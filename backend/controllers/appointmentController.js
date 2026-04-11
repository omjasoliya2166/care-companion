import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import User from '../models/User.js';
import Unavailability from '../models/Unavailability.js';
import Payment from '../models/Payment.js';
import { sendEmail } from '../utils/email.js';
import { createNotification } from './notificationController.js';

export const getAppointments = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'patient') {
      query.patientId = req.user._id;
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      query.doctorId = doctor._id;
    }
    const appointments = await Appointment.find(query)
      .populate('patientId', 'fullName email')
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'fullName' }
      });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBookedSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;
    const queryDate = new Date(date);

    const appointments = await Appointment.find({
      doctorId,
      date,
      status: { $in: ['pending', 'approved', 'pending_reschedule'] }
    }).select('time');

    const unavailabilities = await Unavailability.find({
      doctorId,
      startDate: { $lte: queryDate },
      endDate: { $gte: queryDate }
    });

    const bookedSlots = appointments.map(a => a.time);
    const unavailableRanges = unavailabilities.map(u => ({
      start: u.startTime,
      end: u.endTime,
      fullDay: u.startTime === "00:00" && u.endTime === "23:59"
    }));

    res.json({
      booked: bookedSlots,
      unavailableRanges,
      isFullyBlocked: unavailableRanges.some(r => r.fullDay)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const isTimeValid = (timeStr) => {
  if (!timeStr) return false;
  const timeMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!timeMatch) return false;
  
  let [_, hours, minutes, modifier] = timeMatch;
  hours = parseInt(hours, 10);
  if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
  if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
  
  const totalMinutes = hours * 60 + parseInt(minutes, 10);
  const startMinutes = 9 * 60; // 9:00 AM
  const endMinutes = 17 * 60; // 5:00 PM
  
  return totalMinutes >= startMinutes && totalMinutes <= endMinutes;
};

export const createAppointment = async (req, res) => {
  try {
    const dateInput = req.body.appointmentDate || req.body.date;
    const timeInput = req.body.appointmentTime || req.body.time;

    if (!dateInput || !timeInput || !req.body.doctorId) {
      return res.status(400).json({ message: 'Missing required fields: doctor, date, or time.' });
    }

    if (!isTimeValid(timeInput)) {
      return res.status(400).json({ message: 'Invalid appointment time. Please select between 9:00 AM and 5:00 PM.' });
    }

    const existingAppointment = await Appointment.findOne({
      doctorId: req.body.doctorId,
      date: dateInput,
      time: timeInput,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingAppointment) {
      return res.status(409).json({ message: 'This time slot is already booked for the selected doctor.' });
    }

    // Fetch doctor dynamically to lock the consultation fee
    const doctorObj = await Doctor.findById(req.body.doctorId);
    if (!doctorObj) return res.status(404).json({ message: 'Doctor not found' });
    const feeToLock = doctorObj.consultationFee || 1500;

    const appointment = await Appointment.create({
      doctorId: req.body.doctorId,
      notes: req.body.notes || '',
      date: dateInput,
      time: timeInput,
      patientId: req.user._id,
      chargeAmount: feeToLock
    });

    const populatedAppt = await Appointment.findById(appointment._id)
      .populate('patientId', 'fullName email')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'fullName' } });

    // Notify the doctor about new appointment
    await createNotification({
      userId: populatedAppt.doctorId.userId._id,
      type: 'appointment_created',
      title: 'New Appointment Request',
      message: `${populatedAppt.patientId.fullName} has requested an appointment on ${new Date(populatedAppt.date).toLocaleDateString()} at ${populatedAppt.time}.`,
      meta: { appointmentId: appointment._id }
    });

    // Notify patient that request was received
    await createNotification({
      userId: req.user._id,
      type: 'appointment_created',
      title: 'Appointment Request Sent',
      message: `Your appointment with Dr. ${populatedAppt.doctorId.userId.fullName} on ${new Date(populatedAppt.date).toLocaleDateString()} at ${populatedAppt.time} is pending approval.`,
      meta: { appointmentId: appointment._id }
    });

    try {
      await sendEmail({
        to: populatedAppt.patientId.email,
        subject: 'Appointment Request Received',
        html: `
          <h2>Hi ${populatedAppt.patientId.fullName},</h2>
          <p>Your appointment request with Dr. ${populatedAppt.doctorId.userId.fullName} on ${new Date(populatedAppt.date).toLocaleDateString()} at ${populatedAppt.time} has been received.</p>
          <p>Status: <strong>Pending Approval</strong></p>
          <p>Thank you for choosing LIONHS Care!</p>
        `
      });
    } catch (emailErr) {
      console.error('Email send failed:', emailErr.message);
    }

    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId', 'fullName email')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'fullName' } });

    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    appointment.status = status;
    await appointment.save();

    // Send notification to patient
    const notifMap = {
      approved: { type: 'appointment_approved', title: 'Appointment Approved ✅', message: `Your appointment with Dr. ${appointment.doctorId.userId.fullName} on ${new Date(appointment.date).toLocaleDateString()} at ${appointment.time} has been approved.` },
      rejected: { type: 'appointment_rejected', title: 'Appointment Rejected ❌', message: `Your appointment with Dr. ${appointment.doctorId.userId.fullName} on ${new Date(appointment.date).toLocaleDateString()} at ${appointment.time} has been rejected.` },
      cancelled: { type: 'appointment_cancelled', title: 'Appointment Cancelled', message: `Your appointment with Dr. ${appointment.doctorId.userId.fullName} on ${new Date(appointment.date).toLocaleDateString()} at ${appointment.time} has been cancelled.` },
      completed: { type: 'general', title: 'Appointment Completed', message: `Your appointment with Dr. ${appointment.doctorId.userId.fullName} has been marked as completed.` },
    };

    if (notifMap[status]) {
      await createNotification({
        userId: appointment.patientId._id,
        ...notifMap[status],
        meta: { appointmentId: appointment._id }
      });
    }

    try {
      await sendEmail({
        to: appointment.patientId.email,
        subject: `Appointment ${status.toUpperCase()}`,
        html: `
          <h2>Hi ${appointment.patientId.fullName},</h2>
          <p>Your appointment with Dr. ${appointment.doctorId.userId.fullName} on ${new Date(appointment.date).toLocaleDateString()} at ${appointment.time} has been <strong>${status}</strong>.</p>
        `
      });
    } catch (emailErr) {
      console.error('Email send failed:', emailErr.message);
    }

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdminAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('patientId', 'fullName email')
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'fullName' }
      })
      .sort({ date: -1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdminRecentAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'fullName' }
      })
      .sort({ createdAt: -1 })
      .limit(5);
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdminStats = async (req, res) => {
  try {
    const [patients, doctors, appointments, pendingAppts] = await Promise.all([
      User.countDocuments({ role: 'patient' }),
      Doctor.countDocuments(),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'pending' })
    ]);

    const statusCounts = await Appointment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const statusDistribution = statusCounts.map(item => ({
      name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
      value: item.count
    }));

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyTrends = await Appointment.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    const appointmentTrends = dailyTrends.map(item => ({
      date: item._id,
      count: item.count
    }));

    const docPerformance = await Appointment.aggregate([
      { $group: { _id: '$doctorId', count: { $sum: 1 } } },
      { $lookup: { from: 'doctors', localField: '_id', foreignField: '_id', as: 'doctorInfo' } },
      { $unwind: '$doctorInfo' },
      { $lookup: { from: 'users', localField: 'doctorInfo.userId', foreignField: '_id', as: 'userInfo' } },
      { $unwind: '$userInfo' },
      { $project: { name: '$userInfo.fullName', count: 1 } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const revenueStats = await Appointment.aggregate([
      { $match: { status: 'completed' } },
      { $lookup: { from: 'doctors', localField: 'doctorId', foreignField: '_id', as: 'doctorInfo' } },
      { $unwind: '$doctorInfo' },
      { $group: { _id: null, totalRevenue: { $sum: '$doctorInfo.consultationFee' } } }
    ]);
    const totalRevenue = revenueStats[0]?.totalRevenue || 0;

    res.json({
      summary: { patients, doctors, appointments, pending: pendingAppts, totalRevenue },
      statusDistribution,
      appointmentTrends,
      doctorPerformance: docPerformance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const rescheduleAppointment = async (req, res) => {
  try {
    const { date, time } = req.body;
    if (!date || !time) {
      return res.status(400).json({ message: 'Missing required fields: date or time.' });
    }

    if (!isTimeValid(time)) {
      return res.status(400).json({ message: 'Invalid appointment time. Please select between 9:00 AM and 5:00 PM.' });
    }

    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId', 'fullName email')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'fullName' } });

    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    const existingAppointment = await Appointment.findOne({
      doctorId: appointment.doctorId._id,
      date: date,
      time: time,
      status: { $in: ['pending', 'approved'] },
      _id: { $ne: appointment._id }
    });

    if (existingAppointment) {
      return res.status(409).json({ message: 'This time slot is already booked for the selected doctor.' });
    }

    appointment.date = date;
    appointment.time = time;
    appointment.status = 'pending_reschedule';
    await appointment.save();

    // Notify the doctor about rescheduled request
    await createNotification({
      userId: appointment.doctorId.userId._id,
      type: 'appointment_rescheduled',
      title: 'Appointment Reschedule Request',
      message: `${appointment.patientId.fullName} has requested to reschedule their appointment to ${new Date(date).toLocaleDateString()} at ${time}.`,
      meta: { appointmentId: appointment._id }
    });

    // Notify patient
    await createNotification({
      userId: appointment.patientId._id,
      type: 'appointment_rescheduled',
      title: 'Reschedule Request Submitted',
      message: `Your reschedule request to ${new Date(date).toLocaleDateString()} at ${time} with Dr. ${appointment.doctorId.userId.fullName} is pending approval.`,
      meta: { appointmentId: appointment._id }
    });

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const payForAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    if (appointment.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (appointment.isPaid) {
      return res.status(400).json({ message: 'Appointment is already paid' });
    }

    // Generate unique transaction ID
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create payment record
    const payment = await Payment.create({
      appointmentId: appointment._id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      amount: appointment.chargeAmount || 1500,
      status: 'Paid',
      transactionId: transactionId
    });

    appointment.isPaid = true;
    appointment.isPrescriptionVisible = true;
    await appointment.save();

    await createNotification({
      userId: req.user._id,
      type: 'general',
      title: 'Payment Successful 💳',
      message: `Payment for your appointment on ${new Date(appointment.date).toLocaleDateString()} has been processed (Txn: ${transactionId}). Prescription is now unlocked.`,
      meta: { appointmentId: appointment._id }
    });

    res.json({ message: 'Payment successful', appointment, payment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPaymentByAppointment = async (req, res) => {
  try {
    const payment = await Payment.findOne({ appointmentId: req.params.id })
      .populate('patientId', 'fullName email')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'fullName' } })
      .populate('appointmentId');
      
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    
    // Auth check
    if (req.user.role === 'patient' && payment.patientId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPatientPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ patientId: req.user._id })
      .populate('doctorId')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'fullName' } })
      .populate('appointmentId')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDoctorPayments = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    
    const payments = await Payment.find({ doctorId: doctor._id })
      .populate('patientId', 'fullName email')
      .populate('appointmentId')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find({})
      .populate('patientId', 'fullName email')
      .populate('doctorId')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'fullName' } })
      .populate('appointmentId')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

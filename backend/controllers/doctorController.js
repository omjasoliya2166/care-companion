import Doctor from '../models/Doctor.js';
import User from '../models/User.js';
import Unavailability from '../models/Unavailability.js';

export const getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find().populate('userId', 'fullName avatarUrl email');
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addDoctor = async (req, res) => {
  try {
    const { fullName, email, password, specialization, experience, bio, profileImage } = req.body;
    
    let userId;
    if (email && password) {
      const userExists = await User.findOne({ email });
      if (userExists) {
        userId = userExists._id;
      } else {
        const user = await User.create({ fullName, email, password, role: 'doctor' });
        userId = user._id;
      }
    }

    const doctor = await Doctor.create({
      userId,
      specialization,
      experience,
      bio,
      profileImage,
      available: true
    });

    res.status(201).json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDoctorMe = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id }).populate('userId', 'fullName email');
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateDoctor = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const { fullName, specialization, experience, bio, profileImage, consultationFee, unavailableSlots } = req.body;
    
    const doctor = await Doctor.findById(doctorId).populate('userId');
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    if (specialization) doctor.specialization = specialization;
    if (experience !== undefined) doctor.experience = experience;
    if (bio) doctor.bio = bio;
    if (profileImage) doctor.profileImage = profileImage;
    if (consultationFee !== undefined) doctor.consultationFee = consultationFee;
    if (unavailableSlots) doctor.unavailableSlots = unavailableSlots;
    await doctor.save();

    if (fullName && doctor.userId) {
      const user = await User.findById(doctor.userId._id);
      user.fullName = fullName;
      await user.save();
    }

    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteDoctor = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    
    // Also delete user account if we want, but for now we just delete doctor profile
    await Doctor.findByIdAndDelete(doctorId);
    
    res.json({ message: 'Doctor deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const setUnavailability = async (req, res) => {
  try {
    const { type, startDate, endDate, startTime, endTime } = req.body;
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

    const unavailability = await Unavailability.create({
      doctorId: doctor._id,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate || startDate),
      startTime,
      endTime
    });

    res.status(201).json(unavailability);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUnavailability = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    const list = await Unavailability.find({ doctorId: doctor._id }).sort({ startDate: -1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadDoctorProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

    let finalPath = req.file.path;
    if (!finalPath.startsWith('http')) {
      finalPath = `${req.protocol}://${req.get('host')}/${finalPath.replace(/\\/g, '/')}`;
    }

    doctor.profileImage = finalPath;
    await doctor.save();

    // Also update User model for consistency
    await User.findByIdAndUpdate(req.user._id, { avatarUrl: finalPath });

    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUnavailability = async (req, res) => {
  try {
    const { id } = req.params;
    const unavailability = await Unavailability.findById(id);
    if (!unavailability) return res.status(404).json({ message: 'Unavailability record not found' });
    
    // Check ownership
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (unavailability.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Unavailability.findByIdAndDelete(id);
    res.json({ message: 'Unavailability record deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

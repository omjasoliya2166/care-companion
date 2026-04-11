import mongoose from 'mongoose';
import User from './models/User.js';
import Appointment from './models/Appointment.js';
import Chat from './models/Chat.js';
import Message from './models/Message.js';
import Notification from './models/Notification.js';
import Prescription from './models/Prescription.js';
import Unavailability from './models/Unavailability.js';
import Doctor from './models/Doctor.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/care-companion';

const seedAdmin = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Destructive Seed Section
    console.log('Purging existing data...');
    await Promise.all([
      User.deleteMany({}),
      Appointment.deleteMany({}),
      Chat.deleteMany({}),
      Message.deleteMany({}),
      Notification.deleteMany({}),
      Prescription.deleteMany({}),
      Unavailability.deleteMany({}),
      Doctor.deleteMany({})
    ]);
    console.log('All previous data cleared.');

    const adminEmail = 'hospitaladmin@liohns.com';
    const adminPassword = 'Admin@985';

    await User.create({
      fullName: 'System Administrator',
      email: adminEmail,
      password: adminPassword,
      role: 'admin'
    });
    
    console.log('Super Admin user created successfully');

    console.log('\n--- Admin Credentials ---');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('-------------------------\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();

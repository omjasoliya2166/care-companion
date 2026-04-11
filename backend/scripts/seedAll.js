import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { seedFAQs } from './seedFAQ.js';
import { seedBlogs } from './seedBlog.js';
import { seedServices } from './seedService.js';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import Notification from '../models/Notification.js';
import Prescription from '../models/Prescription.js';
import Unavailability from '../models/Unavailability.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/care-companion';

const seedAll = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for Master Seeding...');

    console.log('Purging all existing data...');
    await Promise.all([
      User.deleteMany({}),
      Appointment.deleteMany({}),
      Doctor.deleteMany({}),
      Chat.deleteMany({}),
      Message.deleteMany({}),
      Notification.deleteMany({}),
      Prescription.deleteMany({}),
      Unavailability.deleteMany({})
    ]);
    console.log('Database cleared.');

    // Create Super Admin
    await User.create({
      fullName: 'System Administrator',
      email: 'hospitaladmin@liohns.com',
      password: 'Admin@985',
      role: 'admin'
    });
    console.log('Super Admin created! (Email: hospitaladmin@liohns.com, Pwd: Admin@985)');

    // Run modular seeders
    await seedFAQs();
    await seedBlogs();
    await seedServices();

    console.log('\nMaster Seeding Completed Successfully! 🚀');
    process.exit(0);
  } catch (error) {
    console.error('Master Seeding Failed:', error);
    process.exit(1);
  }
};

seedAll();

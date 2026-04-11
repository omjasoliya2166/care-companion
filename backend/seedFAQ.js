import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { FAQ } from './models/Content.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/care-companion';

const faqData = [
  {
    question: "What are your operating hours?",
    answer: "Our hospital provides 24/7 emergency services. General consultation hours are from 8:00 AM to 8:00 PM Monday through Saturday.",
    sortOrder: 1
  },
  {
    question: "Do I need to make an appointment before visiting?",
    answer: "For emergency cases, no appointment is necessary. For routine check-ups and specialized consultations, we strongly recommend booking an appointment online or by calling our reception to minimize waiting times.",
    sortOrder: 2
  },
  {
    question: "What health insurance plans do you accept?",
    answer: "We accept most major health insurance plans including Medicare, Blue Cross Blue Shield, Aetna, Cigna, and UnitedHealthcare. Please contact our billing department to verify coverage for your specific insurance.",
    sortOrder: 3
  },
  {
    question: "How can I access my medical records?",
    answer: "Patients can easily access their medical records, test results, and prescriptions through our secure patient portal. You can also request physical copies from our Medical Records department upon presenting valid identification.",
    sortOrder: 4
  },
  {
    question: "Are virtual consultation services available?",
    answer: "Yes, we offer telehealth and virtual consultation services for follow-ups and minor medical inquiries. You can schedule a virtual appointment through the patient portal.",
    sortOrder: 5
  }
];

const seedFAQ = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for FAQ seeding...');

    await FAQ.deleteMany({});
    console.log('Cleared existing FAQ data.');

    await FAQ.insertMany(faqData);
    console.log('Successfully seeded FAQ data.');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding FAQ data:', error);
    process.exit(1);
  }
};

seedFAQ();

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Service } from './models/Content.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/care-companion';

const serviceData = [
  {
    title: "Cardiology",
    description: "Comprehensive heart care including diagnosis, treatment, and preventive services for various cardiovascular conditions.",
    icon: "HeartPulse",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Neurology",
    description: "Expert treatment for neurological disorders affecting the brain, spinal cord, and nervous system.",
    icon: "Brain",
    image: "https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Orthopedics",
    description: "Specialized care for bones, joints, ligaments, tendons, and muscles including joint replacement surgeries.",
    icon: "Bone",
    image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Pediatrics",
    description: "Compassionate healthcare dedicated to the physical, emotional, and social health of children from birth to young adulthood.",
    icon: "Baby",
    image: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Emergency Care",
    description: "24/7 urgent medical attention for life-threatening conditions, injuries, and sudden health crises.",
    icon: "Ambulance",
    image: "https://images.unsplash.com/photo-1587370560942-ad2a04eabb6d?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Laboratory Services",
    description: "Advanced diagnostic testing and pathology services utilizing state-of-the-art medical equipment.",
    icon: "Microscope",
    image: "https://images.unsplash.com/photo-1579165466741-7f35e4755660?auto=format&fit=crop&q=80&w=800"
  }
];

const seedService = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for Service seeding...');

    await Service.deleteMany({});
    console.log('Cleared existing Service data.');

    await Service.insertMany(serviceData);
    console.log('Successfully seeded Service data.');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding Service data:', error);
    process.exit(1);
  }
};

seedService();

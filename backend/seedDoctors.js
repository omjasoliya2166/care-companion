import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import Doctor from './models/Doctor.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/care-companion';

const doctorsData = [
  {
    fullName: "Sarah Johnson",
    email: "sarahjohnson@gmail.com",
    password: "Sarah@123",
    role: "doctor",
    specialization: "Cardiology",
    experience: 15,
    bio: "Dr. Sarah is a senior cardiologist with over 15 years of experience in heart surgery and treatments.",
    profileImage: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200&h=200",
    consultationFee: 2500
  },
  {
    fullName: "Michael Chen",
    email: "michaelchen@gmail.com",
    password: "Michael@123",
    role: "doctor",
    specialization: "Neurology",
    experience: 12,
    bio: "Specialist in neurological disorders and brain health with a focus on patient-centered care.",
    profileImage: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200&h=200",
    consultationFee: 1800
  },
  {
    fullName: "Emily Williams",
    email: "emilywilliams@gmail.com",
    password: "Emily@123",
    role: "doctor",
    specialization: "Orthopedics",
    experience: 10,
    bio: "Expert in joint replacement and sports medicine, helping patients regain their mobility.",
    profileImage: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=200&h=200",
    consultationFee: 1500
  },
  {
    fullName: "James Anderson",
    email: "jamesanderson@gmail.com",
    password: "James@123",
    role: "doctor",
    specialization: "Pediatrics",
    experience: 8,
    bio: "Compassionate pediatrician dedicated to the health and well-being of children from birth to adolescence.",
    profileImage: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200&h=200",
    consultationFee: 1200
  }, 
  {
  fullName: "Olivia Bennett",
  email: "oliviabennett@gmail.com",
  password: "Olivia@123",
  role: "doctor",
  specialization: "Endocrinology",
  experience: 11,
  bio: "Specialist in hormonal disorders, diabetes management, and metabolic health with a patient-focused approach.",
  profileImage: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=200&h=200",
  consultationFee: 1600
},
{
  fullName: "Daniel Rodriguez",
  email: "danielrodriguez@gmail.com",
  password: "Daniel@123",
  role: "doctor",
  specialization: "Oncology",
  experience: 14,
  bio: "Dedicated oncologist experienced in cancer diagnosis, chemotherapy, and compassionate patient care.",
  profileImage: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200&h=200",
  consultationFee: 3000
},
{
  fullName: "Aisha Khan",
  email: "aishakhan@gmail.com",
  password: "Aisha@123",
  role: "doctor",
  specialization: "Psychiatry",
  experience: 9,
  bio: "Mental health specialist focused on treating anxiety, depression, and behavioral disorders with holistic care.",
  profileImage: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&q=80&w=200&h=200",
  consultationFee: 1400
}
];

const seedDoctors = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    await User.deleteMany({ role: 'doctor' });
    await Doctor.deleteMany({});
    console.log('Cleared existing doctor data.');

    for (const doc of doctorsData) {
      // Check if user already exists
      let user = await User.findOne({ email: doc.email });

      if (!user) {
        user = new User({
          fullName: doc.fullName,
          email: doc.email,
          password: doc.password, // Schema pre-save hook will hash this
          role: 'doctor'
        });
        await user.save();
        console.log(`Created user for ${doc.fullName}`);
      }

      // Check if doctor profile already exists
      let doctorProfile = await Doctor.findOne({ userId: user._id });

      if (!doctorProfile) {
        doctorProfile = new Doctor({
          userId: user._id,
          specialization: doc.specialization,
          experience: doc.experience,
          bio: doc.bio,
          profileImage: doc.profileImage,
          consultationFee: doc.consultationFee || 1500
        });
        await doctorProfile.save();
        console.log(`Created doctor profile for ${doc.fullName}`);
      } else {
        console.log(`Doctor profile already exists for ${doc.fullName}`);
      }
    }

    console.log('Seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedDoctors();

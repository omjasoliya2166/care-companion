import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Blog } from './models/Content.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/care-companion';

const blogData = [
  {
    title: "Understanding Heart Health: 5 Tips for a Stronger Heart",
    content: "Your heart is the engine of your body. Keeping it strong and healthy is crucial for an active life. Here are five easy tips to maintain excellent cardiovascular health: \n\n1. Get active and aim for at least 30 minutes of moderate exercise daily.\n2. Choose heart-healthy foods like whole grains, berries, and omega-3 rich fish.\n3. Keep your stress in check through mindfulness and meditation.\n4. Avoid smoking or passive smoking.\n5. Keep your blood pressure and cholesterol levels monitored annually.",
    image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=800",
    author: "Dr. Sarah Johnson"
  },
  {
    title: "The Importance of Regular Check-ups",
    content: "A regular check-up might seem unnecessary when you feel perfectly fine, but prevention is always better than cure. Annual check-ups help doctors detect early warning signs of disease before they become serious problems. They also keep your vaccinations up to date and provide you with an opportunity to discuss any new lifestyle habits. Consider an annual check-up an investment in a longer, healthier life.",
    image: "https://images.unsplash.com/photo-1516549655134-f61d714529ed?auto=format&fit=crop&q=80&w=800",
    author: "Hospital Admin"
  },
  {
    title: "Managing Mental Wealth: Recognizing the Signs of Burnout",
    content: "Burnout is a state of physical and emotional exhaustion. It can occur when you experience long-term stress in your job or life. Symptoms of burnout include feeling depleted, drained, and emotionally exhausted. If left unchecked, it can lead to serious depression. To combat burnout, it is essential to prioritize self-care, set firm boundaries in the workplace, and consult with a mental health professional for tailored strategies.",
    image: "https://images.unsplash.com/photo-1543333995-a78aea2efa50?auto=format&fit=crop&q=80&w=800",
    author: "Dr. Aisha Khan"
  }
];

const seedBlog = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for Blog seeding...');

    await Blog.deleteMany({});
    console.log('Cleared existing Blog data.');

    await Blog.insertMany(blogData);
    console.log('Successfully seeded Blog data.');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding Blog data:', error);
    process.exit(1);
  }
};

seedBlog();

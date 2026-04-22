import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Blog } from '../models/Content.js';

dotenv.config({ path: 'backend/.env' });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error("CRITICAL: MONGODB_URI is not defined in .env");

const blogData = [
  {
    title: "Understanding Heart Health: 5 Tips for a Stronger Heart",
    content: "Your heart is the engine of your body. Keeping it strong and healthy is crucial for an active life. Here are five easy tips to maintain excellent cardiovascular health: \n\n1. Get active and aim for at least 30 minutes of moderate exercise daily.\n2. Choose heart-healthy foods like whole grains, berries, and omega-3 rich fish.\n3. Keep your stress in check through mindfulness and meditation.\n4. Avoid smoking or passive smoking.\n5. Keep your blood pressure and cholesterol levels monitored annually.",
    image: "/images/blog1.jpeg",
    author: "Dr. Abhijit Makwana"
  },
  {
    title: "The Importance of Regular Check-ups",
    content: "A regular check-up might seem unnecessary when you feel perfectly fine, but prevention is always better than cure. Annual check-ups help doctors detect early warning signs of disease before they become serious problems. They also keep your vaccinations up to date and provide you with an opportunity to discuss any new lifestyle habits. Consider an annual check-up an investment in a longer, healthier life.",
    image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&q=80&w=800",
    author: "Hospital Admin"
  },
  {
    title: "Managing Mental Wealth: Recognizing the Signs of Burnout",
    content: "Burnout is a state of physical and emotional exhaustion. It can occur when you experience long-term stress in your job or life. Symptoms of burnout include feeling depleted, drained, and emotionally exhausted. If left unchecked, it can lead to serious depression. To combat burnout, it is essential to prioritize self-care, set firm boundaries in the workplace, and consult with a mental health professional for tailored strategies.",
    image: "https://images.unsplash.com/photo-1527137342181-19aab11a8ee1?auto=format&fit=crop&q=80&w=800",
    author: "Dr. Aisha Khan"
  },
  {
    title: "Boosting Immunity: Everyday Habits for Better Health",
    content: "A strong immune system helps your body fight infections and stay healthy. Simple daily habits can significantly improve your immunity. \n\n1. Eat a balanced diet rich in fruits and vegetables.\n2. Stay hydrated throughout the day.\n3. Get at least 7-8 hours of quality sleep.\n4. Exercise regularly to improve circulation.\n5. Maintain proper hygiene and wash hands frequently.",
    image: "/images/blog4.jpg",
    author: "Dr. Yama Patel"
  },
  {
    title: "Understanding Diabetes: Prevention and Control",
    content: "Diabetes is a chronic condition that affects how your body processes blood sugar. While it can be serious, it is manageable with proper care. \n\n1. Monitor your blood sugar levels regularly.\n2. Follow a balanced, low-sugar diet.\n3. Stay physically active.\n4. Take medications as prescribed by your doctor.\n5. Schedule regular medical check-ups to avoid complications.",
    image: "/images/blog5.jpg",
    author: "Dr. Kanak Patel"
  },
  {
    title: "Healthy Eyes, Healthy Life: Tips for Better Vision",
    content: "Your eyes are essential for everyday life, and maintaining good vision should be a priority. \n\n1. Follow the 20-20-20 rule to reduce eye strain.\n2. Eat foods rich in Vitamin A and Omega-3.\n3. Avoid excessive screen time.\n4. Wear protective eyewear in harsh environments.\n5. Get regular eye check-ups to detect issues early.",
    image: "/images/blog6.jpg",
    author: "Dr. Mit Patel"
  }
];

const seedBlog = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for Blog seeding...');

    /*
    await Blog.deleteMany({});
    console.log('Cleared existing Blog data.');

    await Blog.insertMany(blogData);
    */

    const BASE_URL = process.env.BASE_URL;
    if (!BASE_URL) throw new Error("CRITICAL: BASE_URL is not defined in .env");

    for (const blog of blogData) {
      const fullImageUrl = blog.image.startsWith('http') ? blog.image : `${BASE_URL}${blog.image}`;
      
      await Blog.updateOne(
        { title: blog.title },
        { 
          $set: {
            ...blog,
            image: fullImageUrl
          } 
        },
        { upsert: true }
      );
      console.log(`Synced blog: ${blog.title}`);
    }
    console.log('Successfully seeded/updated Blog data.');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding Blog data:', error);
    process.exit(1);
  }
};

seedBlog();

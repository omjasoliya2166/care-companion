import { Blog } from '../models/Content.js';

export const seedBlogs = async () => {
  await Blog.deleteMany({});
  const blogs = [
    { 
      title: "Maintaining Heart Health", 
      content: "Regular exercise and a balanced diet are key to a healthy heart. Limit salt intake and monitor your blood pressure regularly to reduce risks of cardiovascular diseases.", 
      image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800" 
    },
    { 
      title: "Understanding Diabetes", 
      content: "Diabetes is a chronic condition that affects how your body turns food into energy. Proper management involves monitoring glucose levels and following a doctor's prescribed diet.", 
      image: "https://images.unsplash.com/photo-1511174511562-5f7f185854c8?w=800" 
    }
  ];
  await Blog.insertMany(blogs);
  console.log('Blogs seeded! ✅');
};

import { Service } from '../models/Content.js';

export const seedServices = async () => {
  await Service.deleteMany({});
  const services = [
    { 
      title: "Cardiology", 
      description: "Specialized care for heart-related conditions including rhythms and valve issues.", 
      icon: "Heart" 
    },
    { 
      title: "Neurology", 
      description: "Expert consultation for brain and nervous system issues, including migraine and seizure management.", 
      icon: "Activity" 
    },
    { 
      title: "Pediatrics", 
      description: "Comprehensive healthcare for children and adolescents, focusing on developmental milestones.", 
      icon: "User" 
    }
  ];
  await Service.insertMany(services);
  console.log('Services seeded! ✅');
};

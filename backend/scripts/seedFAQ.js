import { FAQ } from '../models/Content.js';

export const seedFAQs = async () => {
  await FAQ.deleteMany({});
  const faqs = [
    { 
      question: "How do I book an appointment?", 
      answer: "Go to the Patient Dashboard and select 'Book Appointment'. Choose your doctor and preferred time slot." 
    },
    { 
      question: "What are the hospital hours?", 
      answer: "Our specialists are available from 9:00 AM to 5:00 PM, Monday through Saturday." 
    },
    { 
      question: "How can I view my prescriptions?", 
      answer: "Once the doctor generates a prescription and payment is completed, it will be visible in the 'Prescriptions' tab." 
    }
  ];
  await FAQ.insertMany(faqs);
  console.log('FAQs seeded! ✅');
};

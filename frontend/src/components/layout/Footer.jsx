import { Heart, Phone, Mail, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import logo from "@/assets/logo.png";

const footerColumnVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: "easeOut" },
  }),
};

export default function Footer() {
  return (
    <footer className="bg-slate-50 text-foreground border-t border-slate-200 mt-auto dark:bg-card dark:border-border">
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid md:grid-cols-4 gap-8"
        >
          <motion.div custom={0} variants={footerColumnVariant} className="space-y-4">
            <div className="flex items-center gap-2">
              <motion.img
                whileHover={{ scale: 1.05 }}
                src={logo}
                alt="LIOHN Logo"
                className="h-16 w-auto object-contain"
              />
            </div>
            <p className="text-sm text-foreground/70">
              Advanced Super Specialty Care for ENT, Neurology, Neurosurgery, Oncosurgery, Opthalmology, Dental sciences, Dermatology, Plastic Surgery, Psychiatry, Pulmonary and More...
            </p>
          </motion.div>
          <motion.div custom={1} variants={footerColumnVariant}>
            <h4 className="font-semibold mb-3">Quick Links</h4>
            <div className="space-y-2 text-sm text-foreground/70">
              <a href="/#about" className="block hover:text-primary hover:translate-x-1 transition-all duration-200">About Us</a>
              <a href="/#services" className="block hover:text-primary hover:translate-x-1 transition-all duration-200">Services</a>
              <a href="/#doctors" className="block hover:text-primary hover:translate-x-1 transition-all duration-200">Our Doctors</a>
              <a href="/#blog" className="block hover:text-primary hover:translate-x-1 transition-all duration-200">Health Blog</a>
            </div>
          </motion.div>
          <motion.div custom={2} variants={footerColumnVariant}>
            <h4 className="font-semibold mb-3">Services</h4>
            <div className="space-y-2 text-sm text-foreground/70">
              <a href="/#services" className="block hover:text-primary hover:translate-x-1 transition-all duration-200">Emergency Care</a>
              <a href="/#services" className="block hover:text-primary hover:translate-x-1 transition-all duration-200">Ambulance Services</a>
              <a href="/#services" className="block hover:text-primary hover:translate-x-1 transition-all duration-200">24/7 Pharmacy</a>
              <a href="/#services" className="block hover:text-primary hover:translate-x-1 transition-all duration-200">Home Sample Pickup</a>
            </div>
          </motion.div>
          <motion.div custom={3} variants={footerColumnVariant}>
            <h4 className="font-semibold mb-3">Contact</h4>
            <div className="space-y-2 text-sm text-foreground/70">
              <a href="tel:07935096700" className="flex items-center gap-2 hover:text-primary transition-colors"><Phone className="h-4 w-4" /> 079-35096700</a>
              <a href="mailto:liohnshospital748@gmail.com" className="flex items-center gap-2 hover:text-primary transition-colors"><Mail className="h-4 w-4" /> liohnshospital748@gmail.com</a>
              <a href="https://maps.google.com/?q=Life+Care+Hospital+Memnagar+Ahmedabad" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors"><MapPin className="h-4 w-4 shrink-0" /> Beside Sarva Mangal Hall, Memnagar, Ahmedabad - 380052</a>
            </div>
          </motion.div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="border-t border-border mt-8 pt-6 text-center text-sm text-foreground/60 origin-center"
        >
          © {new Date().getFullYear()} LIOHN Hospital. All rights reserved.
        </motion.div>
      </div>
    </footer>
  );
}

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { CalendarPlus, ShieldCheck, Star, Users, LayoutDashboard, CalendarCheck, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";

export default function HeroSection({ id }) {
  const navigate = useNavigate();
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const { user, role } = useAuth();
  
  const { data: dbStats } = useQuery({
    queryKey: ["public-stats"],
    queryFn: async () => {
      try {
        const response = await api.get("/content/stats");
        return response.data;
      } catch (e) {
        return null;
      }
    },
  });

  return (
    <section id={id} className="relative min-h-[700px] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <img 
          src="https://liohns.com/wp-content/uploads/2025/08/Rectangle-40375-8.png" 
          alt="LIOHNS Hospital" 
          className="w-full h-full object-cover object-[center_75%]"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950/70 via-blue-950/40 to-transparent z-0" />
      </div>

      <div className="container mx-auto px-4 relative z-10 py-20">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block py-1 px-3 rounded-full bg-blue-500/20 text-blue-300 text-sm font-medium mb-6 backdrop-blur-sm border border-blue-400/30">
              {role === 'doctor' ? `Welcome Dr. ${user?.fullName?.split(' ')[1] || 'Specialist'}` : `Trusted by ${dbStats?.patients?.toLocaleString() || '1,000'}+ Patients`}
            </span>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-white leading-tight mb-6 tracking-tight drop-shadow-2xl">
              {role === 'doctor' ? 'Revolutionize Your' : 'Welcome To'} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-emerald-300">
                {role === 'doctor' ? 'Clinical Practice' : 'LIOHNS Hospital'}
              </span>
            </h1>
            <p className="text-xl text-blue-100/90 mb-10 max-w-2xl leading-relaxed drop-shadow-lg">
              {role === 'doctor' 
                ? 'Access your clinical dashboard, manage patient schedules, and streamline your medical consultations with our integrated healthcare platform.'
                : 'We are open 24/7 at your service. Advanced Super Specialty Care for ENT, Neurology, Neurosurgery, Oncosurgery, Opthalmology, Dental sciences, Dermatology, Plastic Surgery, Psychiatry, Pulmonary and More...'}
            </p>
            
            <div className="flex flex-wrap gap-4 mb-12">
              {role === 'doctor' ? (
                <>
                  <motion.div whileHover={{ scale: 1.06, y: -2 }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400 }}>
                    <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50 px-8 h-14 text-lg font-semibold shadow-xl transition-shadow" onClick={() => navigate("/doctor")}>
                      <LayoutDashboard className="mr-2 h-5 w-5" /> Provider Dashboard
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.06, y: -2 }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400 }}>
                    <Button size="lg" className="bg-blue-600/90 text-white hover:bg-blue-700 px-8 h-14 text-lg font-semibold shadow-xl transition-shadow border border-blue-400/30 backdrop-blur-md" onClick={() => navigate("/doctor/appointments")}>
                      <CalendarCheck className="mr-2 h-5 w-5" /> Manage Appointments
                    </Button>
                  </motion.div>
                </>
              ) : role === 'admin' ? (
                <motion.div whileHover={{ scale: 1.06, y: -2 }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400 }}>
                  <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50 px-8 h-14 text-lg font-semibold shadow-xl transition-shadow" onClick={() => navigate("/admin")}>
                    <LayoutDashboard className="mr-2 h-5 w-5" /> Administration Panel
                  </Button>
                </motion.div>
              ) : (
                <motion.div whileHover={{ scale: 1.06, y: -2 }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400 }}>
                  <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50 px-8 h-14 text-lg font-semibold shadow-xl transition-shadow" onClick={() => navigate("/patient/book")}>
                    <CalendarPlus className="mr-2 h-5 w-5" /> Book Appointment
                  </Button>
                </motion.div>
              )}

              {role !== 'doctor' && (
                <motion.div
                  animate={{
                    background: [
                      "linear-gradient(135deg, #b91c1c, #dc2626)",
                      "linear-gradient(135deg, #1d4ed8, #2563eb)",
                      "linear-gradient(135deg, #b91c1c, #dc2626)",
                    ],
                    boxShadow: [
                      "0 0 20px 4px rgba(220,38,38,0.5)",
                      "0 0 20px 4px rgba(37,99,235,0.5)",
                      "0 0 20px 4px rgba(220,38,38,0.5)",
                    ],
                  }}
                  whileTap={{ scale: 0.93 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="rounded-full p-0.5"
                >
                  <Button
                    size="lg"
                    className="relative overflow-hidden bg-transparent border-2 border-white/50 text-white px-8 h-14 text-lg font-black rounded-full tracking-wide uppercase flex items-center justify-center gap-2"
                    onClick={() => setEmergencyOpen(true)}
                  >
                    <motion.span
                      animate={{ scale: [1, 1.4, 1] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      🚨
                    </motion.span>
                    <span className="relative z-10 font-bold tracking-tight">Emergency</span>
                  </Button>
                </motion.div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10">
              {[
                { icon: <ShieldCheck className="h-5 w-5 text-emerald-400" />, value: "ISO Certified", label: "Safety standards" },
                { icon: <Star className="h-5 w-5 text-yellow-400" />, value: "4.9/5 Rating", label: "Patient satisfaction" },
                { icon: <Users className="h-5 w-5 text-blue-300" />, value: `${dbStats?.doctors || '5'}+ Doctors`, label: "Expert specialists" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 + i * 0.15, duration: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                  className="text-white cursor-default"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {stat.icon}
                    <span className="font-bold text-lg">{stat.value}</span>
                  </div>
                  <p className="text-xs text-blue-200">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
      
      <div className="absolute bottom-0 right-0 p-10 hidden lg:block overflow-hidden pointer-events-none">
        <div className="w-96 h-96 rounded-full border-[32px] border-white/5 -mb-48 -mr-48" />
      </div>
      
      <Dialog open={emergencyOpen} onOpenChange={setEmergencyOpen}>
        <DialogContent className="sm:max-w-md border-none p-0 overflow-hidden rounded-3xl">
          <div className="relative bg-gradient-to-br from-red-700 to-rose-600 px-8 py-6 overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-white/10"
              animate={{ opacity: [0, 0.2, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-white text-2xl font-black relative z-10">
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1.5 }}
                  className="flex items-center justify-center font-black"
                >
                  <Phone className="h-7 w-7" />
                </motion.div>
                <span>Emergency Contacts</span>
              </DialogTitle>
              <p className="text-red-100 text-sm mt-1 relative z-10">Available 24/7 - Call immediately</p>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-4 bg-white dark:bg-card">
            <div className="bg-red-50 dark:bg-red-950/30 p-5 rounded-2xl border-2 border-red-200 dark:border-red-800">
              <h3 className="font-black text-red-700 dark:text-red-400 mb-3 text-lg">LIOHNS Main Hospital</h3>
              <p className="text-slate-600 dark:text-slate-400 font-semibold text-sm mb-3">Ambulance & Emergency (24/7):</p>
              <div className="space-y-2">
                <a href="tel:108" className="flex items-center gap-3 text-3xl font-black tracking-wider text-red-600 hover:text-red-800 transition-colors">
                  <Phone className="h-6 w-6 animate-pulse" /> 108
                </a>
                <a href="tel:079-35096700" className="flex items-center gap-3 text-xl font-bold tracking-wider text-red-600 hover:text-red-800 transition-colors">
                  <Phone className="h-5 w-5" /> 079-35096700
                </a>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-muted p-5 rounded-2xl border border-slate-200 dark:border-border">
              <h4 className="font-bold text-foreground mb-2">General Helpline</h4>
              <a href="tel:+919104323400" className="text-xl font-bold text-primary hover:underline">+91 91043 23400</a>
            </div>
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              If you are facing a life-threatening emergency, proceed to the nearest hospital immediately or call the national emergency number.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

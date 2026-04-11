import { useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useNotifications } from "@/contexts/NotificationContext";
import { Button } from "@/components/ui/button";
import { 
  Bell, CheckCheck, Trash2, 
  Calendar, CreditCard, Pill, 
  MessageSquare, AlertCircle, Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function PatientNotifications() {
  const { notifications, unreadCount, markRead, markAllRead, deleteNotif } = useNotifications();

  // Auto-mark all read on mount
  useEffect(() => {
    if (unreadCount > 0) {
      markAllRead();
    }
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'appointment_approved': return <Calendar className="w-5 h-5 text-emerald-500" />;
      case 'appointment_rejected': return <Calendar className="w-5 h-5 text-destructive" />;
      case 'prescription_generated': return <Pill className="w-5 h-5 text-primary" />;
      case 'payment_received': return <CreditCard className="w-5 h-5 text-amber-500" />;
      case 'chat_message': return <MessageSquare className="w-5 h-5 text-blue-500" />;
      default: return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <DashboardLayout role="patient">
      <div className="max-w-4xl mx-auto space-y-10">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-black text-slate-900 tracking-tight"
            >
              Notifications <span className="text-primary italic">Center</span> 🔔
            </motion.h1>
            <p className="text-slate-500 font-medium mt-2">Stay updated with your clinical alerts and schedule changes.</p>
          </div>
          <div className="flex items-center gap-3">
             <Badge variant="secondary" className="px-4 py-1.5 rounded-full bg-primary/10 text-primary border-none font-bold">
               Refreshed
             </Badge>
          </div>
        </header>

        <Card className="border-none shadow-2xl shadow-slate-200 rounded-[3rem] overflow-hidden bg-white">
          <ScrollArea className="h-[60vh] p-8">
            <div className="space-y-4">
              <AnimatePresence>
                {notifications.map((notif, idx) => (
                  <motion.div
                    key={notif._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`group relative p-6 rounded-[2rem] border transition-all duration-300 flex items-start gap-6 ${
                      notif.read 
                        ? "bg-slate-50/50 border-slate-50 opacity-60" 
                        : "bg-white border-slate-100 shadow-xl shadow-slate-100/50 hover:border-primary/20"
                    }`}
                  >
                    {!notif.read && (
                      <div className="absolute top-6 right-6 w-3 h-3 bg-primary rounded-full animate-pulse shadow-lg shadow-primary/30" />
                    )}

                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                      notif.read ? "bg-slate-100" : "bg-primary/5 shadow-inner"
                    }`}>
                      {getIcon(notif.type)}
                    </div>

                    <div className="flex-1 space-y-2">
                       <div className="flex items-center justify-between">
                          <h3 className={`font-black tracking-tight ${notif.read ? "text-slate-600" : "text-slate-900 text-lg"}`}>
                            {notif.title}
                          </h3>
                          <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest flex items-center gap-1.5">
                            <Clock className="w-3 h-3" /> {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                       </div>
                       <p className={`text-sm font-medium leading-relaxed ${notif.read ? "text-slate-400" : "text-slate-500"}`}>
                         {notif.message}
                       </p>
                       
                       <div className="flex items-center gap-4 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notif.read && (
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="p-0 h-auto text-[10px] font-black uppercase text-primary tracking-widest"
                              onClick={() => markRead(notif._id)}
                            >
                              Dismiss as read
                            </Button>
                          )}
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="p-0 h-auto text-[10px] font-black uppercase text-destructive tracking-widest"
                            onClick={() => deleteNotif(notif._id)}
                          >
                            Delete alert
                          </Button>
                       </div>
                    </div>
                  </motion.div>
                ))}

                {notifications.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 grayscale opacity-20">
                    <Bell className="w-24 h-24 mb-6" />
                    <p className="font-black uppercase tracking-[0.3em] text-sm">Silence in the Archive</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </Card>
      </div>
    </DashboardLayout>
  );
}

import { Card } from "@/components/ui/card";

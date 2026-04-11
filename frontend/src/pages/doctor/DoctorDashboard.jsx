import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, Calendar, MessageSquare, DollarSign, 
  ArrowUpRight, Clock, UserCheck, Activity, TrendingUp,
  AlertCircle, ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';

const chartData = [
  { name: 'Mon', revenue: 450, patients: 3 },
  { name: 'Tue', revenue: 600, patients: 4 },
  { name: 'Wed', revenue: 300, patients: 2 },
  { name: 'Thu', revenue: 900, patients: 6 },
  { name: 'Fri', revenue: 750, patients: 5 },
  { name: 'Sat', revenue: 400, patients: 3 },
  { name: 'Sun', revenue: 200, patients: 1 },
];

export default function DoctorDashboard() {
  const { user } = useAuth();
  
  const { data: doctor } = useQuery({
    queryKey: ["doctor-self", user?._id],
    queryFn: async () => {
      const response = await api.get("/appointments/doctor/me");
      return response.data;
    },
    enabled: !!user,
  });

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["doctor-all-appointments", doctor?._id],
    queryFn: async () => {
      const response = await api.get("/appointments/appointments");
      return response.data || [];
    },
    enabled: !!doctor,
  });

  const fee = doctor?.consultationFee || 1500;
  
  const pendingCount = appointments?.filter(a => a.status === 'pending' || a.status === 'pending_reschedule').length || 0;
  const approvedCount = appointments?.filter(a => a.status === 'approved').length || 0;
  const totalCompleted = appointments?.filter(a => a.status === 'completed').length || 0;
  
  const [revTab, setRevTab] = useState('history');

  const historyEarnings = totalCompleted * fee;
  const projectedEarnings = approvedCount * fee;

  const currentRevData = revTab === 'history' ? chartData : chartData.map(d => ({ ...d, revenue: d.revenue * 1.5 }));

  // Active Queue Logic
  const today = new Date().toISOString().split('T')[0];
  const activeQueue = appointments?.filter(a => 
    a.status === 'approved' && 
    (a.date.startsWith(today) || new Date(a.date).toDateString() === new Date().toDateString())
  ).sort((a, b) => a.time.localeCompare(b.time)) || [];

  const getWaitTime = (index) => {
    return index * 20; // 20 minutes per patient
  };

  return (
    <DashboardLayout role="doctor">
      <div className="space-y-8 pb-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl font-black text-slate-900 tracking-tight"
            >
              Doctor's <span className="text-primary italic">Command Center</span> 🩺
            </motion.h1>
            <p className="text-slate-500 font-medium mt-2">Precision management for your medical practice.</p>
          </div>
          <div className="flex items-center gap-3">
             <Link to="/doctor/appointments">
              <Button className="rounded-2xl shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 px-8 font-bold h-14 text-sm tracking-wide">
                View Appointments
              </Button>
            </Link>
          </div>
        </header>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Pending Requests", value: pendingCount, icon: Clock, color: "text-orange-500", bg: "bg-orange-50", subtitle: "Awaiting Action" },
            { label: "Active Patients", value: approvedCount, icon: UserCheck, color: "text-blue-500", bg: "bg-blue-50", subtitle: "Scheduled Today" },
            { label: "Completed", value: totalCompleted, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50", subtitle: "Total Success" },
            { label: "Earnings", value: `₹${historyEarnings + projectedEarnings}`, icon: DollarSign, color: "text-indigo-500", bg: "bg-indigo-50", subtitle: `${historyEarnings} History / ${projectedEarnings} Proj.` },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <Card className="border-none shadow-sm hover:shadow-2xl transition-all duration-500 rounded-[2rem] overflow-hidden group bg-white">
                <CardContent className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-14 h-14 ${stat.bg} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                      <stat.icon className={`w-7 h-7 ${stat.color}`} />
                    </div>
                    <div className="bg-slate-50 px-3 py-1 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Real-time
                    </div>
                  </div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{stat.label}</p>
                  <p className="text-4xl font-black text-slate-900 mt-2 tracking-tighter">{stat.value}</p>
                  <p className="text-[11px] font-medium text-slate-500 mt-3 flex items-center gap-2">
                     <TrendingUp className="w-3 h-3 text-emerald-500" /> {stat.subtitle}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Revenue Intelligence */}
          <Card className="lg:col-span-2 border-none shadow-sm rounded-[3rem] overflow-hidden bg-white">
            <CardHeader className="p-10 pb-0 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-black text-slate-900">Revenue <span className="text-primary italic">Stream</span></CardTitle>
                <p className="text-slate-500 font-medium mt-1">Daily revenue distribution ({revTab})</p>
              </div>
              <div className="bg-slate-50 p-2 rounded-2xl border border-slate-100 flex gap-2">
                <Button 
                  size="sm" 
                  className={`rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${revTab === 'history' ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-400"}`}
                  onClick={() => setRevTab('history')}
                >
                  History
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className={`rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${revTab === 'projection' ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-400"}`}
                  onClick={() => setRevTab('projection')}
                >
                  Projection
                </Button>
              </div>
            </CardHeader>
            <CardContent className="h-[400px] p-10 pt-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={currentRevData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)', padding: '20px' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Real-time Patient Queue */}
          <Card className="border-none shadow-2xl shadow-primary/5 rounded-[3rem] overflow-hidden bg-slate-900 text-white flex flex-col">
            <CardHeader className="p-10">
              <CardTitle className="text-2xl font-black flex items-center gap-4">
                <Activity className="w-8 h-8 text-primary" /> Active Queue
              </CardTitle>
              <p className="text-slate-400 font-medium mt-1">Predicted waiting times & priority</p>
            </CardHeader>
            <CardContent className="p-10 pt-0 flex-1 space-y-6 overflow-y-auto max-h-[500px] scrollbar-hide">
              {activeQueue.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-20 px-8 bg-white/5 rounded-[2.5rem] border border-white/10">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <UserCheck className="w-10 h-10 text-slate-700" />
                  </div>
                  <h4 className="text-lg font-bold">Queue is empty</h4>
                  <p className="text-slate-500 text-sm mt-2 font-medium">No sessions scheduled for the next hour.</p>
                </div>
              ) : (
                activeQueue.map((appt, i) => (
                  <motion.div 
                    key={appt._id} 
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="relative flex flex-col gap-5 p-7 bg-white/5 rounded-[2.5rem] border border-white/10 hover:bg-white/10 transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/20 flex items-center justify-center text-primary font-black text-xl">
                        {appt.patientId?.fullName?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-black truncate text-white">{appt.patientId?.fullName}</p>
                        <div className="flex items-center gap-3 mt-1 text-[11px] font-bold uppercase tracking-widest text-primary">
                          <span className="bg-primary/10 px-2 py-0.5 rounded flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {appt.time}
                          </span>
                          <span className="text-slate-500">Wait: {getWaitTime(i)}m</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                        <p className="text-[10px] font-black text-slate-500 tracking-tighter uppercase">
                          {i === 0 ? "Current Patient" : `Next in ${getWaitTime(i)} min`}
                        </p>
                        <ChevronRight className="w-5 h-5 text-slate-700 group-hover:text-primary transition-colors" />
                    </div>
                    {i === 0 && (
                      <div className="absolute -top-3 -right-3 w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30 animate-pulse border-4 border-slate-900">
                        <Activity className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </CardContent>
            <div className="p-10 pt-0 mt-auto border-t border-white/5 py-8">
              <p className="text-slate-400 text-xs font-medium text-center italic">
                Wait times are estimated based on 20min average session length.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function CheckCircle(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

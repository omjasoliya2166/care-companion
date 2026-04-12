import DashboardLayout from "@/components/layout/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { 
  Users, Stethoscope, Calendar, 
  TrendingUp, CreditCard, ArrowUpRight,
  TrendingDown, Activity, Star
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const response = await api.get("/appointments/admin/stats");
      return response.data || { summary: { patients: 0, doctors: 0, appointments: 0, totalRevenue: 0 } };
    },
  });

  const { data: recentAppointments } = useQuery({
    queryKey: ["admin-recent-appointments"],
    queryFn: async () => {
      const response = await api.get("/appointments/admin/recent-appointments");
      return response.data || [];
    },
  });

  const metrics = [
    { 
      label: "Total Patients", 
      value: stats?.summary?.patients || 0, 
      icon: <Users className="h-6 w-6" />, 
      color: "bg-blue-500",
      trend: "+12.5%",
      positive: true
    },
    { 
      label: "Active Doctors", 
      value: stats?.summary?.doctors || 0, 
      icon: <Stethoscope className="h-6 w-6" />, 
      color: "bg-teal-500",
      trend: "+2.1%",
      positive: true
    },
    { 
      label: "Total Revenue", 
      value: `₹${stats?.summary?.totalRevenue || 0}`, 
      icon: <CreditCard className="h-6 w-6" />, 
      color: "bg-emerald-500",
      trend: "+24% this month",
      positive: true
    },
    { 
      label: "Appointments", 
      value: stats?.summary?.appointments || 0, 
      icon: <Calendar className="h-6 w-6" />, 
      color: "bg-amber-500",
      trend: "-4.2%",
      positive: false
    },
  ];

  return (
    <DashboardLayout role="admin">
      <div className="space-y-10">
        <header className="flex flex-col md:flex-row items-baseline gap-4">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Executive <span className="text-primary italic">Summary</span> 📊</h1>
          <p className="text-slate-500 font-medium">Real-time performance analytics for LIONHS.</p>
        </header>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {metrics.map((m, idx) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2.5rem] bg-white group hover:scale-[1.02] transition-transform cursor-default">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between">
                    <div className={`p-4 rounded-2xl ${m.color} text-white shadow-lg`}>
                      {m.icon}
                    </div>
                    {m.trend && (
                      <Badge variant="outline" className={`border-none ${m.positive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"} font-black text-[10px]`}>
                        {m.positive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                        {m.trend}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-6">
                    <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest">{m.label}</p>
                    <h3 className="text-3xl font-black text-slate-900 mt-1">{m.value}</h3>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          {/* Recent Activity */}
          <Card className="xl:col-span-8 border-none shadow-2xl shadow-slate-200/50 rounded-[3rem] bg-white overflow-hidden">
             <CardHeader className="p-10 border-b border-slate-50 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-black text-slate-900">Recent Appointments</CardTitle>
                  <p className="text-slate-400 font-medium text-sm mt-1">Latest consultation logs and booking status.</p>
                </div>
                <Link to="/admin/appointments">
                  <Button variant="ghost" className="rounded-xl font-bold text-primary group">
                    View Full Logs <ArrowUpRight className="w-4 h-4 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </Button>
                </Link>
             </CardHeader>
             <CardContent className="p-0">
                <div className="divide-y divide-slate-50">
                   {recentAppointments?.map((a) => (
                      <div key={a._id} className="p-8 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                         <div className="flex items-center gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                               <Activity className="w-6 h-6" />
                            </div>
                            <div>
                               <p className="font-bold text-slate-900 text-lg">Dr. {a.doctorId?.userId?.fullName || "Awaiting Assignment"}</p>
                               <div className="flex items-center gap-3 mt-1">
                                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-lg">
                                    <Calendar className="w-3 h-3" /> {new Date(a.date).toLocaleDateString()}
                                  </span>
                                  <span className="text-xs font-black text-primary uppercase tracking-widest">
                                    @ {a.time}
                                  </span>
                               </div>
                            </div>
                         </div>
                         <Badge 
                           className={`h-10 px-6 rounded-2xl font-black uppercase tracking-widest text-[10px] border-none ${
                             a.status === "approved" ? "bg-emerald-500 text-white" :
                             a.status === "rejected" ? "bg-destructive text-white" :
                             "bg-amber-100 text-amber-600"
                           }`}
                         >
                           {a.status}
                         </Badge>
                      </div>
                   ))}
                </div>
             </CardContent>
          </Card>

          {/* Quick Support / Feedback */}
          <div className="xl:col-span-4 space-y-10">
             <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[3rem] bg-slate-900 text-white p-10 overflow-hidden relative">
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
                <Star className="text-primary w-12 h-12 mb-6" />
                <h3 className="text-2xl font-black italic">Platform Wellness</h3>
                <p className="text-slate-400 font-medium mt-4 leading-relaxed">System monitoring indicates optimal performance for all active nodes.</p>
                <Button className="mt-8 bg-white text-slate-900 hover:bg-slate-100 rounded-2xl font-black w-full h-14">
                  Check Health
                </Button>
             </Card>

             <Card className="border-none shadow-2xl shadow-slate-100/50 rounded-[3rem] bg-white p-10">
                <h3 className="text-xl font-black text-slate-900 mb-6">Staff Breakdown</h3>
                <div className="space-y-6">
                   <div className="group flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary/20 transition-all">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">CN</div>
                         <p className="font-bold text-slate-700">Clinical Nodes</p>
                      </div>
                      <span className="font-black text-slate-900">{stats?.summary?.doctors}</span>
                   </div>
                   <div className="group flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-100 transition-all">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center font-bold">UR</div>
                         <p className="font-bold text-slate-700">User Registry</p>
                      </div>
                      <span className="font-black text-slate-900">{stats?.summary?.patients}</span>
                   </div>
                </div>
             </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

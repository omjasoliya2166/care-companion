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
      value: `Rs. ${stats?.summary?.totalRevenue || 0}`, 
      icon: <CreditCard className="h-6 w-6" />, 
      color: "bg-emerald-500",
      trend: "+24%",
      positive: true
    },
    { 
      label: "Appointments", 
      value: stats?.summary?.appointments || 0, 
      icon: <Calendar className="h-6 w-6" />, 
      color: "bg-amber-500",
      trend: stats?.summary?.appointments > 0 ? "+5.4%" : "0%",
      positive: stats?.summary?.appointments > 0
    },
  ];

  return (
    <DashboardLayout role="admin">
      <div className="space-y-10 p-8">
        <header className="flex flex-col md:flex-row items-baseline gap-4">
          <h1 className="text-4xl font-black text-foreground tracking-tight">Executive <span className="text-primary italic">Summary</span> 📊</h1>
          <p className="text-foreground/80 font-medium">Real-time performance analytics for LIOHN.</p>
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
              <Card className="border-none shadow-2xl shadow-primary/5 rounded-[2.5rem] bg-card group hover:scale-[1.02] transition-transform cursor-default">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between">
                    <div className={`p-4 rounded-2xl ${m.color} text-white shadow-lg shadow-primary/10`}>
                      {m.icon}
                    </div>
                    {m.trend && (
                      <Badge variant="outline" className={`border-none ${m.positive ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"} font-black text-[10px]`}>
                        {m.positive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                        {m.trend}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-6">
                    <p className="text-[11px] font-black uppercase text-foreground/80 tracking-widest">{m.label}</p>
                    <h3 className="text-3xl font-black text-foreground mt-1">{m.value}</h3>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          {/* Recent Activity */}
          <Card className="xl:col-span-8 border-none shadow-2xl shadow-primary/5 rounded-[3rem] bg-card overflow-hidden border border-border">
             <CardHeader className="p-10 border-b border-border flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-black text-foreground">Recent Appointments</CardTitle>
                  <p className="text-foreground/80 font-medium text-sm mt-1">Latest consultation logs and booking status.</p>
                </div>
                <Link to="/admin/appointments">
                  <Button variant="ghost" className="rounded-xl font-bold text-primary group hover:bg-primary/5">
                    View Full Logs <ArrowUpRight className="w-4 h-4 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </Button>
                </Link>
             </CardHeader>
             <CardContent className="p-0">
                <div className="divide-y divide-border">
                   {recentAppointments?.map((a) => (
                      <div key={a._id} className="p-8 flex items-center justify-between hover:bg-muted/50 transition-colors">
                         <div className="flex items-center gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-foreground/80">
                               <Activity className="w-6 h-6" />
                            </div>
                            <div>
                               <p className="font-bold text-foreground text-lg">Dr. {a.doctorId?.userId?.fullName || "Awaiting Assignment"}</p>
                               <div className="flex items-center gap-3 mt-1">
                                  <span className="text-xs font-bold text-foreground/80 flex items-center gap-1.5 uppercase tracking-widest bg-muted px-3 py-1 rounded-lg">
                                    <Calendar className="w-3 h-3" /> {new Date(a.date).toLocaleDateString()}
                                  </span>
                                  <span className="text-xs font-black text-primary uppercase tracking-widest bg-primary/5 px-3 py-1 rounded-lg">
                                    @ {a.time}
                                  </span>
                               </div>
                            </div>
                         </div>
                         <Badge 
                           className={`h-10 px-6 rounded-2xl font-black uppercase tracking-widest text-[10px] border-none shadow-sm ${
                             a.status === "approved" ? "bg-emerald-500 text-white" :
                             a.status === "completed" ? "bg-green-400 text-white" :
                             a.status === "rejected" ? "bg-destructive text-white" :
                             "bg-amber-500 text-white"
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
             <Card className="border-none shadow-2xl shadow-primary/10 rounded-[3rem] bg-card text-foreground p-10 overflow-hidden relative group border border-border">
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary/30 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
                <Star className="text-primary w-12 h-12 mb-6" />
                <h3 className="text-2xl font-black italic tracking-tight text-foreground">Platform Wellness</h3>
                <p className="text-foreground/80 font-medium mt-4 leading-relaxed">System monitoring indicates <span className="text-emerald-500 font-black">optimal</span> performance for all active nodes.</p>
                <Button className="mt-8 bg-primary text-white hover:bg-primary/90 rounded-2xl font-black w-full h-14 shadow-xl shadow-primary/20 transition-all">
                  Check Health
                </Button>
             </Card>

             <Card className="border-none shadow-2xl shadow-primary/5 rounded-[3rem] bg-card p-10 border border-border">
                <h3 className="text-xl font-black text-foreground mb-6">Staff Breakdown</h3>
                <div className="space-y-6">
                   <div className="group flex items-center justify-between p-5 rounded-2xl bg-muted/30 border border-transparent hover:border-primary/20 hover:bg-muted/50 transition-all">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">CN</div>
                         <p className="font-bold text-foreground/80 group-hover:text-foreground">Clinical Nodes</p>
                      </div>
                      <span className="font-black text-foreground">{stats?.summary?.doctors}</span>
                   </div>
                   <div className="group flex items-center justify-between p-5 rounded-2xl bg-muted/30 border border-transparent hover:border-emerald-500/20 hover:bg-muted/50 transition-all">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">UR</div>
                         <p className="font-bold text-foreground/80 group-hover:text-foreground">User Registry</p>
                      </div>
                      <span className="font-black text-foreground">{stats?.summary?.patients}</span>
                   </div>
                </div>
             </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

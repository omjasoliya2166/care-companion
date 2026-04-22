import { useState, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  Pill, Download, FileText, Activity, Clock,
  Search, Info, UtensilsCrossed, Loader2, Lock
} from "lucide-react";
import HeartbeatLoader from "@/components/ui/HeartbeatLoader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { generatePrescriptionPDF } from "@/utils/pdfGenerators";
import { Link } from "react-router-dom";

export default function PatientPrescriptions() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [exportingId, setExportingId] = useState(null);
  const pdfRefs = useRef({});

  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ["my-prescriptions", user?._id],
    queryFn: async () => {
      const response = await api.get("/prescriptions");
      return response.data || [];
    },
    enabled: !!user,
  });

  const filteredPrescriptions = prescriptions?.filter(p =>
    p.doctorId?.userId?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    p.medicines?.some(m => m.name?.toLowerCase().includes(search.toLowerCase()))
  );

  const exportPDF = async (presc) => {
    setExportingId(presc._id);
    try {
      generatePrescriptionPDF(presc);
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setExportingId(null);
    }
  };

  return (
    <DashboardLayout role="patient">
      <div className="space-y-6 pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-foreground">My Prescriptions</h1>
            <p className="text-muted-foreground text-sm mt-1">Your complete pharmaceutical history from LIOHN Care</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search medicine or doctor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 pl-11 rounded-2xl text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isLoading ? (
            <div className="lg:col-span-2 flex justify-center py-20">
              <HeartbeatLoader />
            </div>
          ) : filteredPrescriptions?.length === 0 ? (
            <div className="lg:col-span-2 py-20 text-center bg-muted/20 rounded-3xl border-2 border-dashed border-border">
              <Pill className="w-14 h-14 text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-bold text-muted-foreground">No prescriptions found.</p>
            </div>
          ) : (
            filteredPrescriptions.map((presc, i) => {
              const isLocked = presc.appointmentId && !presc.appointmentId.isPrescriptionVisible && !presc.appointmentId.isPaid;

              return (
                <motion.div
                  key={presc._id}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card rounded-3xl border border-border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden relative"
                >
                  {isLocked && (
                    <div className="absolute inset-0 z-10 backdrop-blur-md bg-white/40 dark:bg-slate-900/40 flex flex-col items-center justify-center p-8 text-center">
                      <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-3xl shadow-xl flex items-center justify-center mb-4">
                        <Lock className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Prescription Locked</h3>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-2 max-w-[240px]">
                        Please complete your consultation payment to unlock and download this prescription.
                      </p>
                      <Link to={`/patient/payment/${presc.appointmentId._id}`} className="mt-6">
                        <Button className="rounded-2xl h-11 px-6 bg-primary text-white font-bold shadow-lg shadow-primary/20">
                          Go to Payments
                        </Button>
                      </Link>
                    </div>
                  )}
                {/* Card Header */}
                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 px-6 py-4 flex items-center justify-between border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center">
                      <Pill className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-black text-foreground text-sm">Prescription #{presc._id.slice(-6).toUpperCase()}</p>
                      <p className="text-xs text-muted-foreground">{new Date(presc.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => exportPDF(presc)}
                    disabled={exportingId === presc._id}
                    className="rounded-xl h-9 px-4 text-xs font-bold gap-2 border-primary/20 text-primary hover:bg-primary/10"
                  >
                    {exportingId === presc._id ? (
                      <HeartbeatLoader size="sm" />
                    ) : (
                      <Download className="w-3 h-3" />
                    )}
                    {exportingId === presc._id ? "Generating..." : "Export PDF"}
                  </Button>
                </div>

                {/* Medicines */}
                <div className="p-5 space-y-3">
                  {presc.medicines?.map((med, idx) => (
                    <div key={idx} className="p-4 bg-muted/30 rounded-2xl border border-border/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <Activity className="w-4 h-4 text-emerald-500" />
                          </div>
                          <p className="font-black text-foreground text-sm">{med.name}</p>
                        </div>
                        <div className="flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-full">
                          <UtensilsCrossed className="w-3 h-3 text-emerald-600" />
                          <span className="text-[10px] font-black text-emerald-600">{med.mealTiming}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {med.dosage?.morning && <span className="flex items-center gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-lg text-[10px] font-black"><Clock className="w-3 h-3" />Morning</span>}
                        {med.dosage?.noon && <span className="flex items-center gap-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2.5 py-1 rounded-lg text-[10px] font-black"><Clock className="w-3 h-3" />Noon</span>}
                        {med.dosage?.evening && <span className="flex items-center gap-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-lg text-[10px] font-black"><Clock className="w-3 h-3" />Evening</span>}
                        {med.duration && <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-lg text-[10px] font-black">{med.duration}</span>}
                      </div>
                      {med.description && (
                        <p className="text-xs text-muted-foreground pl-2 border-l-2 border-muted-foreground/30">{med.description}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Notes & Doctor */}
                <div className="px-5 pb-5 space-y-3">
                  {presc.generalNotes && (
                    <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                      <p className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                        <Info className="w-3.5 h-3.5" /> Doctor's Notes
                      </p>
                      <p className="text-sm text-foreground font-medium italic">"{presc.generalNotes}"</p>
                    </div>
                  )}
                  <div className="flex items-center gap-3 pt-1">
                    <div className="w-8 h-8 rounded-xl bg-foreground/10 flex items-center justify-center text-foreground text-xs font-black">
                      {presc.doctorId?.userId?.fullName?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Prescribed by</p>
                      <p className="text-sm font-black text-foreground">Dr. {presc.doctorId?.userId?.fullName}</p>
                    </div>
                  </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

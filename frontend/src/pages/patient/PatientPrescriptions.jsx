import { useState, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  Pill, Download, FileText, Activity, Clock,
  Search, Info, UtensilsCrossed, Loader2, Lock
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
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
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let y = 0;

      // Header background
      pdf.setFillColor(37, 99, 235);
      pdf.rect(0, 0, pageWidth, 45, "F");

      // Hospital name
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(26);
      pdf.setFont("helvetica", "bold");
      pdf.text("LIONHS Care Hospital", pageWidth / 2, 18, { align: "center" });
      
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      pdf.text("Excellence in Precision Healthcare • Est. 1998", pageWidth / 2, 26, { align: "center" });
      
      pdf.setDrawColor(255, 255, 255);
      pdf.setLineWidth(0.5);
      pdf.line(pageWidth / 2 - 40, 32, pageWidth / 2 + 40, 32);
      
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("DIGITAL MEDICAL PRESCRIPTION", pageWidth / 2, 40, { align: "center" });

      y = 55;

      // Prescription ID & Date
      pdf.setTextColor(100, 116, 139);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.text(`REFERENCE ID: #${presc._id.slice(-8).toUpperCase()}`, 15, y);
      pdf.text(`ISSUED ON: ${new Date(presc.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`, pageWidth - 15, y, { align: "right" });
      y += 8;

      // Divider
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.1);
      pdf.line(15, y, pageWidth - 15, y);
      y += 10;

      // Patient & Doctor Info
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(15, y, (pageWidth - 35) / 2, 32, 4, 4, "F");
      pdf.roundedRect(pageWidth / 2 + 3, y, (pageWidth - 35) / 2, 32, 4, 4, "F");

      pdf.setTextColor(37, 99, 235);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.text("PATIENT INFORMATION", 20, y + 8);
      pdf.text("TREATING PHYSICIAN", pageWidth / 2 + 8, y + 8);

      pdf.setTextColor(30, 41, 59);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text(presc.patientId?.fullName || "Patient", 20, y + 18);
      pdf.text(`Dr. ${presc.doctorId?.userId?.fullName || "Doctor"}`, pageWidth / 2 + 8, y + 18);

      pdf.setTextColor(100, 116, 139);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.text(`${presc.patientId?.email || "No email provided"}`, 20, y + 25);
      pdf.text(`${presc.doctorId?.specialization || "Medical Specialist"}`, pageWidth / 2 + 8, y + 25);
      y += 40;

      // Medicines table header
      pdf.setFillColor(37, 99, 235);
      pdf.roundedRect(15, y, pageWidth - 30, 12, 3, 3, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text("Medication Name", 20, y + 8);
      pdf.text("Dosage Schedule", 85, y + 8);
      pdf.text("Duration", 130, y + 8);
      pdf.text("Timing", 160, y + 8);
      y += 15;

      // Medicine rows
      presc.medicines?.forEach((med, idx) => {
        const rowHeight = 16;
        if (y + rowHeight > pageHeight - 30) {
          pdf.addPage();
          y = 20;
        }

        const bgColor = idx % 2 === 0 ? [248, 250, 252] : [255, 255, 255];
        pdf.setFillColor(...bgColor);
        pdf.rect(15, y, pageWidth - 30, rowHeight, "F");

        pdf.setTextColor(30, 41, 59);
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.text(med.name, 20, y + 7);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(71, 85, 105);

        const dosageParts = [];
        if (med.dosage?.morning) dosageParts.push("Morning");
        if (med.dosage?.noon) dosageParts.push("Noon");
        if (med.dosage?.evening) dosageParts.push("Evening");
        pdf.text(dosageParts.join(" - ") || "—", 85, y + 7);
        pdf.text(med.duration || "As directed", 130, y + 7);
        pdf.text(med.mealTiming || "—", 160, y + 7);

        if (med.description) {
           pdf.setFontSize(7);
           pdf.setTextColor(148, 163, 184);
           pdf.text(`Note: ${med.description}`, 20, y + 12);
        }

        y += rowHeight;
      });

      y += 6;

      if (presc.generalNotes) {
        if (y + 30 > pageHeight - 30) {
          pdf.addPage();
          y = 20;
        }
        pdf.setFillColor(241, 245, 249);
        pdf.roundedRect(15, y, pageWidth - 30, 25, 4, 4, "F");
        pdf.setTextColor(37, 99, 235);
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.text("ADMINISTRATIVE NOTES / CLINICAL ADVICE:", 20, y + 8);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(51, 65, 85);
        const noteLines = pdf.splitTextToSize(presc.generalNotes, pageWidth - 40);
        pdf.text(noteLines, 20, y + 15);
        y += 30;
      }

      // Footer
      const footerY = pageHeight - 20;
      pdf.setDrawColor(226, 232, 240);
      pdf.line(15, footerY - 5, pageWidth - 15, footerY - 5);
      
      pdf.setTextColor(148, 163, 184);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.text("This is an electronically generated record from LIONHS Care Hospital Management System.", pageWidth / 2, footerY + 2, { align: "center" });
      pdf.text("Verification Code: " + presc._id.toUpperCase(), pageWidth / 2, footerY + 7, { align: "center" });

      pdf.save(`Prescription_${presc._id.slice(-6).toUpperCase()}.pdf`);
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
            <p className="text-muted-foreground text-sm mt-1">Your complete pharmaceutical history from LIONHS Care</p>
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
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-64 bg-muted/50 animate-pulse rounded-3xl" />
            ))
          ) : filteredPrescriptions?.length === 0 ? (
            <div className="lg:col-span-2 py-20 text-center bg-muted/20 rounded-3xl border-2 border-dashed border-border">
              <Pill className="w-14 h-14 text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-bold text-muted-foreground">No prescriptions found.</p>
            </div>
          ) : (
            filteredPrescriptions.map((presc, i) => {
              const isLocked = presc.appointmentId && !presc.appointmentId.isPrescriptionVisible;

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
                      <Loader2 className="w-3 h-3 animate-spin" />
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
                        {med.duration && <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-lg text-[10px] font-black">📅 {med.duration}</span>}
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

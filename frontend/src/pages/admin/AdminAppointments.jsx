import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import jsPDF from "jspdf";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminAppointments() {
  const { user } = useAuth(); // For Admin name if needed

  const { data: appointments, isLoading: apptLoading, refetch } = useQuery({
    queryKey: ["admin-all-appointments"],
    queryFn: async () => {
      const response = await api.get("/appointments/admin/appointments");
      return response.data || [];
    },
  });

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/appointments/appointments/${id}/status`, { status });
      refetch();
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const { data: prescriptions, isLoading: prescLoading } = useQuery({
    queryKey: ["admin-all-prescriptions"],
    queryFn: async () => {
      const response = await api.get("/prescriptions");
      return response.data || [];
    },
  });

  const exportInvoice = async (appt) => {
    try {
      let transactionId = `CC-${appt._id.slice(-8).toUpperCase()}`;
      try {
        const payRes = await api.get(`/appointments/appointments/${appt._id}/payment`);
        if (payRes.data && payRes.data.transactionId) {
          transactionId = payRes.data.transactionId;
        }
      } catch (err) {
        console.warn("Could not fetch unique payment record", err);
      }

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      pdf.setFillColor(15, 23, 42);
      pdf.rect(0, 0, pageWidth, 40, "F");
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(22);
      pdf.setFont("helvetica", "bold");
      pdf.text("LIONHS Care Invoice", pageWidth / 2, 18, { align: "center" });
      
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text("Electronic Billing Statement • Tax Invoice", pageWidth / 2, 26, { align: "center" });

      pdf.setTextColor(30, 41, 59);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text("BILL TO:", 15, 55);
      pdf.setFont("helvetica", "normal");
      pdf.text(appt.patientId?.fullName || "Patient", 15, 62);

      pdf.setFont("helvetica", "bold");
      pdf.text("DOCTOR:", 120, 55);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Dr. ${appt.doctorId?.userId?.fullName || "Doctor"}`, 120, 62);

      pdf.setDrawColor(226, 232, 240);
      pdf.line(15, 80, pageWidth - 15, 80);

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.text("Description", 20, 95);
      pdf.text("Date", 100, 95);
      pdf.text("Amount", pageWidth - 20, 95, { align: "right" });

      pdf.setFont("helvetica", "normal");
      pdf.text(`Consultation Fee`, 20, 110);
      pdf.text(new Date(appt.date).toLocaleDateString(), 100, 110);
      pdf.text(`₹${appt.chargeAmount ? appt.chargeAmount.toFixed(2) : '1500.00'}`, pageWidth - 20, 110, { align: "right" });

      pdf.line(15, 120, pageWidth - 15, 120);
      
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text("Total Paid:", 120, 135);
      pdf.text(`₹${appt.chargeAmount ? appt.chargeAmount.toFixed(2) : '1500.00'}`, pageWidth - 20, 135, { align: "right" });

      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text(`Payment Status: ${appt.isPaid ? 'SUCCESSFUL' : 'PENDING'}`, 20, 150);
      if (appt.isPaid) {
        pdf.text(`Transaction ID: ${transactionId}`, 20, 155);
      }

      pdf.setDrawColor(226, 232, 240);
      pdf.line(15, 165, pageWidth - 15, 165);
      pdf.setFontSize(7);
      pdf.text("Thank you for choosing LIONHS Care.", pageWidth / 2, 172, { align: "center" });

      const blob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (err) {
      console.error("PDF Failed:", err);
    }
  };

  const exportPDF = async (presc) => {
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
      pdf.text("Excellence in Precision Healthcare", pageWidth / 2, 26, { align: "center" });
      
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
      pdf.text(`ISSUED ON: ${new Date(presc.createdAt).toLocaleDateString()}`, pageWidth - 15, y, { align: "right" });
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
        if (med.dosage?.afternoon) dosageParts.push("Afternoon");
        if (med.dosage?.evening) dosageParts.push("Evening");
        if (med.dosage?.night) dosageParts.push("Night");
        
        pdf.text(dosageParts.join(" • ") || "As prescribed", 85, y + 7);
        pdf.text(`${med.duration} days`, 130, y + 7);
        pdf.text(med.timing === "after_food" ? "After Food" : "Before Food", 160, y + 7);

        y += rowHeight;
      });

      const blob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (error) {
      console.error("PDF generation failed:", error);
    }
  };

  return (
    <DashboardLayout role="admin">
      <h1 className="text-2xl font-bold text-foreground mb-6">Appointment Management</h1>
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-4 font-bold text-muted-foreground uppercase text-xs">Patient Name</th>
                <th className="text-left p-4 font-bold text-muted-foreground uppercase text-xs">Doctor Name</th>
                <th className="text-left p-4 font-bold text-muted-foreground uppercase text-xs">Date & Time</th>
                <th className="text-left p-4 font-bold text-muted-foreground uppercase text-xs">Appointment Status</th>
                <th className="text-left p-4 font-bold text-muted-foreground uppercase text-xs">Actions</th>
                <th className="text-left p-4 font-bold text-muted-foreground uppercase text-xs">Payment Status</th>
                <th className="text-left p-4 font-bold text-muted-foreground uppercase text-xs">View Invoice</th>
                <th className="text-left p-4 font-bold text-muted-foreground uppercase text-xs">View Prescription</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {apptLoading && <tr><td colSpan={7} className="p-4 text-center">Loading...</td></tr>}
              {appointments?.map((a) => {
                const presc = prescriptions?.find(p => p.appointmentId?._id === a._id);

                return (
                  <tr key={a._id} className="hover:bg-accent/50 transition-colors">
                    <td className="p-4 font-bold text-foreground">{a.patientId?.fullName || "Patient"}</td>
                    <td className="p-4 font-bold text-primary">Dr. {a.doctorId?.userId?.fullName || "Doctor"}</td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-semibold">{new Date(a.date).toLocaleDateString()}</span>
                        <span className="text-xs text-muted-foreground">{a.time}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-widest uppercase ${
                        a.status === "approved" ? "bg-emerald-500/10 text-emerald-600" :
                        a.status === "rejected" ? "bg-red-500/10 text-red-600" :
                        a.status === "completed" ? "bg-blue-500/10 text-blue-600" :
                        "bg-amber-500/10 text-amber-600"
                      }`}>
                        {a.status === "pending_reschedule" ? "PENDING" : a.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {a.status === 'pending' || a.status === 'pending_reschedule' ? (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => updateStatus(a._id, 'approved')} className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] h-7 px-2">Approve</Button>
                          <Button size="sm" onClick={() => updateStatus(a._id, 'rejected')} variant="destructive" className="text-[10px] h-7 px-2">Reject</Button>
                        </div>
                      ) : a.status === 'approved' ? (
                        <Button size="sm" onClick={() => updateStatus(a._id, 'completed')} className="bg-blue-500 hover:bg-blue-600 text-white text-[10px] h-7 px-2 w-full">Complete</Button>
                      ) : (
                        <span className="text-xs text-muted-foreground font-medium flex items-center justify-center">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        a.isPaid ? "bg-emerald-500/10 text-emerald-600" : "bg-warning/10 text-warning"
                      }`}>
                        {a.isPaid ? 'Paid' : 'Not Paid'}
                      </span>
                    </td>
                    <td className="p-4">
                      {a.isPaid ? (
                        <Button size="sm" variant="outline" className="h-7 text-[10px] px-2 text-slate-600" onClick={() => exportInvoice(a)}>
                          <FileText className="w-3 h-3 mr-1" /> View Invoice
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      {presc && a.isPaid ? (
                        <Button size="sm" variant="outline" className="h-7 text-[10px] px-2 text-primary" onClick={() => exportPDF(presc)}>
                          <Download className="w-3 h-3 mr-1" /> View Prescription
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

import jsPDF from "jspdf";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";

export default function PatientAppointments() {
  const { user } = useAuth();

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["patient-all-appointments", user?._id],
    queryFn: async () => {
      const response = await api.get("/appointments/appointments");
      return response.data || [];
    },
    enabled: !!user,
  });

  const { data: prescriptions, isLoading: prescLoading } = useQuery({
    queryKey: ["patient-prescriptions", user?._id],
    queryFn: async () => {
      const response = await api.get("/prescriptions");
      return response.data || [];
    },
    enabled: !!user,
  });

  const exportInvoice = async (appt) => {
    try {
      let transactionId = `CC-${appt._id.slice(-8).toUpperCase()}`;
      try {
        const payRes = await api.get(`/appointments/${appt._id}/payment`);
        if (payRes.data && payRes.data.transactionId) {
          transactionId = payRes.data.transactionId;
        }
      } catch (err) {
        console.warn("Could not fetch payment record", err);
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
      pdf.text(user?.fullName || "Patient", 15, 62);

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
      pdf.text("Payment Status: SUCCESSFUL", 20, 150);
      pdf.text(`Transaction ID: ${transactionId}`, 20, 155);
      
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

      pdf.setFillColor(37, 99, 235);
      pdf.rect(0, 0, pageWidth, 45, "F");

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
      pdf.text("DIGITAL PRESCRIPTION", pageWidth / 2, 40, { align: "center" });

      y = 55;

      pdf.setTextColor(100, 116, 139);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.text(`ID: #${presc._id.slice(-8).toUpperCase()}`, 15, y);
      pdf.text(`DATE: ${new Date(presc.createdAt).toLocaleDateString()}`, pageWidth - 15, y, { align: "right" });
      y += 10;

      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(15, y, (pageWidth - 35) / 2, 25, 4, 4, "F");
      pdf.roundedRect(pageWidth / 2 + 3, y, (pageWidth - 35) / 2, 25, 4, 4, "F");

      pdf.setTextColor(37, 99, 235);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.text("PATIENT", 20, y + 8);
      pdf.text("DOCTOR", pageWidth / 2 + 8, y + 8);

      pdf.setTextColor(30, 41, 59);
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.text(presc.patientId?.fullName || "Patient", 20, y + 16);
      pdf.text(`Dr. ${presc.doctorId?.userId?.fullName || "Doctor"}`, pageWidth / 2 + 8, y + 16);
      y += 35;

      pdf.setFillColor(37, 99, 235);
      pdf.roundedRect(15, y, pageWidth - 30, 10, 2, 2, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.text("Medicine", 20, y + 7);
      pdf.text("Dosage", 95, y + 7);
      pdf.text("Duration", 150, y + 7);
      y += 15;

      presc.medicines?.forEach((med) => {
        pdf.setTextColor(30, 41, 59);
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.text(med.name, 20, y + 4);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(71, 85, 105);

        const dosage = [];
        if (med.dosage?.morning) dosage.push("Morning");
        if (med.dosage?.afternoon) dosage.push("Afternoon");
        if (med.dosage?.evening) dosage.push("Evening");
        if (med.dosage?.night) dosage.push("Night");
        
        pdf.text(dosage.join(", ") || "As directed", 95, y + 4);
        pdf.text(`${med.duration} days`, 150, y + 4);
        y += 10;
      });

      const blob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (err) {
      console.error("PDF Failed:", err);
    }
  };

  return (
    <DashboardLayout role="patient">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Appointment Management</h1>
          <Link to="/patient/book">
            <Button className="rounded-xl h-9 px-4 text-sm font-bold bg-primary text-white shadow-sm">
              + Book New
            </Button>
          </Link>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4 font-bold text-muted-foreground uppercase text-xs">Doctor Name</th>
                  <th className="text-left p-4 font-bold text-muted-foreground uppercase text-xs">Date & Time</th>
                  <th className="text-left p-4 font-bold text-muted-foreground uppercase text-xs">Appointment Status</th>
                  <th className="text-left p-4 font-bold text-muted-foreground uppercase text-xs">Payment Status</th>
                  <th className="text-left p-4 font-bold text-muted-foreground uppercase text-xs">View Invoice</th>
                  <th className="text-left p-4 font-bold text-muted-foreground uppercase text-xs">View Prescription</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading || prescLoading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
                ) : appointments?.length === 0 ? (
                  <tr><td colSpan={6} className="p-12 text-center text-muted-foreground">No appointments found.</td></tr>
                ) : (
                  appointments?.map((a) => {
                    const presc = prescriptions?.find(p => p.appointmentId?._id === a._id);

                    return (
                      <tr key={a._id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4 font-bold text-primary">Dr. {a.doctorId?.userId?.fullName || "Doctor"}</td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="text-foreground font-semibold">{new Date(a.date).toLocaleDateString()}</span>
                            <span className="text-xs text-muted-foreground font-medium">{a.time}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-block text-[10px] uppercase tracking-wider px-3 py-1 rounded-full font-bold ${
                            a.status === "approved" ? "bg-emerald-500/10 text-emerald-600" :
                            a.status === "rejected" ? "bg-red-500/10 text-red-600" :
                            a.status === "completed" ? "bg-blue-500/10 text-blue-600" :
                            "bg-amber-500/10 text-amber-600"
                          }`}>
                            {a.status === "pending_reschedule" ? "PENDING" : a.status}
                          </span>
                        </td>
                        <td className="p-4">
                          {a.isPaid ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600">
                              Paid
                            </span>
                          ) : (
                            <Link to={`/patient/payment/${a._id}`}>
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-warning/10 text-warning hover:bg-warning/20 transition-colors cursor-pointer border border-warning/20">
                                Not Paid (Pay Now)
                              </span>
                            </Link>
                          )}
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
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

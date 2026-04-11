import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { CreditCard, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";

export default function PatientBilling() {
  const { data: payments, isLoading } = useQuery({
    queryKey: ["patient-payments"],
    queryFn: async () => {
      const res = await api.get("/appointments/payments/patient");
      return res.data;
    }
  });

  const exportInvoice = (pay) => {
    try {
      const appt = pay.appointmentId;
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
      pdf.text(pay.patientId?.fullName || "Patient", 15, 62);

      pdf.setFont("helvetica", "bold");
      pdf.text("DOCTOR:", 120, 55);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Dr. ${pay.doctorId?.userId?.fullName || "Doctor"}`, 120, 62);

      pdf.setDrawColor(226, 232, 240);
      pdf.line(15, 80, pageWidth - 15, 80);

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.text("Description", 20, 95);
      pdf.text("Date", 100, 95);
      pdf.text("Amount", pageWidth - 20, 95, { align: "right" });

      pdf.setFont("helvetica", "normal");
      pdf.text(`Consultation Fee`, 20, 110);
      pdf.text(new Date(appt?.date || pay.createdAt).toLocaleDateString(), 100, 110);
      pdf.text(`₹${pay.amount ? pay.amount.toFixed(2) : '1500.00'}`, pageWidth - 20, 110, { align: "right" });

      pdf.line(15, 120, pageWidth - 15, 120);
      
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text("Total Paid:", 120, 135);
      pdf.text(`₹${pay.amount ? pay.amount.toFixed(2) : '1500.00'}`, pageWidth - 20, 135, { align: "right" });

      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text(`Payment Status: SUCCESSFUL`, 20, 150);
      pdf.text(`Transaction ID: ${pay.transactionId}`, 20, 155);

      pdf.setDrawColor(226, 232, 240);
      pdf.line(15, 165, pageWidth - 15, 165);
      pdf.setFontSize(7);
      pdf.text("Thank you for choosing LIONHS Care.", pageWidth / 2, 172, { align: "center" });

      // Open PDF in new tab
      const blob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (err) {
      console.error("PDF Failed:", err);
    }
  };

  return (
    <DashboardLayout role="patient">
      <div className="flex items-center gap-3 mb-6">
        <CreditCard className="w-8 h-8 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Billing History</h1>
      </div>

      <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted">
            <tr>
              <th className="p-4 font-bold text-muted-foreground w-1/4">Date</th>
              <th className="p-4 font-bold text-muted-foreground w-1/4">Doctor</th>
              <th className="p-4 font-bold text-muted-foreground w-1/6">Transaction ID</th>
              <th className="p-4 font-bold text-muted-foreground w-1/6">Amount</th>
              <th className="p-4 font-bold text-muted-foreground w-1/6 flex justify-end">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr>}
            {!isLoading && payments?.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No payments found.</td></tr>
            )}
            {payments?.map((p) => (
              <tr key={p._id} className="hover:bg-accent/50 transition-colors">
                <td className="p-4">{new Date(p.createdAt).toLocaleDateString()}</td>
                <td className="p-4 font-bold">Dr. {p.doctorId?.userId?.fullName || "Doctor"}</td>
                <td className="p-4 font-mono text-[10px] text-muted-foreground">{p.transactionId}</td>
                <td className="p-4 font-bold text-emerald-600">₹{p.amount?.toFixed(2)}</td>
                <td className="p-4 flex justify-end">
                  <Button size="sm" variant="outline" className="h-8 text-xs font-bold" onClick={() => exportInvoice(p)}>
                    <Download className="w-3 h-3 mr-1" /> View Invoice
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}

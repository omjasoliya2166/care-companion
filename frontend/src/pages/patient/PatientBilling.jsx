import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { CreditCard, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateInvoicePDF } from "@/utils/pdfGenerators";

export default function PatientBilling() {
  const { data: payments, isLoading } = useQuery({
    queryKey: ["patient-payments"],
    queryFn: async () => {
      const res = await api.get("/appointments/payments/patient");
      return res.data;
    }
  });

  const exportInvoice = (pay) => {
    generateInvoicePDF({
      patientName: pay.patientId?.fullName || "Patient",
      doctorName: pay.doctorId?.userId?.fullName || "Doctor",
      date: pay.appointmentId?.date || pay.createdAt,
      amount: pay.amount,
      paymentStatus: "SUCCESSFUL",
      transactionId: pay.transactionId
    });
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

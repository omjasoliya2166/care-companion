import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { generatePrescriptionPDF, generateInvoicePDF } from "@/utils/pdfGenerators";
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

      generateInvoicePDF({
        patientName: appt.patientId?.fullName || "Patient",
        doctorName: appt.doctorId?.userId?.fullName || "Doctor",
        date: appt.date,
        amount: appt.chargeAmount,
        paymentStatus: appt.isPaid ? 'SUCCESSFUL' : 'PENDING',
        transactionId: appt.isPaid ? transactionId : null
      });
    } catch (err) {
      console.error("PDF Failed:", err);
    }
  };

  const exportPDF = async (presc) => {
    generatePrescriptionPDF(presc);
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

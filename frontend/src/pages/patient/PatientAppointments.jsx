import jsPDF from "jspdf";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Download, FileText, MessageSquare } from "lucide-react";
import { generatePrescriptionPDF, generateInvoicePDF } from "@/utils/pdfGenerators";

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

      generateInvoicePDF({
        patientName: user?.fullName || "Patient",
        doctorName: appt.doctorId?.userId?.fullName || "Doctor",
        date: appt.date,
        amount: appt.chargeAmount,
        paymentStatus: appt.isPaid ? "SUCCESSFUL" : "PENDING",
        transactionId
      });
    } catch (err) {
      console.error("PDF Failed:", err);
    }
  };

  const exportPDF = async (presc) => {
    generatePrescriptionPDF(presc);
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
                  <th className="text-left p-4 font-bold text-muted-foreground uppercase text-xs">Chat</th>
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
                          {a.status === 'approved' || a.status === 'completed' ? (
                            <Link to={`/chat/${a._id}`}>
                              <Button size="sm" variant="outline" className="h-7 text-[10px] px-2 text-primary">
                                <MessageSquare className="w-3 h-3 mr-1" /> Chat
                              </Button>
                            </Link>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
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

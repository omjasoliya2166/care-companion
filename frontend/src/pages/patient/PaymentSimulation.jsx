import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Lock, CreditCard, ShieldCheck, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function PaymentSimulation() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const { data: appointment, isLoading } = useQuery({
    queryKey: ["appointment", appointmentId],
    queryFn: async () => {
      const res = await api.get("/appointments/appointments");
      // Find the specific appointment from the list
      return res.data.find(a => a._id === appointmentId);
    }
  });

  const payMutation = useMutation({
    mutationFn: async () => {
      return await api.post(`/appointments/appointments/${appointmentId}/pay`);
    },
    onSuccess: () => {
      toast({
        title: "Payment Successful!",
        description: "Your consultation fee has been paid and your prescription is unlocked.",
      });
      navigate("/patient/prescriptions"); // Redirect back to prescriptions
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: err.response?.data?.message || "Something went wrong.",
      });
    }
  });

  const handlePayment = (e) => {
    e.preventDefault();
    if (pin === "123") {
      payMutation.mutate();
    } else {
      setError("Incorrect PIN. Please try again. (Hint: 123)");
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading Gateway...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="bg-primary p-10 text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30">
              <CreditCard className="w-8 h-8" />
            </div>
            <CardTitle className="text-2xl font-black italic tracking-tight">SafePay <span className="text-white/70">Gateway</span></CardTitle>
            <p className="text-white/60 text-sm font-bold uppercase tracking-widest mt-2">LIOHN Secure Payment</p>
          </CardHeader>

          <CardContent className="p-10 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-6 rounded-3xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none">Consultation Fee</p>
                  <h3 className="text-2xl font-black text-slate-900 mt-1">
                    Rs. {appointment?.chargeAmount ? appointment.chargeAmount.toFixed(2) : "..."}
                  </h3>
                </div>
                <ShieldCheck className="w-8 h-8 text-emerald-500" />
              </div>

              {appointment && (
                <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 text-xs font-medium text-slate-500 flex flex-col gap-1">
                  <p>Doctor: <span className="font-bold text-slate-900">Dr. {appointment.doctorId?.userId?.fullName}</span></p>
                  <p>Date: <span className="font-bold text-slate-900">{new Date(appointment.date).toLocaleDateString()} at {appointment.time}</span></p>
                  <p>Ref: <span className="font-bold text-slate-900">#{appointment._id.slice(-8).toUpperCase()}</span></p>
                </div>
              )}
            </div>

            <form onSubmit={handlePayment} className="space-y-6">
              <div className="space-y-3 text-center">
                <label className="text-sm font-bold text-slate-600 block">Enter Your Secure PIN</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                  <Input
                    type="password"
                    maxLength={4}
                    placeholder="****"
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value);
                      setError("");
                    }}
                    className="h-16 pl-12 text-center text-3xl font-black tracking-[0.5em] rounded-2xl border-slate-200 focus:ring-primary focus:border-primary transition-all"
                    required
                  />
                </div>
                {error && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs font-bold text-destructive flex items-center justify-center gap-1.5 pt-1"
                  >
                    <AlertCircle className="w-4 h-4" /> {error}
                  </motion.p>
                )}
              </div>

              <Button
                type="submit"
                disabled={payMutation.isPending}
                className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-lg shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
              >
                {payMutation.isPending ? "Processing..." : "Complete Payment"}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="px-10 pb-10 flex flex-col items-center gap-3">
            <div className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              256-bit Encrypted Session
            </div>
            <Button 
              variant="link" 
              onClick={() => navigate(-1)}
              className="text-slate-400 hover:text-slate-600 font-bold text-xs"
            >
              Cancel Transaction
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}

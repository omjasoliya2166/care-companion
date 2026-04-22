import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Heart, KeyRound, Timer } from "lucide-react";
import api from "@/services/api";
import { motion } from "framer-motion";
import logo from "@/assets/logo.png";

export default function VerifyOTP() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const { email } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast({ title: "Invalid OTP", description: "Please enter all 6 digits.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/verify-otp", { email, otp });
      toast({ title: "OTP Verified", description: "You can now reset your password." });
      navigate(`/reset-password/${email}/${otp}`);
    } catch (err) {
      toast({ 
        title: "Verification failed", 
        description: err.response?.data?.message || err.message, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setResendLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      toast({ title: "OTP Resent", description: "New verification code sent to your email." });
      setCooldown(60);
    } catch (err) {
      toast({ 
        title: "Resend failed", 
        description: err.response?.data?.message || err.message, 
        variant: "destructive" 
      });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4 py-8 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-4">
          <Link to="/" className="inline-flex flex-col items-center gap-2 mb-2 group">
            <motion.img
              whileHover={{ scale: 1.05 }}
              src={logo}
              alt="LIOHNS Logo"
              className="h-24 w-auto object-contain"
            />
          </Link>
        </div>

        <div className="bg-card p-6 md:p-8 rounded-[2rem] shadow-2xl border border-border">
          <h2 className="text-xl font-bold text-foreground mb-2 text-center">Verify Identity</h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Enter the 6-digit code sent to <span className="font-semibold text-foreground">{email}</span>
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 text-center">
              <Label htmlFor="otp">Verification Code</Label>
              <div className="relative">
                <Input 
                  id="otp" 
                  type="text" 
                  maxLength={6}
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} 
                  required 
                  placeholder="000000"
                  className="rounded-xl h-14 text-center text-3xl font-bold tracking-[0.5em] pl-6"
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-12 rounded-xl font-bold bg-primary" disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </Button>

            <div className="flex flex-col items-center gap-2 pt-2 border-t border-border">
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                className="text-primary font-bold hover:bg-primary/5"
                onClick={handleResend}
                disabled={resendLoading || cooldown > 0}
              >
                {resendLoading ? "Resending..." : cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend Code"}
              </Button>
            </div>
          </form>
        </div>
        
        <div className="mt-6 text-center px-4">
             <Link to="/forgot-password" className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">Back to Forgot Password</Link>
        </div>
      </motion.div>
    </div>
  );
}

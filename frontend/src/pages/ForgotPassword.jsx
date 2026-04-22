import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Heart, Mail } from "lucide-react";
import api from "@/services/api";
import { motion } from "framer-motion";
import logo from "@/assets/Logo.png";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: email.toLowerCase() });
      toast({ 
        title: "OTP Sent", 
        description: "Check your email for the verification code." 
      });
      navigate(`/verify-otp/${email.toLowerCase()}`);
    } catch (err) {
      toast({ 
        title: "Request failed", 
        description: err.response?.data?.message || err.message, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
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
          <h2 className="text-xl font-bold text-foreground mb-2 text-center">Forgot Password</h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Enter your email to receive a 6-digit verification code.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Input 
                  id="email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  placeholder="example@gmail.com"
                  className="rounded-xl h-12 pl-10"
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
              </div>
            </div>

            <Button type="submit" className="w-full h-12 rounded-xl font-bold bg-primary mt-2" disabled={loading}>
              {loading ? "Sending OTP..." : "Send Reset OTP"}
            </Button>

            <div className="text-center pt-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Remembered your password?{" "}
                <Link to="/login" className="text-primary font-bold hover:underline">Login here</Link>
              </p>
            </div>
          </form>
        </div>
        
        <div className="mt-6 text-center px-4">
             <Link to="/login" className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">Back to Login</Link>
        </div>
      </motion.div>
    </div>
  );
}

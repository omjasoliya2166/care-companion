import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Heart, Eye, EyeOff, ShieldAlert } from "lucide-react";
import api from "@/services/api";
import { motion } from "framer-motion";
import logo from "@/assets/logo.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [requirePasswordChange, setRequirePasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tempUser, setTempUser] = useState(null);
  
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userData = await signIn(email.toLowerCase(), password);
      
      if (userData.mustChangePassword) {
        setTempUser(userData);
        setRequirePasswordChange(true);
        toast({ title: "Action Required", description: "You must change your default password to continue." });
        return;
      }

      toast({ title: "Welcome back!" });
      const dashboardPath = userData.role === "admin" ? "/admin" : userData.role === "doctor" ? "/doctor" : "/patient";
      navigate(dashboardPath);
    } catch (err) {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    } finally {
      if (!requirePasswordChange) setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await api.put('/auth/change-password', { newPassword });
      toast({ title: "Password Updated" });
      const dashboardPath = tempUser.role === "admin" ? "/admin" : tempUser.role === "doctor" ? "/doctor" : "/patient";
      navigate(dashboardPath);
    } catch (err) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4 py-8 relative overflow-hidden">
      {/* Subtle Background Effect */}
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
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Healthcare management at your fingertips</p>
        </div>

        <div className="bg-card p-6 md:p-8 rounded-[2rem] shadow-2xl border border-border">
          <h2 className="text-xl font-bold text-foreground mb-4 text-center">Login</h2>
          
          {!requirePasswordChange ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  placeholder="example@gmail.com"
                  className="rounded-xl h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    placeholder="********"
                    className="rounded-xl h-12 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="flex justify-end pt-1">
                  <Link 
                    to="/forgot-password" 
                    className="text-xs font-semibold text-primary hover:underline transition-all"
                  >
                    Forgot Password?
                  </Link>
                </div>
              </div>

              <Button type="submit" className="w-full h-12 rounded-xl font-bold bg-primary mt-2" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>

              <div className="text-center pt-3 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Link to="/register" className="text-primary font-bold hover:underline">Signup now</Link>
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
               <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-200 dark:border-amber-800 flex gap-3 mb-2">
                <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Please set a new secure password to activate your account.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input 
                  id="newPassword" 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required 
                  placeholder="Min. 6 characters"
                  className="rounded-xl h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm Password</Label>
                <Input 
                  id="confirm" 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                  placeholder="Repeat new password"
                  className="rounded-xl h-12"
                />
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white mt-2" disabled={loading}>
                {loading ? "Saving..." : "Update & Continue"}
              </Button>
            </form>
          )}
        </div>
        
        <div className="mt-6 text-center px-4">
             <Link to="/" className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">Back to homepage</Link>
        </div>
      </motion.div>
    </div>
  );
}

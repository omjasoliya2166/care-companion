import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  Plus, FileText, Calendar, Trash2, Pill, Info, 
  MapPin, Clock, AlertCircle
} from "lucide-react";
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogTrigger, DialogFooter, DialogDescription 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function DoctorPrescriptions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [medicines, setMedicines] = useState([{ 
    name: "", 
    dosage: { morning: false, noon: false, evening: false }, 
    mealTiming: "After Meal", 
    description: "" 
  }]);
  const [generalNotes, setGeneralNotes] = useState("");

  const { data: doctor } = useQuery({
    queryKey: ["doctor-self-presc", user?._id],
    queryFn: async () => {
      const response = await api.get("/appointments/doctor/me");
      return response.data;
    },
    enabled: !!user,
  });

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["doctor-appointed-patients", doctor?._id],
    queryFn: async () => {
      const response = await api.get("/appointments/appointments");
      // Displaying all, but button control is handled in UI
      return response.data || [];
    },
    enabled: !!doctor,
  });

  const prescribeMutation = useMutation({
    mutationFn: async () => {
      await api.post("/prescriptions", {
        appointmentId: selectedAppt._id,
        medicines,
        generalNotes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-appointed-patients"] });
      toast({ title: "Prescription Recorded", description: "The patient has been notified." });
      setSelectedAppt(null);
      resetForm();
    },
    onError: (err) => {
      toast({ title: "Prescription Failed", description: err.message, variant: "destructive" });
    }
  });

  const resetForm = () => {
    setMedicines([{ 
      name: "", 
      dosage: { morning: false, noon: false, evening: false }, 
      mealTiming: "After Meal", 
      description: "" 
    }]);
    setGeneralNotes("");
  };

  const addMedicine = () => setMedicines([...medicines, { 
    name: "", 
    dosage: { morning: false, noon: false, evening: false }, 
    mealTiming: "After Meal", 
    description: "" 
  }]);
  
  const removeMedicine = (index) => setMedicines(medicines.filter((_, i) => i !== index));
  
  const updateMedicine = (index, field, value) => {
    const updated = [...medicines];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      updated[index][parent][child] = value;
    } else {
      updated[index][field] = value;
    }
    setMedicines(updated);
  };

  return (
    <DashboardLayout role="doctor">
      <div className="space-y-10">
        <header>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-black text-slate-900 tracking-tight"
          >
            Medical <span className="text-primary italic">Prescriptions</span> 💊
          </motion.h1>
          <p className="text-slate-500 font-medium mt-2">Issue structured pharmaceutical records for completed consultations.</p>
        </header>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                <th className="p-8">Patient Identity</th>
                <th className="p-8">Interaction Date</th>
                <th className="p-8">Status</th>
                <th className="p-8 text-right">Clinical Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {appointments?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-20 text-center">
                    <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <p className="font-bold text-slate-400">No active appointments found.</p>
                  </td>
                </tr>
              ) : (
                appointments?.map((appt, i) => {
                  const isCompleted = appt.status === 'completed';
                  return (
                    <motion.tr 
                      key={appt._id} 
                      className="group hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-8">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-center text-primary font-black text-lg">
                            {appt.patientId?.fullName?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-slate-900">{appt.patientId?.fullName}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{appt.patientId?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-8 font-bold text-slate-700">
                        {new Date(appt.date).toLocaleDateString()}
                      </td>
                      <td className="p-8">
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest ${
                          appt.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 
                          appt.status === 'approved' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'
                        }`}>
                          {appt.status}
                        </span>
                      </td>
                      <td className="p-8 text-right">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Dialog open={selectedAppt?._id === appt._id} onOpenChange={(open) => !open && setSelectedAppt(null)}>
                                  <DialogTrigger asChild>
                                    <Button 
                                      disabled={!isCompleted}
                                      onClick={() => setSelectedAppt(appt)}
                                      className="rounded-2xl h-12 px-6 bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-200 font-black uppercase text-[10px] tracking-widest gap-2 disabled:opacity-30"
                                    >
                                      <Plus className="w-4 h-4" /> Prescribe
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-4xl rounded-[3rem] border-none p-10 overflow-y-auto max-h-[90vh]">
                                    <DialogHeader className="mb-8">
                                      <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                                          <Pill className="w-8 h-8 text-primary" />
                                        </div>
                                        <div>
                                            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Standardized Prescription</DialogTitle>
                                            <DialogDescription className="text-slate-500 font-medium text-sm">
                                              Case Ref: {appt._id.slice(-8).toUpperCase()} • Patient: {appt.patientId?.fullName}
                                            </DialogDescription>
                                        </div>
                                      </div>
                                    </DialogHeader>

                                    <div className="space-y-8">
                                      <div className="space-y-6">
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                          <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Medication Schedule</Label>
                                          <Button onClick={addMedicine} variant="outline" className="rounded-xl h-10 px-4 text-primary font-black uppercase text-[10px] tracking-widest gap-2 bg-primary/5 border-primary/10 hover:bg-primary/10">
                                            <Plus className="w-4 h-4" /> Add Next Medicine
                                          </Button>
                                        </div>

                                        <div className="space-y-6">
                                          {medicines.map((med, idx) => (
                                            <CardMedicine 
                                              key={idx} 
                                              idx={idx} 
                                              med={med} 
                                              updateMedicine={updateMedicine} 
                                              removeMedicine={removeMedicine} 
                                              canRemove={medicines.length > 1}
                                            />
                                          ))}
                                        </div>
                                      </div>

                                      <div className="space-y-3">
                                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Clinical Summary / Advice</Label>
                                        <Textarea 
                                          placeholder="Enter dietary restrictions, resting period, or specific follow-up instructions..." 
                                          value={generalNotes}
                                          onChange={(e) => setGeneralNotes(e.target.value)}
                                          className="rounded-3xl border-slate-100 bg-slate-50 min-h-[100px] p-6 font-medium text-slate-700 focus:bg-white transition-all shadow-inner"
                                        />
                                      </div>
                                    </div>

                                    <DialogFooter className="mt-10">
                                      <Button 
                                        onClick={() => prescribeMutation.mutate()}
                                        disabled={prescribeMutation.isPending || medicines.some(m => !m.name)}
                                        className="w-full h-16 rounded-2xl bg-primary text-white hover:bg-primary/90 transition-all font-black text-base shadow-2xl shadow-primary/20"
                                      >
                                        {prescribeMutation.isPending ? "Validating & Transmitting..." : "Generate Prescription & Commit Records"}
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </span>
                            </TooltipTrigger>
                            {!isCompleted && (
                              <TooltipContent className="bg-slate-900 text-white border-none rounded-xl px-4 py-2 text-xs font-bold">
                                Prescription can only be added after appointment is completed
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      </td>
                    </motion.tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

function CardMedicine({ idx, med, updateMedicine, removeMedicine, canRemove }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 space-y-8 relative group"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Substance Name</Label>
          <Input 
            placeholder="e.g. Paracetamol 500mg" 
            value={med.name} 
            onChange={(e) => updateMedicine(idx, 'name', e.target.value)}
            className="h-14 rounded-2xl bg-white border-slate-100 font-bold focus:ring-primary/20 shadow-sm"
          />
        </div>
        
        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Dosage Frequency</Label>
          <div className="flex items-center gap-6 h-14 bg-white/50 px-4 rounded-2xl border border-slate-100">
            {['morning', 'noon', 'evening'].map(time => (
              <div key={time} className="flex items-center gap-2">
                <Checkbox 
                  id={`med-${idx}-${time}`}
                  checked={med.dosage[time]}
                  onCheckedChange={(val) => updateMedicine(idx, `dosage.${time}`, val)}
                  className="rounded-md border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <Label htmlFor={`med-${idx}-${time}`} className="text-xs font-bold text-slate-600 capitalize">{time}</Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Consumption Timing</Label>
          <RadioGroup 
            value={med.mealTiming} 
            onValueChange={(val) => updateMedicine(idx, 'mealTiming', val)}
            className="flex items-center gap-8 h-14 bg-white/50 px-6 rounded-2xl border border-slate-100"
          >
            {['Before Meal', 'After Meal'].map(val => (
              <div key={val} className="flex items-center gap-2">
                <RadioGroupItem value={val} id={`meal-${idx}-${val}`} className="text-primary border-slate-300" />
                <Label htmlFor={`meal-${idx}-${val}`} className="text-xs font-bold text-slate-600">{val}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Additional Guidance (Optional)</Label>
          <Input 
            placeholder="e.g. Swallow with warm water" 
            value={med.description} 
            onChange={(e) => updateMedicine(idx, 'description', e.target.value)}
            className="h-14 rounded-2xl bg-white border-slate-100 font-bold focus:ring-primary/20 shadow-sm"
          />
        </div>
      </div>

      {canRemove && (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => removeMedicine(idx)} 
          className="absolute -top-3 -right-3 h-10 w-10 rounded-full bg-white text-slate-300 hover:text-red-500 shadow-lg border border-slate-100 opacity-0 group-hover:opacity-100 transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </motion.div>
  );
}

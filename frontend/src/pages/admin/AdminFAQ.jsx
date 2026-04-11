import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, Search, HelpCircle, Edit2, 
  Trash2, Save, X, Loader2, ChevronDown 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

export default function AdminFAQ() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ question: "", answer: "" });

  const { data: faqs, isLoading } = useQuery({
    queryKey: ["admin-faqs"],
    queryFn: async () => {
      const res = await api.get("/admin/faqs");
      return res.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data) => api.post("/admin/faqs", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-faqs"]);
      setIsAdding(false);
      setFormData({ question: "", answer: "" });
      toast.success("FAQ created successfully");
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => api.put(`/admin/faqs/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-faqs"]);
      setEditingId(null);
      toast.success("FAQ updated successfully");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/admin/faqs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-faqs"]);
      toast.success("FAQ deleted successfully");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredFaqs = faqs?.filter(f => 
    f.question.toLowerCase().includes(search.toLowerCase()) || 
    f.answer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout role="admin">
      <div className="max-w-5xl mx-auto space-y-10">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tighter">Knowledge <span className="text-primary italic">Base</span> 🧠</h1>
            <p className="text-muted-foreground font-medium mt-2">Manage public FAQs and patient guidance resources.</p>
          </div>
          <Button 
            onClick={() => { setIsAdding(true); setEditingId(null); setFormData({ question: "", answer: "" }); }}
            className="rounded-2xl h-14 px-8 bg-primary text-white shadow-xl shadow-primary/20 font-bold gap-3"
          >
            <Plus className="w-5 h-5" /> Add New FAQ
          </Button>
        </header>

        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Search knowledge base..." 
            className="h-16 pl-14 pr-6 rounded-3xl bg-card border-border/50 text-lg font-medium shadow-sm focus:ring-primary/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grid gap-6">
          <AnimatePresence mode="popLayout">
            {isAdding && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-primary/5 border-2 border-dashed border-primary/20 rounded-[2.5rem] p-8"
              >
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <Input 
                      placeholder="Frequently Asked Question" 
                      className="h-14 rounded-2xl bg-white focus:ring-primary/20 font-bold"
                      value={formData.question}
                      onChange={(e) => setFormData({...formData, question: e.target.value})}
                      required
                    />
                    <Textarea 
                      placeholder="Comprehensive Answer" 
                      className="min-h-[150px] rounded-2xl bg-white focus:ring-primary/20 font-medium leading-relaxed"
                      value={formData.answer}
                      onChange={(e) => setFormData({...formData, answer: e.target.value})}
                      required
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <Button type="submit" className="h-12 px-8 rounded-xl font-bold gap-2" disabled={createMutation.isPending}>
                      {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Publish Entry
                    </Button>
                    <Button type="button" variant="ghost" className="h-12 px-8 rounded-xl font-bold" onClick={() => setIsAdding(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}

            {filteredFaqs?.map((faq) => (
              <Card key={faq._id} className="p-8 border-none shadow-xl shadow-slate-100/50 rounded-[2.5rem] bg-card hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500 group">
                {editingId === faq._id ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Input 
                      value={formData.question}
                      onChange={(e) => setFormData({...formData, question: e.target.value})}
                      className="h-12 rounded-xl font-bold"
                      required
                    />
                    <Textarea 
                      value={formData.answer}
                      onChange={(e) => setFormData({...formData, answer: e.target.value})}
                      className="min-h-[100px] rounded-xl font-medium"
                      required
                    />
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" className="rounded-lg gap-2" disabled={updateMutation.isPending}>
                        <Save className="w-4 h-4" /> Save
                      </Button>
                      <Button type="button" variant="ghost" size="sm" className="rounded-lg" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex gap-6">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                        <HelpCircle className="w-6 h-6 text-primary" />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-xl font-black text-foreground leading-tight">{faq.question}</h3>
                        <p className="text-muted-foreground font-medium leading-relaxed">{faq.answer}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                        onClick={() => { setEditingId(faq._id); setFormData({ question: faq.question, answer: faq.answer }); }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all"
                        onClick={() => deleteMutation.mutate(faq._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}

            {isLoading && (
              <div className="flex flex-col items-center justify-center py-20 grayscale opacity-20">
                <Loader2 className="w-12 h-12 animate-spin mb-4" />
                <p className="font-black uppercase tracking-widest text-xs">Syncing Knowledge Base...</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}

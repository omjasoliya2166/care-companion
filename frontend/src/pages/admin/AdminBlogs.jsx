import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, Search, FileText, Edit2, 
  Trash2, Save, X, Loader2, Image as ImageIcon,
  Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

export default function AdminBlogs() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: "", content: "", image: "", author: "Admin" });

  const { data: blogs, isLoading } = useQuery({
    queryKey: ["admin-blogs"],
    queryFn: async () => {
      const res = await api.get("/admin/blogs");
      return res.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data) => api.post("/admin/blogs", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-blogs"]);
      setIsAdding(false);
      setFormData({ title: "", content: "", image: "", author: "Admin" });
      toast.success("Blog published successfully");
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => api.put(`/admin/blogs/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-blogs"]);
      setEditingId(null);
      toast.success("Blog updated successfully");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/admin/blogs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-blogs"]);
      toast.success("Blog removed successfully");
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

  const filteredBlogs = blogs?.filter(b => 
    b.title.toLowerCase().includes(search.toLowerCase()) || 
    b.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout role="admin">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase">Editorial <span className="text-secondary italic">Control</span> 📰</h1>
            <p className="text-muted-foreground font-medium mt-2">Publish medical insights and hospital announcements.</p>
          </div>
          <Button 
            onClick={() => { setIsAdding(true); setEditingId(null); setFormData({ title: "", content: "", image: "", author: "Admin" }); }}
            className="rounded-2xl h-14 px-8 bg-secondary text-white shadow-xl shadow-secondary/20 font-bold gap-3"
          >
            <Plus className="w-5 h-5" /> New Publication
          </Button>
        </header>

        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Search publications..." 
            className="h-16 pl-14 pr-6 rounded-3xl bg-card border-border/50 text-lg font-medium shadow-sm focus:ring-secondary/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {isAdding && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="col-span-full bg-secondary/5 border-2 border-dashed border-secondary/20 rounded-[3rem] p-10"
              >
                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-xs font-black uppercase tracking-widest text-secondary ml-1">Title</label>
                       <Input 
                        placeholder="Article Title" 
                        className="h-14 rounded-2xl bg-white font-bold"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-black uppercase tracking-widest text-secondary ml-1">Author</label>
                       <Input 
                        placeholder="Author Name" 
                        className="h-12 rounded-xl bg-white font-medium"
                        value={formData.author}
                        onChange={(e) => setFormData({...formData, author: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-black uppercase tracking-widest text-secondary ml-1">Image URL</label>
                       <div className="relative">
                          <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            placeholder="https://images.unsplash.com/..." 
                            className="h-12 pl-12 rounded-xl bg-white"
                            value={formData.image}
                            onChange={(e) => setFormData({...formData, image: e.target.value})}
                          />
                       </div>
                    </div>
                  </div>
                  <div className="space-y-6 flex flex-col">
                    <div className="space-y-2 flex-1">
                       <label className="text-xs font-black uppercase tracking-widest text-secondary ml-1">Content</label>
                       <Textarea 
                        placeholder="Article content (Markdown supported)..." 
                        className="h-full min-h-[200px] rounded-2xl bg-white font-medium"
                        value={formData.content}
                        onChange={(e) => setFormData({...formData, content: e.target.value})}
                        required
                      />
                    </div>
                    <div className="flex items-center gap-4 pt-4">
                      <Button type="submit" className="h-14 px-10 rounded-2xl bg-secondary hover:bg-secondary/90 font-bold gap-3" disabled={createMutation.isPending}>
                        {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Transmit Publication
                      </Button>
                      <Button type="button" variant="ghost" className="h-14 px-8 rounded-2xl font-bold" onClick={() => setIsAdding(false)}>
                        Discard
                      </Button>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}

            {filteredBlogs?.map((blog) => (
              <Card key={blog._id} className="flex flex-col h-full border-none shadow-xl shadow-slate-100/50 rounded-[2.5rem] bg-card overflow-hidden group hover:shadow-2xl transition-all duration-500">
                <div className="h-48 overflow-hidden relative">
                  <img 
                    src={blog.image || "https://images.unsplash.com/photo-1576091160550-217359f42f8c?w=800"} 
                    alt={blog.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute top-4 right-4 flex gap-2">
                     <Button 
                       size="icon" 
                       className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-secondary"
                       onClick={() => { setEditingId(blog._id); setFormData({ title: blog.title, content: blog.content, image: blog.image, author: blog.author }); setIsAdding(true); }}
                     >
                       <Edit2 className="w-4 h-4" />
                     </Button>
                     <Button 
                       size="icon" 
                       className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-destructive"
                       onClick={() => deleteMutation.mutate(blog._id)}
                     >
                       <Trash2 className="w-4 h-4" />
                     </Button>
                  </div>
                </div>
                <div className="p-8 flex flex-col flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-secondary bg-secondary/5 px-3 py-1 rounded-full">
                       {blog.author}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                       <Calendar className="w-3 h-3" /> {new Date(blog.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-foreground mb-4 leading-tight">{blog.title}</h3>
                  <p className="text-muted-foreground text-sm font-medium line-clamp-3 leading-relaxed">
                    {blog.content}
                  </p>
                </div>
              </Card>
            ))}
          </AnimatePresence>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-40 grayscale opacity-20">
            <Loader2 className="w-12 h-12 animate-spin mb-4" />
            <p className="font-black uppercase tracking-widest text-xs">Syncing Editorial Logs...</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

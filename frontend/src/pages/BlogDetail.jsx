import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/ui/BackButton";
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Share2, 
  Clock, 
  ChevronRight, 
  BookOpen,
  MessageCircle,
  TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import HeartbeatLoader from "@/components/ui/HeartbeatLoader";

const fallbackBlogs = [
  { id: "1", title: "10 Tips for a Healthy Heart", content: "Regular exercise, balanced diet, and stress management are key to maintaining heart health in your daily routine. Cardiovascular diseases remain one of the leading causes of health issues globally, but the good news is that many can be prevented with simple lifestyle changes.\n\nFirst, prioritize movement. At least 30 minutes of moderate activity like brisk walking five days a week can significantly strengthen your heart. Second, watch your plate. Incorporate heart-healthy fats found in avocados and nuts while reducing sodium and trans fats found in processed foods.\n\nThird, manage stress. Chronic stress can lead to inflammation and high blood pressure, both of which are enemies of heart health. Try mindfulness, yoga, or simply spending time in nature.", image: "https://images.unsplash.com/photo-1505751172107-19598f4bc1e2?auto=format&fit=crop&q=80&w=1200", created_at: "2025-01-15", author: "Dr. Sarah Johnson" },
  { id: "2", title: "Understanding Diabetes", content: "Diabetes management requires consistent monitoring, lifestyle adjustments, and regular consults with specialists. Whether you're living with Type 1 or Type 2 diabetes, understanding how your body processes glucose is fundamental to maintaining a high quality of life.\n\nMonitoring blood sugar regularly helps you see the direct impact of different foods and activities. It's not just about avoiding sugar; it's about balanced carbohydrate intake and ensuring you're getting enough fiber to slow glucose absorption.\n\nExercise also plays a vital role. Muscle cells use more glucose when they work, so physical activity helps lower blood sugar and makes your body more sensitive to insulin over time.", image: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&q=80&w=1200", created_at: "2025-02-10", author: "Dr. Michael Chen" },
  { id: "3", title: "Mental Health Matters", content: "Taking care of your mental health is just as important as physical health. In our fast-paced modern world, the brain often bears the brunt of our hectic schedules and high expectations. Neglecting mental health can lead to burnout, anxiety, and physical ailments.\n\nOne of the most effective ways to preserve mental well-being is setting boundaries. Learning to say 'no' allows you to protect your energy for things that truly matter. Additionally, social connection is a biological necessity. Even small interactions can release oxytocin and reduce feelings of isolation.\n\nDon't be afraid to seek professional help. Talking to a therapist is a sign of strength and proactive self-care, not a sign of weakness. Your mind deserves the same care you give your body.", image: "https://images.unsplash.com/photo-1527137342181-19aab11a8ee1?auto=format&fit=crop&q=80&w=1200", created_at: "2025-03-05", author: "Dr. Emily Williams" },
];



export default function BlogDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { on, off, emit } = useSocket();

  const [newComment, setNewComment] = useState("");
  const [localComments, setLocalComments] = useState([]);

  // Fetch single blog with comments
  const { data: blog, isLoading: isBlogLoading, refetch } = useQuery({
    queryKey: ["blog", id],
    queryFn: async () => {
      const response = await api.get(`/content/blogs/${id}`);
      return response.data;
    },
  });

  // Fetch all blogs for sidebar (related posts)
  const { data: allBlogs } = useQuery({
    queryKey: ["blogs-public"],
    queryFn: async () => {
      try {
        const response = await api.get("/content/blogs");
        return response.data && response.data.length > 0 ? response.data : fallbackBlogs;
      } catch (e) {
        return fallbackBlogs;
      }
    },
  });

  useEffect(() => {
    if (blog?.comments) {
      setLocalComments(blog.comments);
    }
  }, [blog]);

  useEffect(() => {
    if (id) {
      emit('join_blog_room', id);

      const handleNewComment = (data) => {
        if (data.blogId === id) {
          setLocalComments(prev => [data.comment, ...prev]);
        }
      };

      on('blog_comment_added', handleNewComment);

      return () => {
        off('blog_comment_added', handleNewComment);
      };
    }
  }, [id, on, off, emit]);

  const isLoading = isBlogLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <HeartbeatLoader />
      </div>
    );
  }

  const relatedPosts = (allBlogs || fallbackBlogs).filter(b => (b.id !== id && b._id !== id)).slice(0, 3);

  if (!blog) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <h1 className="text-3xl font-bold text-foreground mb-4">Article Not Found</h1>
          <Button onClick={() => navigate("/")}>Go Back Home</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      await api.post(`/content/blogs/${id}/comments`, {
        name: user?.fullName || "Guest User",
        text: newComment,
        userId: user?._id
      });
      
      setNewComment("");
      
      import("sonner").then(({ toast }) => {
        toast.success("Comment posted successfully!");
      });
    } catch (error) {
      import("sonner").then(({ toast }) => {
        toast.error("Failed to post comment");
      });
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: blog?.title || "Health Article",
      text: `Check out this health article: ${blog?.title}`,
      url: url
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return;
      }
    } catch (err) {
      console.log("Web Share failed, falling back to clipboard", err);
    }

    // Fallback: Clipboard API
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        import("sonner").then(({ toast }) => {
          toast.success("Link copied to clipboard!");
        });
        return;
      }
    } catch (err) {
      console.log("Clipboard API failed", err);
    }

    // Final Fallback: Legacy Textarea
    try {
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        import("sonner").then(({ toast }) => {
          toast.success("Link copied to clipboard!");
        });
      } else {
        throw new Error("Copy command failed");
      }
    } catch (err) {
      import("sonner").then(({ toast }) => {
        toast.error("Failed to copy link");
      });
    }
  };

  const handleComments = () => {
    document.getElementById("comments-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Article Hero */}
      <div className="relative h-[400px] md:h-[500px] w-full overflow-hidden">
        <img 
          src={blog.image || "https://images.unsplash.com/photo-1505751172107-19598f4bc1e2?auto=format&fit=crop&q=80&w=1200"} 
          alt={blog.title} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

        {/* Back button overlaid top-left on hero image */}
        <div className="absolute top-4 left-4 md:top-6 md:left-8 z-10">
          <BackButton label="Back to Articles" variant="light" />
        </div>
        
        <div className="absolute bottom-0 left-0 w-full p-4 md:p-8">
          <div className="container mx-auto max-w-4xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-bold uppercase tracking-wider mb-4 inline-block">
                Health & Wellness
              </span>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-6 leading-tight">
                {blog.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-6 text-sm text-foreground/80">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-semibold">{blog.author || "Medical Staff"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>{new Date(blog.createdAt || blog.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>6 min read</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 max-w-4xl py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Left Side: Article Content */}
          <article className="flex-1">
            <div className="prose prose-slate lg:prose-xl dark:prose-invert max-w-none">
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8 font-medium italic border-l-4 border-primary pl-6">
                LIOHNS Care brings you the latest medical insights to help you lead a healthier, more vibrant life. 
                Our team of specialists curates this content to ensure you have access to reliable health education.
              </p>
              
              {blog.content.split('\n').map((paragraph, idx) => (
                <p key={idx} className="mb-6 text-foreground/90 leading-relaxed text-lg whitespace-pre-line">
                  {paragraph}
                </p>
              ))}
              
              <div className="mt-12 p-8 rounded-3xl bg-primary/5 border border-primary/10">
                <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" /> Quick Summary
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>Understanding the core principles of {blog.title.toLowerCase()} is essential for long-term health.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>Small, consistent changes in daily habits yield the most significant medical results.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>Always consult with a LIOHNS specialist for personalized medical advice.</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-border flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <Button variant="ghost" className="rounded-full gap-2" onClick={handleComments}>
                  <MessageCircle className="h-4 w-4" /> {localComments.length} Comments
                </Button>
                <Button variant="ghost" className="rounded-full gap-2" onClick={handleShare}>
                  <Share2 className="h-4 w-4" /> Share Article
                </Button>
              </div>
            </div>

            {/* Comments Section */}
            <div id="comments-section" className="mt-12 pt-12 border-t border-border">
              <h3 className="text-xl font-display font-bold mb-6 flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-primary" />
                Article Discussions ({localComments.length})
              </h3>
              
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-4 md:p-6 mb-10 shadow-sm focus-within:shadow-md focus-within:shadow-primary/5 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-lg shadow-primary/20">
                    {user?.fullName?.[0] || "G"}
                  </div>
                  <div className="flex-1">
                    <textarea 
                      placeholder="Add a comment or ask a health question..." 
                      className="w-full bg-transparent border-none focus:ring-0 text-sm resize-none mb-2 p-0 placeholder:text-muted-foreground/50 outline-none caret-primary"
                      rows={2}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <div className="flex justify-end pt-3 border-t border-border/50">
                      <Button 
                        size="sm" 
                        className="rounded-lg px-5 font-bold shadow-md shadow-primary/10 hover:shadow-primary/20 transition-all h-9" 
                        onClick={handlePostComment}
                        disabled={!newComment.trim()}
                      >
                        Post Comment
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>

              <div className="space-y-6">
                <AnimatePresence initial={false}>
                  {localComments.map((c, i) => (
                    <motion.div 
                      key={c._id || i} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="flex gap-4 group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/10 flex items-center justify-center font-bold text-primary flex-shrink-0 shadow-sm group-hover:shadow-md transition-all duration-300">
                        {c.name[0]}
                      </div>
                      <div className="flex-1 pt-0.5">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{c.name}</span>
                          <span className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-tight">
                            {new Date(c.createdAt || c.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <div className="bg-muted/20 group-hover:bg-muted/40 transition-colors p-3.5 md:p-4 rounded-xl rounded-tl-none border border-border/30">
                          <p className="text-sm text-foreground/80 leading-relaxed">{c.text}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </article>

          {/* Right Side: Sidebar */}
          <aside className="lg:w-80 shrink-0">
            <div className="sticky top-24 space-y-12">
              {/* Promotion */}
              <div className="bg-primary p-8 rounded-3xl text-primary-foreground text-center relative overflow-hidden group">
                <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                <h3 className="text-xl font-bold mb-3">Expert Care Awaits</h3>
                <p className="text-sm opacity-90 mb-6">Discuss your health concerns with our world-class specialists.</p>
                {(role !== 'admin' && role !== 'doctor') && (
                  <Button 
                    className="w-full bg-white text-primary hover:bg-white/90 font-bold rounded-xl h-12"
                    onClick={() => navigate("/patient/book")}
                  >
                    Book Appointment
                  </Button>
                )}
              </div>

              {/* Related Posts */}
              <div>
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" /> More Articles
                </h3>
                <div className="space-y-6">
                  {relatedPosts.map((post) => (
                    <Link 
                      key={post.id || post._id} 
                      to={`/blog/${post.id || post._id}`}
                      className="group flex gap-4 items-center"
                    >
                      <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-border">
                        <img 
                          src={post.image || "https://images.unsplash.com/photo-1505751172107-19598f4bc1e2"} 
                          alt="" 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="text-sm font-bold line-clamp-2 group-hover:text-primary transition-colors mb-1">
                          {post.title}
                        </h4>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                          {new Date(post.createdAt || post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}

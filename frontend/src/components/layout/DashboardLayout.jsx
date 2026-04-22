import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Calendar, Users, Stethoscope, FileText,
  MessageSquare, Heart, Bot, Settings,
  BarChart3, Pill, LogOut, User, HelpCircle, Clock,
  Bell, Menu, X, CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";
import ThemeToggle from "./ThemeToggle";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useCallback } from "react";
import GlobalCallOverlay from "../chat/GlobalCallOverlay";
import logo from "@/assets/logo.png";
import api from "@/services/api";

const patientNav = [
  { label: "Dashboard", path: "/patient", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Book Appointment", path: "/patient/book", icon: <Calendar className="h-4 w-4" /> },
  { label: "My Appointments", path: "/patient/appointments", icon: <Calendar className="h-4 w-4" /> },
  { label: "Prescriptions", path: "/patient/prescriptions", icon: <Pill className="h-4 w-4" /> },
  { label: "Billing", path: "/patient/billing", icon: <CreditCard className="h-4 w-4" /> },
  { label: "Messages", path: "/chats", icon: <MessageSquare className="h-4 w-4" />, chatNotify: true },
  { label: "Notifications", path: "/patient/notifications", icon: <Bell className="h-4 w-4" />, notify: true },
  { label: "Smart Help", path: "/patient/chat", icon: <Bot className="h-4 w-4" /> },
  { label: "Profile", path: "/patient/profile", icon: <User className="h-4 w-4" /> },
];

const doctorNav = [
  { label: "Dashboard", path: "/doctor", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Appointments", path: "/doctor/appointments", icon: <Calendar className="h-4 w-4" /> },
  { label: "Prescriptions", path: "/doctor/prescriptions", icon: <Pill className="h-4 w-4" /> },
  { label: "Billing", path: "/doctor/billing", icon: <CreditCard className="h-4 w-4" /> },
  { label: "Unavailable", path: "/doctor/unavailability", icon: <Clock className="h-4 w-4" /> },
  { label: "Messages", path: "/chats", icon: <MessageSquare className="h-4 w-4" />, chatNotify: true },
  { label: "Notifications", path: "/doctor/notifications", icon: <Bell className="h-4 w-4" />, notify: true },
  { label: "Patient History", path: "/doctor/history", icon: <FileText className="h-4 w-4" /> },
  { label: "Profile", path: "/doctor/profile", icon: <User className="h-4 w-4" /> },
];

const adminNav = [
  { label: "Dashboard", path: "/admin", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Analytics", path: "/admin/analytics", icon: <BarChart3 className="h-4 w-4" /> },
  { label: "Revenue", path: "/admin/billing", icon: <CreditCard className="h-4 w-4" /> },
  { label: "Doctors", path: "/admin/doctors", icon: <Stethoscope className="h-4 w-4" /> },
  { label: "Appointments", path: "/admin/appointments", icon: <Calendar className="h-4 w-4" /> },
  { label: "Patients", path: "/admin/patients", icon: <Users className="h-4 w-4" /> },
  { label: "Services", path: "/admin/services", icon: <Settings className="h-4 w-4" /> },
  { label: "Chats", path: "/admin/chats", icon: <MessageSquare className="h-4 w-4" />, chatNotify: true },
  { label: "Blogs", path: "/admin/blogs", icon: <FileText className="h-4 w-4" /> },
  { label: "FAQ", path: "/admin/faq", icon: <HelpCircle className="h-4 w-4" /> },
];

function SidebarContent({ navItems, user, role, unreadCount, unreadChatCount, onClose, collapsed }) {
  const location = useLocation();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const navRef = useRef(null);

  // Restore sidebar scroll position on mount
  useEffect(() => {
    const saved = sessionStorage.getItem('sidebar-scroll');
    if (saved && navRef.current) {
      navRef.current.scrollTop = parseInt(saved, 10);
    }
  }, []);

  // Save scroll position on scroll
  const handleNavScroll = useCallback(() => {
    if (navRef.current) {
      sessionStorage.setItem('sidebar-scroll', String(navRef.current.scrollTop));
    }
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo */}
      <div className={cn(
        "p-6 border-b border-border flex items-center justify-between transition-all duration-300",
        collapsed && "px-4 justify-center"
      )}>
        <Link to="/" className="flex items-center gap-3 group" onClick={onClose}>
          <motion.img
            whileHover={{ scale: 1.1 }}
            src={logo}
            alt="LIOHN Logo"
            className={cn("h-10 w-auto object-contain transition-transform duration-300", collapsed && "h-8")}
          />
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col mt-1"
            >
              <span className="font-extrabold text-xl tracking-tighter text-foreground uppercase">LIOHN</span>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none">{role} Portal</p>
            </motion.div>
          )}
        </Link>
        {!collapsed && onClose && (
          <button onClick={onClose} className="lg:hidden p-1 rounded-lg text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav ref={navRef} onScroll={handleNavScroll} className="flex-1 p-4 space-y-1.5 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const showNotify = (item.notify && unreadCount > 0) || (item.chatNotify && unreadChatCount > 0);
          const count = item.notify ? unreadCount : (item.chatNotify ? unreadChatCount : 0);

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              title={collapsed ? item.label : ""}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 relative group",
                isActive
                  ? "bg-primary text-white shadow-lg shadow-primary/20 translate-x-1"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                collapsed && "px-0 justify-center"
              )}
            >
              <div className={cn("p-2 rounded-lg transition-colors", isActive ? "bg-white/20" : "bg-transparent")}>
                {item.icon}
              </div>

              {showNotify && (
                <span className={cn(
                  "bg-red-500 text-white text-[10px] font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 transition-all",
                  collapsed ? "absolute top-1 right-1" : ""
                )}>
                  {count > 99 ? "99+" : count}
                </span>
              )}

              {!collapsed && <span className="flex-1">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={cn("p-4 border-t border-border mt-auto space-y-3", collapsed && "px-2")}>
        <div className={cn(
          "flex items-center justify-between p-3 rounded-2xl bg-muted/80 dark:bg-muted border border-border transition-all",
          collapsed && "p-2 justify-center"
        )}>
          <div className="flex items-center gap-3 min-w-0">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.fullName} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                {user?.fullName?.charAt(0)}
              </div>
            )}
            {!collapsed && (
              <span className="text-xs font-bold text-foreground truncate max-w-[100px]">
                {user?.fullName}
              </span>
            )}
          </div>
          {!collapsed && <ThemeToggle />}
        </div>

        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-4 px-4 h-12 rounded-2xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all font-bold",
            collapsed && "px-0 justify-center"
          )}
          onClick={() => { signOut(); navigate("/"); }}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </div>
    </div>
  );
}



export default function DashboardLayout({ children, role }) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try { return localStorage.getItem('sidebar-collapsed') === 'true'; } catch { return false; }
  });
  const toggleCollapsed = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('sidebar-collapsed', String(next)); } catch {}
      return next;
    });
  };
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const location = useLocation();
  const mainRef = useRef(null);

  // Scroll to top on navigation
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.pathname]);

  // Fetch unread chats count (unique senders)
  useEffect(() => {
    const fetchUnreadChats = async () => {
      if (!user) return;
      try {
        const response = await api.get("/chat/my-chats");
        const chats = response.data || [];
        const count = chats.filter(c => c.unreadCount > 0).length;
        setUnreadChatCount(count);
      } catch (err) {
        console.error("Failed to fetch unread chats", err);
      }
    };

    fetchUnreadChats();
    const interval = setInterval(fetchUnreadChats, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [user]);

  // Try to use notifications context safely
  let unreadCount = 0;
  try {
    const notifCtx = useNotifications();
    unreadCount = notifCtx.unreadCount;
  } catch (e) {
    // Not wrapped in NotificationProvider (admin role), ignore
  }

  const navItems = role === "admin" ? adminNav : role === "doctor" ? doctorNav : patientNav;

  return (
    <div className="flex h-screen bg-background text-foreground transition-colors duration-300 overflow-hidden font-medium">
      <GlobalCallOverlay />
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 bg-card border-r border-border flex flex-col transition-all duration-300 shadow-xl lg:shadow-none relative",
        isCollapsed ? "w-20" : "w-64",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Toggle Button for Desktop */}
        <button
          onClick={toggleCollapsed}
          className="hidden lg:flex absolute -right-4 top-10 w-8 h-8 rounded-full bg-card border border-border items-center justify-center shadow-lg hover:bg-primary hover:text-white transition-all z-50"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <SidebarContent
          navItems={navItems}
          user={user}
          role={role}
          unreadCount={unreadCount}
          unreadChatCount={unreadChatCount}
          onClose={() => setSidebarOpen(false)}
          collapsed={isCollapsed}
        />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Top Bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl bg-muted text-foreground hover:bg-primary hover:text-white transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <img src={logo} alt="LIOHN Logo" className="h-8 w-auto object-contain" />
            <span className="font-extrabold text-lg text-foreground uppercase">LIOHN</span>
          </div>
          <ThemeToggle />
        </div>

        {/* Scrollable Page Content */}
        <main ref={mainRef} className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 space-y-8 custom-scrollbar scroll-smooth">
          {children}
        </main>
      </div>
    </div>
  );
}

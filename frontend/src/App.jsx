import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";

const queryClient = new QueryClient();
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import Index from "./pages/Index";
import ServiceDetail from "./pages/ServiceDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import ChatPage from "./pages/ChatPage";
import PatientDashboard from "./pages/patient/PatientDashboard";
import BookAppointment from "./pages/patient/BookAppointment";
import PatientAppointments from "./pages/patient/PatientAppointments";
import PatientChat from "./pages/patient/PatientChat";
import PatientProfile from "./pages/patient/PatientProfile";
import PatientPrescriptions from "./pages/patient/PatientPrescriptions";
import PatientNotifications from "./pages/patient/PatientNotifications";
import PaymentSimulation from "./pages/patient/PaymentSimulation";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminDoctors from "./pages/admin/AdminDoctors";
import AdminAppointments from "./pages/admin/AdminAppointments";
import AdminPatients from "./pages/admin/AdminPatients";
import AdminServices from "./pages/admin/AdminServices";
import AdminBlogs from "./pages/admin/AdminBlogs";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminFAQ from "./pages/admin/AdminFAQ";
import AdminChats from "./pages/admin/AdminChats";
import ConsultationChats from "./pages/ConsultationChats";
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import DoctorAppointments from "./pages/doctor/DoctorAppointments";
import DoctorProfile from "./pages/doctor/DoctorProfile";
import DoctorPrescriptions from "./pages/doctor/DoctorPrescriptions";
import DoctorUnavailability from "./pages/doctor/DoctorUnavailability";
import PatientHistory from "./pages/doctor/PatientHistory";
import DoctorNotifications from "./pages/doctor/DoctorNotifications";
import PatientBilling from "./pages/patient/PatientBilling";
import DoctorBilling from "./pages/doctor/DoctorBilling";
import AdminBilling from "./pages/admin/AdminBilling";

function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && !allowedRoles.includes(role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/services/:id" element={<ServiceDetail />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/patient" element={<ProtectedRoute allowedRoles={["patient"]}><PatientDashboard /></ProtectedRoute>} />
      <Route path="/patient/prescriptions" element={<ProtectedRoute allowedRoles={["patient"]}><PatientPrescriptions /></ProtectedRoute>} />
      <Route path="/patient/book" element={<ProtectedRoute allowedRoles={["patient"]}><BookAppointment /></ProtectedRoute>} />
      <Route path="/patient/appointments" element={<ProtectedRoute allowedRoles={["patient"]}><PatientAppointments /></ProtectedRoute>} />
      <Route path="/patient/chat" element={<ProtectedRoute allowedRoles={["patient"]}><PatientChat /></ProtectedRoute>} />
      <Route path="/patient/profile" element={<ProtectedRoute allowedRoles={["patient"]}><PatientProfile /></ProtectedRoute>} />
      <Route path="/patient/notifications" element={<ProtectedRoute allowedRoles={["patient"]}><PatientNotifications /></ProtectedRoute>} />
      <Route path="/patient/payment/:appointmentId" element={<ProtectedRoute allowedRoles={["patient"]}><PaymentSimulation /></ProtectedRoute>} />
      <Route path="/patient/billing" element={<ProtectedRoute allowedRoles={["patient"]}><PatientBilling /></ProtectedRoute>} />

      <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/doctors" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDoctors /></ProtectedRoute>} />
      <Route path="/admin/appointments" element={<ProtectedRoute allowedRoles={["admin"]}><AdminAppointments /></ProtectedRoute>} />
      <Route path="/admin/patients" element={<ProtectedRoute allowedRoles={["admin"]}><AdminPatients /></ProtectedRoute>} />
      <Route path="/admin/services" element={<ProtectedRoute allowedRoles={["admin"]}><AdminServices /></ProtectedRoute>} />
      <Route path="/admin/blogs" element={<ProtectedRoute allowedRoles={["admin"]}><AdminBlogs /></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={["admin"]}><AdminAnalytics /></ProtectedRoute>} />
      <Route path="/admin/faq" element={<ProtectedRoute allowedRoles={["admin"]}><AdminFAQ /></ProtectedRoute>} />
      <Route path="/admin/chats" element={<ProtectedRoute allowedRoles={["admin"]}><AdminChats /></ProtectedRoute>} />
      <Route path="/admin/billing" element={<ProtectedRoute allowedRoles={["admin"]}><AdminBilling /></ProtectedRoute>} />
      <Route path="/chats" element={<ProtectedRoute allowedRoles={["patient", "doctor"]}><ConsultationChats /></ProtectedRoute>} />

      <Route path="/doctor" element={<ProtectedRoute allowedRoles={["doctor"]}><DoctorDashboard /></ProtectedRoute>} />
      <Route path="/doctor/appointments" element={<ProtectedRoute allowedRoles={["doctor"]}><DoctorAppointments /></ProtectedRoute>} />
      <Route path="/doctor/profile" element={<ProtectedRoute allowedRoles={["doctor"]}><DoctorProfile /></ProtectedRoute>} />
      <Route path="/doctor/prescriptions" element={<ProtectedRoute allowedRoles={["doctor"]}><DoctorPrescriptions /></ProtectedRoute>} />
      <Route path="/doctor/unavailability" element={<ProtectedRoute allowedRoles={["doctor"]}><DoctorUnavailability /></ProtectedRoute>} />
      <Route path="/doctor/history" element={<ProtectedRoute allowedRoles={["doctor"]}><PatientHistory /></ProtectedRoute>} />
      <Route path="/doctor/notifications" element={<ProtectedRoute allowedRoles={["doctor"]}><DoctorNotifications /></ProtectedRoute>} />
      <Route path="/doctor/billing" element={<ProtectedRoute allowedRoles={["doctor"]}><DoctorBilling /></ProtectedRoute>} />

      <Route path="/chat/:appointmentId" element={<ProtectedRoute allowedRoles={["patient", "doctor", "admin"]}><ChatPage /></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function AuthWrappedApp() {
  const { user } = useAuth();
  return user ? (
    <NotificationProvider>
      <AppRoutes />
    </NotificationProvider>
  ) : (
    <AppRoutes />
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ThemeProvider>
          <AuthProvider>
            <AuthWrappedApp />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

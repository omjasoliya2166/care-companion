import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Menu, X, Phone, Heart } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.png";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  const dashboardPath = role === "admin" ? "/admin" : role === "doctor" ? "/doctor" : "/patient";
  const { pathname } = useLocation();

  const handleNavClick = (e, targetId) => {
    e.preventDefault();
    setOpen(false);

    const scrollToSection = () => {
      if (targetId === "hero") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const element = document.getElementById(targetId);
        if (element) {
          const yOffset = -80; // Compensating for navbar height
          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: "smooth" });
        }
      }
    };

    if (pathname !== "/") {
      navigate("/");
      setTimeout(scrollToSection, 100);
    } else {
      scrollToSection();
    }
  };

  const navLinks = [
    { label: "Home", id: "hero", href: "/" },
    { label: "About", id: "about", href: "/#about" },
    { label: "Services", id: "services", href: "/#services" },
    { label: "Doctors", id: "doctors", href: "/#doctors" },
    { label: "Blog", id: "blog", href: "/#blog" },
  ];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 transition-all duration-300 bg-background/80 backdrop-blur-lg border-b border-border shadow-sm"
    >
      <div className="container mx-auto px-4 flex items-center justify-between h-20">
        <a href="/" onClick={(e) => handleNavClick(e, "hero")} title="Home" className="flex items-center gap-2 group cursor-pointer">
          <motion.img
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            src={logo}
            alt="LIOHNS Logo"
            className="h-20 w-auto object-contain"
          />
        </a>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link, i) => (
            <motion.a
              key={link.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.id)}
              className="text-sm font-semibold text-foreground/70 hover:text-primary transition-colors relative group cursor-pointer"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
            </motion.a>
          ))}
          {role !== "doctor" && (
            <motion.a
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              href="/#contact"
              onClick={(e) => handleNavClick(e, "contact")}
              className="text-sm font-semibold text-foreground/70 hover:text-primary transition-colors relative group cursor-pointer"
            >
              Contact
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
            </motion.a>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="hidden md:flex items-center gap-4"
        >
          <ThemeToggle />
          <div className="h-8 w-[1px] bg-border mx-2" />
          {user ? (
            <div className="flex items-center gap-2">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="sm" variant="outline" className="rounded-full border-primary/20 text-primary hover:bg-primary/5" onClick={() => navigate(dashboardPath)}>
                  Dashboard
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="sm" variant="ghost" className="rounded-full text-foreground/70 hover:text-foreground" onClick={signOut}>
                  Logout
                </Button>
              </motion.div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="sm" variant="ghost" className="rounded-full font-semibold text-foreground/70 hover:text-foreground" onClick={() => navigate("/login")}>
                  Login
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="sm" className="rounded-full px-6 font-semibold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all" onClick={() => navigate("/register")}>
                  Get Started
                </Button>
              </motion.div>
            </div>
          )}
        </motion.div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-lg bg-secondary text-foreground"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden bg-background border-b border-border shadow-xl overflow-hidden"
          >
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
              className="px-4 py-6 space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                {navLinks.map((link) => (
                  <motion.a
                    key={link.id}
                    variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.id)}
                    className="px-4 py-2 rounded-lg bg-muted border border-border text-sm font-medium text-foreground hover:bg-primary/10 transition-colors"
                  >
                    {link.label}
                  </motion.a>
                ))}
                {role !== "doctor" && (
                  <motion.a
                    variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                    href="/#contact"
                    onClick={(e) => handleNavClick(e, "contact")}
                    className="px-4 py-2 rounded-lg bg-muted border border-border text-sm font-medium text-foreground hover:bg-primary/10 transition-colors"
                  >
                    Contact
                  </motion.a>
                )}
              </div>
              <div className="pt-4 border-t border-border flex flex-col gap-3">
                {user ? (
                  <>
                    <Button className="w-full rounded-xl" onClick={() => { navigate(dashboardPath); setOpen(false); }}>Dashboard</Button>
                    <Button variant="outline" className="w-full rounded-xl" onClick={signOut}>Logout</Button>
                  </>
                ) : (
                  <>
                    <Button className="w-full rounded-xl" onClick={() => { navigate("/register"); setOpen(false); }}>Register</Button>
                    <Button variant="outline" className="w-full rounded-xl" onClick={() => { navigate("/login"); setOpen(false); }}>Login</Button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

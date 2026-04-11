import { createContext, useContext, useEffect, useState } from "react";
import api from "@/services/api";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState(localStorage.getItem('role'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const response = await api.get('/auth/me');
          if (response.data) {
            setUser(response.data);
            setRole(response.data.role);
          } else {
            signOut();
          }
        } catch (error) {
          console.error("Auth check failed:", error);
          signOut();
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const signUp = async (email, password, fullName) => {
    try {
      const response = await api.post('/auth/register', { email, password, fullName, role: 'patient' });
      const { token, ...userData } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('role', userData.role);

      setToken(token);
      setUser(userData);
      setRole(userData.role);
    } catch (error) {
      throw error.response?.data?.message || "Sign up failed";
    }
  };

  const signIn = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, ...userData } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('role', userData.role);

      setToken(token);
      setUser(userData);
      setRole(userData.role);
      return userData;
    } catch (error) {
      throw error.response?.data?.message || "Sign in failed";
    }
  };

  const signOut = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    setToken(null);
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, token, role, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

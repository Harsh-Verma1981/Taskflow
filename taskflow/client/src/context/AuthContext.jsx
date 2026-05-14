import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate user from token on app load
  useEffect(() => {
    const token = localStorage.getItem("tf_token");
    if (!token) { setLoading(false); return; }
    api.get("/auth/me")
      .then((r) => setUser(r.data))
      .catch(() => localStorage.removeItem("tf_token"))
      .finally(() => setLoading(false));
  }, []);

  const saveAuth = (token, userData) => {
    localStorage.setItem("tf_token", token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("tf_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, saveAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

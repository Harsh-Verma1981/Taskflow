import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import AuthPage    from "./pages/AuthPage";
import Dashboard   from "./pages/Dashboard";
import TasksPage   from "./pages/TasksPage";
import HistoryPage from "./pages/HistoryPage";
import RemindersPage from "./pages/RemindersPage";
import SettingsPage  from "./pages/SettingsPage";
import Layout      from "./components/Layout";

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", fontFamily:"var(--font-sans)", color:"var(--text-secondary)" }}>Loading…</div>;
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
};

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Toaster position="top-right" toastOptions={{ style: { fontFamily: "var(--font-sans)", fontSize: "13px" } }} />
          <Routes>
            <Route path="/login"  element={<PublicRoute><AuthPage /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><AuthPage defaultTab="signup" /></PublicRoute>} />
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard"  element={<Dashboard />} />
              <Route path="tasks"      element={<TasksPage />} />
              <Route path="history"    element={<HistoryPage />} />
              <Route path="reminders"  element={<RemindersPage />} />
              <Route path="settings"   element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

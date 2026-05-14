import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import s from "./AuthPage.module.css";

export default function AuthPage({ defaultTab = "login" }) {
  const [tab, setTab] = useState(defaultTab);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const { saveAuth } = useAuth();
  const navigate = useNavigate();

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = tab === "login" ? "/auth/login" : "/auth/signup";
      const payload  = tab === "login"
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password };
      const { data } = await api.post(endpoint, payload);
      saveAuth(data.token, data.user);
      toast.success(tab === "login" ? "Welcome back!" : "Account created!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Google One-Tap callback
  const handleGoogle = async (credential) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/google", { idToken: credential });
      saveAuth(data.token, data.user);
      toast.success("Signed in with Google!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  // Render Google button div
  const initGoogle = (el) => {
    if (!el || !window.google) return;
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: (res) => handleGoogle(res.credential),
    });
    window.google.accounts.id.renderButton(el, {
      theme: "outline", size: "large", width: 276, text: "continue_with",
    });
  };

  return (
    <div className={s.root}>
      {/* Left panel */}
      <div className={s.left}>
        <div className={s.logo}>
          <div className={s.logoMark}><span>T</span></div>
          <span className={s.logoText}>TaskFlow</span>
        </div>
        <div className={s.hero}>
          <h1 className={s.heroTitle}>Your tasks,<br />beautifully<br />organised.</h1>
          <p className={s.heroSub}>
            Type your event naturally — "Meeting with client at 7 pm today" — and TaskFlow
            handles the rest. Email reminders land in your inbox so you never miss a thing.
          </p>
          <div className={s.pills}>
            {["Natural language input","Email reminders","Recurring alerts","Full history","Google sign-in"].map((p) => (
              <span key={p} className={s.pill}>{p}</span>
            ))}
          </div>
        </div>
        <p className={s.leftFooter}>© 2025 TaskFlow · MERN stack</p>
      </div>

      {/* Right panel */}
      <div className={s.right}>
        <div className={s.tabs}>
          <button className={`${s.tab} ${tab === "login" ? s.tabActive : ""}`} onClick={() => setTab("login")}>Sign in</button>
          <button className={`${s.tab} ${tab === "signup" ? s.tabActive : ""}`} onClick={() => setTab("signup")}>Create account</button>
        </div>

        <form onSubmit={handleSubmit} className={s.form}>
          {tab === "signup" && (
            <div className={s.field}>
              <label className="field-label">Full name</label>
              <input className="field-input" type="text" placeholder="Arjun Singh" value={form.name} onChange={set("name")} required />
            </div>
          )}
          <div className={s.field}>
            <label className="field-label">Email</label>
            <input className="field-input" type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} required />
          </div>
          <div className={s.field}>
            <label className="field-label">Password</label>
            <input className="field-input" type="password" placeholder={tab === "signup" ? "Min 8 characters" : "••••••••"} value={form.password} onChange={set("password")} required minLength={8} />
          </div>

          <button type="submit" className={`btn-primary ${s.submitBtn}`} disabled={loading}>
            {loading ? <span className="spinner" /> : tab === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div className={s.divider}><span>or continue with</span></div>
        <div ref={initGoogle} className={s.googleBtn} />

        <p className={s.switchText}>
          {tab === "login" ? (
            <>Don't have an account? <button className={s.switchLink} onClick={() => setTab("signup")}>Sign up free</button></>
          ) : (
            <>Already have an account? <button className={s.switchLink} onClick={() => setTab("login")}>Sign in</button></>
          )}
        </p>
      </div>
    </div>
  );
}

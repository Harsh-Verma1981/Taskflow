import { useState } from "react";
import toast from "react-hot-toast";
import { User, Bell, Shield, Save, Sun, Moon } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import styles from "./SettingsPage.module.css";

const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Australia/Sydney",
  "Pacific/Auckland",
];

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [name,   setName]   = useState(user?.name  || "");
  const [tz,     setTz]     = useState(user?.timezone || "Asia/Kolkata");
  const [remindBefore, setRemindBefore] = useState(user?.defaultReminderMinutes || 30);
  const [emails, setEmails] = useState(user?.emailNotifications ?? true);
  const [saving, setSaving] = useState(false);

  const initials = name
    ? name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.patch("/auth/me", {
        name,
        timezone: tz,
        defaultReminderMinutes: remindBefore,
        emailNotifications: emails,
      });
      setUser(data);
      toast.success("Settings saved ✓");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.sub}>Manage your profile and notification preferences</p>
      </div>

      <form onSubmit={handleSave} className={styles.form}>
        {/* ── Profile section ── */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <User size={16} color="var(--purple)" />
            <h2 className={styles.sectionTitle}>Profile</h2>
          </div>

          <div className={styles.avatarRow}>
            {user?.avatar
              ? <img src={user.avatar} alt={user.name} className={styles.avatarImg} />
              : <div className={styles.avatarInitials}>{initials}</div>
            }
            <div>
              <p className={styles.avatarName}>{user?.name}</p>
              <p className={styles.avatarEmail}>{user?.email}</p>
              {user?.googleId && (
                <span className={styles.googleBadge}>
                  Connected via Google
                </span>
              )}
            </div>
          </div>

          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <label>Display name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
              />
            </div>
            <div className={styles.field}>
              <label>Email</label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className={styles.disabledInput}
              />
              <span className={styles.fieldHint}>Email cannot be changed</span>
            </div>
          </div>
        </div>

        {/* ── Notification section ── */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Bell size={16} color="var(--purple)" />
            <h2 className={styles.sectionTitle}>Notifications</h2>
          </div>

          <div className={styles.field} style={{ maxWidth: 320 }}>
            <label>Timezone</label>
            <select value={tz} onChange={(e) => setTz(e.target.value)}>
              {TIMEZONES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <span className={styles.fieldHint}>Reminders fire based on this timezone</span>
          </div>

          <div className={styles.field} style={{ maxWidth: 320 }}>
            <label>Default reminder</label>
            <select
              value={remindBefore}
              onChange={(e) => setRemindBefore(parseInt(e.target.value))}
            >
              <option value={0}>At exact time</option>
              <option value={5}>5 minutes before</option>
              <option value={10}>10 minutes before</option>
              <option value={15}>15 minutes before</option>
              <option value={30}>30 minutes before</option>
              <option value={60}>1 hour before</option>
              <option value={120}>2 hours before</option>
              <option value={1440}>1 day before</option>
            </select>
            <span className={styles.fieldHint}>Default reminder time for new tasks</span>
          </div>

          <div className={styles.toggleRow}>
            <div>
              <div className={styles.toggleLabel}>Email reminders</div>
              <div className={styles.toggleHint}>
                Receive email alerts for tasks and standing reminders
              </div>
            </div>
            <button
              type="button"
              className={`${styles.toggle} ${emails ? styles.toggleOn : ""}`}
              onClick={() => setEmails(!emails)}
              role="switch"
              aria-checked={emails}
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>
        </div>

        {/* ── Appearance section ── */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Sun size={16} color="var(--purple)" />
            <h2 className={styles.sectionTitle}>Appearance</h2>
          </div>

          <div className={styles.toggleRow}>
            <div>
              <div className={styles.toggleLabel}>Dark mode</div>
              <div className={styles.toggleHint}>
                Switch between light and dark theme
              </div>
            </div>
            <button
              type="button"
              className={`${styles.toggle} ${theme === "dark" ? styles.toggleOn : ""}`}
              onClick={toggleTheme}
              role="switch"
              aria-checked={theme === "dark"}
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>
        </div>

        {/* ── Security section ── */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Shield size={16} color="var(--purple)" />
            <h2 className={styles.sectionTitle}>Security</h2>
          </div>
          <div className={styles.infoBox}>
            <p>
              {user?.googleId
                ? "Your account is secured via Google OAuth. Password login is not available for Google accounts."
                : "Your password is securely hashed with bcrypt. To change it, log out and use the 'Forgot password' flow."}
            </p>
            <p className={styles.rateLimitNote}>
              🛡️ API rate limiting is active: 100 requests / 15 min per IP. Login attempts are limited to 10 / 15 min.
            </p>
          </div>
        </div>

        <div className={styles.formFooter}>
          <button type="submit" className={styles.saveBtn} disabled={saving}>
            <Save size={14} />
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

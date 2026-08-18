import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, Bell, ToggleLeft, ToggleRight, Clock } from "lucide-react";
import api from "../api/axios";
import styles from "./RemindersPage.module.css";

const REPEAT_OPTIONS = [
  { id: "once", label: "Once", color: "#6b7280" },
  { id: "daily", label: "Every day", color: "#6C5CE7" },
  { id: "weekly", label: "Weekly", color: "#3b82f6" },
  { id: "weekdays", label: "Weekdays", color: "#22c55e" },
  { id: "weekends", label: "Weekends", color: "#ec4899" },
];

const REPEAT_MAP = REPEAT_OPTIONS.reduce((acc, item) => {
  acc[item.id] = item;
  return acc;
}, {});

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const EMPTY_FORM = { label: "", time: "19:00", repeatType: "daily", repeatDayOfWeek: 1, onceDate: "" };

export default function RemindersPage() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);

  const fetchReminders = async () => {
    try {
      const { data } = await api.get("/reminders");
      setReminders(data);
    } catch (_) {
      toast.error("Failed to load reminders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReminders(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Send repeatType, frequency, and type for backend schema compatibility
      const selectedRepeat = form.repeatType || "daily";

      const payload = {
        label: form.label,
        title: form.label,
        time: form.time,
        repeatType: selectedRepeat,
        frequency: selectedRepeat,
        type: selectedRepeat,
        isActive: true,
        status: "PENDING",
        isNotified: false,
      };

      if (selectedRepeat === "weekly") {
        payload.repeatDayOfWeek = form.repeatDayOfWeek;
      }

      if (selectedRepeat === "once") {
        payload.onceDate = form.onceDate;
        if (form.onceDate && form.time) {
          payload.scheduledFor = new Date(`${form.onceDate}T${form.time}`).toISOString();
          payload.dueDate = payload.scheduledFor;
        }
      }

      await api.post("/reminders", payload);
      toast.success("Reminder set! You'll get emails at the scheduled time.");
      setForm(EMPTY_FORM);
      setShowForm(false);
      fetchReminders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create reminder");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (r) => {
    const currentActive = r.isActive ?? (r.status?.toUpperCase() === "PENDING" && !r.isNotified);
    const newActiveState = !currentActive;
    const newStatus = newActiveState ? "PENDING" : "CANCELLED";

    try {
      await api.patch(`/reminders/${r._id}`, { 
        isActive: newActiveState, 
        status: newStatus,
        isNotified: false 
      });

      setReminders((prev) =>
        prev.map((x) => (x._id === r._id ? { ...x, isActive: newActiveState, status: newStatus } : x))
      );
    } catch (_) {
      toast.error("Failed to update reminder");
    }
  };

  const deleteReminder = async (id) => {
    if (!window.confirm("Delete this reminder?")) return;
    try {
      await api.delete(`/reminders/${id}`);
      toast.success("Reminder deleted");
      setReminders((prev) => prev.filter((r) => r._id !== id));
    } catch (_) {
      toast.error("Failed to delete");
    }
  };

  const getDisplayTime = (r) => {
    if (r.time) return r.time;
    const dateSource = r.scheduledFor || r.dueDate;
    if (dateSource) {
      const d = new Date(dateSource);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      }
    }
    return "19:00";
  };

  return (
    <div className={styles.page}>
      {/* ── Top Header Bar ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 className={styles.title} style={{ margin: 0, fontSize: "24px", fontWeight: "700" }}>Reminders</h1>
          <p className={styles.sub} style={{ margin: "4px 0 0 0", color: "#6b7280" }}>Standing alerts — set once, fire automatically</p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "#6C5CE7",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "10px",
            padding: "10px 18px",
            fontWeight: "600",
            fontSize: "14px",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(108, 92, 231, 0.25)",
            transition: "all 0.2s ease"
          }}
        >
          <Plus size={16} />
          {showForm ? "Close form" : "New reminder"}
        </button>
      </div>

      {/* ── Explainer banner ── */}
      <div className={styles.infoBanner}>
        <Bell size={15} color="#6C5CE7" />
        <p>
          Unlike task reminders, <strong>standing reminders</strong> repeat on a schedule you set — daily, every weekday, or weekly.
          Great for things like <em>"Review my tasks every evening at 7 PM"</em>.
          Just set it once and TaskFlow emails you automatically.
        </p>
      </div>

      {/* ── Create Form ── */}
      {showForm && (
        <form className={styles.createForm} onSubmit={handleCreate}>
          <h3 className={styles.formTitle}>New reminder</h3>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>Label</label>
              <input
                type="text"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="e.g. Evening task review"
                required
              />
            </div>

            <div className={styles.field}>
              <label>Time</label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Styled Repeat Option Buttons */}
          <div className={styles.field} style={{ marginTop: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", fontWeight: "600" }}>Repeat</label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {REPEAT_OPTIONS.map((opt) => {
                const isSelected = form.repeatType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, repeatType: opt.id }))}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: "pointer",
                      border: isSelected ? `2px solid ${opt.color}` : "1px solid #e5e7eb",
                      backgroundColor: isSelected ? `${opt.color}15` : "#ffffff",
                      color: isSelected ? opt.color : "#374151",
                      boxShadow: isSelected ? `0 2px 8px ${opt.color}25` : "none",
                      transition: "all 0.15s ease",
                      outline: "none"
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {form.repeatType === "weekly" && (
            <div className={styles.field} style={{ marginTop: "16px" }}>
              <label>Day of week</label>
              <select
                value={form.repeatDayOfWeek}
                onChange={(e) => setForm({ ...form, repeatDayOfWeek: Number(e.target.value) })}
              >
                {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
          )}

          {form.repeatType === "once" && (
            <div className={styles.field} style={{ marginTop: "16px" }}>
              <label>Date</label>
              <input
                type="date"
                value={form.onceDate}
                onChange={(e) => setForm({ ...form, onceDate: e.target.value })}
                required
              />
            </div>
          )}

          <div className={styles.formActions}>
            <button type="button" className={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className={styles.saveBtn} disabled={saving}>
              {saving ? "Saving…" : "Save reminder"}
            </button>
          </div>
        </form>
      )}

      {/* ── List ── */}
      {loading ? (
        <div className={styles.loading}>Loading…</div>
      ) : reminders.length === 0 ? (
        <div className={styles.emptyState}>
          <Bell size={40} color="#d1d5db" />
          <p>No reminders yet</p>
          <p className={styles.emptyHint}>Set a daily or weekly reminder to keep you on track.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {reminders.map((r) => {
            // Check repeatType, frequency, or type with fallback
            const freqKey = r.repeatType || r.frequency || r.type || "daily";
            const rt = REPEAT_MAP[freqKey] || REPEAT_MAP.daily;
            const isItemActive = r.isActive ?? (r.status?.toUpperCase() === "PENDING" && !r.isNotified);
            const displayTime = getDisplayTime(r);

            return (
              <div key={r._id} className={`${styles.reminderCard} ${!isItemActive ? styles.inactive : ""}`}>
                <div className={styles.reminderIcon} style={{ background: `${rt.color}18` }}>
                  <Clock size={16} color={rt.color} />
                </div>
                <div className={styles.reminderBody}>
                  <div className={styles.reminderLabel}>{r.label || r.title}</div>
                  <div className={styles.reminderMeta}>
                    {displayTime && <span className={styles.timeTag}>{displayTime}</span>}
                    <span className={styles.repeatTag} style={{ background: `${rt.color}18`, color: rt.color }}>
                      {rt.label}
                      {freqKey === "weekly" && r.repeatDayOfWeek != null
                        ? ` · ${DAYS[r.repeatDayOfWeek]}`
                        : ""}
                    </span>
                    {r.lastFiredAt && (
                      <span className={styles.lastFired}>
                        Last sent: {new Date(r.lastFiredAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className={styles.reminderActions}>
                  <button
                    className={styles.toggleBtn}
                    onClick={() => toggleActive(r)}
                    title={isItemActive ? "Pause" : "Enable"}
                  >
                    {isItemActive
                      ? <ToggleRight size={22} color="#6C5CE7" />
                      : <ToggleLeft  size={22} color="#9ca3af" />}
                  </button>
                  <button className={styles.deleteBtn} onClick={() => deleteReminder(r._id)} title="Delete">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

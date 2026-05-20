import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, Bell, ToggleLeft, ToggleRight, Clock } from "lucide-react";
import api from "../api/axios";
import styles from "./RemindersPage.module.css";

const REPEAT_LABELS = {
  once:     { label: "Once",      color: "#6b7280" },
  daily:    { label: "Every day", color: "#6C5CE7" },
  weekly:   { label: "Weekly",    color: "#3b82f6" },
  weekdays: { label: "Weekdays",  color: "#22c55e" },
  weekends: { label: "Weekends",  color: "#ec4899" },
};

const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

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
      const payload = {
        label: form.label,
        time:  form.time,
        repeatType: form.repeatType,
      };
      if (form.repeatType === "weekly") payload.repeatDayOfWeek = form.repeatDayOfWeek;
      if (form.repeatType === "once")   payload.onceDate = form.onceDate;

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
    try {
      await api.patch(`/reminders/${r._id}`, { isActive: !r.isActive });
      setReminders((prev) =>
        prev.map((x) => (x._id === r._id ? { ...x, isActive: !x.isActive } : x))
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

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.title}>Reminders</h1>
          <p className={styles.sub}>Standing alerts — set once, fire automatically</p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowForm(!showForm)}>
          <Plus size={15} /> New reminder
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

      {/* ── Create form ── */}
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

          <div className={styles.field}>
            <label>Repeat</label>
            <div className={styles.repeatGrid}>
              {Object.entries(REPEAT_LABELS).map(([key, { label, color }]) => (
                <button
                  key={key}
                  type="button"
                  className={`${styles.repeatBtn} ${form.repeatType === key ? styles.repeatActive : ""}`}
                  style={form.repeatType === key ? { background: `${color}18`, borderColor: color, color } : {}}
                  onClick={() => setForm({ ...form, repeatType: key })}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {form.repeatType === "weekly" && (
            <div className={styles.field}>
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
            <div className={styles.field}>
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
            const rt = REPEAT_LABELS[r.repeatType] || REPEAT_LABELS.once;
            return (
              <div key={r._id} className={`${styles.reminderCard} ${!r.isActive ? styles.inactive : ""}`}>
                <div className={styles.reminderIcon} style={{ background: `${rt.color}18` }}>
                  <Clock size={16} color={rt.color} />
                </div>
                <div className={styles.reminderBody}>
                  <div className={styles.reminderLabel}>{r.label}</div>
                  <div className={styles.reminderMeta}>
                    <span className={styles.timeTag}>{r.time}</span>
                    <span className={styles.repeatTag} style={{ background: `${rt.color}18`, color: rt.color }}>
                      {rt.label}
                      {r.repeatType === "weekly" && r.repeatDayOfWeek != null
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
                    title={r.isActive ? "Pause" : "Enable"}
                  >
                    {r.isActive
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

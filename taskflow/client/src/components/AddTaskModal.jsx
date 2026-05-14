import { useState } from "react";
import { X, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import s from "./AddTaskModal.module.css";

const EXAMPLES = [
  "Meeting with client at 7 pm today",
  "Exam at 3 pm tomorrow",
  "Submit project report at 11:30 am on Friday",
  "Doctor appointment at 2 pm next Monday",
  "Pay electricity bill today",
];

const CATEGORIES = ["work", "personal", "study", "health", "finance", "other"];
const PRIORITIES = ["low", "medium", "high", "urgent"];

export default function AddTaskModal({ onClose, onSaved }) {
  const [rawInput, setRawInput] = useState("");
  const [notes, setNotes] = useState("");
  const [remindBefore, setRemindBefore] = useState(30);
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [category, setCategory] = useState("other");
  const [priority, setPriority] = useState("low");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const addTag = (e) => {
    if (e) e.preventDefault();
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };
  const removeTag = (tag) => setTags(tags.filter(t => t !== tag));

  const handleSave = async () => {
    if (!rawInput.trim() && !dueDate && !dueTime) {
      toast.error("Please describe your task or set a date/time");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        rawInput: rawInput.trim(),
        notes,
        remindBeforeMinutes: remindBefore,
        dueDate: dueDate || undefined,
        dueTime: dueTime || undefined,
        category,
        priority,
        tags,
      };
      const { data } = await api.post("/tasks", payload);
      toast.success("Task added!");
      onSaved?.();
      setTimeout(onClose, 1200);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not add task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={s.modal}>
        <div className={s.header}>
          <div className={s.headerLeft}>
            <Sparkles size={16} color="var(--brand)" />
            <h2 className={s.title}>Add a task</h2>
          </div>
          <button className={s.closeBtn} onClick={onClose}><X size={16} /></button>
        </div>

        <div className={s.body}>
          {/* Natural language input */}
          <div className={s.inputWrap}>
            <label className="field-label">Describe your task naturally (optional)</label>
            <textarea
              className={`field-input ${s.textarea}`}
              placeholder='e.g. "Meeting with client at 7 pm today"'
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              rows={2}
            />
          </div>

          {/* Example chips */}
          <div className={s.examples}>
            {EXAMPLES.map((ex) => (
              <button key={ex} className={s.exChip} onClick={() => setRawInput(ex)}>{ex}</button>
            ))}
          </div>

          <div className={s.divider}>
            <span>Or fill manually</span>
          </div>

          {/* Manual fields */}
          <div className={s.manualGrid}>
            <div className={s.inputWrap}>
              <label className="field-label">Title</label>
              <input
                type="text"
                className="field-input"
                placeholder="Task title"
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
              />
            </div>

            <div className={s.inputWrap}>
              <label className="field-label">Date</label>
              <input
                type="date"
                className="field-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className={s.inputWrap}>
              <label className="field-label">Time</label>
              <input
                type="time"
                className="field-input"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
              />
            </div>

            <div className={s.inputWrap}>
              <label className="field-label">Category</label>
              <select
                className="field-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
            </div>

            <div className={s.inputWrap}>
              <label className="field-label">Priority</label>
              <select
                className="field-input"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                {PRIORITIES.map(pri => (
                  <option key={pri} value={pri}>{pri.charAt(0).toUpperCase() + pri.slice(1)}</option>
                ))}
              </select>
            </div>

            <div className={s.inputWrap}>
              <label className="field-label">Tags (custom)</label>
              <div className={s.tagInputRow}>
                <input
                  type="text"
                  className="field-input"
                  placeholder="Add tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(e); } }}
                />
                <button type="button" className="btn-ghost" onClick={addTag}>Add</button>
              </div>
              {tags.length > 0 && (
                <div className={s.tagList}>
                  {tags.map(tag => (
                    <span key={tag} className={`tag ${s.tagItem}`}>
                      {tag}
                      <button type="button" className="tag-remove" onClick={() => removeTag(tag)}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={s.inputWrap}>
            <label className="field-label">Notes (optional)</label>
            <textarea
              className={`field-input ${s.textarea}`}
              placeholder="Any extra details…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className={s.inputWrap}>
            <label className="field-label">Email reminder — how many minutes before?</label>
            <select className="field-input" value={remindBefore} onChange={(e) => setRemindBefore(Number(e.target.value))}>
              <option value={0}>At exact time</option>
              <option value={5}>5 minutes before</option>
              <option value={10}>10 minutes before</option>
              <option value={15}>15 minutes before</option>
              <option value={30}>30 minutes before</option>
              <option value={60}>1 hour before</option>
              <option value={120}>2 hours before</option>
              <option value={1440}>1 day before</option>
            </select>
          </div>
        </div>

        <div className={s.footer}>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? <span className="spinner" /> : "Save task"}
          </button>
        </div>
      </div>
    </div>
  );
}

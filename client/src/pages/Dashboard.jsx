import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format, isToday, isPast } from "date-fns";
import { CheckCircle2, Clock, AlertTriangle, Bell, Plus, ArrowRight } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import AddTaskModal from "../components/AddTaskModal";
import s from "./Dashboard.module.css";

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className={`${s.statCard} card`}>
    <div className={s.statIcon} style={{ background: color + "20", color }}><Icon size={16} /></div>
    <div className={s.statBody}>
      <div className={s.statLabel}>{label}</div>
      <div className={s.statNum}>{value}</div>
      {sub && <div className={s.statSub}>{sub}</div>}
    </div>
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const load = () => api.get("/tasks/dashboard").then((r) => setStats(r.data));
  useEffect(() => { load(); }, []);

    const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.split(" ")[0] || "there";

  const completionPct = stats?.total > 0
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  return (
    <div className={s.page}>
      {/* Header */}
      <div className={s.header}>
        <div>
          <h1 className={s.greeting}>{greeting}, {firstName}</h1>
          <p className={s.subGreeting}>{format(new Date(), "EEEE, d MMMM yyyy")}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={15} /> Add task
        </button>
      </div>

      {/* Stats */}
      <div className={s.statsGrid}>
        <StatCard icon={CheckCircle2} label="Completed"  value={stats?.completed ?? "—"} color="#22c55e" sub={`${completionPct}% done`} />
        <StatCard icon={Clock}        label="Pending"    value={stats?.pending ?? "—"}   color="#6C5CE7" sub="active tasks" />
        <StatCard icon={AlertTriangle} label="Overdue"   value={stats?.overdue ?? "—"}   color="#ef4444" sub="needs action" />
        <StatCard icon={Bell}         label="This month" value={stats?.monthCompleted ?? "—"} color="#f59e0b" sub="completed" />
      </div>

      {/* Progress bar */}
      {stats?.total > 0 && (
        <div className={`${s.progressCard} card`}>
          <div className={s.progressHeader}>
            <span>Overall progress</span>
            <span>{stats.completed} / {stats.total} tasks</span>
          </div>
          <div className={s.progressTrack}>
            <div className={s.progressFill} style={{ width: `${completionPct}%` }} />
          </div>
        </div>
      )}

      {/* Today's tasks */}
      <div className={s.section}>
        <div className={s.sectionHeader}>
          <h2 className={s.sectionTitle}>Today's events</h2>
          <Link to="/tasks" className={s.seeAll}>See all <ArrowRight size={13} /></Link>
        </div>

        {!stats ? (
          <div className={s.loading}><span className="spinner" /></div>
        ) : stats.todayTasks?.length === 0 ? (
          <div className={`${s.emptyCard} card`}>
            <p>No tasks scheduled for today.</p>
            <button className="btn-ghost" style={{marginTop:10}} onClick={() => setShowAdd(true)}>
              <Plus size={13} /> Add your first task
            </button>
          </div>
        ) : (
          <div className={s.taskList}>
            {stats.todayTasks.map((t) => (
              <TodayTask key={t._id} task={t} onRefresh={load} />
            ))}
          </div>
        )}
      </div>

      {showAdd && <AddTaskModal onClose={() => setShowAdd(false)} onSaved={load} />}
    </div>
  );
}

function TodayTask({ task, onRefresh }) {
  const [done, setDone] = useState(task.status === "completed");

  const toggle = async () => {
    const newStatus = done ? "pending" : "completed";
    setDone(!done);
    await api.patch(`/tasks/${task._id}`, { status: newStatus });
    onRefresh();
  };

  const overdue = task.dueDate && isPast(new Date(task.dueDate)) && !done;

  return (
    <div className={`${s.taskCard} card ${done ? s.taskDone : ""} ${overdue ? s.taskOverdue : ""}`}>
      <button className={`${s.checkBtn} ${done ? s.checked : ""}`} onClick={toggle}>
        {done && <CheckCircle2 size={16} />}
      </button>
      <div className={s.taskBody}>
        <div className={`${s.taskTitle} ${done ? s.strikethrough : ""}`}>{task.title}</div>
        <div className={s.taskMeta}>
          <span className={`badge cat-${task.category}`}>{task.category}</span>
          {task.dueTime && (
            <span className={s.timeChip}>
              <Clock size={10} /> {task.dueTime}
            </span>
          )}
          {overdue && <span className="badge badge-danger">Overdue</span>}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { format, isPast } from "date-fns";
import { Plus, Search, Trash2, CheckCircle2, Clock, Filter } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import AddTaskModal from "../components/AddTaskModal";
import s from "./TasksPage.module.css";

const CATS = ["all","work","personal","study","health","finance","other"];
const PRIS = ["all","urgent","high","medium","low"];

export default function TasksPage() {
  const [tasks, setTasks]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch]   = useState("");
  const [cat, setCat]         = useState("all");
  const [pri, setPri]         = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const params = { status: "pending" };
      if (search) params.search = search;
      if (cat !== "all") params.category = cat;
      if (pri !== "all") params.priority = pri;
      const { data } = await api.get("/tasks", { params });
      setTasks(data.tasks);
      setTotal(data.total);
    } catch { toast.error("Could not load tasks"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, cat, pri]);

  const markDone = async (id) => {
    await api.patch(`/tasks/${id}`, { status: "completed" });
    toast.success("Marked as done!");
    load();
  };

  const deleteTask = async (id) => {
    if (!confirm("Delete this task?")) return;
    await api.delete(`/tasks/${id}`);
    toast.success("Task deleted");
    load();
  };

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div>
          <h1 className={s.title}>My Tasks</h1>
          <p className={s.sub}>{total} active task{total !== 1 ? "s" : ""}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={15} /> Add task
        </button>
      </div>

      {/* Filters */}
      <div className={s.filters}>
        <div className={s.searchWrap}>
          <Search size={13} className={s.searchIcon} />
          <input
            className={s.searchInput}
            placeholder="Search tasks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={s.pills}>
          {CATS.map((c) => (
            <button key={c} className={`${s.pill} ${cat===c ? s.pillActive : ""}`} onClick={() => setCat(c)}>
              {c}
            </button>
          ))}
        </div>
        <div className={s.pills}>
          {PRIS.map((p) => (
            <button key={p} className={`${s.pill} ${pri===p ? s.pillActive : ""}`} onClick={() => setPri(p)}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Task list */}
      {loading ? (
        <div className={s.center}><span className="spinner" /></div>
      ) : tasks.length === 0 ? (
        <div className={`${s.empty} card`}>
          <p>No tasks found.</p>
          <button className="btn-ghost" style={{marginTop:12}} onClick={() => setShowAdd(true)}>
            <Plus size={13} /> Add your first task
          </button>
        </div>
      ) : (
        <div className={s.list}>
          {tasks.map((t) => (
            <TaskRow key={t._id} task={t} onDone={markDone} onDelete={deleteTask} />
          ))}
        </div>
      )}

      {showAdd && <AddTaskModal onClose={() => setShowAdd(false)} onSaved={load} />}
    </div>
  );
}

function TaskRow({ task, onDone, onDelete }) {
  const overdue = task.dueDate && isPast(new Date(task.dueDate));
  return (
    <div className={`${s.taskCard} card ${overdue ? s.overdue : ""}`}>
      <button className={s.doneBtn} onClick={() => onDone(task._id)} title="Mark done">
        <CheckCircle2 size={18} />
      </button>
      <div className={s.taskBody}>
        <div className={s.taskTitle}>{task.title}</div>
        <div className={s.taskMeta}>
          {task.tags && task.tags.length > 0 && task.tags.map(tag => (
            <span key={tag} className={`badge ${s.tagBadge}`}>{tag}</span>
          ))}
          {!task.tags?.length && (
            <span className={`badge cat-${task.category}`}>{task.category}</span>
          )}
          <span className={`badge pri-${task.priority}`}>{task.priority}</span>
          {task.dueTime && (
            <span className={s.timeChip}><Clock size={10} /> {task.dueTime}</span>
          )}
          {task.dueDate && (
            <span className={s.dateChip}>
              {format(new Date(task.dueDate), "d MMM, yyyy")}
            </span>
          )}
          {overdue && <span className="badge badge-danger">Overdue</span>}
        </div>
        {task.notes && <p className={s.notes}>{task.notes}</p>}
      </div>
      <button className={s.deleteBtn} onClick={() => onDelete(task._id)} title="Delete">
        <Trash2 size={14} />
      </button>
    </div>
  );
}

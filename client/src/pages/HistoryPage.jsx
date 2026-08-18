import { useState, useEffect, useCallback, useMemo } from "react";
import { format } from "date-fns";
import { CheckCircle2, Archive, Clock, Search, ChevronLeft, ChevronRight, X } from "lucide-react";
import api from "../api/axios";
import styles from "./HistoryPage.module.css";

const CAT_COLOR = {
  work: "#6C5CE7",
  personal: "#22c55e",
  study: "#3b82f6",
  health: "#ec4899",
  finance: "#f59e0b",
  other: "#9ca3af",
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function HistoryPage() {
  const [tasks, setTasks]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState("");
  const [timeFilter, setTimeFilter] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear]   = useState("");

  const PER_PAGE = 15;

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch history data (fetching larger limit so client-side month/year filters work seamlessly)
      const { data } = await api.get("/tasks/history", {
        params: { limit: 100 }
      });
      setTasks(data.tasks || []);
    } catch (_) {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // 🔍 Strict Filtering Logic
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const taskDateObj = new Date(t.completedAt || t.archivedAt || t.updatedAt || t.createdAt);
      
      // 1. Month Filter (1-indexed)
      if (filterMonth !== "") {
        const taskMonth = taskDateObj.getMonth() + 1; // 1 to 12
        if (taskMonth !== Number(filterMonth)) return false;
      }

      // 2. Year Filter
      if (filterYear !== "") {
        const taskYear = taskDateObj.getFullYear();
        if (taskYear !== Number(filterYear)) return false;
      }

      // 3. Search Text Filter
      if (search.trim() !== "") {
        const query = search.toLowerCase();
        const matchesTitle = (t.title || "").toLowerCase().includes(query);
        const matchesNotes = (t.notes || "").toLowerCase().includes(query);
        if (!matchesTitle && !matchesNotes) return false;
      }

      // 4. Time Filter
      if (timeFilter !== "") {
        const taskTime = t.dueTime || (t.completedAt ? format(taskDateObj, "HH:mm") : "");
        if (!taskTime.includes(timeFilter)) return false;
      }

      return true;
    });
  }, [tasks, filterMonth, filterYear, search, timeFilter]);

  // Client-side Pagination
  const totalPages = Math.ceil(filteredTasks.length / PER_PAGE) || 1;
  const paginatedTasks = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return filteredTasks.slice(start, start + PER_PAGE);
  }, [filteredTasks, page]);

  // Group filtered tasks by month label
  const grouped = paginatedTasks.reduce((acc, task) => {
    const date = task.completedAt || task.archivedAt || task.updatedAt;
    const key  = date ? format(new Date(date), "MMMM yyyy") : "Unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(task);
    return acc;
  }, {});

  const clearAllFilters = () => {
    setSearch("");
    setTimeFilter("");
    setFilterMonth("");
    setFilterYear("");
    setPage(1);
  };

  const hasActiveFilters = Boolean(search || timeFilter || filterMonth || filterYear);

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.title}>History</h1>
          <p className={styles.sub}>{filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""} found</p>
        </div>
      </div>

      {/* ── Filter Controls Bar ── */}
      <div className={styles.filtersBar}>
        {/* Search Input */}
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Search history…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {/* Filters Group */}
        <div className={styles.dateFilters}>
          <input
            type="time"
            value={timeFilter}
            onChange={(e) => { setTimeFilter(e.target.value); setPage(1); }}
            className={styles.select}
            title="Filter by specific time"
          />

          <select
            value={filterMonth}
            onChange={(e) => { setFilterMonth(e.target.value); setPage(1); }}
            className={styles.select}
          >
            <option value="">All months</option>
            {MONTHS.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>

          <select
            value={filterYear}
            onChange={(e) => { setFilterYear(e.target.value); setPage(1); }}
            className={styles.select}
          >
            <option value="">All years</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {hasActiveFilters && (
            <button className={styles.clearBtn} onClick={clearAllFilters}>
              <X size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Content Area ── */}
      {loading ? (
        <div className={styles.loading}>
          {[...Array(5)].map((_, i) => <div key={i} className={styles.skeleton} />)}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className={styles.emptyState}>
          <Archive size={40} color="#d1d5db" />
          <p>No history found</p>
          <p className={styles.emptyHint}>No completed tasks match your selected month, year, or filter.</p>
        </div>
      ) : (
        <>
          {Object.entries(grouped).map(([month, monthTasks]) => (
            <div key={month} className={styles.monthGroup}>
              <div className={styles.monthLabel}>{month}</div>
              <div className={styles.taskList}>
                {monthTasks.map((task) => {
                  const doneDate = task.completedAt || task.archivedAt;
                  const isCompleted = task.status === "completed";
                  return (
                    <div key={task._id} className={styles.historyCard}>
                      <div className={`${styles.statusIcon} ${isCompleted ? styles.statusDone : styles.statusArchived}`}>
                        {isCompleted ? <CheckCircle2 size={16} /> : <Archive size={16} />}
                      </div>

                      <div className={styles.historyBody}>
                        <div className={styles.historyTitle}>{task.title}</div>
                        <div className={styles.historyMeta}>
                          {task.dueTime && (
                            <span className={styles.metaChip}>
                              <Clock size={10} /> {task.dueTime}
                            </span>
                          )}
                          <span
                            className={styles.catChip}
                            style={{
                              background: `${CAT_COLOR[task.category] || "#9ca3af"}18`,
                              color: CAT_COLOR[task.category] || "#9ca3af",
                            }}
                          >
                            {task.category}
                          </span>
                          {task.notes && (
                            <span className={styles.noteChip} title={task.notes}>📝 has notes</span>
                          )}
                        </div>
                      </div>

                      <div className={styles.historyRight}>
                        <span className={`${styles.statusBadge} ${isCompleted ? styles.badgeDone : styles.badgeArchived}`}>
                          {isCompleted ? "Completed" : "Archived"}
                        </span>
                        {doneDate && (
                          <span className={styles.doneDate}>
                            {format(new Date(doneDate), "d MMM, h:mm a")}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
              <button
                className={styles.pageBtn}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
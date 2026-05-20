import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { CheckCircle2, Archive, Clock, Search, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../api/axios";
import styles from "./HistoryPage.module.css";

const CAT_COLOR = {
  work:"#6C5CE7", personal:"#22c55e", study:"#3b82f6",
  health:"#ec4899", finance:"#f59e0b", other:"#9ca3af",
};

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export default function HistoryPage() {
  const [tasks, setTasks]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear]   = useState("");

  const PER_PAGE = 15;

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: PER_PAGE };
      if (filterMonth && filterYear) {
        params.month = filterMonth;
        params.year  = filterYear;
      }
      const { data } = await api.get("/tasks/history", { params });

      let filtered = data.tasks;
      if (search) {
        filtered = filtered.filter((t) =>
          t.title.toLowerCase().includes(search.toLowerCase())
        );
      }
      setTasks(filtered);
      setTotal(data.total);
    } catch (_) {} finally {
      setLoading(false);
    }
  }, [page, filterMonth, filterYear, search]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear - i);

  // Group tasks by month label
  const grouped = tasks.reduce((acc, task) => {
    const date = task.completedAt || task.archivedAt || task.updatedAt;
    const key  = date ? format(new Date(date), "MMMM yyyy") : "Unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(task);
    return acc;
  }, {});

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div>
          <h1 className={styles.title}>History</h1>
          <p className={styles.sub}>{total} completed task{total !== 1 ? "s" : ""} in your archive</p>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className={styles.filtersBar}>
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Search history…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <div className={styles.dateFilters}>
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
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>

          {(filterMonth || filterYear) && (
            <button
              className={styles.clearBtn}
              onClick={() => { setFilterMonth(""); setFilterYear(""); setPage(1); }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className={styles.loading}>
          {[...Array(5)].map((_, i) => <div key={i} className={styles.skeleton} />)}
        </div>
      ) : tasks.length === 0 ? (
        <div className={styles.emptyState}>
          <Archive size={40} color="#d1d5db" />
          <p>No history yet</p>
          <p className={styles.emptyHint}>Completed tasks will appear here.</p>
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
                        {isCompleted
                          ? <CheckCircle2 size={16} />
                          : <Archive size={16} />}
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
                            style={{ background: `${CAT_COLOR[task.category]}18`, color: CAT_COLOR[task.category] }}
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

          {/* ── Pagination ── */}
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

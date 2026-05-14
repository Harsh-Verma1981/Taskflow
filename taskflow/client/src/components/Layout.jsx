import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  CheckSquare,
  Clock,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  User
} from "lucide-react";
import s from "./Layout.module.css";

const NAV = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/tasks",     icon: CheckSquare,     label: "My Tasks" },
  { to: "/reminders", icon: Bell,            label: "Reminders" },
  { to: "/history",   icon: Clock,           label: "History" },
  { to: "/settings",  icon: Settings,        label: "Settings" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const initials = user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close sidebar on mobile when route changes
  const handleNavClick = () => {
    if (isMobile) setSidebarOpen(false);
  };

  const MobileNav = () => (
    <nav className={s.mobileNav}>
      {NAV.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `${s.mobileNavItem} ${isActive ? s.active : ""}`}
          onClick={handleNavClick}
        >
          <Icon size={22} strokeWidth={2} />
          <span>{label}</span>
        </NavLink>
      ))}
      <button
        className={`${s.mobileNavItem} ${s.mobileUserBtn}`}
        onClick={() => { logout(); navigate("/login"); }}
      >
        <LogOut size={20} />
        <span>Logout</span>
      </button>
    </nav>
  );

  return (
    <div className={s.root}>
      {/* Mobile hamburger */}
      {isMobile && (
        <button
          className={s.hamburger}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}

      <aside className={`${s.sidebar} ${sidebarOpen ? s.sidebarOpen : ""}`}>
        <div className={s.logo}>
          <div className={s.logoMark}><span>T</span></div>
          <span className={s.logoText}>TaskFlow</span>
        </div>

        <nav className={s.nav}>
          <span className={s.navSection}>Menu</span>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `${s.navItem} ${isActive ? s.navActive : ""}`}
              onClick={handleNavClick}
            >
              <Icon size={18} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className={s.sidebarFooter}>
          <div className={s.userRow}>
            {user?.avatar
              ? <img src={user.avatar} className={s.avatarImg} alt="" />
              : <div className={s.avatar}>{initials}</div>
            }
            <div className={s.userInfo}>
              <div className={s.userName}>{user?.name}</div>
              <div className={s.userEmail}>{user?.email}</div>
            </div>
          </div>
          <button className={s.logoutBtn} onClick={handleLogout} title="Sign out">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobile && sidebarOpen && (
        <div
          className={s.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className={s.main}>
        <Outlet />
      </main>

      {isMobile && <MobileNav />}
    </div>
  );
}

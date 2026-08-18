import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const { user, updateUser } = useAuth();

  // 1. Initialize directly from localStorage first
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved || user?.theme || "light";
  });

  // 2. Apply theme to HTML root element and save in localStorage
  useEffect(() => {
    const root = document.documentElement;

    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
      root.classList.add("dark");
    } else {
      root.removeAttribute("data-theme");
      root.classList.remove("dark");
    }

    localStorage.setItem("theme", theme);
  }, [theme]);

  // 3. Only sync from user profile if localStorage was never set
  useEffect(() => {
    const savedLocal = localStorage.getItem("theme");
    if (!savedLocal && user?.theme) {
      setTheme(user.theme);
    }
  }, [user?.theme]);

  // 4. Toggle theme function
  const toggleTheme = async () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);

    // Save to server in background if user is logged in
    if (user && updateUser) {
      try {
        await updateUser({ theme: newTheme });
      } catch (err) {
        console.warn("Failed to save theme preference on server:", err.message);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
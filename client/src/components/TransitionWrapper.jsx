import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

export default function TransitionWrapper({ children }) {
  const location = useLocation();
  const [state, setState] = useState({
    status: "enter",
    location: location.pathname + location.search
  });

  useEffect(() => {
    // Start exit animation
    setState(prev => ({ ...prev, status: "exit" }));

    // After exit animation completes, change location and enter
    const timer = setTimeout(() => {
      setState({
        status: "enter",
        location: location.pathname + location.search
      });
    }, 300); // Match this to CSS transition duration

    return () => clearTimeout(timer);
  }, [location]);

  return (
    <div
      className={`page-transition-page ${state.status}`}
      data-key={state.location}
    >
      {children}
    </div>
  );
}
import { useState, useEffect } from "react";

export default function SkeletonLoader({
  count = 1,
  type = "text",
  className = ""
}) {
  const [show, setShow] = useState(true);

  // Simulate loading delay
  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className={`${className} skeleton skeleton-animated`}>
      {Array.from({ length: count }).map((_, index) => {
        const key = `skeleton-${type}-${index}`;
        switch (type) {
          case "text":
            return <div key={key} className="skeleton-text" />;
          case "title":
            return <div key={key} className="skeleton-title" />;
          case "avatar":
            return <div key={key} className="skeleton-avatar" />;
          case "icon":
            return <div key={key} className="skeleton-icon" />;
          default:
            return <div key={key} className="skeleton-text" />;
        }
      })}
    </div>
  );
}
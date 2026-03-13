import { useEffect, useState } from "react";
import "./ThemeToggle.scss";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") !== "light";
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
    }
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  return (
    <label className="theme-switch" title={isDark ? "Mode clair" : "Mode sombre"}>
      <input
        type="checkbox"
        checked={isDark}
        onChange={() => setIsDark((prev) => !prev)}
      />
      <span className="theme-slider">
        <span className="theme-icon theme-icon--moon">☽</span>
        <span className="theme-icon theme-icon--sun">☀</span>
      </span>
    </label>
  );
}
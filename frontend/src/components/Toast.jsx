import { useEffect, useState } from "react";
import "./Toast.scss";

export default function Toast({ message, type = "success", onClose }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (type === "success") {
      const fadeTimer  = setTimeout(() => setVisible(false), 2700);
      const closeTimer = setTimeout(onClose, 3000);
      return () => { clearTimeout(fadeTimer); clearTimeout(closeTimer); };
    }
  }, [type, onClose]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 250);
  };

  return (
    <div className={`toast toast-${type} ${!visible ? "toast-hide" : ""}`}>
      <span className="toast-icon">{type === "success" ? "✓" : "✗"}</span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={handleClose}>✕</button>
    </div>
  );
}
import { useEffect } from "react";
import { createPortal } from "react-dom";
import "./ConfirmModal.scss";

export default function ConfirmModal({ message, onConfirm, onCancel }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  return createPortal(
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="confirm-btn-danger" onClick={onConfirm}>Confirmer</button>
          <button className="confirm-btn-cancel" onClick={onCancel}>Annuler</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
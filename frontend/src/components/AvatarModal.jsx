import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { uploadAvatar } from "../api/client";

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function AvatarModal({ currentAvatarUrl, username, onClose, onUpdated }) {
  const [preview, setPreview] = useState(currentAvatarUrl || null);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef();

  const isDark = document.documentElement.getAttribute("data-theme") !== "light";

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      setError("Fichier invalide, choisissez une image.");
      return;
    }
    setError(null);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleSave = async () => {
    if (!file) return;
    setSaving(true);
    setError(null);
    try {
      const updatedUser = await uploadAvatar(file);
      const avatarUrl = updatedUser?.avatar?.url || null;
      if (avatarUrl) {
        const full = `http://localhost:1337${avatarUrl}`;
        localStorage.setItem("avatarUrl", full);
        onUpdated(full);
      }
      onClose();
    } catch (err) {
      setError("Erreur upload : " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const overlayStyle = {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999,
  };

  const modalStyle = {
    background: isDark ? "#111111" : "#ffffff",
    borderRadius: "12px",
    padding: "24px",
    width: "320px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    color: isDark ? "#ffffff" : "#0f172a",
  };

  const previewWrapperStyle = {
    width: "100px", height: "100px", borderRadius: "50%", margin: "0 auto",
    overflow: "hidden", cursor: "pointer", position: "relative",
border: isDark ? "3px solid #ffffff" : "3px solid #111111",
  };

  const initialsStyle = {
    width: "100%", height: "100%", display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: "2rem", fontWeight: "bold",
    background: "#7c3aed", color: "#fff",
  };

  return createPortal(
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>Photo de profil</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "1.4rem", cursor: "pointer", color: isDark ? "#ffffff" : "#0f172a" }}>×</button>
        </div>
        <div style={previewWrapperStyle} onClick={() => inputRef.current.click()}>
          {preview
            ? <img src={preview} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={initialsStyle}>{getInitials(username)}</div>
          }
        </div>
        <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
        <button onClick={() => inputRef.current.click()} style={{ padding: "8px", borderRadius: "8px", cursor: "pointer", border: `1px dashed ${isDark ? "#666" : "#ccc"}`, background: "none", color: isDark ? "#ffffff" : "#0f172a" }}>
          Choisir une photo
        </button>
        {error && <p style={{ color: "red", margin: 0, fontSize: "0.85rem" }}>{error}</p>}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={handleSave}
            disabled={!file || saving}
style={{ flex: 1, padding: "10px", borderRadius: "8px", background: isDark ? "#ffffff" : "#111111", color: isDark ? "#111111" : "#ffffff", border: "none", cursor: "pointer", opacity: (!file || saving) ? 0.5 : 1 }}          >
            {saving ? "Envoi..." : "Sauvegarder"}
          </button>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: `1px solid ${isDark ? "#444" : "#e2e8f0"}`, cursor: "pointer", background: "none", color: isDark ? "#ffffff" : "#0f172a" }}>
            Annuler
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
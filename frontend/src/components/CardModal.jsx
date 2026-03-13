import "./CardModal.scss";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { updateCard, getLabels, createLabel, deleteLabel, getUsers } from "../api/client";
import Toast from "./Toast";
import ConfirmModal from "./ConfirmModal";
import RenameIcon from "../assets/rename.png";

const API_URL = import.meta.env.VITE_API_URL;

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function stringToColor(str) {
  const colors = [
    "#e74c3c", "#e67e22", "#f1c40f", "#2ecc71",
    "#1abc9c", "#3498db", "#9b59b6", "#e91e63",
    "#00bcd4", "#ff5722", "#607d8b", "#795548",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function resolveAvatarUrl(user) {
  return user.avatar?.url ?? null;
}

export default function CardModal({ card, onClose, onDelete, onUpdate }) {
  const [title, setTitle] = useState(card.title ?? card.attributes?.title ?? "");
  const [description, setDescription] = useState(card.description ?? card.attributes?.description ?? "");
  const [dueDate, setDueDate] = useState((card.dueDate ?? card.attributes?.dueDate ?? "").slice(0, 10));
  const [availableLabels, setAvailableLabels] = useState([]);
  const [selectedLabelIds, setSelectedLabelIds] = useState(
    (card.attributes?.labels?.data ?? card.labels ?? []).map((l) => l.id)
  );
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState(
    (card.assignees ?? []).map((u) => u.id)
  );
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#ffffff");
  const [saving, setSaving] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [toast, setToast] = useState(null);
  const [labelToDelete, setLabelToDelete] = useState(null);
  const [showDeleteCardConfirm, setShowDeleteCardConfirm] = useState(false);

  const showToast = (message, type = "success") => setToast({ message, type });

  useEffect(() => {
    getLabels()
      .then((res) => setAvailableLabels(res.data ?? []))
      .catch(() => showToast("Erreur lors du chargement des labels", "error"));

    getUsers()
      .then((res) => setAvailableUsers(Array.isArray(res) ? res : res.data ?? []))
      .catch(() => showToast("Erreur lors du chargement des membres", "error"));
  }, []);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await updateCard(card.id, {
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDate || null,
        labels: selectedLabelIds,
        assignees: selectedAssigneeIds,
      });
      onUpdate();
      onClose();
    } catch (err) {
      showToast("Erreur : " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleLabel = (labelId) => {
    setSelectedLabelIds((prev) =>
      prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId]
    );
  };

  const toggleAssignee = (userId) => {
    setSelectedAssigneeIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return;
    try {
      const res = await createLabel(newLabelName.trim(), newLabelColor);
      const newLabel = res.data;
      setAvailableLabels((prev) => [...prev, newLabel]);
      setSelectedLabelIds((prev) => [...prev, newLabel.id]);
      setNewLabelName("");
      setShowLabelPicker(false);
    } catch (err) {
      showToast("Erreur création label : " + err.message, "error");
    }
  };

  const handleDeleteLabel = async (label) => {
    try {
      await deleteLabel(label.id);
      setAvailableLabels((prev) => prev.filter((l) => l.id !== label.id));
      setSelectedLabelIds((prev) => prev.filter((id) => id !== label.id));
      setLabelToDelete(null);
      onUpdate();
    } catch (err) {
      showToast("Erreur suppression label : " + err.message, "error");
    }
  };

  const handleDeleteCard = () => {
    onDelete(card.id);
    onClose();
  };

  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "long", year: "numeric",
    });
  };

  const isOverdue = dueDate && new Date(dueDate) < new Date(new Date().toDateString());

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>

        <div className="modal-header">
          <div className="modal-title-wrapper">
            {editingTitle ? (
              <input
                className="modal-title-input editing"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => setEditingTitle(false)}
                onKeyDown={(e) => { if (e.key === "Enter") setEditingTitle(false); }}
                placeholder="Titre de la carte"
                autoFocus
              />
            ) : (
              <div className="modal-title-display" onClick={() => setEditingTitle(true)}>
                <span className="modal-title-text">{title || "Sans titre"}</span>
                <img src={RenameIcon} alt="modifier" width="16" height="16" className="modal-title-edit-icon" />
              </div>
            )}
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="modal-main">

            {selectedLabelIds.length > 0 && (
              <div className="modal-section">
                <h5>Labels</h5>
                <div className="selected-labels">
                  {availableLabels
                    .filter((l) => selectedLabelIds.includes(l.id))
                    .map((label) => {
                      const color = label.attributes?.color ?? label.color ?? "#ccc";
                      const name = label.attributes?.title ?? label.title ?? label.name ?? "";
                      return (
                        <span key={label.id} className="label-chip" style={{ backgroundColor: color }}>
                          {name}
                        </span>
                      );
                    })}
                </div>
              </div>
            )}

            {selectedAssigneeIds.length > 0 && (
              <div className="modal-section">
                <h5>Membres</h5>
                <div className="modal-assignees">
                  {availableUsers
                    .filter((u) => selectedAssigneeIds.includes(u.id))
                    .map((user) => {
                      const username = user.username ?? "";
                      const avatarUrl = resolveAvatarUrl(user);
                      const color = stringToColor(username);
                      return (
                        <div key={user.id} className="modal-avatar-chip">
                          <div
                            className="modal-avatar"
                            style={{ backgroundColor: avatarUrl ? "transparent" : color, overflow: "hidden" }}
                          >
                            {avatarUrl
                              ? <img src={`${API_URL}${avatarUrl}`} alt={username} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                              : getInitials(username)
                            }
                          </div>
                          <span>{username}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {dueDate && (
              <div className="modal-section">
                <h5>Date d'échéance</h5>
                <span className={`due-date-display ${isOverdue ? "overdue" : ""}`}>
                  📅 {formatDateForDisplay(dueDate)}
                  {isOverdue && " — En retard !"}
                </span>
              </div>
            )}

            <div className="modal-section">
              <h5>☰ Description</h5>
              <textarea
                className="modal-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ajoute une description plus détaillée..."
                rows={5}
              />
            </div>

          </div>

          <div className="modal-sidebar">

            {/* MEMBRES */}
            <div className="sidebar-section">
              <h5>Membres</h5>
              <div className="assignee-list">
                {availableUsers.map((user) => {
                  const username = user.username ?? "";
                  const avatarUrl = resolveAvatarUrl(user);
                  const color = stringToColor(username);
                  const isSelected = selectedAssigneeIds.includes(user.id);
                  return (
                    <div
                      key={user.id}
                      className={`assignee-item ${isSelected ? "selected" : ""}`}
                      onClick={() => toggleAssignee(user.id)}
                    >
                      <div
                        className="assignee-avatar"
                        style={{ backgroundColor: avatarUrl ? "transparent" : color, overflow: "hidden" }}
                      >
                        {avatarUrl
                          ? <img src={`${API_URL}${avatarUrl}`} alt={username} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                          : getInitials(username)
                        }
                      </div>
                      <span className="assignee-name">{username}</span>
                      {isSelected && <span className="assignee-check">✓</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* LABELS */}
            <div className="sidebar-section">
              <h5>Labels</h5>
              <div className="label-list">
                {availableLabels.map((label) => {
                  const color = label.attributes?.color ?? label.color ?? "#ccc";
                  const name = label.attributes?.title ?? label.title ?? label.name ?? "";
                  const isSelected = selectedLabelIds.includes(label.id);
                  return (
                    <div
                      key={label.id}
                      className={`label-item ${isSelected ? "selected" : ""}`}
                      onClick={() => toggleLabel(label.id)}
                    >
                      <span className="label-dot" style={{ backgroundColor: color }} />
                      <span className="label-name">{name}</span>
                      {isSelected && <span className="label-check">✓</span>}
                      <button
                        className="label-delete-btn"
                        onClick={(e) => { e.stopPropagation(); setLabelToDelete(label); }}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>

              {showLabelPicker ? (
                <div className="new-label-form">
                  <input
                    type="text"
                    placeholder="Nom du label"
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    autoFocus
                  />
                  <div className="color-swatch-wrapper">
                    <div className="color-swatch-preview" style={{ backgroundColor: newLabelColor }} />
                    <input
                      type="color"
                      value={newLabelColor}
                      onChange={(e) => setNewLabelColor(e.target.value)}
                      className="color-swatch-input"
                    />
                  </div>
                  <div className="new-label-actions">
                    <button onClick={handleCreateLabel}>Créer</button>
                    <button onClick={() => setShowLabelPicker(false)}>Annuler</button>
                  </div>
                </div>
              ) : (
                <button className="btn-add-label" onClick={() => setShowLabelPicker(true)}>
                  + Nouveau label
                </button>
              )}
            </div>

            {/* DATE */}
            <div className="sidebar-section">
              <h5>Date d'échéance</h5>
              <input
                type="date"
                className="date-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
              {dueDate && (
                <button className="btn-clear-date" onClick={() => setDueDate("")}>
                  ✕ Supprimer la date
                </button>
              )}
            </div>

            {/* ACTIONS */}
            <div className="sidebar-section">
              <h5>Actions</h5>
              <button className="btn-danger" onClick={() => setShowDeleteCardConfirm(true)}>
                Supprimer
              </button>
            </div>

          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-save" onClick={handleSave} disabled={saving || !title.trim()}>
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </button>
          <button className="btn-cancel" onClick={onClose}>Annuler</button>
        </div>

      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {labelToDelete && (
        <ConfirmModal
          message={`Supprimer le label "${labelToDelete.attributes?.title ?? labelToDelete.title}" ?`}
          onConfirm={() => handleDeleteLabel(labelToDelete)}
          onCancel={() => setLabelToDelete(null)}
        />
      )}

      {showDeleteCardConfirm && (
        <ConfirmModal
          message="Supprimer cette carte définitivement ?"
          onConfirm={handleDeleteCard}
          onCancel={() => setShowDeleteCardConfirm(false)}
        />
      )}

    </div>,
    document.body
  );
}
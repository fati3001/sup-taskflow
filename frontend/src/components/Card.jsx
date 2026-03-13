import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import CardModal from "./CardModal";
import ConfirmModal from "./ConfirmModal";
import TrashIcon from "../assets/trash.png";
import RenameIcon from "../assets/rename.png";
import "./Card.scss";

const API_URL = import.meta.env.VITE_API_URL;

const AVATAR_COLORS = [
  "#e74c3c", "#e67e22", "#f1c40f", "#2ecc71",
  "#1abc9c", "#3498db", "#9b59b6", "#e91e63",
  "#00bcd4", "#ff5722", "#607d8b", "#795548",
];

const MAX_VISIBLE_AVATARS = 4;

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((part) => part[0]).join("").toUpperCase().slice(0, 2);
}

function getColorFromString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatDueDate(dateString) {
  if (!dateString) return null;
  const date      = new Date(dateString);
  const isPast    = date < new Date();
  const formatted = date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  return { formatted, isPast };
}

function enrichAssignees(rawAssignees, allUsers) {
  return rawAssignees.map((assignee) => {
    const match = (allUsers ?? []).find((u) => u.id === assignee.id);
    return match ?? assignee;
  });
}

export default function Card({ card, onDelete, onUpdate, allUsers }) {
  const [showModal, setShowModal]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const dragStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const cardData       = card?.attributes ?? card;
  const title          = cardData?.title ?? "Sans titre";
  const description    = cardData?.description ?? "";
  const labels         = cardData?.labels?.data ?? cardData?.labels ?? [];
  const rawAssignees   = cardData?.assignees?.data ?? cardData?.assignees ?? [];
  const assignees      = enrichAssignees(rawAssignees, allUsers);
  const dueDateInfo    = formatDueDate(cardData?.dueDate);
  const visibleAssignees = assignees.slice(0, MAX_VISIBLE_AVATARS);
  const hiddenCount    = assignees.length - MAX_VISIBLE_AVATARS;

  return (
    <>
      <div ref={setNodeRef} style={dragStyle} className="card">
        <div className="card-drag-handle" {...attributes} {...listeners}>
          ⠿
        </div>

        <div className="card-body" onClick={() => setShowModal(true)}>
          {labels.length > 0 && (
            <div className="card-labels">
              {labels.map((label) => (
                <span
                  key={label.id}
                  className="card-label"
                  style={{ backgroundColor: label.attributes?.color ?? label.color ?? "#b3b3b3" }}
                />
              ))}
            </div>
          )}

          <div className="card-title">{title}</div>

          <div className="card-footer">
            <div className="card-badges">
              {description && (
                <span className="badge">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </span>
              )}
              {dueDateInfo && (
                <span className={`badge badge-date ${dueDateInfo.isPast ? "overdue" : ""}`}>
                  {dueDateInfo.formatted}
                </span>
              )}
            </div>

            {assignees.length > 0 && (
              <div className="card-avatars">
                {visibleAssignees.map((user) => {
                  const username  = user.attributes?.username ?? user.username ?? "";
                  const avatarUrl = user.attributes?.avatar?.data?.attributes?.url ?? user.avatar?.url ?? null;
                  const color     = getColorFromString(username);
                  return (
                    <div
                      key={user.id}
                      className="card-avatar"
                      style={{ backgroundColor: avatarUrl ? "transparent" : color }}
                      title={username}
                    >
                      {avatarUrl
                        ? <img src={`${API_URL}${avatarUrl}`} alt={username} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                        : getInitials(username)
                      }
                    </div>
                  );
                })}
                {hiddenCount > 0 && (
                  <div className="card-avatar card-avatar-more">+{hiddenCount}</div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="card-actions">
          <button
            className="card-edit-btn"
            onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
            title="Modifier"
          >
            <img src={RenameIcon} alt="modifier" width="14" height="14" />
          </button>
          <button
            className="card-delete-btn"
            onClick={(e) => { e.stopPropagation(); setShowConfirm(true); }}
            title="Supprimer"
          >
            <img src={TrashIcon} alt="supprimer" width="14" height="14" />
          </button>
        </div>
      </div>

      {showModal && (
        <CardModal
          card={card}
          onClose={() => setShowModal(false)}
          onDelete={onDelete}
          onUpdate={onUpdate}
        />
      )}

      {showConfirm && (
        <ConfirmModal
          message="Supprimer cette carte ?"
          onConfirm={() => { setShowConfirm(false); onDelete(card.id); }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}
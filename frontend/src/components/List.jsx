import { useState } from "react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import Card from "./Card";
import ConfirmModal from "./ConfirmModal";
import TrashIcon from "../assets/trash.png";
import RenameIcon from "../assets/rename.png";
import "./List.scss";

const resolveListTitle = (list) =>
  list?.attributes?.title ?? list?.title ?? "Sans titre";

const resolveListCards = (list) =>
  list?.cards ?? list?.attributes?.cards?.data ?? [];

export default function List({
  list,
  showAddCard,
  newCardTitle,
  setNewCardTitle,
  onShowAddCard,
  onAddCard,
  onDeleteList,
  onDeleteCard,
  onUpdateCard,
  onRenameList,
  allUsers,
  hasBg,
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing]                 = useState(false);
  const [editTitle, setEditTitle]                 = useState(resolveListTitle(list));

  const listTitle = resolveListTitle(list);
  const cards     = resolveListCards(list);
  const cardIds   = cards.map((c) => c.id);

  const { setNodeRef } = useDroppable({ id: list.id });

  // ─── Rename Handlers ───────────────────────────────────────────────────────
  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    if (editTitle.trim() && editTitle.trim() !== listTitle) {
      await onRenameList(list.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleRenameCancel = () => {
    setEditTitle(listTitle);
    setIsEditing(false);
  };

  const handleRenameKeyDown = (e) => {
    if (e.key === "Escape") handleRenameCancel();
  };

  // ─── Card Handlers ─────────────────────────────────────────────────────────
  const handleAddCardSubmit = (e) => {
    e.preventDefault();
    onAddCard(list.id);
  };

  const handleCancelAddCard = () => {
    onShowAddCard(null);
    setNewCardTitle("");
  };

  return (
    <div className={`list ${hasBg ? "list-with-bg" : ""}`}>
      <div className="list-header">
        {isEditing ? (
          <form onSubmit={handleRenameSubmit} className="list-rename-form">
            <input
              className="list-title-input"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleRenameKeyDown}
              autoFocus
            />
            <button type="submit" className="btn-rename-confirm">✓</button>
            <button type="button" onClick={handleRenameCancel} className="btn-rename-cancel">✕</button>
          </form>
        ) : (
          <>
            <h3 className="list-title">{listTitle}</h3>
            <button className="list-rename-btn" onClick={() => setIsEditing(true)} title="Renommer">
              <img src={RenameIcon} alt="renommer" width="16" height="16" />
            </button>
          </>
        )}
        <button className="list-delete-btn" onClick={() => setShowDeleteConfirm(true)}>
          <img src={TrashIcon} alt="supprimer" width="16" height="16" />
        </button>
      </div>

      <div className="cards-container" ref={setNodeRef}>
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <Card
              key={card.id}
              card={card}
              onDelete={onDeleteCard}
              onUpdate={onUpdateCard}
              allUsers={allUsers}
            />
          ))}
        </SortableContext>


      </div>

      {showAddCard === list.id ? (
        <form onSubmit={handleAddCardSubmit} className="add-card-form">
          <textarea
            placeholder="Titre de la carte..."
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
            autoFocus
            rows="2"
          />
          <div className="form-actions">
            <button type="submit" className="btn-add">Ajouter</button>
            <button type="button" onClick={handleCancelAddCard} className="btn-cancel">✕</button>
          </div>
        </form>
      ) : (
        <button className="add-card-btn" onClick={() => onShowAddCard(list.id)}>
          + Ajouter une carte
        </button>
      )}

      {showDeleteConfirm && (
        <ConfirmModal
          message="Supprimer cette liste et toutes ses cartes ?"
          onConfirm={() => { onDeleteList(list.id); setShowDeleteConfirm(false); }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}
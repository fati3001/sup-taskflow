import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DndContext, DragOverlay, closestCorners } from "@dnd-kit/core";
import useBoard, { getBoardTitle } from "../hooks/useBoard";
import List from "../components/List";
import Card from "../components/Card";
import Toast from "../components/Toast";
import ThemeToggle from "../components/ThemeToggle";
import ConfirmModal from "../components/ConfirmModal";
import AvatarModal from "../components/AvatarModal";
import { getCurrentUser } from "../api/client";
import TrashIcon from "../assets/trash.png";
import reloadImg from "../assets/reolad.png";
import back1  from "../assets/backgrounds/back1.png";
import back2  from "../assets/backgrounds/back2.png";
import back3  from "../assets/backgrounds/back3.png";
import back4  from "../assets/backgrounds/back4.png";
import back5  from "../assets/backgrounds/back5.png";
import back6  from "../assets/backgrounds/back6.png";
import back7  from "../assets/backgrounds/back7.png";
import back8  from "../assets/backgrounds/back8.png";
import back9  from "../assets/backgrounds/back9.png";
import back10 from "../assets/backgrounds/back10.png";
import "./Board.scss";

const BACKGROUNDS = [
  { id: "default", label: "Défaut", image: null },
  { id: "back1",  label: "1",  image: back1  },
  { id: "back2",  label: "2",  image: back2  },
  { id: "back3",  label: "3",  image: back3  },
  { id: "back4",  label: "4",  image: back4  },
  { id: "back5",  label: "5",  image: back5  },
  { id: "back6",  label: "6",  image: back6  },
  { id: "back7",  label: "7",  image: back7  },
  { id: "back8",  label: "8",  image: back8  },
  { id: "back9",  label: "9",  image: back9  },
  { id: "back10", label: "10", image: back10 },
];

const resolveBackgroundById = (bgId) =>
  BACKGROUNDS.find((bg) => bg.id === bgId) ?? BACKGROUNDS[0];

export default function Board() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const {
    board, lists, loading, error,
    allLabels, allUsers,
    toast, setToast,
    confirm, setConfirm,
    handleAddList,
    handleDeleteList,
    handleRenameList,
    handleAddCard,
    handleDeleteCard,
    handleUpdateCard,
    handleDeleteBoard,
    findListContainingCard,
    handleDragEnd,
    getCardsFromList,
  } = useBoard(id);

  const [newListTitle, setNewListTitle]       = useState("");
  const [showAddList, setShowAddList]         = useState(false);
  const [addingList, setAddingList]           = useState(false);
  const [showAddCard, setShowAddCard]         = useState(null);
  const [newCardTitle, setNewCardTitle]       = useState("");
  const [activeCard, setActiveCard]           = useState(null);
  const [showBgPicker, setShowBgPicker]       = useState(false);
  const [showMenu, setShowMenu]               = useState(false);
  const [showFilters, setShowFilters]         = useState(false);
  const [activeFilters, setActiveFilters]     = useState([]);
  const [searchQuery, setSearchQuery]         = useState("");
  const [avatarUrl, setAvatarUrl]             = useState(localStorage.getItem("avatarUrl") ?? null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [currentBgId, setCurrentBgId]        = useState(
    () => localStorage.getItem(`board-bg-${id}`) ?? "default"
  );

  const storedUsername = localStorage.getItem("username") ?? "?";
  const avatarFallback = storedUsername.slice(0, 2).toUpperCase();

  // Précharge toutes les images de fond au montage — changement instantané au clic
  useEffect(() => {
    BACKGROUNDS.forEach((bg) => {
      if (bg.image) {
        const img = new Image();
        img.src = bg.image;
      }
    });
  }, []);

  // Sync avatar from server on mount
  useEffect(() => {
    const syncAvatar = async () => {
      try {
        const user = await getCurrentUser();
        if (user?.avatar?.url) {
          const url = `${import.meta.env.VITE_API_URL}${user.avatar.url}`;
          setAvatarUrl(url);
          localStorage.setItem("avatarUrl", url);
        }
      } catch {
        // Avatar sync is non-critical; silently ignore failures
      }
    };
    syncAvatar();
  }, []);

  const selectedBackground = resolveBackgroundById(currentBgId);

  const handleSelectBackground = (bg) => {
    setCurrentBgId(bg.id);
    localStorage.setItem(`board-bg-${id}`, bg.id);
    setShowBgPicker(false);
  };

  const handleAddListSubmit = async (e) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    setAddingList(true);
    await handleAddList(newListTitle);
    setNewListTitle("");
    setShowAddList(false);
    setAddingList(false);
  };

  const handleAddCardSubmit = async (listId) => {
    if (!newCardTitle.trim()) return;
    await handleAddCard(listId, newCardTitle);
    setNewCardTitle("");
    setShowAddCard(null);
  };

  const handleDragStart = ({ active }) => {
    const sourceList = findListContainingCard(active.id);
    if (!sourceList) return;
    const card = getCardsFromList(sourceList).find((c) => c.id === active.id);
    setActiveCard(card);
  };

  const onDragEnd = async (event) => {
    setActiveCard(null);
    await handleDragEnd(event);
  };

  const toggleFilter = (labelId) => {
    setActiveFilters((prev) =>
      prev.includes(labelId) ? prev.filter((fId) => fId !== labelId) : [...prev, labelId]
    );
  };

  const applyFiltersToList = (list) => {
    const cards = getCardsFromList(list);

    const labelFiltered =
      activeFilters.length === 0
        ? cards
        : cards.filter((card) => {
            const cardLabels = card.attributes?.labels?.data ?? card.labels ?? [];
            return activeFilters.some((fId) => cardLabels.some((l) => l.id === fId));
          });

    const searchFiltered = !searchQuery.trim()
      ? labelFiltered
      : labelFiltered.filter((card) => {
          const title = card.title ?? card.attributes?.title ?? "";
          return title.toLowerCase().includes(searchQuery.toLowerCase());
        });

    return { ...list, cards: searchFiltered };
  };

  if (loading) {
    return (
      <div className={`board-container ${selectedBackground.image ? "has-background" : ""}`}>
        <div className="loading">
          <img src={reloadImg} alt="chargement" className="loading-spinner" />
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="board-container">
        <div className="error-container">
          <h2>Board introuvable</h2>
          <p>{error}</p>
          <button onClick={() => navigate("/boards")}>← Retour</button>
        </div>
      </div>
    );
  }

  const boardTitle = getBoardTitle(board);

  return (
    <div
      className={`board-container ${selectedBackground.image ? "has-background" : ""}`}
      style={
        selectedBackground.image
          ? {
              backgroundImage:    `url(${selectedBackground.image})`,
              backgroundSize:     "cover",
              backgroundPosition: "center",
              backgroundRepeat:   "no-repeat",
            }
          : {}
      }
    >
      {selectedBackground.image && <div className="bg-overlay-tint" />}

      <header className="board-header">
        <div className="board-header-left">
          <button className="back-btn" onClick={() => navigate("/boards")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>

        <h1>{boardTitle}</h1>

        <div className="board-header-right">
          {/* Avatar — opens AvatarModal on click */}
          <div
            className="user-avatar"
            onClick={() => setShowAvatarModal(true)}
            style={{ cursor: "pointer", overflow: "hidden" }}
          >
            {avatarUrl
              ? <img src={avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
              : avatarFallback
            }
          </div>

          {showAvatarModal && (
            <AvatarModal
              currentAvatarUrl={avatarUrl}
              username={storedUsername}
              onClose={() => setShowAvatarModal(false)}
              onUpdated={(url) => setAvatarUrl(url)}
            />
          )}

          <ThemeToggle />

          <div className="bg-picker-wrapper">
            <button className="menu-btn" onClick={() => setShowMenu(!showMenu)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6"  x2="21" y2="6"  />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            {showMenu && (
              <>
                <div className="bg-overlay" onClick={() => setShowMenu(false)} />
                <div className="bg-picker-panel">
                  <p className="bg-picker-title">Actions</p>
                  <button className="menu-action-btn" onClick={() => setShowBgPicker(!showBgPicker)}>
                    Changer le fond
                  </button>
                  <button
                    className="menu-action-btn"
                    onClick={() => { setShowMenu(false); handleDeleteBoard(); }}
                  >
                    <img src={TrashIcon} alt="supprimer" width="14" height="14" style={{ marginRight: "8px", filter: "brightness(0)" }} />
                    Supprimer le board
                  </button>

                  {showBgPicker && (
                    <div className="bg-grid" style={{ marginTop: "10px" }}>
                      {BACKGROUNDS.map((bg) => (
                        <button
                          key={bg.id}
                          className={`bg-thumb ${currentBgId === bg.id ? "active" : ""}`}
                          onClick={() => handleSelectBackground(bg)}
                          style={
                            bg.image
                              ? { backgroundImage: `url(${bg.image})`, backgroundSize: "cover", backgroundPosition: "center" }
                              : { background: "linear-gradient(135deg, #070707, #1b1b1b)" }
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="filter-bar">
        <div className="filter-bar-center" style={{ position: "relative", zIndex: 1000 }}>
          <input
            type="text"
            className="board-search-input"
            placeholder="Rechercher une carte..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div style={{ position: "relative", zIndex: 1000 }}>
            <button className="filter-toggle-btn" onClick={() => setShowFilters(!showFilters)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="4" y1="6"  x2="20" y2="6"  />
                <circle cx="8"  cy="6"  r="2" fill="currentColor" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <circle cx="16" cy="12" r="2" fill="currentColor" />
                <line x1="4" y1="18" x2="20" y2="18" />
                <circle cx="10" cy="18" r="2" fill="currentColor" />
              </svg>
              {activeFilters.length > 0 && (
                <span className="filter-count">{activeFilters.length}</span>
              )}
            </button>

            {showFilters && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 98 }} onClick={() => setShowFilters(false)} />
                <div className="filter-dropdown">
                  <p className="filter-dropdown-title">Labels</p>
                  {allLabels.map((label) => {
                    const color    = label.attributes?.color ?? label.color ?? "#ccc";
                    const name     = label.attributes?.title ?? label.title ?? "";
                    const isActive = activeFilters.includes(label.id);
                    return (
                      <button
                        key={label.id}
                        className={`filter-chip ${isActive ? "active" : ""}`}
                        style={{ "--chip-color": color }}
                        onClick={() => toggleFilter(label.id)}
                      >
                        <span className="filter-chip-dot" style={{ backgroundColor: color }} />
                        {name}
                      </button>
                    );
                  })}
                  {activeFilters.length > 0 && (
                    <button className="filter-chip-clear" onClick={() => setActiveFilters([])}>
                      Tout effacer
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <DndContext
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="lists-container">
          {lists.map((list) => (
            <List
              key={list.id}
              list={applyFiltersToList(list)}
              showAddCard={showAddCard}
              newCardTitle={newCardTitle}
              setNewCardTitle={setNewCardTitle}
              onShowAddCard={setShowAddCard}
              onAddCard={handleAddCardSubmit}
              onDeleteList={handleDeleteList}
              onDeleteCard={handleDeleteCard}
              onUpdateCard={handleUpdateCard}
              onRenameList={handleRenameList}
              allUsers={allUsers}
            />
          ))}

          <div className="list add-list-form">
            {showAddList ? (
              <form onSubmit={handleAddListSubmit}>
                <input
                  type="text"
                  placeholder="Titre de la liste"
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  autoFocus
                />
                <div className="form-actions">
                  <button type="submit" disabled={addingList}>
                    {addingList ? "Ajout..." : "Ajouter"}
                  </button>
                  <button type="button" onClick={() => { setShowAddList(false); setNewListTitle(""); }}>
                    ✕
                  </button>
                </div>
              </form>
            ) : (
              <button className="add-list-btn" onClick={() => setShowAddList(true)}>
                + Ajouter une liste
              </button>
            )}
          </div>
        </div>

        <DragOverlay>
          {activeCard && (
            <Card card={activeCard} onDelete={() => {}} onUpdate={() => {}} />
          )}
        </DragOverlay>
      </DndContext>

      {lists.length === 0 && !showAddList && (
        <div className="empty-lists-message">
          <p>Aucune liste pour l'instant</p>
          <p>Créez votre première liste pour commencer !</p>
        </div>
      )}

      {toast   && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {confirm && <ConfirmModal message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
    </div>
  );
}
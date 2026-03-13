import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getBoards, createBoard, deleteBoard, logout, getCurrentUser } from "../api/client";
import ThemeToggle from "../components/ThemeToggle";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import AvatarModal from "../components/AvatarModal";
import TrashIcon from "../assets/trash.png";
import reloadImg from "../assets/reolad.png";
import "./Boards.scss";

const getBoardTitle = (board) => board.attributes?.title ?? board.title ?? "Sans titre";
const getBoardDescription = (board) => board.attributes?.description ?? board.description ?? "";

const matchesQuery = (board, query) => {
  const q = query.toLowerCase();
  return (
    getBoardTitle(board).toLowerCase().includes(q) ||
    getBoardDescription(board).toLowerCase().includes(q)
  );
};

export default function Boards() {
  const navigate = useNavigate();

  const [boards, setBoards]                   = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState(null);
  const [showCreateForm, setShowCreateForm]   = useState(false);
  const [newBoardTitle, setNewBoardTitle]     = useState("");
  const [newBoardDescription, setNewBoardDescription] = useState("");
  const [toast, setToast]                     = useState(null);
  const [confirm, setConfirm]                 = useState(null);
  const [searchQuery, setSearchQuery]         = useState("");
  const [showMenu, setShowMenu]               = useState(false);
  const [avatarUrl, setAvatarUrl]             = useState(localStorage.getItem("avatarUrl") ?? null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const showToast = (message, type = "success") => setToast({ message, type });
  const askConfirm = (message, onConfirm) => setConfirm({ message, onConfirm });

  const filteredBoards = searchQuery
    ? boards.filter((board) => matchesQuery(board, searchQuery))
    : boards;

  useEffect(() => {
    fetchBoards();
    syncCurrentUserAvatar();
  }, []);

  const fetchBoards = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getBoards();
      setBoards(response?.data ?? []);
    } catch (err) {
      setError(err.message ?? "Erreur lors du chargement des boards");
      const isAuthError = err.message.includes("401") || err.message.includes("Unauthorized");
      if (isAuthError) {
        logout();
        navigate("/");
      }
    } finally {
      setLoading(false);
    }
  };

  const syncCurrentUserAvatar = async () => {
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

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) {
      showToast("Le titre est obligatoire !", "error");
      return;
    }
    setSubmitting(true);
    try {
      await createBoard(newBoardTitle, newBoardDescription);
      setNewBoardTitle("");
      setNewBoardDescription("");
      setShowCreateForm(false);
      await fetchBoards();
      showToast("Board créé !");
    } catch (err) {
      showToast("Erreur création : " + err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBoard = (boardId, boardTitle) => {
    askConfirm(`Supprimer "${boardTitle}" définitivement ?`, async () => {
      setConfirm(null);
      try {
        await deleteBoard(boardId);
        setBoards((prev) => prev.filter((b) => b.id !== boardId));
        showToast("Board supprimé !");
      } catch (err) {
        showToast("Erreur suppression : " + err.message, "error");
        await fetchBoards();
      }
    });
  };

 const handleLogout = () => {
  localStorage.removeItem("avatarUrl");  // ← ajoute cette ligne
  logout();
  navigate("/");
};

  const handleAvatarUpdated = (url) => setAvatarUrl(url);

  const cancelCreateForm = () => {
    setShowCreateForm(false);
    setNewBoardTitle("");
    setNewBoardDescription("");
  };

  const storedUsername = localStorage.getItem("username") ?? "?";
  const avatarFallback = storedUsername.slice(0, 2).toUpperCase();

  if (loading) {
    return (
      <div className="boards-container">
        <div className="loading">
          <img src={reloadImg} alt="chargement" className="loading-spinner" />
          <p>Chargement des boards...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="boards-container">
        <div className="error-container">
          <div className="error-icon" />
          <h2>Erreur de chargement</h2>
          <p className="error-message">{error}</p>
          <div className="error-actions">
            <button onClick={fetchBoards} className="retry-btn">Réessayer</button>
            <button onClick={handleLogout} className="logout-btn-error">Déconnexion</button>
          </div>
        </div>
      </div>
    );
  }

  const hasBoardsVisible = filteredBoards.length > 0 || showCreateForm;
  const isEmptySearch    = searchQuery && filteredBoards.length === 0 && boards.length > 0;

  return (
    <div className="boards-container">
      <header className="boards-header">
        <div className="header-title">
          <h1>Mes Boards Kanban</h1>
        </div>

        <div className="header-right">
          <input
            type="text"
            className="search-input search-desktop"
            placeholder=" Rechercher un board..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <ThemeToggle />

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
              onUpdated={handleAvatarUpdated}
            />
          )}

          <div style={{ position: "relative" }}>
            <button className="menu-btn" onClick={() => setShowMenu(!showMenu)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            {showMenu && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 998 }} onClick={() => setShowMenu(false)} />
                <div className="boards-menu-panel">
                  <button className="menu-action-btn" onClick={() => { setShowMenu(false); handleLogout(); }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "8px" }}>
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Déconnexion
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="search-mobile-wrapper">
        <input
          type="text"
          className="search-input search-mobile"
          placeholder=" Rechercher un board..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="boards-content">
        {boards.length === 0 && !showCreateForm && (
          <div className="empty-state">
            <h3>Aucun board pour le moment</h3>
            <p>Créez votre premier board pour commencer à organiser vos tâches !</p>
            <button className="create-first-board-btn" onClick={() => setShowCreateForm(true)}>
              Créer mon premier board
            </button>
          </div>
        )}

        {isEmptySearch && (
          <div className="empty-state">
            <h3>Aucun résultat pour "{searchQuery}"</h3>
            <p>Essayez un autre mot-clé.</p>
            <button className="create-first-board-btn" onClick={() => setSearchQuery("")}>
              Effacer la recherche
            </button>
          </div>
        )}

        {hasBoardsVisible && (
          <div className="boards-grid">
            {filteredBoards.map((board) => {
              const title = getBoardTitle(board);
              const desc  = getBoardDescription(board);
              return (
                <div key={board.id} className="board-card">
                  <div className="board-card-content" onClick={() => navigate(`/board/${board.id}`)}>
                    <h3>{title}</h3>
                    {desc && <p>{desc}</p>}
                  </div>
                  <button
                    className="delete-btn"
                    onClick={(e) => { e.stopPropagation(); handleDeleteBoard(board.id, title); }}
                    title="Supprimer ce board"
                  >
                    <img src={TrashIcon} alt="supprimer" width="16" height="16" />
                  </button>
                </div>
              );
            })}

            <div className="board-card add-board-card">
              {showCreateForm ? (
                <form onSubmit={handleCreateBoard} className="create-board-form">
                  <input
                    type="text"
                    placeholder="Titre du board *"
                    value={newBoardTitle}
                    onChange={(e) => setNewBoardTitle(e.target.value)}
                    autoFocus
                    required
                  />
                  <textarea
                    placeholder="Description (optionnelle)"
                    value={newBoardDescription}
                    onChange={(e) => setNewBoardDescription(e.target.value)}
                    rows="3"
                  />
                  <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={submitting}>
                      {submitting ? "Création..." : "Créer"}
                    </button>
                    <button type="button" className="btn-secondary" onClick={cancelCreateForm}>
                      Annuler
                    </button>
                  </div>
                </form>
              ) : (
                <button className="add-board-btn" onClick={() => setShowCreateForm(true)}>
                  <span className="plus-icon">+</span>
                  <span>Créer un nouveau board</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {toast   && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {confirm && <ConfirmModal message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />}
    </div>
  );
}
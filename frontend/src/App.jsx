import { useMemo, useState } from "react";
import {
  apiFetch,
  login,
  createBoard,
  deleteBoard,
  getColumns,
  createColumn,
  deleteColumn,
  updateColumn,
} from "./api/client";

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [status, setStatus] = useState("");

  const [boards, setBoards] = useState([]);
  const [newBoardName, setNewBoardName] = useState("");

  const [selectedBoardId, setSelectedBoardId] = useState(null);

  const [columns, setColumns] = useState([]);
  const [newColumnName, setNewColumnName] = useState("");

  const selectedBoard = useMemo(
    () => boards.find((b) => b.id === selectedBoardId) || null,
    [boards, selectedBoardId]
  );

  async function handleLogin(e) {
    e.preventDefault();
    setStatus("Connexion...");
    try {
      const data = await login(email, password);
      localStorage.setItem("token", data.jwt);
      setStatus("Connecté ✅");
    } catch (err) {
      setStatus(`Erreur login ❌: ${err.message}`);
    }
  }

  async function loadBoards() {
    setStatus("Chargement des boards...");
    try {
      const data = await apiFetch("/api/boards?sort=createdAt:desc");
      setBoards(data.data || []);
      setStatus(`Boards chargés ✅ (${(data.data || []).length})`);
    } catch (err) {
      setStatus(`Erreur chargement ❌: ${err.message}`);
    }
  }

  async function handleCreateBoard() {
    const name = newBoardName.trim();
    if (!name) {
      setStatus("Entre un nom de board.");
      return;
    }

    setStatus("Création du board...");
    try {
      await createBoard(name);
      setNewBoardName("");
      await loadBoards();
      setStatus("Board créé ✅");
    } catch (err) {
      setStatus(`Erreur création ❌: ${err.message}`);
    }
  }

  async function handleDeleteBoard(id) {
    setStatus("Suppression du board...");
    try {
      await deleteBoard(id);
      setBoards((prev) => prev.filter((b) => b.id !==id));
      if (selectedBoardId === id) {
        setSelectedBoardId(null);
        setColumns([]);
      }
      
      setStatus("Board supprimé ✅");
    } catch (err) {
      setStatus(`Erreur suppression ❌: ${err.message}`);
    }
  }

  async function openBoard(boardId) {
    setSelectedBoardId(boardId);
    setStatus("Chargement des colonnes...");
    try {
      const data = await getColumns(boardId);
      setColumns(data.data || []);
      setStatus(`Colonnes chargées ✅ (${(data.data || []).length})`);
    } catch (err) {
      setStatus(`Erreur colonnes ❌: ${err.message}`);
    }
  }

  async function handleCreateColumn() {
    if (!selectedBoardId) {
      setStatus("Sélectionne d'abord un board.");
      return;
    }

    const name = newColumnName.trim();
    if (!name) {
      setStatus("Entre un nom de colonne.");
      return;
    }

    const maxOrder = columns.reduce((m, c) => {
      const v = c?.attributes?.order ?? c?.order ?? 0;
      return Math.max(m, v);
    }, 0);

    setStatus("Création colonne...");
    try {
      await createColumn(selectedBoardId, name, maxOrder + 1);
      setNewColumnName("");
      await openBoard(selectedBoardId);
      setStatus("Colonne créée ✅");
    } catch (err) {
      setStatus(`Erreur colonne ❌: ${err.message}`);
    }
  }

  async function handleDeleteColumn(id) {
    setStatus("Suppression colonne...");
    try {
      await deleteColumn(id);
    setColumns((prev) => prev.filter((c) => c.id !== id));
      setStatus("Colonne supprimée ✅");
    } catch (err) {
      setStatus(`Erreur suppression colonne ❌: ${err.message}`);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <h1>SupTaskFlow</h1>

      <form
        onSubmit={handleLogin}
        style={{ display: "grid", gap: 8, maxWidth: 360 }}
      >
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          placeholder="Mot de passe"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Se connecter</button>
      </form>

      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <button onClick={loadBoards}>Charger mes boards</button>
        <button
          onClick={() => {
            localStorage.removeItem("token");
            setBoards([]);
            setSelectedBoardId(null);
            setColumns([]);
            setStatus("Déconnecté ✅");
          }}
        >
          Se déconnecter
        </button>
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 8, maxWidth: 520 }}>
        <input
          placeholder="Nom du nouveau board"
          value={newBoardName}
          onChange={(e) => setNewBoardName(e.target.value)}
        />
        <button onClick={handleCreateBoard}>Créer</button>
      </div>

      <p style={{ marginTop: 12 }}>{status}</p>

      <h2 style={{ marginTop: 16 }}>Boards</h2>
      <ul style={{ display: "grid", gap: 8 }}>
        {boards.map((b) => {
          const name = b?.attributes?.name ?? b?.name ?? "Board";
          const isSelected = b.id === selectedBoardId;

          return (
            <li
              key={b.id}
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
              }}
            >
              <button onClick={() => openBoard(b.id)}>
                {isSelected ? "✅ " : ""}Ouvrir
              </button>
              <span>{name}</span>
              <button onClick={() => handleDeleteBoard(b.id)}>Supprimer</button>
            </li>
          );
        })}
      </ul>

      <hr style={{ margin: "20px 0" }} />

      <h2>Colonnes</h2>

      {!selectedBoard ? (
        <p>Sélectionne un board pour voir ses colonnes.</p>
      ) : (
        <>
          <p>
            Board sélectionné :{" "}
            <b>{selectedBoard?.attributes?.name ?? selectedBoard?.name}</b>
          </p>

          <div style={{ display: "flex", gap: 8, maxWidth: 520 }}>
            <input
              placeholder="Nom de la colonne"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
            />
            <button onClick={handleCreateColumn}>Ajouter colonne</button>
          </div>

          {columns.length === 0 ? (
            <p style={{ marginTop: 12 }}>Aucune colonne pour ce board.</p>
          ) : (
            <ul style={{ marginTop: 12, display: "grid", gap: 8 }}>
              {columns.map((c) => {
                const name = c?.attributes?.name ?? c?.name ?? "Colonne";
                const order = c?.attributes?.order ?? c?.order ?? 0;

                return (
                  <li
  key={c.id}
  style={{ display: "flex", gap: 8, alignItems: "center" }}
>
  <span>
    #{order} —
  </span>

  <input
    value={name}
    onChange={(e) => {
      const next = e.target.value;
      setColumns((prev) =>
        prev.map((x) =>
          x.id === c.id
            ? { ...x, attributes: { ...(x.attributes || {}), name: next } }
            : x
        )
      );
    }}
    style={{ flex: 1 }}
  />

  <button
    onClick={async () => {
      setStatus("Renommage...");
      try {
        const currentName = c?.attributes?.name ?? c?.name ?? "";
        await updateColumn(c.id, currentName);
        setStatus("Colonne renommée ✅");
      } catch (err) {
        setStatus(`Erreur renommage ❌: ${err.message}`);
      }
    }}
  >
    Save
  </button>

  <button onClick={() => handleDeleteColumn(c.id)}>Supprimer</button>
</li>

                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

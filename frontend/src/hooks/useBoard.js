import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { arrayMove } from "@dnd-kit/sortable";
import {
  getBoard, createList, deleteList, updateList,
  createCard, deleteCard, deleteBoard, updateCard,
  getLabels, getUsers,
} from "../api/client";
import useSocket from "./useSocket";

const getCardsFromList = (list) =>
  list?.cards ?? list?.attributes?.cards?.data ?? [];

export const getBoardTitle = (board) =>
  board?.attributes?.title ?? board?.title ?? "Sans titre";

export default function useBoard(boardId) {
  const navigate = useNavigate();

  const [board, setBoard]     = useState(null);
  const [lists, setLists]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [allLabels, setAllLabels] = useState([]);
  const [allUsers, setAllUsers]   = useState([]);
  const [toast, setToast]         = useState(null);
  const [confirm, setConfirm]     = useState(null);

  const showToast  = (message, type = "success") => setToast({ message, type });
  const askConfirm = (message, onConfirm) => setConfirm({ message, onConfirm });

  const fetchBoard = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const response  = await getBoard(boardId);
      const boardData = response?.data ?? response;
      if (!boardData) throw new Error("Board introuvable");
      setBoard(boardData);
      setLists(boardData?.lists ?? []);
    } catch (err) {
      setError(err.message ?? "Erreur lors du chargement du board");
    } finally {
      if (!silent) setLoading(false);
    }
  };

useSocket(
  () => fetchBoard(true),
  (data) => {
    setLists((prev) =>
      prev.map((list) => ({
        ...list,
        cards: list.cards.map((card) =>
          card.id === data.cardId
            ? { ...card, title: data.title, description: data.description, dueDate: data.dueDate }
            : card
        ),
      }))
    );
  }
);
  useEffect(() => {
    if (boardId) fetchBoard();
  }, [boardId]);

  useEffect(() => {
    getLabels()
      .then((res) => setAllLabels(res.data ?? []))
      .catch(() => {});

    getUsers()
      .then((res) => setAllUsers(Array.isArray(res) ? res : res.data ?? []))
      .catch(() => {});
  }, []);

  // ─── List Handlers ─────────────────────────────────────────────────────────

  const handleAddList = async (title) => {
    try {
      await createList(boardId, title, lists.length);
      await fetchBoard();
      showToast("Liste créée !");
    } catch (err) {
      showToast("Erreur création liste : " + err.message, "error");
    }
  };

  const handleDeleteList = (listId) => {
    askConfirm("Supprimer cette liste et toutes ses cartes ?", async () => {
      setConfirm(null);
      try {
        await deleteList(listId);
        setLists((prev) => prev.filter((l) => l.id !== listId));
        showToast("Liste supprimée !");
      } catch (err) {
        showToast("Erreur suppression : " + err.message, "error");
      }
    });
  };

  const handleRenameList = async (listId, newTitle) => {
    try {
      await updateList(listId, newTitle);
      await fetchBoard();
      showToast("Liste renommée !");
    } catch (err) {
      showToast("Erreur renommage : " + err.message, "error");
    }
  };

  // ─── Card Handlers ─────────────────────────────────────────────────────────

  const handleAddCard = async (listId, title) => {
    try {
      const targetList = lists.find((l) => l.id === listId);
      const cardCount  = getCardsFromList(targetList).length;
      await createCard(listId, title, "", null, [], cardCount);
      await fetchBoard();
      showToast("Carte créée !");
    } catch (err) {
      showToast("Erreur création carte : " + err.message, "error");
    }
  };

  const handleDeleteCard = async (cardId) => {
    try {
      await deleteCard(cardId);
      await fetchBoard();
      showToast("Carte supprimée !");
    } catch (err) {
      showToast("Erreur suppression carte : " + err.message, "error");
    }
  };

  const handleUpdateCard = async () => {
  await fetchBoard();
  getLabels()
    .then((res) => setAllLabels(res.data ?? []))
    .catch(() => {});
};

  const handleDeleteBoard = () => {
    askConfirm(`Supprimer "${getBoardTitle(board)}" définitivement ?`, async () => {
      setConfirm(null);
      try {
        await deleteBoard(board.id);
        navigate("/boards");
      } catch (err) {
        showToast("Erreur suppression board : " + err.message, "error");
      }
    });
  };

  // ─── Drag & Drop Handlers ──────────────────────────────────────────────────

  const findListContainingCard = (cardId) =>
    lists.find((list) => getCardsFromList(list).some((c) => c.id === cardId));

  const handleDragEnd = async ({ active, over }) => {
    if (!over) return;

    const sourceList = findListContainingCard(active.id);
    if (!sourceList) return;

    const sourceCards = [...getCardsFromList(sourceList)];
    const destList    = lists.find((l) => l.id === over.id) ?? findListContainingCard(over.id);
    if (!destList) return;

    const destCards  = [...getCardsFromList(destList)];
    const isSameList = sourceList.id === destList.id;

    if (isSameList) {
      const oldIndex       = sourceCards.findIndex((c) => c.id === active.id);
      const newIndex       = sourceCards.findIndex((c) => c.id === over.id);
      if (oldIndex === newIndex) return;

      const reorderedCards = arrayMove(sourceCards, oldIndex, newIndex);
      setLists((prev) =>
        prev.map((l) => (l.id === sourceList.id ? { ...l, cards: reorderedCards } : l))
      );

      try {
        await Promise.all(
          reorderedCards.map((card, index) => updateCard(card.id, { position: index }))
        );
      } catch {
        showToast("Erreur sauvegarde position", "error");
        await fetchBoard();
      }
    } else {
      const movedCard     = sourceCards.find((c) => c.id === active.id);
      const updatedSource = sourceCards.filter((c) => c.id !== active.id);
      const overIndex     = destCards.findIndex((c) => c.id === over.id);
      const insertIndex   = overIndex === -1 ? destCards.length : overIndex;
      const updatedDest   = [
        ...destCards.slice(0, insertIndex),
        movedCard,
        ...destCards.slice(insertIndex),
      ];

      setLists((prev) =>
        prev.map((l) => {
          if (l.id === sourceList.id) return { ...l, cards: updatedSource };
          if (l.id === destList.id)   return { ...l, cards: updatedDest };
          return l;
        })
      );

      try {
        await updateCard(active.id, { list: destList.id, position: insertIndex });
        showToast("Carte déplacée !");
      } catch {
        showToast("Erreur déplacement carte", "error");
        await fetchBoard();
      }
    }
  };

  return {
    board, lists, loading, error,
    allLabels, allUsers,
    toast, setToast,
    confirm, setConfirm,
    fetchBoard,
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
  };
}
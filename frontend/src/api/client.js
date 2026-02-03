const API_URL = import.meta.env.VITE_API_URL;

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  // ✅ Si Strapi renvoie vide (DELETE / 204 / content-length=0)
  const contentType = res.headers.get("content-type") || "";
  const hasJson = contentType.includes("application/json");

  let data = null;
  if (hasJson) {
    data = await res.json();
  } else {
    // texte ou vide
    const text = await res.text();
    data = text ? text : null;
  }

  if (!res.ok) {
    // Strapi met souvent le message ici
    const msg =
      typeof data === "object" && data?.error?.message
        ? data.error.message
        : `Erreur HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

// AUTH
export async function login(email, password) {
  return apiFetch("/api/auth/local", {
    method: "POST",
    body: JSON.stringify({
      identifier: email,
      password,
    }),
  });
}

// BOARDS
export async function getBoards() {
  return apiFetch("/api/boards?sort=createdAt:desc");
}

export async function createBoard(name) {
  return apiFetch("/api/boards", {
    method: "POST",
    body: JSON.stringify({ data: { name } }),
  });
}

export async function deleteBoard(id) {
  return apiFetch(`/api/boards/${id}`, { method: "DELETE" });
}

// COLUMNS
export async function getColumns(boardId) {
  return apiFetch(
    `/api/columns?filters[board][id][$eq]=${boardId}&sort=order:asc`
  );
}
export async function createColumn(boardId, name, order) {
  return apiFetch("/api/columns", {
    method: "POST",
    body: JSON.stringify({
      data: { name, order, board: boardId },
    }),
  });
}

export async function deleteColumn(id) {
  return apiFetch(`/api/columns/${id}`, { method: "DELETE" });
}
export async function updateColumn(id, name) {
  return apiFetch(`/api/columns/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      data: { name },
    }),
  });
}

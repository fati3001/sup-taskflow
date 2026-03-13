const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:1337';

const getAuthToken = () => localStorage.getItem('token');

export async function apiFetch(path, options = {}) {
  const token       = getAuthToken();
  const isAuthRoute = path.startsWith('/api/auth/local');

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(!isAuthRoute && token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  const contentType = res.headers.get('content-type') ?? '';
  const data = contentType.includes('application/json')
    ? await res.json()
    : (await res.text()) || null;

  if (!res.ok) {
    const message =
      typeof data === 'object' && data?.error?.message
        ? data.error.message
        : `Erreur ${res.status}`;
    throw new Error(message);
  }

  return data;
}

const persistSession = (jwt, user) => {
  localStorage.setItem('token',    jwt);
  localStorage.setItem('username', user?.username ?? '');
  localStorage.setItem('userId',   user?.id ?? '');
};

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function register(username, email, password) {
  const response = await apiFetch('/api/auth/local/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  });
  if (response.jwt) persistSession(response.jwt, response.user);
  return response;
}

export async function login(email, password) {
  const response = await apiFetch('/api/auth/local', {
    method: 'POST',
    body: JSON.stringify({ identifier: email, password }),
  });
  if (response.jwt) persistSession(response.jwt, response.user);
  return response;
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  localStorage.removeItem('userId');
}

// ─── Boards ──────────────────────────────────────────────────────────────────

export function getBoards() {
  return apiFetch('/api/boards?populate=*&sort=createdAt:desc');
}

export function getBoard(id) {
  return apiFetch(
    `/api/boards/${id}?populate[lists][populate][cards][populate][labels]=*&populate[lists][populate][cards][populate][assignees]=*`
  );
}

export function createBoard(name, description = '') {
  return apiFetch('/api/boards', {
    method: 'POST',
    body: JSON.stringify({
      data: { title: name, description, publishedAt: new Date().toISOString() },
    }),
  });
}

export function updateBoard(id, name, description) {
  return apiFetch(`/api/boards/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      data: { title: name, description, publishedAt: new Date().toISOString() },
    }),
  });
}

export function deleteBoard(id) {
  return apiFetch(`/api/boards/${id}`, { method: 'DELETE' });
}

// ─── Lists ───────────────────────────────────────────────────────────────────

export function getLists(boardId) {
  return apiFetch(
    `/api/lists?filters[board][id][$eq]=${boardId}&sort=position:asc&populate=cards`
  );
}

export function createList(boardId, name, position = 0) {
  return apiFetch('/api/lists', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        title:       name,
        position,
        board:       Number(boardId),
        publishedAt: new Date().toISOString(),
      },
    }),
  });
}

export function updateList(id, name, position) {
  const data = { publishedAt: new Date().toISOString() };
  if (name     !== undefined) data.title    = name;
  if (position !== undefined) data.position = position;
  return apiFetch(`/api/lists/${id}`, { method: 'PUT', body: JSON.stringify({ data }) });
}

export function deleteList(id) {
  return apiFetch(`/api/lists/${id}`, { method: 'DELETE' });
}

export const getColumns    = getLists;
export const createColumn  = createList;
export const updateColumn  = updateList;
export const deleteColumn  = deleteList;

// ─── Cards ───────────────────────────────────────────────────────────────────

export function getCards(listId) {
  return apiFetch(
    `/api/cards?filters[list][id][$eq]=${listId}&sort=position:asc&populate=*`
  );
}

export function createCard(listId, title, description = '', dueDate = null, labels = [], position = 0) {
  return apiFetch('/api/cards', {
    method: 'POST',
    body: JSON.stringify({
      data: { title, description, dueDate, labels, position, list: listId, publishedAt: new Date().toISOString() },
    }),
  });
}

export function updateCard(id, updates) {
  return apiFetch(`/api/cards/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ data: { ...updates, publishedAt: new Date().toISOString() } }),
  });
}

export function moveCard(cardId, newListId, newPosition) {
  return updateCard(cardId, { list: newListId, position: newPosition });
}

export function deleteCard(id) {
  return apiFetch(`/api/cards/${id}`, { method: 'DELETE' });
}

// ─── Labels ──────────────────────────────────────────────────────────────────

export function getLabels() {
  return apiFetch('/api/labels?sort=title:asc');
}

export function createLabel(name, color) {
  return apiFetch('/api/labels', {
    method: 'POST',
    body: JSON.stringify({ data: { title: name, color, publishedAt: new Date().toISOString() } }),
  });
}

export function deleteLabel(id) {
  return apiFetch(`/api/labels/${id}`, { method: 'DELETE' });
}

// ─── Users ───────────────────────────────────────────────────────────────────

export function getUsers() {
  return apiFetch('/api/users?populate=avatar');
}

export function getCurrentUser() {
  return apiFetch('/api/users/me?populate=avatar');
}

export async function uploadAvatar(file) {
  const token  = getAuthToken();
  const userId = localStorage.getItem('userId');

  const formData = new FormData();
  formData.append('files', file);

  const uploadRes = await fetch(`${API_URL}/api/upload`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}` },
    body:    formData,
  });
  const [uploadedFile] = await uploadRes.json();

  const updateRes = await fetch(`${API_URL}/api/users/${userId}`, {
    method:  'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization:  `Bearer ${token}`,
    },
    body: JSON.stringify({ avatar: uploadedFile.id }),
  });

  return updateRes.json();
}
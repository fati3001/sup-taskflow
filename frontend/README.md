# SupTaskFlow

Application de gestion de tâches collaborative de type Kanban, inspirée de Trello.  
Projet scolaire SUPINFO — Module 1PRO2.

---

## Schéma relationnel des données

```
┌─────────────────────┐
│        User         │
│─────────────────────│
│ id                  │
│ username (unique)   │
│ email (unique)      │
│ password (private)  │
└────────┬────────────┘
         │ oneToMany
         ▼
┌─────────────────────┐
│        Board        │
│─────────────────────│
│ id                  │
│ title (required)    │
│ description         │
│ user → User         │
└────────┬────────────┘
         │ oneToMany
         ▼
┌─────────────────────┐
│        List         │
│─────────────────────│
│ id                  │
│ title (required)    │
│ position (integer)  │
│ board → Board       │
└────────┬────────────┘
         │ oneToMany
         ▼
┌─────────────────────┐         ┌─────────────────┐
│        Card         │         │      Label      │
│─────────────────────│         │─────────────────│
│ id                  │manyToMany│ id             │
│ title (required)    │◄────────►│ title          │
│ description         │         │ color          │
│ position (bigint)   │         └─────────────────┘
│ dueDate             │
│ list → List         │
└─────────────────────┘
```

**Relations :**
- Un `User` possède plusieurs `Board`
- Un `Board` contient plusieurs `List`
- Une `List` contient plusieurs `Card`
- Une `Card` peut avoir plusieurs `Label` (ManyToMany)

---

## Procédure d'installation

### Prérequis

- Node.js v18+
- npm v9+

### 1. Cloner le projet

```bash
git clone <url-du-repo>
cd suptaskflow
```

### 2. Lancer le Backend (Strapi)

```bash
cd backend
npm install
npm run develop
```

Strapi sera disponible sur : `http://localhost:1337`  
Interface admin : `http://localhost:1337/admin`

> **Première utilisation :** Créez un compte administrateur sur `http://localhost:1337/admin`, puis configurez les permissions dans **Settings > Roles > Authenticated** en activant toutes les routes pour `board`, `list`, `card` et `label`.

### 3. Lancer le Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

L'application sera disponible sur : `http://localhost:5173`

---

## Variables d'environnement

### Backend — `backend/.env`

```env
HOST=0.0.0.0
PORT=1337
APP_KEYS=your_app_keys_here
API_TOKEN_SALT=your_api_token_salt
ADMIN_JWT_SECRET=your_admin_jwt_secret
TRANSFER_TOKEN_SALT=your_transfer_token_salt
ENCRYPTION_KEY=your_encryption_key
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db
```

> Pour utiliser PostgreSQL, remplacez `DATABASE_CLIENT=sqlite` par `DATABASE_CLIENT=postgres` et ajoutez `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`.

### Frontend — `frontend/.env`

```env
VITE_API_URL=http://localhost:1337
```

---

## Choix techniques

### Backend — Strapi v4

Strapi a été choisi car il permet de modéliser rapidement des collections avec relations, expose automatiquement une API REST, et gère nativement l'authentification JWT via le plugin `users-permissions`. Les controllers ont été surchargés pour ajouter le filtrage par utilisateur connecté (`ctx.state.user`) et la suppression en cascade des listes et cartes.

### Frontend — React 18 + Vite

React a été choisi pour sa gestion efficace de l'état local via les hooks (`useState`, `useEffect`), sa composabilité et l'écosystème disponible. Vite est utilisé comme bundler pour sa rapidité en développement.

### Bibliothèques additionnelles

| Bibliothèque | Usage |
|---|---|
| `react-router-dom` | Routing côté client (pages Login, Boards, Board) |
| `@dnd-kit/core` | Drag & Drop de bas niveau — contexte DnD, détection collisions |
| `@dnd-kit/sortable` | Tri des cartes dans les listes avec animations |
| `@dnd-kit/utilities` | Utilitaires CSS pour les transformations pendant le drag |

> L'utilisation de `dnd-kit` est une bibliothèque de bas niveau — la logique Kanban (déplacement entre colonnes, mise à jour des positions, appels API) est entièrement implémentée manuellement dans `Board.jsx`.

---

## Guide utilisateur

### Créer un compte

1. Rendez-vous sur l'application (`http://localhost:5173`)
2. Cliquez sur **"S'inscrire"**
3. Renseignez un nom d'utilisateur, un email et un mot de passe
4. Un message de confirmation s'affiche avant la redirection automatique

### Se connecter

1. Entrez votre email et mot de passe
2. Cliquez sur **"Se connecter"**

### Créer un board

1. Sur la page **Mes Boards**, cliquez sur **"Créer un nouveau board"**
2. Renseignez un titre (obligatoire) et une description (optionnelle)
3. Cliquez sur **"Créer"**

### Naviguer dans un board

1. Cliquez sur une carte de board pour l'ouvrir
2. Le board affiche ses colonnes (listes) de gauche à droite
3. Faites défiler horizontalement pour voir toutes les colonnes

### Gérer les colonnes

- **Ajouter** : Cliquez sur **"+ Ajouter une liste"** à droite des colonnes existantes
- **Renommer** : Cliquez sur l'icône crayon dans l'en-tête de la colonne
- **Supprimer** : Cliquez sur l'icône corbeille — toutes les cartes de la colonne sont supprimées

### Gérer les cartes

- **Créer** : Cliquez sur **"+ Ajouter une carte"** en bas d'une colonne
- **Éditer** : Cliquez sur une carte pour ouvrir la modale d'édition
- **Déplacer** : Glissez-déposez la carte via la poignée `⠿` vers une autre colonne ou une autre position
- **Supprimer** : Icône corbeille sur la carte ou bouton "Supprimer" dans la modale

### Modale d'édition de carte

La modale permet de modifier :
- Le **titre** (cliquez dessus pour l'éditer)
- La **description** (zone de texte libre)
- La **date d'échéance** (affichée en rouge si dépassée)
- Les **labels** (créez des labels colorés et assignez-les à la carte)

### Changer le fond du board

Cliquez sur le bouton **"Fond"** dans l'en-tête du board pour choisir parmi 7 images de fond.

### Mode sombre / clair

Cliquez sur le toggle ☽/☀ dans l'en-tête pour basculer entre les deux thèmes.

### Se déconnecter

Cliquez sur le bouton **"Déconnexion"** dans l'en-tête.

---

## Structure du projet

```
suptaskflow/
├── backend/                        # Strapi API
│   └── src/
│       └── api/
│           ├── board/
│           │   ├── controllers/board.js   # CRUD + filtrage par user
│           │   ├── routes/board.js
│           │   ├── services/board.js
│           │   └── content-types/board/schema.json
│           ├── list/
│           │   ├── controllers/list.js    # CRUD + cascade delete
│           │   ├── routes/list.js
│           │   ├── services/list.js
│           │   └── content-types/list/schema.json
│           ├── card/
│           │   ├── controllers/card.js
│           │   ├── routes/card.js
│           │   ├── services/card.js
│           │   └── content-types/card/schema.json
│           └── label/
│               ├── controllers/label.js
│               ├── routes/label.js
│               ├── services/label.js
│               └── content-types/label/schema.json
│
└── frontend/                       # React + Vite
    └── src/
        ├── api/
        │   └── client.js           # Toutes les fonctions API (fetch)
        ├── components/
        │   ├── Card.jsx            # Carte avec drag handle
        │   ├── CardModal.jsx       # Modale édition carte
        │   ├── List.jsx            # Colonne Kanban
        │   ├── Toast.jsx           # Notifications
        │   └── ThemeToggle.jsx     # Bascule dark/light
        └── pages/
            ├── Login.jsx           # Connexion + Inscription
            ├── Boards.jsx          # Liste des boards
            └── Board.jsx           # Vue board + DnD
```

---

## Sécurité

- Les tokens JWT sont stockés dans le `localStorage`
- Chaque requête authentifiée envoie le token dans le header `Authorization: Bearer`
- Côté Strapi, chaque endpoint board vérifie `ctx.state.user` et compare l'ownership avant toute opération
- Un utilisateur ne peut ni voir, ni modifier, ni supprimer les boards d'un autre utilisateur
- Les mots de passe sont marqués `private: true` dans le schema Strapi et ne sont jamais exposés par l'API
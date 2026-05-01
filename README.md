# 📋 TaskFlow — Team Task Manager

> A full-stack web app for managing team projects and tasks with role-based access control.

![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61dafb?style=flat-square&logo=react)
![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?style=flat-square&logo=node.js)
![Database](https://img.shields.io/badge/Database-MySQL%208-4479a1?style=flat-square&logo=mysql)
![Auth](https://img.shields.io/badge/Auth-JWT-orange?style=flat-square&logo=jsonwebtokens)
![Deployed](https://img.shields.io/badge/Deployed%20on-Railway-0B0D0E?style=flat-square&logo=railway)
![Docker](https://img.shields.io/badge/Container-Docker-2496ED?style=flat-square&logo=docker)

---

## ✨ Features

- 🔐 **Authentication** — Signup & Login with JWT tokens
- 📁 **Project Management** — Create, update and delete projects
- 👥 **Team Members** — Invite members by email with Admin / Member roles
- ✅ **Task Tracking** — Create, assign & track tasks (To Do / In Progress / Done)
- 🎯 **Priority Levels** — Low / Medium / High per task with due dates
- 📊 **Dashboard** — Live stats, overdue tasks, and tasks assigned to you
- 🔒 **Role-Based Access** — Admins manage tasks & members, Members update status
- 📱 **Responsive UI** — Works on desktop and mobile

---

## 🛠 Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React 18, Vite, React Router v6   |
| Backend    | Node.js, Express.js               |
| Database   | MySQL 8 (raw `mysql2` — no ORM)   |
| Auth       | JWT (JSON Web Tokens)             |
| Deployment | Railway (free tier)               |
| Container  | Docker + Nginx (frontend proxy)   |

> **No ORM** — uses raw `mysql2` queries with direct foreign key relationships. Tables are auto-created on first startup via `init.js`.

---

## 🚀 Getting Started (Local)

### Prerequisites
- Node.js 18+
- MySQL 8 running locally

### 1. Clone the repo

```bash
git clone https://github.com/inboxprashant/taskflow.git
cd taskflow
```

### 2. Backend setup

```bash
cd backend
npm install

# Configure environment
cp .env.example .env
# Edit .env — set your MySQL credentials and JWT secret
```

Your `.env` should look like:
```env
DATABASE_URL="mysql://root:yourpassword@localhost:3306/team_task_manager"
JWT_SECRET="your_secret_key_here"
PORT=5000
```

```bash
# Start dev server (auto-creates tables on first run)
npm run dev

# Seed demo data
npm run db:seed
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

### 4. Open the app

```
http://localhost:3000
```

---

## 🐳 Run with Docker

```bash
# Copy and fill in environment variables
cp .env.example .env

# Build and start all services (MySQL + Backend + Frontend)
docker compose up -d --build

# Seed demo data
docker compose exec backend node src/seed.js
```

Open `http://localhost`

---

## ☁️ Deploy on Railway (Free)

### Architecture on Railway
```
Browser → Frontend (Nginx + Docker)
              ├── /          → React SPA
              └── /api/*     → proxied to Backend service
                                    └── MySQL service
```

### Steps

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → **New Project**
3. Add **MySQL** service → copy the `MYSQL_URL`
4. Add **backend** service → root dir: `backend` → set variables:

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | paste `MYSQL_URL` from MySQL service |
   | `JWT_SECRET` | any long random string |

5. Add **frontend** service → root dir: `frontend` → set variables:

   | Key | Value |
   |---|---|
   | `BACKEND_URL` | your backend Railway URL (no `/api` at end) |

6. Seed demo data — backend service → **Run command**: `node src/seed.js`
7. Done ✅

> Full guide → **[RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md)**

---

## 👤 Demo Accounts

| Role   | Email              | Password     |
|--------|--------------------|--------------|
| Admin  | alice@demo.com     | password123  |
| Member | bob@demo.com       | password123  |
| Member | carol@demo.com     | password123  |

---

## 📡 API Endpoints

| Method | Endpoint                          | Description           | Access  |
|--------|-----------------------------------|-----------------------|---------|
| POST   | `/api/auth/signup`                | Register              | Public  |
| POST   | `/api/auth/login`                 | Login                 | Public  |
| GET    | `/api/auth/me`                    | Current user          | Auth    |
| GET    | `/api/projects`                   | List my projects      | Auth    |
| POST   | `/api/projects`                   | Create project        | Auth    |
| GET    | `/api/projects/:id`               | Project details       | Member  |
| PUT    | `/api/projects/:id`               | Update project        | Admin   |
| DELETE | `/api/projects/:id`               | Delete project        | Admin   |
| GET    | `/api/tasks/:projectId`           | List tasks            | Member  |
| POST   | `/api/tasks/:projectId`           | Create task           | Admin   |
| PUT    | `/api/tasks/:projectId/:taskId`   | Update task           | Member  |
| DELETE | `/api/tasks/:projectId/:taskId`   | Delete task           | Admin   |
| GET    | `/api/members/:projectId`         | List members          | Member  |
| POST   | `/api/members/:projectId`         | Add member            | Admin   |
| PUT    | `/api/members/:projectId/:userId` | Update member role    | Admin   |
| DELETE | `/api/members/:projectId/:userId` | Remove member         | Admin   |
| GET    | `/api/dashboard`                  | Dashboard stats       | Auth    |

---

## 🗄️ Entity Relationship Diagram

```
┌─────────────┐        ┌──────────────────┐        ┌─────────────┐
│    User     │        │  ProjectMember   │        │   Project   │
│─────────────│        │──────────────────│        │─────────────│
│ id (PK)     │1      *│ id (PK)          │*      1│ id (PK)     │
│ name        │────────│ userId (FK)      │────────│ name        │
│ email       │        │ projectId (FK)   │        │ description │
│ password    │        │ role             │        │ ownerId(FK) │──┐
│ createdAt   │        │ joinedAt         │        │ createdAt   │  │
│ updatedAt   │        └──────────────────┘        │ updatedAt   │  │
└──────┬──────┘                                    └──────┬──────┘  │
       │ 1                                                │ 1       │
       │ (creatorId / assigneeId)                         │ *       │
       │ *                                         ┌──────┴──────┐  │
       └───────────────────────────────────────────│    Task     │  │
                                                   │─────────────│  │
                                                   │ id (PK)     │  │
                                                   │ title       │  │
                                                   │ description │  │
                                                   │ status      │  │
                                                   │ priority    │  │
                                                   │ dueDate     │  │
                                                   │ projectId(FK│  │
                                                   │ creatorId(FK│  │
                                                   │ assigneeId  │  │
                                                   │ createdAt   │  │
                                                   │ updatedAt   │  │
                                                   └─────────────┘  │
       └─────────────────────────────────────────────────────────────┘
```

### Relationships & Cascade Rules

| From | To | Type | Foreign Key | On Delete |
|---|---|---|---|---|
| User | Project | One-to-Many | `Project.ownerId` | RESTRICT |
| User | ProjectMember | One-to-Many | `ProjectMember.userId` | CASCADE |
| Project | ProjectMember | One-to-Many | `ProjectMember.projectId` | CASCADE |
| Project | Task | One-to-Many | `Task.projectId` | CASCADE |
| User | Task (creator) | One-to-Many | `Task.creatorId` | RESTRICT |
| User | Task (assignee) | One-to-Many | `Task.assigneeId` | SET NULL |

### Enums

| Table | Column | Values |
|---|---|---|
| `ProjectMember` | `role` | `ADMIN`, `MEMBER` |
| `Task` | `status` | `TODO`, `IN_PROGRESS`, `DONE` |
| `Task` | `priority` | `LOW`, `MEDIUM`, `HIGH` |

---

## 📁 Project Structure

```
taskflow/
├── docker-compose.yml           # Local Docker setup
├── .env.example                 # Root env template for Docker
├── RAILWAY_DEPLOY.md            # Full Railway deploy guide
│
├── backend/
│   ├── src/
│   │   ├── db.js                # mysql2 connection pool
│   │   ├── init.js              # Auto-creates tables on startup
│   │   ├── schema.sql           # SQL schema reference
│   │   ├── seed.js              # Demo data seeder
│   │   ├── index.js             # Express entry point
│   │   ├── middleware/
│   │   │   └── auth.js          # JWT + role guards
│   │   └── routes/
│   │       ├── auth.js
│   │       ├── projects.js
│   │       ├── tasks.js
│   │       ├── members.js
│   │       └── dashboard.js
│   ├── .env.example
│   ├── Dockerfile
│   └── railway.toml
│
└── frontend/
    ├── src/
    │   ├── api/axios.js         # Axios with JWT interceptor
    │   ├── context/AuthContext.jsx
    │   ├── components/
    │   │   ├── Layout.jsx
    │   │   ├── TaskModal.jsx
    │   │   └── MemberModal.jsx
    │   └── pages/
    │       ├── LoginPage.jsx
    │       ├── SignupPage.jsx
    │       ├── DashboardPage.jsx
    │       ├── ProjectsPage.jsx
    │       └── ProjectDetailPage.jsx
    ├── Dockerfile               # Nginx + React build
    ├── nginx.conf               # Proxies /api → backend
    ├── start.sh                 # Injects env vars into nginx at runtime
    ├── serve.json               # SPA routing fallback
    └── railway.toml
```

---

## 👨‍💻 Author

**Prashant Kumar**
📧 [inboxprashantkumar@gmail.com](mailto:inboxprashantkumar@gmail.com)
🐙 [github.com/inboxprashant](https://github.com/inboxprashant)

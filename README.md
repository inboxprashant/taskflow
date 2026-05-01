# 📋 TaskFlow — Team Task Manager

> A full-stack web app for managing team projects and tasks with role-based access control.

![Made with React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61dafb?style=flat-square&logo=react)
![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?style=flat-square&logo=node.js)
![MySQL](https://img.shields.io/badge/Database-MySQL%20%2B%20Prisma-4479a1?style=flat-square&logo=mysql)
![Railway](https://img.shields.io/badge/Deployed%20on-Railway-0B0D0E?style=flat-square&logo=railway)

---

## ✨ Features

- 🔐 **Authentication** — Signup & Login with JWT
- 📁 **Project Management** — Create, update, delete projects
- 👥 **Team Members** — Invite members with Admin / Member roles
- ✅ **Task Tracking** — Create, assign & track tasks (To Do / In Progress / Done)
- 🎯 **Priority Levels** — Low / Medium / High per task
- 📊 **Dashboard** — Stats, overdue tasks, and tasks assigned to you
- 🔒 **Role-Based Access** — Admins manage everything, Members update task status
- 📱 **Responsive UI** — Works on desktop and mobile

---

## 🛠 Tech Stack

| Layer      | Technology                  |
|------------|-----------------------------|
| Frontend   | React 18, Vite, React Router |
| Backend    | Node.js, Express.js          |
| Database   | MySQL 8, Prisma ORM          |
| Auth       | JWT (JSON Web Tokens)        |
| Deployment | Railway                      |
| Container  | Docker + Docker Compose      |

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

# Run migrations
npx prisma migrate dev --name init

# Seed demo data
npm run db:seed

# Start dev server
npm run dev
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

See the full guide → **[RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md)**

**Quick steps:**
1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project
3. Add **MySQL** service
4. Add **backend** service (root dir: `backend`) → set `DATABASE_URL`, `JWT_SECRET`
5. Add **frontend** service (root dir: `frontend`) → set `VITE_API_URL`
6. Done ✅

---

## 👤 Demo Accounts

After seeding, use these to log in:

| Role   | Email              | Password     |
|--------|--------------------|--------------|
| Admin  | alice@demo.com     | password123  |
| Member | bob@demo.com       | password123  |
| Member | carol@demo.com     | password123  |

---

## 📡 API Endpoints

| Method | Endpoint                        | Description           | Access  |
|--------|---------------------------------|-----------------------|---------|
| POST   | /api/auth/signup                | Register              | Public  |
| POST   | /api/auth/login                 | Login                 | Public  |
| GET    | /api/auth/me                    | Current user          | Auth    |
| GET    | /api/projects                   | List my projects      | Auth    |
| POST   | /api/projects                   | Create project        | Auth    |
| GET    | /api/projects/:id               | Project details       | Member  |
| PUT    | /api/projects/:id               | Update project        | Admin   |
| DELETE | /api/projects/:id               | Delete project        | Admin   |
| GET    | /api/tasks/:projectId           | List tasks            | Member  |
| POST   | /api/tasks/:projectId           | Create task           | Admin   |
| PUT    | /api/tasks/:projectId/:taskId   | Update task           | Member  |
| DELETE | /api/tasks/:projectId/:taskId   | Delete task           | Admin   |
| GET    | /api/members/:projectId         | List members          | Member  |
| POST   | /api/members/:projectId         | Add member            | Admin   |
| PUT    | /api/members/:projectId/:userId | Update member role    | Admin   |
| DELETE | /api/members/:projectId/:userId | Remove member         | Admin   |
| GET    | /api/dashboard                  | Dashboard stats       | Auth    |

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
       │ (creatorId)                                      │         │
       │ (assigneeId, nullable)                           │ *       │
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
       ┌─────────────────────────────────────────────────────────────┘
       │ User.id ← Project.ownerId  (one user owns many projects)
```

### Relationships

| From | To | Type | Key | On Delete |
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
| ProjectMember | role | `ADMIN`, `MEMBER` |
| Task | status | `TODO`, `IN_PROGRESS`, `DONE` |
| Task | priority | `LOW`, `MEDIUM`, `HIGH` |

---

## 📁 Project Structure

```
taskflow/
├── docker-compose.yml
├── .env.example
├── RAILWAY_DEPLOY.md
│
├── backend/
│   ├── prisma/
│   │   └── schema.prisma        # DB schema (User, Project, Task, Member)
│   ├── src/
│   │   ├── middleware/auth.js   # JWT + role guards
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── projects.js
│   │   │   ├── tasks.js
│   │   │   ├── members.js
│   │   │   └── dashboard.js
│   │   ├── index.js             # Express entry point
│   │   └── seed.js              # Demo data seeder
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
    ├── Dockerfile
    ├── nginx.conf
    ├── serve.json
    └── railway.toml
```

---

## 👨‍💻 Author

**Prashant Kumar**
📧 [inboxprashantkumar@gmail.com](mailto:inboxprashantkumar@gmail.com)
🐙 [github.com/inboxprashant](https://github.com/inboxprashant)

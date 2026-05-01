-- ============================================================
--  TaskFlow — Database Schema (MySQL)
--  Entity Relationship:
--
--  User ──< ProjectMember >── Project
--  User ──< Task (as assignee)
--  User ──< Task (as creator)
--  Project ──< Task
--
--  User        : id, name, email, password
--  Project     : id, name, description, ownerId → User
--  ProjectMember: userId → User, projectId → Project, role
--  Task        : id, title, status, priority, dueDate,
--                projectId → Project, creatorId → User, assigneeId → User
-- ============================================================

CREATE TABLE IF NOT EXISTS User (
  id        INT          AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(255) NOT NULL,
  email     VARCHAR(255) NOT NULL UNIQUE,
  password  VARCHAR(255) NOT NULL,
  createdAt DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── Project ──────────────────────────────────────────────────
-- Each project is owned by one User (ownerId)
-- One User can own many Projects  →  User 1──< Project

CREATE TABLE IF NOT EXISTS Project (
  id          INT          AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  ownerId     INT          NOT NULL,
  createdAt   DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updatedAt   DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_project_owner
    FOREIGN KEY (ownerId) REFERENCES User(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ── ProjectMember ─────────────────────────────────────────────
-- Junction table: User <──> Project  (many-to-many)
-- role: ADMIN | MEMBER
-- One User can be in many Projects; one Project has many Users

CREATE TABLE IF NOT EXISTS ProjectMember (
  id        INT      AUTO_INCREMENT PRIMARY KEY,
  userId    INT      NOT NULL,
  projectId INT      NOT NULL,
  role      ENUM('ADMIN','MEMBER') NOT NULL DEFAULT 'MEMBER',
  joinedAt  DATETIME DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uq_user_project (userId, projectId),

  CONSTRAINT fk_member_user
    FOREIGN KEY (userId)    REFERENCES User(id)    ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT fk_member_project
    FOREIGN KEY (projectId) REFERENCES Project(id) ON DELETE CASCADE  ON UPDATE CASCADE
);

-- ── Task ──────────────────────────────────────────────────────
-- Belongs to one Project           →  Project 1──< Task
-- Created by one User (creatorId)  →  User 1──< Task (creator)
-- Optionally assigned to one User  →  User 1──< Task (assignee, nullable)

CREATE TABLE IF NOT EXISTS Task (
  id          INT      AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  status      ENUM('TODO','IN_PROGRESS','DONE') NOT NULL DEFAULT 'TODO',
  priority    ENUM('LOW','MEDIUM','HIGH')        NOT NULL DEFAULT 'MEDIUM',
  dueDate     DATETIME,
  projectId   INT      NOT NULL,
  creatorId   INT      NOT NULL,
  assigneeId  INT,
  createdAt   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_task_project
    FOREIGN KEY (projectId)  REFERENCES Project(id) ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT fk_task_creator
    FOREIGN KEY (creatorId)  REFERENCES User(id)    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_task_assignee
    FOREIGN KEY (assigneeId) REFERENCES User(id)    ON DELETE SET NULL ON UPDATE CASCADE
);

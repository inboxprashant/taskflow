const pool = require('./db');

/**
 * Entity Relationships
 * ─────────────────────────────────────────────────────────────
 *
 *  User 1 ──────────────────────────────────< Project
 *         (ownerId)  one user owns many projects
 *
 *  User >──── ProjectMember ────< Project
 *         many-to-many via junction table
 *         role: ADMIN | MEMBER
 *
 *  Project 1 ───────────────────────────────< Task
 *            one project has many tasks
 *
 *  User 1 ───────────────────────────────── Task (creatorId)
 *         one user creates many tasks
 *
 *  User 1 ───────────────────────────────── Task (assigneeId, nullable)
 *         one user can be assigned many tasks
 *
 * ─────────────────────────────────────────────────────────────
 *  Cascade rules:
 *   - Delete Project  → deletes all its Tasks and ProjectMembers
 *   - Delete User     → deletes their ProjectMemberships
 *                       sets assigneeId = NULL on their tasks
 *                       RESTRICTS deletion if they own a project
 * ─────────────────────────────────────────────────────────────
 */

async function initDB() {
  const conn = await pool.getConnection();
  try {
    // ── User ──────────────────────────────────────────────────
    await conn.query(`
      CREATE TABLE IF NOT EXISTS User (
        id        INT          AUTO_INCREMENT PRIMARY KEY,
        name      VARCHAR(255) NOT NULL,
        email     VARCHAR(255) NOT NULL UNIQUE,
        password  VARCHAR(255) NOT NULL,
        createdAt DATETIME     DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── Project ───────────────────────────────────────────────
    // Relation: User 1──< Project  (ownerId → User.id)
    await conn.query(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── ProjectMember ─────────────────────────────────────────
    // Relation: User >──< Project  (many-to-many junction)
    // userId    → User.id    (CASCADE delete: remove memberships when user deleted)
    // projectId → Project.id (CASCADE delete: remove memberships when project deleted)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS ProjectMember (
        id        INT      AUTO_INCREMENT PRIMARY KEY,
        userId    INT      NOT NULL,
        projectId INT      NOT NULL,
        role      ENUM('ADMIN','MEMBER') NOT NULL DEFAULT 'MEMBER',
        joinedAt  DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_user_project (userId, projectId),
        CONSTRAINT fk_member_user
          FOREIGN KEY (userId)    REFERENCES User(id)    ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_member_project
          FOREIGN KEY (projectId) REFERENCES Project(id) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ── Task ──────────────────────────────────────────────────
    // Relation: Project 1──< Task  (projectId → Project.id, CASCADE)
    // Relation: User 1──< Task     (creatorId → User.id, RESTRICT)
    // Relation: User 1──< Task     (assigneeId → User.id, SET NULL — optional)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS Task (
        id          INT      AUTO_INCREMENT PRIMARY KEY,
        title       VARCHAR(255) NOT NULL,
        description TEXT,
        status      ENUM('TODO','IN_PROGRESS','DONE') NOT NULL DEFAULT 'TODO',
        priority    ENUM('LOW','MEDIUM','HIGH')        NOT NULL DEFAULT 'MEDIUM',
        dueDate     DATETIME,
        projectId   INT      NOT NULL,
        creatorId   INT      NOT NULL,
        assigneeId  INT      DEFAULT NULL,
        createdAt   DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_task_project
          FOREIGN KEY (projectId)  REFERENCES Project(id) ON DELETE CASCADE  ON UPDATE CASCADE,
        CONSTRAINT fk_task_creator
          FOREIGN KEY (creatorId)  REFERENCES User(id)    ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT fk_task_assignee
          FOREIGN KEY (assigneeId) REFERENCES User(id)    ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Database tables ready');
  } finally {
    conn.release();
  }
}

module.exports = initDB;

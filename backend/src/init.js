const pool = require('./db');

async function initDB() {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS User (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS Project (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        ownerId INT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (ownerId) REFERENCES User(id)
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS ProjectMember (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        projectId INT NOT NULL,
        role ENUM('ADMIN','MEMBER') NOT NULL DEFAULT 'MEMBER',
        joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_user_project (userId, projectId),
        FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
        FOREIGN KEY (projectId) REFERENCES Project(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS Task (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status ENUM('TODO','IN_PROGRESS','DONE') NOT NULL DEFAULT 'TODO',
        priority ENUM('LOW','MEDIUM','HIGH') NOT NULL DEFAULT 'MEDIUM',
        dueDate DATETIME,
        projectId INT NOT NULL,
        assigneeId INT,
        creatorId INT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (projectId) REFERENCES Project(id) ON DELETE CASCADE,
        FOREIGN KEY (assigneeId) REFERENCES User(id) ON DELETE SET NULL,
        FOREIGN KEY (creatorId) REFERENCES User(id)
      )
    `);

    console.log('✅ Database tables ready');
  } finally {
    conn.release();
  }
}

module.exports = initDB;

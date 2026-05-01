const express = require('express');
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  const userId = req.user.id;
  const now = new Date();

  try {
    const [memberships] = await pool.query(
      'SELECT projectId, role FROM ProjectMember WHERE userId = ?',
      [userId]
    );
    const projectIds = memberships.map((m) => m.projectId);

    if (!projectIds.length) {
      return res.json({
        stats: { totalProjects: 0, totalTasks: 0, todoTasks: 0, inProgressTasks: 0, doneTasks: 0, overdueTasks: 0, myAssignedTasks: 0 },
        recentAssignedTasks: [],
        overdueTasksList: [],
      });
    }

    const placeholders = projectIds.map(() => '?').join(',');

    const [[{ totalTasks }]] = await pool.query(
      `SELECT COUNT(*) AS totalTasks FROM Task WHERE projectId IN (${placeholders})`, projectIds
    );
    const [[{ todoTasks }]] = await pool.query(
      `SELECT COUNT(*) AS todoTasks FROM Task WHERE projectId IN (${placeholders}) AND status='TODO'`, projectIds
    );
    const [[{ inProgressTasks }]] = await pool.query(
      `SELECT COUNT(*) AS inProgressTasks FROM Task WHERE projectId IN (${placeholders}) AND status='IN_PROGRESS'`, projectIds
    );
    const [[{ doneTasks }]] = await pool.query(
      `SELECT COUNT(*) AS doneTasks FROM Task WHERE projectId IN (${placeholders}) AND status='DONE'`, projectIds
    );
    const [[{ overdueTasks }]] = await pool.query(
      `SELECT COUNT(*) AS overdueTasks FROM Task WHERE projectId IN (${placeholders}) AND status != 'DONE' AND dueDate < ?`,
      [...projectIds, now]
    );
    const [[{ myAssignedTasks }]] = await pool.query(
      `SELECT COUNT(*) AS myAssignedTasks FROM Task WHERE assigneeId = ? AND status != 'DONE'`, [userId]
    );

    const [recentAssignedTasks] = await pool.query(
      `SELECT t.id, t.title, t.status, t.priority, t.dueDate,
              p.id AS projectId, p.name AS projectName
       FROM Task t JOIN Project p ON p.id = t.projectId
       WHERE t.assigneeId = ?
       ORDER BY t.updatedAt DESC LIMIT 5`,
      [userId]
    );

    const [overdueTasksList] = await pool.query(
      `SELECT t.id, t.title, t.priority, t.dueDate,
              p.id AS projectId, p.name AS projectName,
              a.id AS assigneeId, a.name AS assigneeName
       FROM Task t
       JOIN Project p ON p.id = t.projectId
       LEFT JOIN User a ON a.id = t.assigneeId
       WHERE t.projectId IN (${placeholders}) AND t.status != 'DONE' AND t.dueDate < ?
       ORDER BY t.dueDate ASC LIMIT 10`,
      [...projectIds, now]
    );

    res.json({
      stats: {
        totalProjects: projectIds.length,
        totalTasks, todoTasks, inProgressTasks, doneTasks, overdueTasks, myAssignedTasks,
      },
      recentAssignedTasks: recentAssignedTasks.map((t) => ({
        id: t.id, title: t.title, status: t.status, priority: t.priority, dueDate: t.dueDate,
        project: { id: t.projectId, name: t.projectName },
      })),
      overdueTasksList: overdueTasksList.map((t) => ({
        id: t.id, title: t.title, priority: t.priority, dueDate: t.dueDate,
        project: { id: t.projectId, name: t.projectName },
        assignee: t.assigneeId ? { id: t.assigneeId, name: t.assigneeName } : null,
      })),
    });
  } catch (err) { next(err); }
});

module.exports = router;

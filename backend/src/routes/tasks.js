const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../db');
const { authenticate, requireProjectAdmin, requireProjectMember } = require('../middleware/auth');

const router = express.Router();

function formatTask(t) {
  return {
    id: t.id, title: t.title, description: t.description,
    status: t.status, priority: t.priority, dueDate: t.dueDate,
    createdAt: t.createdAt, updatedAt: t.updatedAt,
    projectId: t.projectId, creatorId: t.creatorId, assigneeId: t.assigneeId,
    assignee: t.assigneeId ? { id: t.assigneeId, name: t.assigneeName, email: t.assigneeEmail } : null,
    creator: { id: t.creatorId, name: t.creatorName, email: t.creatorEmail },
  };
}

// GET /api/tasks/:projectId
router.get('/:projectId', authenticate, requireProjectMember, async (req, res, next) => {
  const projectId = parseInt(req.params.projectId);
  const { status, priority, assigneeId } = req.query;

  let sql = `SELECT t.*,
    a.id AS assigneeId, a.name AS assigneeName, a.email AS assigneeEmail,
    c.id AS creatorId, c.name AS creatorName, c.email AS creatorEmail
   FROM Task t
   LEFT JOIN User a ON a.id = t.assigneeId
   JOIN User c ON c.id = t.creatorId
   WHERE t.projectId = ?`;
  const params = [projectId];

  if (status) { sql += ' AND t.status = ?'; params.push(status); }
  if (priority) { sql += ' AND t.priority = ?'; params.push(priority); }
  if (assigneeId) { sql += ' AND t.assigneeId = ?'; params.push(parseInt(assigneeId)); }
  sql += ' ORDER BY t.createdAt DESC';

  try {
    const [rows] = await pool.query(sql, params);
    res.json(rows.map(formatTask));
  } catch (err) { next(err); }
});

// POST /api/tasks/:projectId
router.post('/:projectId', authenticate, requireProjectAdmin,
  [
    body('title').trim().notEmpty().withMessage('Task title is required'),
    body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'DONE']),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH']),
    body('dueDate').optional().isISO8601(),
    body('assigneeId').optional().isInt(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const projectId = parseInt(req.params.projectId);
    const { title, description, status = 'TODO', priority = 'MEDIUM', dueDate, assigneeId } = req.body;

    try {
      if (assigneeId) {
        const [m] = await pool.query(
          'SELECT id FROM ProjectMember WHERE userId = ? AND projectId = ?',
          [parseInt(assigneeId), projectId]
        );
        if (!m.length) return res.status(400).json({ message: 'Assignee must be a member of this project' });
      }

      const [result] = await pool.query(
        `INSERT INTO Task (title, description, status, priority, dueDate, projectId, creatorId, assigneeId)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [title, description || null, status, priority, dueDate || null, projectId, req.user.id, assigneeId || null]
      );

      const [[task]] = await pool.query(
        `SELECT t.*, a.id AS assigneeId, a.name AS assigneeName, a.email AS assigneeEmail,
                c.id AS creatorId, c.name AS creatorName, c.email AS creatorEmail
         FROM Task t LEFT JOIN User a ON a.id=t.assigneeId JOIN User c ON c.id=t.creatorId
         WHERE t.id = ?`,
        [result.insertId]
      );
      res.status(201).json(formatTask(task));
    } catch (err) { next(err); }
  }
);

// PUT /api/tasks/:projectId/:taskId
router.put('/:projectId/:taskId', authenticate, requireProjectMember,
  [
    body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'DONE']),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH']),
    body('dueDate').optional().isISO8601(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const projectId = parseInt(req.params.projectId);
    const taskId = parseInt(req.params.taskId);
    const isAdmin = req.projectMember.role === 'ADMIN';
    const { title, description, status, priority, dueDate, assigneeId } = req.body;

    const fields = [];
    const values = [];

    if (status) { fields.push('status = ?'); values.push(status); }

    if (isAdmin) {
      if (title) { fields.push('title = ?'); values.push(title); }
      if (description !== undefined) { fields.push('description = ?'); values.push(description); }
      if (priority) { fields.push('priority = ?'); values.push(priority); }
      if (dueDate !== undefined) { fields.push('dueDate = ?'); values.push(dueDate || null); }
      if (assigneeId !== undefined) {
        if (assigneeId) {
          const [m] = await pool.query(
            'SELECT id FROM ProjectMember WHERE userId = ? AND projectId = ?',
            [parseInt(assigneeId), projectId]
          );
          if (!m.length) return res.status(400).json({ message: 'Assignee must be a member of this project' });
        }
        fields.push('assigneeId = ?');
        values.push(assigneeId || null);
      }
    }

    if (!fields.length) return res.status(400).json({ message: 'Nothing to update' });
    values.push(taskId);

    try {
      await pool.query(`UPDATE Task SET ${fields.join(', ')} WHERE id = ?`, values);
      const [[task]] = await pool.query(
        `SELECT t.*, a.id AS assigneeId, a.name AS assigneeName, a.email AS assigneeEmail,
                c.id AS creatorId, c.name AS creatorName, c.email AS creatorEmail
         FROM Task t LEFT JOIN User a ON a.id=t.assigneeId JOIN User c ON c.id=t.creatorId
         WHERE t.id = ?`,
        [taskId]
      );
      res.json(formatTask(task));
    } catch (err) { next(err); }
  }
);

// DELETE /api/tasks/:projectId/:taskId
router.delete('/:projectId/:taskId', authenticate, requireProjectAdmin, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM Task WHERE id = ?', [parseInt(req.params.taskId)]);
    res.json({ message: 'Task deleted successfully' });
  } catch (err) { next(err); }
});

module.exports = router;

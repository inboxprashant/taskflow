const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../db');
const { authenticate, requireProjectAdmin, requireProjectMember } = require('../middleware/auth');

const router = express.Router();

// GET /api/projects
router.get('/', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, pm.role AS myRole,
              u.id AS ownerId, u.name AS ownerName, u.email AS ownerEmail,
              (SELECT COUNT(*) FROM ProjectMember WHERE projectId = p.id) AS memberCount,
              (SELECT COUNT(*) FROM Task WHERE projectId = p.id) AS taskCount
       FROM ProjectMember pm
       JOIN Project p ON p.id = pm.projectId
       JOIN User u ON u.id = p.ownerId
       WHERE pm.userId = ?
       ORDER BY p.createdAt DESC`,
      [req.user.id]
    );

    const projects = rows.map((r) => ({
      id: r.id, name: r.name, description: r.description,
      createdAt: r.createdAt, updatedAt: r.updatedAt,
      myRole: r.myRole,
      owner: { id: r.ownerId, name: r.ownerName, email: r.ownerEmail },
      _count: { members: r.memberCount, tasks: r.taskCount },
    }));

    res.json(projects);
  } catch (err) { next(err); }
});

// POST /api/projects
router.post('/', authenticate,
  [body('name').trim().notEmpty().withMessage('Project name is required')],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, description } = req.body;
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [result] = await conn.query(
        'INSERT INTO Project (name, description, ownerId) VALUES (?, ?, ?)',
        [name, description || null, req.user.id]
      );
      const projectId = result.insertId;
      await conn.query(
        'INSERT INTO ProjectMember (userId, projectId, role) VALUES (?, ?, ?)',
        [req.user.id, projectId, 'ADMIN']
      );
      await conn.commit();

      res.status(201).json({
        id: projectId, name, description: description || null,
        myRole: 'ADMIN',
        owner: { id: req.user.id, name: req.user.name, email: req.user.email },
        _count: { members: 1, tasks: 0 },
      });
    } catch (err) {
      await conn.rollback();
      next(err);
    } finally { conn.release(); }
  }
);

// GET /api/projects/:projectId
router.get('/:projectId', authenticate, requireProjectMember, async (req, res, next) => {
  const projectId = parseInt(req.params.projectId);
  try {
    const [[project]] = await pool.query(
      `SELECT p.*, u.id AS ownerId, u.name AS ownerName, u.email AS ownerEmail
       FROM Project p JOIN User u ON u.id = p.ownerId WHERE p.id = ?`,
      [projectId]
    );
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const [members] = await pool.query(
      `SELECT pm.*, u.id AS userId, u.name AS userName, u.email AS userEmail
       FROM ProjectMember pm JOIN User u ON u.id = pm.userId WHERE pm.projectId = ?`,
      [projectId]
    );

    const [tasks] = await pool.query(
      `SELECT t.*,
        a.id AS assigneeId, a.name AS assigneeName, a.email AS assigneeEmail,
        c.id AS creatorId, c.name AS creatorName, c.email AS creatorEmail
       FROM Task t
       LEFT JOIN User a ON a.id = t.assigneeId
       JOIN User c ON c.id = t.creatorId
       WHERE t.projectId = ?
       ORDER BY t.createdAt DESC`,
      [projectId]
    );

    res.json({
      id: project.id, name: project.name, description: project.description,
      createdAt: project.createdAt, updatedAt: project.updatedAt,
      ownerId: project.ownerId,
      myRole: req.projectMember.role,
      owner: { id: project.ownerId, name: project.ownerName, email: project.ownerEmail },
      members: members.map((m) => ({
        id: m.id, role: m.role, joinedAt: m.joinedAt, userId: m.userId,
        user: { id: m.userId, name: m.userName, email: m.userEmail },
      })),
      tasks: tasks.map((t) => ({
        id: t.id, title: t.title, description: t.description,
        status: t.status, priority: t.priority, dueDate: t.dueDate,
        createdAt: t.createdAt, updatedAt: t.updatedAt,
        projectId: t.projectId, creatorId: t.creatorId, assigneeId: t.assigneeId,
        assignee: t.assigneeId ? { id: t.assigneeId, name: t.assigneeName, email: t.assigneeEmail } : null,
        creator: { id: t.creatorId, name: t.creatorName, email: t.creatorEmail },
      })),
    });
  } catch (err) { next(err); }
});

// PUT /api/projects/:projectId
router.put('/:projectId', authenticate, requireProjectAdmin,
  [body('name').optional().trim().notEmpty()],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const projectId = parseInt(req.params.projectId);
    const { name, description } = req.body;
    const fields = [];
    const values = [];
    if (name) { fields.push('name = ?'); values.push(name); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (!fields.length) return res.status(400).json({ message: 'Nothing to update' });
    values.push(projectId);

    try {
      await pool.query(`UPDATE Project SET ${fields.join(', ')} WHERE id = ?`, values);
      const [[p]] = await pool.query(
        `SELECT p.*, u.id AS ownerId, u.name AS ownerName, u.email AS ownerEmail,
                (SELECT COUNT(*) FROM ProjectMember WHERE projectId=p.id) AS memberCount,
                (SELECT COUNT(*) FROM Task WHERE projectId=p.id) AS taskCount
         FROM Project p JOIN User u ON u.id=p.ownerId WHERE p.id=?`, [projectId]
      );
      res.json({
        id: p.id, name: p.name, description: p.description,
        owner: { id: p.ownerId, name: p.ownerName, email: p.ownerEmail },
        _count: { members: p.memberCount, tasks: p.taskCount },
      });
    } catch (err) { next(err); }
  }
);

// DELETE /api/projects/:projectId
router.delete('/:projectId', authenticate, requireProjectAdmin, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM Project WHERE id = ?', [parseInt(req.params.projectId)]);
    res.json({ message: 'Project deleted successfully' });
  } catch (err) { next(err); }
});

module.exports = router;

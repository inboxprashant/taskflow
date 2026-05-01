const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../db');
const { authenticate, requireProjectAdmin, requireProjectMember } = require('../middleware/auth');

const router = express.Router();

// GET /api/members/:projectId
router.get('/:projectId', authenticate, requireProjectMember, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT pm.*, u.id AS userId, u.name AS userName, u.email AS userEmail
       FROM ProjectMember pm JOIN User u ON u.id = pm.userId
       WHERE pm.projectId = ?`,
      [parseInt(req.params.projectId)]
    );
    res.json(rows.map((m) => ({
      id: m.id, role: m.role, joinedAt: m.joinedAt, userId: m.userId,
      user: { id: m.userId, name: m.userName, email: m.userEmail },
    })));
  } catch (err) { next(err); }
});

// POST /api/members/:projectId
router.post('/:projectId', authenticate, requireProjectAdmin,
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('role').optional().isIn(['ADMIN', 'MEMBER']),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const projectId = parseInt(req.params.projectId);
    const { email, role = 'MEMBER' } = req.body;

    try {
      const [users] = await pool.query('SELECT id, name, email FROM User WHERE email = ?', [email]);
      if (!users.length) return res.status(404).json({ message: 'User with this email not found' });

      const userToAdd = users[0];
      const [existing] = await pool.query(
        'SELECT id FROM ProjectMember WHERE userId = ? AND projectId = ?',
        [userToAdd.id, projectId]
      );
      if (existing.length) return res.status(409).json({ message: 'User is already a member of this project' });

      const [result] = await pool.query(
        'INSERT INTO ProjectMember (userId, projectId, role) VALUES (?, ?, ?)',
        [userToAdd.id, projectId, role]
      );
      res.status(201).json({
        id: result.insertId, role, userId: userToAdd.id,
        user: { id: userToAdd.id, name: userToAdd.name, email: userToAdd.email },
      });
    } catch (err) { next(err); }
  }
);

// PUT /api/members/:projectId/:userId
router.put('/:projectId/:userId', authenticate, requireProjectAdmin,
  [body('role').isIn(['ADMIN', 'MEMBER'])],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const projectId = parseInt(req.params.projectId);
    const userId = parseInt(req.params.userId);
    const { role } = req.body;

    try {
      await pool.query(
        'UPDATE ProjectMember SET role = ? WHERE userId = ? AND projectId = ?',
        [role, userId, projectId]
      );
      const [users] = await pool.query('SELECT id, name, email FROM User WHERE id = ?', [userId]);
      res.json({ role, userId, user: users[0] });
    } catch (err) { next(err); }
  }
);

// DELETE /api/members/:projectId/:userId
router.delete('/:projectId/:userId', authenticate, requireProjectAdmin, async (req, res, next) => {
  const projectId = parseInt(req.params.projectId);
  const userId = parseInt(req.params.userId);

  try {
    const [[project]] = await pool.query('SELECT ownerId FROM Project WHERE id = ?', [projectId]);
    if (project.ownerId === userId) {
      return res.status(400).json({ message: 'Cannot remove the project owner' });
    }
    await pool.query('DELETE FROM ProjectMember WHERE userId = ? AND projectId = ?', [userId, projectId]);
    res.json({ message: 'Member removed successfully' });
  } catch (err) { next(err); }
});

module.exports = router;

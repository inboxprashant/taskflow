const jwt = require('jsonwebtoken');
const pool = require('../db');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await pool.query('SELECT id, name, email FROM User WHERE id = ?', [decoded.userId]);
    if (!rows.length) return res.status(401).json({ message: 'User not found' });
    req.user = rows[0];
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const requireProjectAdmin = async (req, res, next) => {
  const projectId = parseInt(req.params.projectId || req.body.projectId);
  const userId = req.user.id;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM ProjectMember WHERE userId = ? AND projectId = ?',
      [userId, projectId]
    );
    if (!rows.length || rows[0].role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access required for this project' });
    }
    req.projectMember = rows[0];
    next();
  } catch (err) {
    next(err);
  }
};

const requireProjectMember = async (req, res, next) => {
  const projectId = parseInt(req.params.projectId || req.body.projectId);
  const userId = req.user.id;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM ProjectMember WHERE userId = ? AND projectId = ?',
      [userId, projectId]
    );
    if (!rows.length) {
      return res.status(403).json({ message: 'You are not a member of this project' });
    }
    req.projectMember = rows[0];
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authenticate, requireProjectAdmin, requireProjectMember };

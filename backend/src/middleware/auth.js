const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Check if user is ADMIN of a specific project
const requireProjectAdmin = async (req, res, next) => {
  const projectId = parseInt(req.params.projectId || req.body.projectId);
  const userId = req.user.id;

  try {
    const member = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId } },
    });

    if (!member || member.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access required for this project' });
    }

    req.projectMember = member;
    next();
  } catch (err) {
    next(err);
  }
};

// Check if user is a member of a specific project
const requireProjectMember = async (req, res, next) => {
  const projectId = parseInt(req.params.projectId || req.body.projectId);
  const userId = req.user.id;

  try {
    const member = await prisma.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId } },
    });

    if (!member) {
      return res.status(403).json({ message: 'You are not a member of this project' });
    }

    req.projectMember = member;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authenticate, requireProjectAdmin, requireProjectMember };

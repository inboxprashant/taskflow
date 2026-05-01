const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireProjectAdmin, requireProjectMember } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/members/:projectId - list members of a project
router.get('/:projectId', authenticate, requireProjectMember, async (req, res, next) => {
  const projectId = parseInt(req.params.projectId);

  try {
    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    res.json(members);
  } catch (err) {
    next(err);
  }
});

// POST /api/members/:projectId - add member to project (admin only)
router.post(
  '/:projectId',
  authenticate,
  requireProjectAdmin,
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('role').optional().isIn(['ADMIN', 'MEMBER']).withMessage('Role must be ADMIN or MEMBER'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const projectId = parseInt(req.params.projectId);
    const { email, role = 'MEMBER' } = req.body;

    try {
      const userToAdd = await prisma.user.findUnique({ where: { email } });
      if (!userToAdd) {
        return res.status(404).json({ message: 'User with this email not found' });
      }

      const existing = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: userToAdd.id, projectId } },
      });

      if (existing) {
        return res.status(409).json({ message: 'User is already a member of this project' });
      }

      const member = await prisma.projectMember.create({
        data: { userId: userToAdd.id, projectId, role },
        include: { user: { select: { id: true, name: true, email: true } } },
      });

      res.status(201).json(member);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/members/:projectId/:userId - update member role (admin only)
router.put(
  '/:projectId/:userId',
  authenticate,
  requireProjectAdmin,
  [body('role').isIn(['ADMIN', 'MEMBER']).withMessage('Role must be ADMIN or MEMBER')],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const projectId = parseInt(req.params.projectId);
    const userId = parseInt(req.params.userId);
    const { role } = req.body;

    try {
      const member = await prisma.projectMember.update({
        where: { userId_projectId: { userId, projectId } },
        data: { role },
        include: { user: { select: { id: true, name: true, email: true } } },
      });

      res.json(member);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/members/:projectId/:userId - remove member (admin only)
router.delete('/:projectId/:userId', authenticate, requireProjectAdmin, async (req, res, next) => {
  const projectId = parseInt(req.params.projectId);
  const userId = parseInt(req.params.userId);

  // Prevent removing the project owner
  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (project.ownerId === userId) {
      return res.status(400).json({ message: 'Cannot remove the project owner' });
    }

    await prisma.projectMember.delete({
      where: { userId_projectId: { userId, projectId } },
    });

    res.json({ message: 'Member removed successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

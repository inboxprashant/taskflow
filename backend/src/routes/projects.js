const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireProjectAdmin, requireProjectMember } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/projects - list all projects for current user
router.get('/', authenticate, async (req, res, next) => {
  try {
    const memberships = await prisma.projectMember.findMany({
      where: { userId: req.user.id },
      include: {
        project: {
          include: {
            owner: { select: { id: true, name: true, email: true } },
            _count: { select: { members: true, tasks: true } },
          },
        },
      },
    });

    const projects = memberships.map((m) => ({
      ...m.project,
      myRole: m.role,
    }));

    res.json(projects);
  } catch (err) {
    next(err);
  }
});

// POST /api/projects - create a project
router.post(
  '/',
  authenticate,
  [
    body('name').trim().notEmpty().withMessage('Project name is required'),
    body('description').optional().trim(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;

    try {
      const project = await prisma.project.create({
        data: {
          name,
          description,
          ownerId: req.user.id,
          members: {
            create: { userId: req.user.id, role: 'ADMIN' },
          },
        },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          _count: { select: { members: true, tasks: true } },
        },
      });

      res.status(201).json({ ...project, myRole: 'ADMIN' });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/projects/:projectId - get single project
router.get('/:projectId', authenticate, requireProjectMember, async (req, res, next) => {
  const projectId = parseInt(req.params.projectId);

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true } },
            creator: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    res.json({ ...project, myRole: req.projectMember.role });
  } catch (err) {
    next(err);
  }
});

// PUT /api/projects/:projectId - update project (admin only)
router.put(
  '/:projectId',
  authenticate,
  requireProjectAdmin,
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('description').optional().trim(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const projectId = parseInt(req.params.projectId);
    const { name, description } = req.body;

    try {
      const project = await prisma.project.update({
        where: { id: projectId },
        data: { ...(name && { name }), ...(description !== undefined && { description }) },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          _count: { select: { members: true, tasks: true } },
        },
      });

      res.json(project);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/projects/:projectId - delete project (admin only)
router.delete('/:projectId', authenticate, requireProjectAdmin, async (req, res, next) => {
  const projectId = parseInt(req.params.projectId);

  try {
    await prisma.project.delete({ where: { id: projectId } });
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireProjectAdmin, requireProjectMember } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Helper to check project membership inline
async function getProjectMember(userId, projectId) {
  return prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
  });
}

// GET /api/tasks/:projectId - list tasks for a project
router.get('/:projectId', authenticate, requireProjectMember, async (req, res, next) => {
  const projectId = parseInt(req.params.projectId);
  const { status, priority, assigneeId } = req.query;

  const where = { projectId };
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (assigneeId) where.assigneeId = parseInt(assigneeId);

  try {
    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

// POST /api/tasks/:projectId - create a task (admin only)
router.post(
  '/:projectId',
  authenticate,
  requireProjectAdmin,
  [
    body('title').trim().notEmpty().withMessage('Task title is required'),
    body('description').optional().trim(),
    body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'DONE']),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH']),
    body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
    body('assigneeId').optional().isInt(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const projectId = parseInt(req.params.projectId);
    const { title, description, status, priority, dueDate, assigneeId } = req.body;

    try {
      // Validate assignee is a project member
      if (assigneeId) {
        const assigneeMember = await getProjectMember(parseInt(assigneeId), projectId);
        if (!assigneeMember) {
          return res.status(400).json({ message: 'Assignee must be a member of this project' });
        }
      }

      const task = await prisma.task.create({
        data: {
          title,
          description,
          status: status || 'TODO',
          priority: priority || 'MEDIUM',
          dueDate: dueDate ? new Date(dueDate) : null,
          projectId,
          creatorId: req.user.id,
          assigneeId: assigneeId ? parseInt(assigneeId) : null,
        },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true, email: true } },
        },
      });

      res.status(201).json(task);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/tasks/:projectId/:taskId - update a task
router.put(
  '/:projectId/:taskId',
  authenticate,
  requireProjectMember,
  [
    body('title').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'DONE']),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH']),
    body('dueDate').optional().isISO8601(),
    body('assigneeId').optional({ nullable: true }).isInt(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const projectId = parseInt(req.params.projectId);
    const taskId = parseInt(req.params.taskId);
    const { title, description, status, priority, dueDate, assigneeId } = req.body;

    try {
      // Members can only update status; admins can update everything
      const isAdmin = req.projectMember.role === 'ADMIN';

      const updateData = {};
      if (status) updateData.status = status;

      if (isAdmin) {
        if (title) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (priority) updateData.priority = priority;
        if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
        if (assigneeId !== undefined) {
          if (assigneeId) {
            const assigneeMember = await getProjectMember(parseInt(assigneeId), projectId);
            if (!assigneeMember) {
              return res.status(400).json({ message: 'Assignee must be a member of this project' });
            }
          }
          updateData.assigneeId = assigneeId ? parseInt(assigneeId) : null;
        }
      }

      const task = await prisma.task.update({
        where: { id: taskId },
        data: updateData,
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true, email: true } },
        },
      });

      res.json(task);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/tasks/:projectId/:taskId - delete a task (admin only)
router.delete(
  '/:projectId/:taskId',
  authenticate,
  requireProjectAdmin,
  async (req, res, next) => {
    const taskId = parseInt(req.params.taskId);

    try {
      await prisma.task.delete({ where: { id: taskId } });
      res.json({ message: 'Task deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;

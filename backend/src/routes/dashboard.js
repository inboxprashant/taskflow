const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/dashboard - get dashboard stats for current user
router.get('/', authenticate, async (req, res, next) => {
  const userId = req.user.id;
  const now = new Date();

  try {
    // Get all projects the user is a member of
    const memberships = await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true, role: true },
    });

    const projectIds = memberships.map((m) => m.projectId);

    // Task stats across all user's projects
    const [totalTasks, todoTasks, inProgressTasks, doneTasks, overdueTasks, myAssignedTasks] =
      await Promise.all([
        prisma.task.count({ where: { projectId: { in: projectIds } } }),
        prisma.task.count({ where: { projectId: { in: projectIds }, status: 'TODO' } }),
        prisma.task.count({ where: { projectId: { in: projectIds }, status: 'IN_PROGRESS' } }),
        prisma.task.count({ where: { projectId: { in: projectIds }, status: 'DONE' } }),
        prisma.task.count({
          where: {
            projectId: { in: projectIds },
            status: { not: 'DONE' },
            dueDate: { lt: now },
          },
        }),
        prisma.task.count({
          where: { assigneeId: userId, status: { not: 'DONE' } },
        }),
      ]);

    // Recent tasks assigned to me
    const recentAssignedTasks = await prisma.task.findMany({
      where: { assigneeId: userId },
      include: {
        project: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    });

    // Overdue tasks details
    const overdueTasksList = await prisma.task.findMany({
      where: {
        projectId: { in: projectIds },
        status: { not: 'DONE' },
        dueDate: { lt: now },
      },
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
    });

    res.json({
      stats: {
        totalProjects: projectIds.length,
        totalTasks,
        todoTasks,
        inProgressTasks,
        doneTasks,
        overdueTasks,
        myAssignedTasks,
      },
      recentAssignedTasks,
      overdueTasksList,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

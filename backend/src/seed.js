const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create users
  const adminPassword = await bcrypt.hash('password123', 10);
  const memberPassword = await bcrypt.hash('password123', 10);

  const alice = await prisma.user.upsert({
    where: { email: 'alice@demo.com' },
    update: {},
    create: { name: 'Alice Johnson', email: 'alice@demo.com', password: adminPassword },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@demo.com' },
    update: {},
    create: { name: 'Bob Smith', email: 'bob@demo.com', password: memberPassword },
  });

  const carol = await prisma.user.upsert({
    where: { email: 'carol@demo.com' },
    update: {},
    create: { name: 'Carol White', email: 'carol@demo.com', password: memberPassword },
  });

  // Create a project
  const project = await prisma.project.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Website Redesign',
      description: 'Redesign the company website with modern UI/UX',
      ownerId: alice.id,
      members: {
        create: [
          { userId: alice.id, role: 'ADMIN' },
          { userId: bob.id, role: 'MEMBER' },
          { userId: carol.id, role: 'MEMBER' },
        ],
      },
    },
  });

  // Create tasks
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  await prisma.task.createMany({
    skipDuplicates: true,
    data: [
      {
        title: 'Design homepage mockup',
        description: 'Create wireframes and mockups for the new homepage',
        status: 'DONE',
        priority: 'HIGH',
        projectId: project.id,
        creatorId: alice.id,
        assigneeId: carol.id,
        dueDate: yesterday,
      },
      {
        title: 'Set up project repository',
        description: 'Initialize Git repo and configure CI/CD pipeline',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        projectId: project.id,
        creatorId: alice.id,
        assigneeId: bob.id,
        dueDate: nextWeek,
      },
      {
        title: 'Write API documentation',
        description: 'Document all REST API endpoints using Swagger',
        status: 'TODO',
        priority: 'MEDIUM',
        projectId: project.id,
        creatorId: alice.id,
        assigneeId: bob.id,
        dueDate: nextWeek,
      },
      {
        title: 'Fix navigation bug',
        description: 'Mobile navigation menu not closing after selection',
        status: 'TODO',
        priority: 'HIGH',
        projectId: project.id,
        creatorId: bob.id,
        assigneeId: carol.id,
        dueDate: yesterday, // overdue
      },
      {
        title: 'Performance optimization',
        description: 'Improve page load times and optimize images',
        status: 'TODO',
        priority: 'LOW',
        projectId: project.id,
        creatorId: alice.id,
        assigneeId: null,
        dueDate: nextWeek,
      },
    ],
  });

  console.log('✅ Seed complete!');
  console.log('Demo accounts:');
  console.log('  Admin: alice@demo.com / password123');
  console.log('  Member: bob@demo.com / password123');
  console.log('  Member: carol@demo.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

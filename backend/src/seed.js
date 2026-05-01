const bcrypt = require('bcryptjs');
const pool = require('./db');

async function main() {
  console.log('Seeding database...');

  const hash = await bcrypt.hash('password123', 10);

  // Upsert users
  await pool.query(
    `INSERT INTO User (name, email, password) VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?)
     ON DUPLICATE KEY UPDATE name=VALUES(name)`,
    [
      'Alice Johnson', 'alice@demo.com', hash,
      'Bob Smith',     'bob@demo.com',   hash,
      'Carol White',   'carol@demo.com', hash,
    ]
  );

  const [[alice]] = await pool.query('SELECT id FROM User WHERE email = ?', ['alice@demo.com']);
  const [[bob]]   = await pool.query('SELECT id FROM User WHERE email = ?', ['bob@demo.com']);
  const [[carol]] = await pool.query('SELECT id FROM User WHERE email = ?', ['carol@demo.com']);

  // Create project if not exists
  let projectId;
  const [existing] = await pool.query('SELECT id FROM Project WHERE name = ? AND ownerId = ?', ['Website Redesign', alice.id]);
  if (existing.length) {
    projectId = existing[0].id;
  } else {
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    const [r] = await conn.query(
      'INSERT INTO Project (name, description, ownerId) VALUES (?, ?, ?)',
      ['Website Redesign', 'Redesign the company website with modern UI/UX', alice.id]
    );
    projectId = r.insertId;
    await conn.query(
      `INSERT IGNORE INTO ProjectMember (userId, projectId, role) VALUES (?, ?, 'ADMIN'), (?, ?, 'MEMBER'), (?, ?, 'MEMBER')`,
      [alice.id, projectId, bob.id, projectId, carol.id, projectId]
    );
    await conn.commit();
    conn.release();
  }

  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const nextWeek  = new Date(); nextWeek.setDate(nextWeek.getDate() + 7);

  await pool.query(
    `INSERT IGNORE INTO Task (title, description, status, priority, dueDate, projectId, creatorId, assigneeId) VALUES
     (?, ?, 'DONE',        'HIGH',   ?, ?, ?, ?),
     (?, ?, 'IN_PROGRESS', 'HIGH',   ?, ?, ?, ?),
     (?, ?, 'TODO',        'MEDIUM', ?, ?, ?, ?),
     (?, ?, 'TODO',        'HIGH',   ?, ?, ?, ?),
     (?, ?, 'TODO',        'LOW',    ?, ?, ?, ?)`,
    [
      'Design homepage mockup',    'Create wireframes and mockups', yesterday, projectId, alice.id, carol.id,
      'Set up project repository', 'Initialize Git repo',           nextWeek,  projectId, alice.id, bob.id,
      'Write API documentation',   'Document REST API endpoints',   nextWeek,  projectId, alice.id, bob.id,
      'Fix navigation bug',        'Mobile nav not closing',        yesterday, projectId, bob.id,   carol.id,
      'Performance optimization',  'Improve page load times',       nextWeek,  projectId, alice.id, null,
    ]
  );

  console.log('✅ Seed complete!');
  console.log('  Admin:  alice@demo.com / password123');
  console.log('  Member: bob@demo.com   / password123');
  console.log('  Member: carol@demo.com / password123');
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });

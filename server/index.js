import express from 'express';
import cors from 'cors';
import { initDb } from './db.js';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Large limit for Base64 profile pictures

let db;

// ── Seed Default Data ─────────────────────────────────────
async function seedDefaultData() {
  const fac = await db.get('SELECT id FROM facilitators WHERE id = ?', ['f001']);
  if (!fac) {
    await db.run(
      `INSERT INTO facilitators (id, firstName, lastName, email, password, role, department, contact, bio, avatarInitial)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['f001', 'Dr. Ana', 'Santos', 'facilitator@sysarch.edu', 'facilitator123',
       'facilitator', 'Guidance & Counseling', '09171234567',
       'Licensed guidance counselor with 10+ years of experience.', 'A']
    );
    console.log('✅ Seeded default facilitator.');
  }

  const sc = await db.get('SELECT COUNT(*) as n FROM students');
  if (sc.n === 0) {
    await db.run(
      `INSERT INTO students (id, firstName, lastName, age, email, password, schoolId, year, department, contact, role, avatarInitial)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'student', ?)`,
      ['s001', 'Juan', 'dela Cruz', '20', 'juan@gmail.com', 'student123', '2021-10001', '3rd Year', 'Computer Science', '09181234567', 'J']
    );
    await db.run(
      `INSERT INTO students (id, firstName, lastName, age, email, password, schoolId, year, department, contact, role, avatarInitial)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'student', ?)`,
      ['s002', 'Maria', 'Reyes', '19', 'maria@gmail.com', 'student123', '2022-10042', '2nd Year', 'Information Technology', '09191234567', 'M']
    );
    console.log('✅ Seeded demo students.');
  }

  const ac = await db.get('SELECT COUNT(*) as n FROM appointments');
  if (ac.n === 0) {
    await db.run(
      `INSERT INTO appointments (id, studentId, studentName, date, time, reason, status, sessions) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['a001', 's001', 'Juan dela Cruz', '2026-04-14', '09:00 AM', 'Academic concern', 'approved',
       JSON.stringify({ first: 'done', second: 'pending', final: 'inactive' })]
    );
    await db.run(
      `INSERT INTO appointments (id, studentId, studentName, date, time, reason, status, sessions) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['a002', 's002', 'Maria Reyes', '2026-04-16', '02:00 PM', 'Personal consultation', 'pending',
       JSON.stringify({ first: 'pending', second: 'inactive', final: 'inactive' })]
    );
    console.log('✅ Seeded demo appointments.');
  }

  const mc = await db.get('SELECT COUNT(*) as n FROM messages');
  if (mc.n === 0) {
    await db.run(`INSERT INTO messages (id, "from", "to", text, timestamp) VALUES (?, ?, ?, ?, ?)`,
      ['m001', 'f001', 's001', 'Hello Juan! Your first session appointment has been confirmed.', new Date(Date.now() - 3_600_000).toISOString()]);
    await db.run(`INSERT INTO messages (id, "from", "to", text, timestamp) VALUES (?, ?, ?, ?, ?)`,
      ['m002', 's001', 'f001', 'Thank you, doc! I will be there.', new Date(Date.now() - 1_800_000).toISOString()]);
    await db.run(`INSERT INTO messages (id, "from", "to", text, timestamp) VALUES (?, ?, ?, ?, ?)`,
      ['m003', 'f001', 's002', 'Hi Maria! Please confirm your appointment schedule.', new Date(Date.now() - 7_200_000).toISOString()]);
    console.log('✅ Seeded demo messages.');
  }
}

// ── Helpers ───────────────────────────────────────────────
const parseAppt = (row) => row ? { ...row, sessions: JSON.parse(row.sessions) } : null;

// ── STUDENT ROUTES ────────────────────────────────────────
app.post('/api/students/register', async (req, res) => {
  try {
    const { firstName, lastName, age, email, password, schoolId, year, department, contact } = req.body;
    if (await db.get('SELECT id FROM students WHERE email = ?', [email]))
      return res.status(409).json({ error: 'Email already registered' });
    if (await db.get('SELECT id FROM students WHERE schoolId = ?', [schoolId]))
      return res.status(409).json({ error: 'School ID already registered' });
    const id = 's' + Date.now();
    const avatarInitial = ((firstName[0] || '') + (lastName[0] || '')).toUpperCase();
    await db.run(
      `INSERT INTO students (id, firstName, lastName, age, email, password, schoolId, year, department, contact, role, avatarInitial)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'student', ?)`,
      [id, firstName, lastName, age, email, password, schoolId, year, department, contact, avatarInitial]
    );
    res.status(201).json(await db.get('SELECT * FROM students WHERE id = ?', [id]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/students/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const student = await db.get('SELECT * FROM students WHERE email = ? AND password = ?', [email, password]);
    if (!student) return res.status(401).json({ error: 'Invalid email or password' });
    res.json(student);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/students', async (req, res) => {
  try { res.json(await db.all('SELECT * FROM students')); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/students/:id', async (req, res) => {
  try {
    const s = await db.get('SELECT * FROM students WHERE id = ?', [req.params.id]);
    if (!s) return res.status(404).json({ error: 'Student not found' });
    res.json(s);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/students/:id', async (req, res) => {
  try {
    const { firstName, lastName, age, contact, email, year, department, profilePicture } = req.body;
    await db.run(
      `UPDATE students SET firstName=?, lastName=?, age=?, contact=?, email=?, year=?, department=?, profilePicture=? WHERE id=?`,
      [firstName, lastName, age, contact, email, year, department, profilePicture ?? null, req.params.id]
    );
    res.json(await db.get('SELECT * FROM students WHERE id = ?', [req.params.id]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── FACILITATOR ROUTES ────────────────────────────────────
app.post('/api/facilitator/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const fac = await db.get('SELECT * FROM facilitators WHERE email = ? AND password = ?', [email, password]);
    if (!fac) return res.status(401).json({ error: 'Invalid email or password' });
    res.json(fac);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/facilitator', async (req, res) => {
  try {
    const fac = await db.get('SELECT * FROM facilitators LIMIT 1');
    if (!fac) return res.status(404).json({ error: 'No facilitator found' });
    res.json(fac);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/facilitator', async (req, res) => {
  try {
    const { id, firstName, lastName, department, contact, bio, profilePicture } = req.body;
    await db.run(
      `UPDATE facilitators SET firstName=?, lastName=?, department=?, contact=?, bio=?, profilePicture=? WHERE id=?`,
      [firstName, lastName, department, contact, bio ?? '', profilePicture ?? null, id]
    );
    res.json(await db.get('SELECT * FROM facilitators WHERE id = ?', [id]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── APPOINTMENT ROUTES ────────────────────────────────────
app.get('/api/appointments', async (req, res) => {
  try { res.json((await db.all('SELECT * FROM appointments')).map(parseAppt)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/appointments', async (req, res) => {
  try {
    const { studentId, studentName, date, time, reason } = req.body;
    const id = 'a' + Date.now();
    await db.run(
      `INSERT INTO appointments (id, studentId, studentName, date, time, reason, status, sessions) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [id, studentId, studentName, date, time, reason, JSON.stringify({ first: 'pending', second: 'inactive', final: 'inactive' })]
    );
    res.status(201).json(parseAppt(await db.get('SELECT * FROM appointments WHERE id = ?', [id])));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/appointments/:id/status', async (req, res) => {
  try {
    await db.run('UPDATE appointments SET status=? WHERE id=?', [req.body.status, req.params.id]);
    res.json(parseAppt(await db.get('SELECT * FROM appointments WHERE id = ?', [req.params.id])));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/appointments/:id/sessions', async (req, res) => {
  try {
    const { sessionKey, sessionStatus } = req.body;
    const row = await db.get('SELECT sessions FROM appointments WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    const sessions = JSON.parse(row.sessions);
    sessions[sessionKey] = sessionStatus;
    await db.run('UPDATE appointments SET sessions=? WHERE id=?', [JSON.stringify(sessions), req.params.id]);
    res.json(parseAppt(await db.get('SELECT * FROM appointments WHERE id = ?', [req.params.id])));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── MESSAGE ROUTES ────────────────────────────────────────
app.get('/api/messages', async (req, res) => {
  try {
    const { from, to } = req.query;
    const msgs = (from && to)
      ? await db.all(`SELECT * FROM messages WHERE ("from"=? AND "to"=?) OR ("from"=? AND "to"=?) ORDER BY timestamp ASC`, [from, to, to, from])
      : await db.all('SELECT * FROM messages ORDER BY timestamp ASC');
    res.json(msgs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/messages', async (req, res) => {
  try {
    const { from, to, text } = req.body;
    const id = 'm' + Date.now();
    const timestamp = new Date().toISOString();
    await db.run(`INSERT INTO messages (id, "from", "to", text, timestamp) VALUES (?, ?, ?, ?, ?)`, [id, from, to, text, timestamp]);
    res.status(201).json(await db.get('SELECT * FROM messages WHERE id = ?', [id]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Test Route ────────────────────────────────────────────
app.get('/api/test', (req, res) => {
  res.json({ message: 'Hello from your new Backend API!' });
});

// ── Start ─────────────────────────────────────────────────
async function startServer() {
  try {
    db = await initDb();
    console.log('✅ Connected to SQLite database.');
    await seedDefaultData();
    app.listen(PORT, () => {
      console.log(`🚀 Backend API Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
  }
}

startServer();

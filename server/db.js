import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize database connection
async function initDb() {
  const db = await open({
    filename: path.join(__dirname, '..', 'database.sqlite'),
    driver: sqlite3.Database
  });

  // Create Students Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      firstName TEXT,
      lastName TEXT,
      age TEXT,
      email TEXT UNIQUE,
      password TEXT,
      schoolId TEXT,
      year TEXT,
      department TEXT,
      contact TEXT,
      role TEXT DEFAULT 'student',
      avatarInitial TEXT
    )
  `);

  // Create Facilitators Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS facilitators (
      id TEXT PRIMARY KEY,
      firstName TEXT,
      lastName TEXT,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT DEFAULT 'facilitator',
      department TEXT,
      contact TEXT,
      bio TEXT,
      avatarInitial TEXT
    )
  `);

  // Create Appointments Table
  // 'sessions' will be stored as a stringified JSON
  await db.exec(`
    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      studentId TEXT,
      studentName TEXT,
      date TEXT,
      time TEXT,
      reason TEXT,
      status TEXT,
      sessions TEXT
    )
  `);

  // Create Messages Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      "from" TEXT,
      "to" TEXT,
      text TEXT,
      timestamp TEXT
    )
  `);

  return db;
}

export { initDb };

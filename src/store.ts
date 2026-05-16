// =========================================================
//  SYSARCH — API Store (SQLite via Express backend)
// =========================================================

import type { Student, Facilitator, Appointment, Message, CurrentUser } from './types';

const API = 'http://localhost:3000';

// ── Current User — sessionStorage (active session only) ──
export const getCurrentUser = (): CurrentUser | null => {
  try {
    const raw = sessionStorage.getItem('currentUser');
    return raw ? (JSON.parse(raw) as CurrentUser) : null;
  } catch { return null; }
};
export const setCurrentUser = (u: CurrentUser): void => {
  sessionStorage.setItem('currentUser', JSON.stringify(u));
};
export const removeCurrentUser = (): void => {
  sessionStorage.removeItem('currentUser');
};

// ── Students ──────────────────────────────────────────────
export async function getStudents(): Promise<Student[]> {
  try {
    const res = await fetch(`${API}/api/students`);
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export async function updateStudentProfile(id: string, data: Partial<Student>): Promise<Student | null> {
  try {
    const res = await fetch(`${API}/api/students/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

// ── Facilitator ───────────────────────────────────────────
export async function getFacilitator(): Promise<Facilitator | null> {
  try {
    const res = await fetch(`${API}/api/facilitator`);
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function setFacilitator(f: Facilitator): Promise<void> {
  await fetch(`${API}/api/facilitator`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(f),
  });
}

// ── Appointments ──────────────────────────────────────────
export async function getAppointments(): Promise<Appointment[]> {
  try {
    const res = await fetch(`${API}/api/appointments`);
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

// ── Messages ──────────────────────────────────────────────
export async function getMessages(from?: string, to?: string): Promise<Message[]> {
  try {
    const url = from && to
      ? `${API}/api/messages?from=${from}&to=${to}`
      : `${API}/api/messages`;
    const res = await fetch(url);
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

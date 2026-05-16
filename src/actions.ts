// =========================================================
//  SYSARCH — Business Logic / Actions (async, SQLite-backed)
// =========================================================

import { Auth } from './auth';
import { showToast, getInitials } from './ui';
import { getMessages, updateStudentProfile, setFacilitator, getFacilitator } from './store';
import type { Student, Facilitator, Appointment, Message, SessionStatus, AppointmentStatus } from './types';

const API = 'http://localhost:3000';

// ── Student Registration ─────────────────────────────────
export interface SignUpData {
  firstName: string;
  lastName: string;
  age: string;
  email: string;
  password: string;
  schoolId: string;
  year: string;
  department: string;
  contact: string;
}

export async function registerStudent(data: SignUpData): Promise<boolean> {
  const res = await fetch(`${API}/api/students/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err: { error: string } = await res.json();
    if (err.error.includes('Email')) showToast('Email already registered!', 'error');
    else if (err.error.includes('School')) showToast('School ID already registered!', 'error');
    else showToast(err.error, 'error');
    return false;
  }
  const student = await res.json() as Student;
  Auth.login({ ...student, role: 'student' });
  showToast('Account created! Welcome aboard 🎉', 'success');
  setTimeout(() => { window.location.href = '/pages/student-dashboard.html'; }, 800);
  return true;
}

// ── Student Login ────────────────────────────────────────
export async function loginStudent(email: string, password: string): Promise<boolean> {
  const res = await fetch(`${API}/api/students/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    showToast('Invalid email or password.', 'error');
    return false;
  }
  const student = await res.json() as Student;
  Auth.login({ ...student, role: 'student' });
  showToast('Welcome back! 👋', 'success');
  setTimeout(() => { window.location.href = '/pages/student-dashboard.html'; }, 600);
  return true;
}

// ── Facilitator Login ────────────────────────────────────
export async function loginFacilitator(email: string, password: string): Promise<boolean> {
  const res = await fetch(`${API}/api/facilitator/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    showToast('Invalid email or password.', 'error');
    return false;
  }
  const fac = await res.json() as Facilitator;
  Auth.login({ ...fac, role: 'facilitator' });
  showToast('Welcome back! 👩‍⚕️', 'success');
  setTimeout(() => { window.location.href = '/pages/facilitator-dashboard.html'; }, 600);
  return true;
}

// ── Book Appointment ─────────────────────────────────────
export interface BookingData {
  date: string;
  time: string;
  reason: string;
}

export async function bookAppointment(studentId: string, studentName: string, data: BookingData): Promise<boolean> {
  if (!data.date || !data.time || !data.reason) {
    showToast('Please fill in all fields.', 'error');
    return false;
  }
  const res = await fetch(`${API}/api/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId, studentName, ...data }),
  });
  if (!res.ok) {
    showToast('Failed to book appointment.', 'error');
    return false;
  }
  showToast('Appointment booked! ✅ Awaiting facilitator approval.', 'success');
  return true;
}

// ── Update Appointment Status ────────────────────────────
export async function updateAppointmentStatus(
  appointmentId: string,
  newStatus: AppointmentStatus,
): Promise<void> {
  const res = await fetch(`${API}/api/appointments/${appointmentId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus }),
  });
  if (res.ok) {
    showToast(`Appointment ${newStatus}!`, newStatus === 'approved' ? 'success' : 'error');
  }
}

// ── Update Session Status ────────────────────────────────
export async function updateSessionStatus(
  appointmentId: string,
  sessionKey: keyof Appointment['sessions'],
  newStatus: SessionStatus,
): Promise<void> {
  await fetch(`${API}/api/appointments/${appointmentId}/sessions`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionKey, sessionStatus: newStatus }),
  });
  showToast('Session status updated!', 'success');
}

// ── Messaging ────────────────────────────────────────────
export async function sendMessage(fromId: string, toId: string, text: string): Promise<void> {
  if (!text.trim()) return;
  await fetch(`${API}/api/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: fromId, to: toId, text: text.trim() }),
  });
}

export async function getConversation(userId1: string, userId2: string): Promise<Message[]> {
  return getMessages(userId1, userId2);
}

// ── Update Student Profile ───────────────────────────────
export async function saveStudentProfile(
  id: string,
  data: Partial<Student>,
): Promise<Student | null> {
  return updateStudentProfile(id, data);
}

// ── Update Facilitator Profile ───────────────────────────
export async function saveFacilitatorProfile(data: Facilitator): Promise<void> {
  await setFacilitator(data);
}

// suppress unused imports
void [getInitials, getFacilitator];

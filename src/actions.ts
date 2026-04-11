// =========================================================
//  SYSARCH — Business Logic / Actions
// =========================================================

import {
  getStudents, setStudents, getFacilitator,
  getAppointments, setAppointments,
  getMessages, setMessages,
} from './store';
import { Auth } from './auth';
import { showToast, getInitials } from './ui';
import type { Student, Appointment, Message, SessionStatus, AppointmentStatus } from './types';

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

export function registerStudent(data: SignUpData): boolean {
  const students = getStudents();

  if (students.find(s => s.email === data.email)) {
    showToast('Email already registered!', 'error');
    return false;
  }
  if (students.find(s => s.schoolId === data.schoolId)) {
    showToast('School ID already registered!', 'error');
    return false;
  }

  const newStudent: Student = {
    id:            's' + Date.now(),
    firstName:     data.firstName,
    lastName:      data.lastName,
    age:           Number(data.age),
    email:         data.email,
    password:      data.password,
    schoolId:      data.schoolId,
    year:          data.year,
    department:    data.department,
    contact:       data.contact,
    role:          'student',
    avatarInitial: getInitials(data.firstName, data.lastName),
  };

  students.push(newStudent);
  setStudents(students);
  Auth.login({ ...newStudent, role: 'student' });
  showToast('Account created! Welcome aboard 🎉', 'success');
  setTimeout(() => { window.location.href = '/pages/student-dashboard.html'; }, 800);
  return true;
}

// ── Student Login ────────────────────────────────────────
export function loginStudent(email: string, password: string): boolean {
  const student = getStudents().find(s => s.email === email && s.password === password);
  if (!student) {
    showToast('Invalid email or password.', 'error');
    return false;
  }
  Auth.login({ ...student, role: 'student' });
  showToast('Welcome back! 👋', 'success');
  setTimeout(() => { window.location.href = '/pages/student-dashboard.html'; }, 600);
  return true;
}

// ── Facilitator Login ────────────────────────────────────
export function loginFacilitator(email: string, password: string): boolean {
  const fac = getFacilitator();
  if (!fac || fac.email !== email || fac.password !== password) {
    showToast('Invalid email or password.', 'error');
    return false;
  }
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

export function bookAppointment(studentId: string, studentName: string, data: BookingData): boolean {
  if (!data.date || !data.time || !data.reason) {
    showToast('Please fill in all fields.', 'error');
    return false;
  }
  const appointments = getAppointments();
  const newAppt: Appointment = {
    id:          'a' + Date.now(),
    studentId,
    studentName,
    date:        data.date,
    time:        data.time,
    reason:      data.reason,
    status:      'pending',
    sessions:    { first: 'pending', second: 'inactive', final: 'inactive' },
  };
  appointments.push(newAppt);
  setAppointments(appointments);
  showToast('Appointment booked! ✅ Awaiting facilitator approval.', 'success');
  return true;
}

// ── Update Appointment Status ────────────────────────────
export function updateAppointmentStatus(
  appointmentId: string,
  newStatus: AppointmentStatus,
): void {
  const appointments = getAppointments();
  const apt = appointments.find(a => a.id === appointmentId);
  if (!apt) return;
  apt.status = newStatus;
  setAppointments(appointments);
  showToast(
    `Appointment ${newStatus}!`,
    newStatus === 'approved' ? 'success' : 'error',
  );
}

// ── Update Session Status ────────────────────────────────
export function updateSessionStatus(
  appointmentId: string,
  sessionKey: keyof Appointment['sessions'],
  newStatus: SessionStatus,
): void {
  const appointments = getAppointments();
  const apt = appointments.find(a => a.id === appointmentId);
  if (!apt) return;
  apt.sessions[sessionKey] = newStatus;
  setAppointments(appointments);
  showToast('Session status updated!', 'success');
}

// ── Messaging ────────────────────────────────────────────
export function sendMessage(fromId: string, toId: string, text: string): void {
  if (!text.trim()) return;
  const messages = getMessages();
  const msg: Message = {
    id:        'm' + Date.now(),
    from:      fromId,
    to:        toId,
    text:      text.trim(),
    timestamp: new Date().toISOString(),
  };
  messages.push(msg);
  setMessages(messages);
}

export function getConversation(userId1: string, userId2: string): Message[] {
  return getMessages()
    .filter(
      m =>
        (m.from === userId1 && m.to === userId2) ||
        (m.from === userId2 && m.to === userId1),
    )
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

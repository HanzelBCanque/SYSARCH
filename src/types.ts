// =========================================================
//  SYSARCH — Shared Type Definitions
// =========================================================

export type UserRole = 'student' | 'facilitator';

export type SessionStatus = 'done' | 'pending' | 'inactive';

export interface SessionRecord {
  first: SessionStatus;
  second: SessionStatus;
  final: SessionStatus;
}

export type AppointmentStatus = 'pending' | 'approved' | 'rejected';

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  age: number | string;
  email: string;
  password: string;
  schoolId: string;
  year: string;
  department: string;
  contact: string;
  role: 'student';
  avatarInitial: string;
  profilePicture?: string;
}

export interface Facilitator {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'facilitator';
  department: string;
  contact: string;
  bio: string;
  avatarInitial: string;
  profilePicture?: string;
}

export type CurrentUser = (Student | Facilitator) & { role: UserRole };

export interface Appointment {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  time: string;
  reason: string;
  status: AppointmentStatus;
  sessions: SessionRecord;
}

export interface Message {
  id: string;
  from: string;
  to: string;
  text: string;
  timestamp: string;
}

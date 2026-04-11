// =========================================================
//  SYSARCH — Seed Default Data
// =========================================================

import { getStudents, setStudents, getFacilitator, setFacilitator,
  getAppointments, setAppointments, getMessages, setMessages } from './store';
import type { Student, Facilitator, Appointment, Message } from './types';

export function seedData(): void {
  // ── Facilitator ──
  if (!getFacilitator()) {
    const fac: Facilitator = {
      id:           'f001',
      firstName:    'Dr. Ana',
      lastName:     'Santos',
      email:        'facilitator@sysarch.edu',
      password:     'facilitator123',
      role:         'facilitator',
      department:   'Guidance & Counseling',
      contact:      '09171234567',
      bio:          'Licensed guidance counselor with 10+ years of experience.',
      avatarInitial:'A',
    };
    setFacilitator(fac);
  }

  // ── Demo Students ──
  if (!getStudents().length) {
    const students: Student[] = [
      {
        id: 's001', firstName: 'Juan', lastName: 'dela Cruz',
        age: 20, email: 'juan@gmail.com', password: 'student123',
        schoolId: '2021-10001', year: '3rd Year',
        department: 'Computer Science', contact: '09181234567',
        role: 'student', avatarInitial: 'J',
      },
      {
        id: 's002', firstName: 'Maria', lastName: 'Reyes',
        age: 19, email: 'maria@gmail.com', password: 'student123',
        schoolId: '2022-10042', year: '2nd Year',
        department: 'Information Technology', contact: '09191234567',
        role: 'student', avatarInitial: 'M',
      },
    ];
    setStudents(students);
  }

  // ── Demo Appointments ──
  if (!getAppointments().length) {
    const appts: Appointment[] = [
      {
        id: 'a001', studentId: 's001', studentName: 'Juan dela Cruz',
        date: '2026-04-14', time: '09:00 AM', reason: 'Academic concern',
        status: 'approved',
        sessions: { first: 'done', second: 'pending', final: 'inactive' },
      },
      {
        id: 'a002', studentId: 's002', studentName: 'Maria Reyes',
        date: '2026-04-16', time: '02:00 PM', reason: 'Personal consultation',
        status: 'pending',
        sessions: { first: 'pending', second: 'inactive', final: 'inactive' },
      },
    ];
    setAppointments(appts);
  }

  // ── Demo Messages ──
  if (!getMessages().length) {
    const msgs: Message[] = [
      {
        id: 'm001', from: 'f001', to: 's001',
        text: 'Hello Juan! Your first session appointment has been confirmed.',
        timestamp: new Date(Date.now() - 3_600_000).toISOString(),
      },
      {
        id: 'm002', from: 's001', to: 'f001',
        text: 'Thank you, doc! I will be there.',
        timestamp: new Date(Date.now() - 1_800_000).toISOString(),
      },
      {
        id: 'm003', from: 'f001', to: 's002',
        text: 'Hi Maria! Please confirm your appointment schedule.',
        timestamp: new Date(Date.now() - 7_200_000).toISOString(),
      },
    ];
    setMessages(msgs);
  }
}

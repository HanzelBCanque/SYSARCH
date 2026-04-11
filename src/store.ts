// =========================================================
//  SYSARCH — localStorage Store (typed)
// =========================================================

import type {
  Student, Facilitator, Appointment, Message, CurrentUser
} from './types';

// ── Generic get/set ──────────────────────────────────────
export const Store = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove(key: string): void {
    localStorage.removeItem(key);
  },
};

// ── Typed accessors ──────────────────────────────────────
export const getStudents      = (): Student[]       => Store.get<Student[]>('students', []);
export const setStudents      = (s: Student[])      => Store.set('students', s);

export const getFacilitator   = (): Facilitator | null =>
  Store.get<Facilitator | null>('facilitator', null);
export const setFacilitator   = (f: Facilitator)   => Store.set('facilitator', f);

export const getAppointments  = (): Appointment[]   => Store.get<Appointment[]>('appointments', []);
export const setAppointments  = (a: Appointment[])  => Store.set('appointments', a);

export const getMessages      = (): Message[]       => Store.get<Message[]>('messages', []);
export const setMessages      = (m: Message[])      => Store.set('messages', m);

export const getCurrentUser   = (): CurrentUser | null =>
  Store.get<CurrentUser | null>('currentUser', null);
export const setCurrentUser   = (u: CurrentUser)   => Store.set('currentUser', u);
export const removeCurrentUser = ()                 => Store.remove('currentUser');

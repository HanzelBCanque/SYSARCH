// =========================================================
//  SYSARCH — Student Dashboard Entry
// =========================================================

import './style.css';
import { Auth } from './auth';
import {
  showToast, openModal, closeModal,
  setupModalOverlayClose, getInitials,
  formatDate, formatTime, twoInitials,
} from './ui';
import {
  bookAppointment, sendMessage, getConversation, saveStudentProfile,
} from './actions';
import { getAppointments, getStudents, getFacilitator, setCurrentUser } from './store';
import type { Student, Appointment } from './types';

setupModalOverlayClose();

// ── Auth Guard ───────────────────────────────────────────
const rawUser = Auth.requireAuth('student');
if (!rawUser) throw new Error('Unauthorized');
let user = rawUser as Student & { role: 'student' };

// ── Expose modal helpers to HTML ─────────────────────────
(window as unknown as Record<string, unknown>).openModal  = openModal;
(window as unknown as Record<string, unknown>).closeModal = closeModal;
(window as unknown as Record<string, unknown>).Auth       = Auth;

// ── DOM helpers ──────────────────────────────────────────
function el<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

// ── Navigation ───────────────────────────────────────────
type Section = 'home' | 'book' | 'appointments' | 'inbox' | 'profile';

const TITLES: Record<Section, string> = {
  home:         'Dashboard',
  book:         'Book a Session',
  appointments: 'My Appointments',
  inbox:        'Inbox',
  profile:      'My Profile',
};

function navigate(section: Section): void {
  document.querySelectorAll<HTMLElement>('.content-section').forEach(
    s => (s.style.display = 'none'),
  );
  document.querySelectorAll<HTMLButtonElement>('.nav-item').forEach(
    n => n.classList.remove('active'),
  );
  const sectionEl = el(`section-${section}`);
  if (sectionEl) sectionEl.style.display = 'block';
  const navEl = el(`nav-${section}`);
  if (navEl) navEl.classList.add('active');
  el('topbar-title').textContent = TITLES[section];

  if (section === 'inbox') loadStudentInbox();
}

document.querySelectorAll<HTMLButtonElement>('[data-nav]').forEach(btn => {
  btn.addEventListener('click', () => navigate(btn.dataset['nav'] as Section));
});

el('sidebar-toggle')?.addEventListener('click', () =>
  el('sidebar').classList.toggle('open'),
);

// ── Logout ───────────────────────────────────────────────
function confirmLogout(): void { openModal('modal-logout'); }
el('nav-logout')?.addEventListener('click', confirmLogout);
el('topbar-logout')?.addEventListener('click', confirmLogout);
el('topbar-profile')?.addEventListener('click', () => navigate('profile'));

// ── Avatar helper ─────────────────────────────────────────
function applyAvatar(el: HTMLElement, user: Student): void {
  if (user.profilePicture) {
    el.style.background = `url(${user.profilePicture}) center/cover`;
    el.textContent = '';
  } else {
    el.style.background = '';
    el.textContent = getInitials(user.firstName, user.lastName);
  }
}

// ── Initialise ───────────────────────────────────────────
async function initDashboard(): Promise<void> {
  applyAvatar(el('sidebar-avatar'), user);
  el('sidebar-name').textContent   = `${user.firstName} ${user.lastName}`;
  el('hero-greeting').textContent  = `Hello, ${user.firstName}! 👋`;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  (el('bk-date') as HTMLInputElement).min = tomorrow.toISOString().split('T')[0]!;

  await loadStats();
  await loadRecentAppointments();
  await loadMyAppointments();
  loadProfile();
}

// ── Stats ────────────────────────────────────────────────
async function loadStats(): Promise<void> {
  const appointments = (await getAppointments()).filter(a => a.studentId === user.id);
  el('stat-total').textContent    = String(appointments.length);
  el('stat-approved').textContent = String(appointments.filter(a => a.status === 'approved').length);
  el('stat-pending').textContent  = String(appointments.filter(a => a.status === 'pending').length);
  const done = appointments.reduce(
    (acc, a) => acc + Object.values(a.sessions).filter(s => s === 'done').length,
    0,
  );
  el('stat-sessions').textContent = String(done);
}

// ── Recent Appointments (home hero) ──────────────────────
async function loadRecentAppointments(): Promise<void> {
  const appointments = (await getAppointments())
    .filter(a => a.studentId === user.id)
    .slice(-3)
    .reverse();
  const container = el('recent-appts-home');

  if (!appointments.length) {
    container.innerHTML = `
      <div style="text-align:center; padding:48px 0; color:var(--text-secondary);">
        <div style="font-size:48px; margin-bottom:12px;">📭</div>
        <p>No appointments yet. <button class="auth-link" id="book-first-btn">Book your first session →</button></p>
      </div>`;
    el('book-first-btn')?.addEventListener('click', () => navigate('book'));
    return;
  }

  container.innerHTML = appointments.map(a => buildMiniCard(a)).join('');
}

function buildMiniCard(a: Appointment): string {
  const d = new Date(a.date);
  const month = d.toLocaleString('en', { month: 'short' });
  const day   = d.getDate();
  const statusClass: Record<string, string> = {
    pending: 'badge-orange', approved: 'badge-green', rejected: 'badge-red',
  };
  return `
    <div class="my-appt-card">
      <div class="appt-date-box">
        <div class="month">${month}</div>
        <div class="day">${day}</div>
      </div>
      <div style="flex:1;">
        <div style="font-weight:700; margin-bottom:2px;">${a.reason}</div>
        <div style="font-size:13px; color:var(--text-secondary);">${a.time}</div>
        <div class="appt-session-progress" style="margin-top:8px;">
          <div class="prog-dot ${a.sessions.first}"></div>
          <div class="prog-dot ${a.sessions.second}"></div>
          <div class="prog-dot ${a.sessions.final}"></div>
        </div>
      </div>
      <span class="badge ${statusClass[a.status] ?? 'badge-blue'}">${a.status}</span>
    </div>`;
}

// ── My Appointments (full list) ──────────────────────────
async function loadMyAppointments(): Promise<void> {
  const appointments = (await getAppointments())
    .filter(a => a.studentId === user.id)
    .reverse();
  const container = el('my-appointments-list');

  if (!appointments.length) {
    container.innerHTML = `
      <div style="text-align:center; padding:60px 0; color:var(--text-secondary);">
        <div style="font-size:52px; margin-bottom:12px;">📭</div>
        <p>You have no appointments yet.</p>
        <button class="btn btn-primary" style="margin-top:16px;" id="book-cta-btn">📅 Book a Session</button>
      </div>`;
    el('book-cta-btn')?.addEventListener('click', () => navigate('book'));
    return;
  }

  const statusClass: Record<string, string> = {
    pending: 'badge-orange', approved: 'badge-green', rejected: 'badge-red',
  };
  const sessionLabels: Record<string, string> = {
    first: '1st Session', second: '2nd Session', final: 'Final Session',
  };

  container.innerHTML = appointments.map(a => {
    const chips = (Object.entries(a.sessions) as [string, string][])
      .map(([k, v]) => `<span class="session-chip ${v}">${sessionLabels[k] ?? k}</span>`)
      .join('');
    return `
      <div class="my-appt-card" style="flex-direction:column; align-items:flex-start; gap:14px;">
        <div style="display:flex; align-items:center; width:100%; gap:16px;">
          <div class="appt-date-box">
            <div class="month">${new Date(a.date).toLocaleString('en',{month:'short'})}</div>
            <div class="day">${new Date(a.date).getDate()}</div>
          </div>
          <div style="flex:1;">
            <div style="font-weight:700; font-size:15px;">${a.reason}</div>
            <div style="font-size:13px; color:var(--text-secondary); margin-top:4px;">⏰ ${a.time}</div>
          </div>
          <span class="badge ${statusClass[a.status] ?? 'badge-blue'}" style="align-self:flex-start;">${a.status}</span>
        </div>
        <div>
          <div style="font-size:12px; color:var(--text-muted); margin-bottom:6px; font-weight:700;">SESSION INTAKE STATUS</div>
          <div class="session-chips">${chips}</div>
        </div>
      </div>`;
  }).join('');
}

// ── Inbox ─────────────────────────────────────────────────
const FACILITATOR_ID = 'f001';

async function loadStudentInbox(): Promise<void> {
  const fac = await getFacilitator();
  if (!fac) return;
  const initials = getInitials(fac.firstName, fac.lastName);

  el('student-conversations').innerHTML = `
    <div class="conversation-item active">
      <div class="avatar avatar-sm" style="background:linear-gradient(135deg,#8b5cf6,#6366f1);">${initials}</div>
      <div class="conv-info">
        <div class="conv-name">${fac.firstName} ${fac.lastName}</div>
        <div class="conv-preview">Guidance Facilitator</div>
      </div>
    </div>`;

  await renderStudentMessages();
}

async function renderStudentMessages(): Promise<void> {
  const msgs = await getConversation(user.id, FACILITATOR_ID);
  const container = el('student-messages');

  if (!msgs.length) {
    container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:40px 0; font-size:14px;">No messages yet. Say hello! 👋</div>`;
    return;
  }

  container.innerHTML = msgs.map(m => {
    const isSent = m.from === user.id;
    return `
      <div class="message-row ${isSent ? 'sent' : ''}">
        ${!isSent ? `<div class="avatar avatar-sm" style="background:linear-gradient(135deg,#8b5cf6,#6366f1);">A</div>` : ''}
        <div>
          <div class="message-bubble ${isSent ? 'sent' : 'received'}">${m.text}</div>
          <div class="message-time" style="text-align:${isSent ? 'right' : 'left'}; margin-top:4px;">
            ${formatTime(m.timestamp)}
          </div>
        </div>
      </div>`;
  }).join('');
  container.scrollTop = container.scrollHeight;
}

async function studentSendMessage(): Promise<void> {
  const input = el<HTMLInputElement>('student-chat-input');
  const text  = input.value.trim();
  if (!text) return;
  await sendMessage(user.id, FACILITATOR_ID, text);
  input.value = '';
  await renderStudentMessages();
}

el('student-send-btn')?.addEventListener('click', () => { void studentSendMessage(); });
el<HTMLInputElement>('student-chat-input')?.addEventListener('keypress', (e: KeyboardEvent) => {
  if (e.key === 'Enter') void studentSendMessage();
});

// ── Profile ──────────────────────────────────────────────
function loadProfile(): void {
  const avatarEl = el('profile-avatar-big');
  applyAvatar(avatarEl, user);
  el('profile-fullname').textContent = `${user.firstName} ${user.lastName}`;
  el('profile-schoolid').textContent = `School ID: ${user.schoolId}`;
  el('profile-year').textContent     = user.year;
  el('profile-dept').textContent     = user.department;
  (el<HTMLInputElement>('pf-firstname')).value  = user.firstName;
  (el<HTMLInputElement>('pf-lastname')).value   = user.lastName;
  (el<HTMLInputElement>('pf-age')).value        = String(user.age);
  (el<HTMLInputElement>('pf-contact')).value    = user.contact;
  (el<HTMLInputElement>('pf-email')).value      = user.email;
  (el<HTMLSelectElement>('pf-year')).value      = user.year;
  (el<HTMLSelectElement>('pf-dept')).value      = user.department;
}

const profileForm = el<HTMLFormElement>('profileForm');
profileForm?.addEventListener('submit', async (e: SubmitEvent) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(profileForm)) as Partial<Student>;
  // Keep the existing profile picture if not replaced
  const updated = await saveStudentProfile(user.id, { ...data, profilePicture: user.profilePicture });
  if (updated) {
    user = { ...updated, role: 'student' };
    setCurrentUser(user);
    showToast('Profile updated! ✅', 'success');
    loadProfile();
    await loadStats();
  }
});

// ── Profile Picture Upload ────────────────────────────────
el<HTMLInputElement>('profile-pic-input')?.addEventListener('change', function () {
  const file = (this as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (ev: ProgressEvent<FileReader>) => {
    const base64 = ev.target?.result as string;
    // Save picture to SQLite immediately
    const updated = await saveStudentProfile(user.id, {
      firstName: user.firstName, lastName: user.lastName,
      age: user.age, contact: user.contact, email: user.email,
      year: user.year, department: user.department,
      profilePicture: base64,
    });
    if (updated) {
      user = { ...updated, role: 'student' };
      setCurrentUser(user);
      showToast('Profile picture saved! 📷', 'success');
      loadProfile();
      // Also update sidebar avatar
      applyAvatar(el('sidebar-avatar'), user);
    }
  };
  reader.readAsDataURL(file);
});

// ── Time Slot Picker ──────────────────────────────────────
const TIME_SLOTS = [
  '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM',
];

el<HTMLInputElement>('bk-date')?.addEventListener('change', async function () {
  const selectedDate = (this as HTMLInputElement).value;
  const booked = (await getAppointments())
    .filter(a => a.date === selectedDate && a.status !== 'rejected')
    .map(a => a.time);

  el('bk-time-hidden').setAttribute('value', '');
  el('time-slot-info').textContent = '';

  el('time-slot-grid').innerHTML = TIME_SLOTS.map(t => {
    const isBooked = booked.includes(t);
    return `<div class="time-slot ${isBooked ? 'booked' : ''}" data-time="${t}">${t}</div>`;
  }).join('');

  el('time-slot-grid').querySelectorAll<HTMLDivElement>('.time-slot:not(.booked)').forEach(slot => {
    slot.addEventListener('click', () => selectSlot(slot.dataset['time'] ?? ''));
  });
});

function selectSlot(time: string): void {
  document.querySelectorAll('.time-slot').forEach(el => el.classList.remove('selected'));
  document.querySelector<HTMLElement>(`.time-slot[data-time="${time}"]`)?.classList.add('selected');
  (el('bk-time-hidden') as HTMLInputElement).value = time;
}

// ── Booking Form ─────────────────────────────────────────
const bookingForm    = el<HTMLFormElement>('bookingForm');
const bookSubmitBtn  = el<HTMLButtonElement>('book-submit-btn');
bookingForm?.addEventListener('submit', async (e: SubmitEvent) => {
  e.preventDefault();
  const timeVal = (el('bk-time-hidden') as HTMLInputElement).value;
  if (!timeVal) {
    showToast('Please select a time slot!', 'error');
    return;
  }
  const data = Object.fromEntries(new FormData(bookingForm)) as {
    date: string; time: string; reason: string;
  };
  data.time = timeVal;
  const ok = await bookAppointment(user.id, `${user.firstName} ${user.lastName}`, data);
  if (ok) {
    bookingForm.reset();
    el('time-slot-grid').innerHTML = '';
    el('time-slot-info').textContent = 'Select a date first to see available slots.';
    await loadStats();
    await loadRecentAppointments();
    await loadMyAppointments();
    setTimeout(() => navigate('appointments'), 1200);
  }
});

// suppress unused
void [formatDate, twoInitials, bookSubmitBtn];

// ── Boot ─────────────────────────────────────────────────
void initDashboard();

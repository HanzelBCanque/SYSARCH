// =========================================================
//  SYSARCH — Facilitator Dashboard Entry
// =========================================================

import './style.css';
import { Auth } from './auth';
import {
  showToast, openModal, closeModal,
  setupModalOverlayClose, getInitials,
  formatDate, formatTime, twoInitials,
} from './ui';
import { sendMessage, getConversation, updateAppointmentStatus, updateSessionStatus, saveFacilitatorProfile } from './actions';
import {
  getAppointments, getStudents, getFacilitator, setCurrentUser,
} from './store';
import type { Facilitator, Appointment, SessionStatus } from './types';

setupModalOverlayClose();

// ── Auth Guard ───────────────────────────────────────────
const rawUser = Auth.requireAuth('facilitator');
if (!rawUser) throw new Error('Unauthorized');
let user = rawUser as Facilitator & { role: 'facilitator' };

// ── Expose modal helpers ─────────────────────────────────
(window as unknown as Record<string, unknown>).openModal  = openModal;
(window as unknown as Record<string, unknown>).closeModal = closeModal;
(window as unknown as Record<string, unknown>).Auth       = Auth;

// ── DOM helper ───────────────────────────────────────────
function el<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

// ── Section navigation ───────────────────────────────────
type FacSection = 'home' | 'appointments' | 'sessions' | 'all-sessions' | 'inbox' | 'profile';

const TITLES: Record<FacSection, string> = {
  home:           'Dashboard',
  appointments:   'Student Appointments',
  sessions:       'View Session',
  'all-sessions': "All Students' Sessions",
  inbox:          'Inbox',
  profile:        'Profile',
};

let currentChatStudentId: string | null = null;

function navigate(section: FacSection): void {
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

  if (section === 'appointments')   void renderAppointmentRequests();
  if (section === 'sessions')       void renderSessionTable();
  if (section === 'all-sessions')   void renderAllStudentsSessions();
  if (section === 'inbox')          void loadFacilitatorInbox();
}

el('nav-home')?.addEventListener('click',          () => navigate('home'));
el('nav-appointments')?.addEventListener('click',  () => navigate('appointments'));
el('nav-sessions')?.addEventListener('click',      () => navigate('sessions'));
el('nav-all-sessions')?.addEventListener('click',  () => navigate('all-sessions'));
el('nav-inbox')?.addEventListener('click',         () => navigate('inbox'));
el('nav-profile')?.addEventListener('click',       () => navigate('profile'));
el('nav-logout')?.addEventListener('click',        () => openModal('modal-logout'));
el('topbar-logout')?.addEventListener('click',     () => openModal('modal-logout'));
el('topbar-profile')?.addEventListener('click',    () => navigate('profile'));

el('review-appts-btn')?.addEventListener('click',  () => navigate('appointments'));
el('view-sessions-btn')?.addEventListener('click', () => navigate('sessions'));

document.querySelector<HTMLButtonElement>('.topbar-icon-btn')?.addEventListener('click', () =>
  el('sidebar').classList.toggle('open'),
);

// ── Avatar helper ─────────────────────────────────────────
function applyAvatar(avatarEl: HTMLElement, u: Facilitator): void {
  if (u.profilePicture) {
    avatarEl.style.background = `url(${u.profilePicture}) center/cover`;
    avatarEl.textContent = '';
  } else {
    avatarEl.style.background = '';
    avatarEl.textContent = getInitials(u.firstName, u.lastName);
  }
}

// ── Init ─────────────────────────────────────────────────
async function initDashboard(): Promise<void> {
  applyAvatar(el('sidebar-avatar'), user);
  el('sidebar-name').textContent   = `${user.firstName} ${user.lastName}`;
  el('fac-greeting').textContent   = `Good day, ${user.firstName}! 👩‍⚕️`;
  await loadStats();
  await loadHomeRecentRequests();
  updatePendingBadge([]);
  await loadFacProfile();
  // Update badge with real data
  const appts = await getAppointments();
  updatePendingBadge(appts);
}

// ── Stats ─────────────────────────────────────────────────
async function loadStats(): Promise<void> {
  const appts    = await getAppointments();
  const students = await getStudents();

  el('stat-total-students').textContent = String(students.length);
  el('stat-pending-appts').textContent  = String(appts.filter(a => a.status === 'pending').length);
  el('stat-approved-appts').textContent = String(appts.filter(a => a.status === 'approved').length);

  const done = appts.reduce(
    (acc, a) => acc + Object.values(a.sessions).filter(s => s === 'done').length,
    0,
  );
  el('stat-done-sessions').textContent = String(done);
}

function updatePendingBadge(appts: Appointment[]): void {
  const count = appts.filter(a => a.status === 'pending').length;
  const badge = el('pending-badge');
  badge.textContent    = String(count);
  badge.style.display  = count > 0 ? 'inline' : 'none';
}

// ── Home Recent Requests ──────────────────────────────────
async function loadHomeRecentRequests(): Promise<void> {
  const pending   = (await getAppointments()).filter(a => a.status === 'pending').slice(0, 3);
  const container = el('home-recent-requests');

  if (!pending.length) {
    container.innerHTML = `
      <div style="text-align:center; padding:40px 0; color:var(--text-secondary);">
        <div style="font-size:40px; margin-bottom:12px;">🎉</div>
        <p>All caught up! No pending requests.</p>
      </div>`;
    return;
  }

  container.innerHTML = pending.map(a => buildApptCard(a)).join('');
  bindApptCardButtons(container);
}

// ── Build Appointment Card HTML ───────────────────────────
function buildApptCard(a: Appointment): string {
  const statusClass: Record<string, string> = {
    pending: 'badge-orange', approved: 'badge-green', rejected: 'badge-red',
  };
  const actions =
    a.status === 'pending'
      ? `<button class="btn btn-sm" style="background:rgba(16,185,129,0.15);color:#6ee7b7;border:1px solid rgba(16,185,129,0.3);"
            data-approve="${a.id}">✅ Approve</button>
         <button class="btn btn-sm btn-danger" data-reject="${a.id}">❌ Reject</button>`
      : `<button class="btn btn-ghost btn-sm" data-sessions="${a.id}">📊 Sessions</button>`;

  return `
    <div class="appt-request-card" id="appt-card-${a.id}">
      <div class="avatar avatar-md">${twoInitials(a.studentName)}</div>
      <div class="appt-info">
        <div class="appt-name">${a.studentName}</div>
        <div class="appt-meta">
          <span>📅 ${formatDate(a.date)}</span>
          <span>⏰ ${a.time}</span>
          <span>📝 ${a.reason}</span>
        </div>
      </div>
      <div style="display:flex; flex-direction:column; align-items:flex-end; gap:10px;">
        <span class="badge ${statusClass[a.status] ?? 'badge-blue'}">${a.status}</span>
        <div class="appt-actions">${actions}</div>
      </div>
    </div>`;
}

function bindApptCardButtons(container: HTMLElement): void {
  container.querySelectorAll<HTMLButtonElement>('[data-approve]').forEach(btn => {
    btn.addEventListener('click', () => { void approveAppt(btn.dataset['approve']!); });
  });
  container.querySelectorAll<HTMLButtonElement>('[data-reject]').forEach(btn => {
    btn.addEventListener('click', () => { void rejectAppt(btn.dataset['reject']!); });
  });
  container.querySelectorAll<HTMLButtonElement>('[data-sessions]').forEach(btn => {
    btn.addEventListener('click', () => { void openSessionModal(btn.dataset['sessions']!); });
  });
}

// ── Appointment Requests ──────────────────────────────────
async function renderAppointmentRequests(): Promise<void> {
  const query  = (el<HTMLInputElement>('appt-search')?.value ?? '').toLowerCase();
  const status = (el<HTMLSelectElement>('appt-status-filter')?.value ?? '');
  let appts    = await getAppointments();
  if (query)  appts = appts.filter(a => a.studentName.toLowerCase().includes(query));
  if (status) appts = appts.filter(a => a.status === status);
  appts = appts.reverse();

  updatePendingBadge(appts);

  const container = el('appointment-requests-list');
  if (!appts.length) {
    container.innerHTML = `
      <div style="text-align:center; padding:60px 0; color:var(--text-secondary);">
        <div style="font-size:48px; margin-bottom:12px;">📭</div>
        <p>No appointment requests found.</p>
      </div>`;
    return;
  }
  container.innerHTML = appts.map(a => buildApptCard(a)).join('');
  bindApptCardButtons(container);
}

el<HTMLInputElement>('appt-search')?.addEventListener('input', () => void renderAppointmentRequests());
el<HTMLSelectElement>('appt-status-filter')?.addEventListener('change', () => void renderAppointmentRequests());

async function approveAppt(id: string): Promise<void> {
  await updateAppointmentStatus(id, 'approved');
  await loadStats();
  await loadHomeRecentRequests();
  await renderAppointmentRequests();
}
async function rejectAppt(id: string): Promise<void> {
  await updateAppointmentStatus(id, 'rejected');
  await loadStats();
  await loadHomeRecentRequests();
  await renderAppointmentRequests();
}

// ── Session Modal ─────────────────────────────────────────
let activeApptId: string | null = null;

async function openSessionModal(apptId: string): Promise<void> {
  const appts = await getAppointments();
  const apt = appts.find(a => a.id === apptId);
  if (!apt) return;
  activeApptId = apptId;

  el('modal-student-name').textContent = apt.studentName;

  const SESSION_KEYS = ['first', 'second', 'final'] as const;
  const STATUS_LABELS: Record<SessionStatus, string> = {
    done: '✅ Done', pending: '⏳ Pending', inactive: '💤 Inactive',
  };

  SESSION_KEYS.forEach(key => {
    const container = el(`modal-${key}-chips`);
    const statuses: SessionStatus[] = ['done', 'pending', 'inactive'];
    container.innerHTML = statuses.map(s => `
      <span class="session-chip ${s}"
        style="${apt.sessions[key] === s ? 'outline:2px solid white;' : ''}"
        data-appt="${apptId}" data-key="${key}" data-status="${s}">
        ${STATUS_LABELS[s]}
      </span>`).join('');

    container.querySelectorAll<HTMLElement>('[data-appt]').forEach(chip => {
      chip.addEventListener('click', async () => {
        const a = chip.dataset['appt']!;
        const k = chip.dataset['key'] as keyof Appointment['sessions'];
        const s = chip.dataset['status'] as SessionStatus;
        await updateSessionStatus(a, k, s);
        container.querySelectorAll<HTMLElement>('.session-chip').forEach(
          c => (c.style.outline = ''),
        );
        chip.style.outline = '2px solid white';
        await loadStats();
        await renderSessionTable();
        showToast('Session status updated!', 'success');
      });
    });
  });

  openModal('modal-session-status');
}

el('modal-session-close')?.addEventListener('click', () => closeModal('modal-session-status'));
void activeApptId;

// ── Session Table ─────────────────────────────────────────
async function renderSessionTable(): Promise<void> {
  const query   = (el<HTMLInputElement>('session-search')?.value ?? '').toLowerCase();
  const dept    = (el<HTMLSelectElement>('session-dept-filter')?.value ?? '');
  const students = await getStudents();

  // Populate dept filter (once)
  const deptFilter = el<HTMLSelectElement>('session-dept-filter');
  if (deptFilter && deptFilter.options.length <= 1) {
    [...new Set(students.map(s => s.department))].forEach(d => {
      const opt = document.createElement('option');
      opt.value = d; opt.textContent = d;
      deptFilter.appendChild(opt);
    });
  }

  let appts = await getAppointments();
  if (query) appts = appts.filter(a => a.studentName.toLowerCase().includes(query));
  if (dept) {
    const ids = students.filter(s => s.department === dept).map(s => s.id);
    appts = appts.filter(a => ids.includes(a.studentId));
  }

  const tbody = el('session-table-body');
  if (!appts.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted);">No sessions found.</td></tr>`;
    return;
  }

  const SESSION_LABELS: Record<string, string> = { first:'1st', second:'2nd', final:'Final' };
  const STATUS_CLASS: Record<string, string> = {
    pending:'badge-orange', approved:'badge-green', rejected:'badge-red',
  };

  tbody.innerHTML = appts.map(a => {
    const student = students.find(s => s.id === a.studentId);
    const chips = (Object.entries(a.sessions) as [string, string][])
      .map(([k, v]) => `
        <span class="session-chip ${v}" data-sessions="${a.id}" style="cursor:pointer;">
          ${SESSION_LABELS[k] ?? k} Session
        </span>`).join('');

    return `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:10px;">
            <div class="avatar avatar-sm">${twoInitials(a.studentName)}</div>
            <div>
              <div style="font-weight:600;">${a.studentName}</div>
              <div style="font-size:12px; color:var(--text-muted);">${student?.schoolId ?? '—'}</div>
            </div>
          </div>
        </td>
        <td><span class="badge badge-blue">${student?.department ?? '—'}</span></td>
        <td>${formatDate(a.date)}</td>
        <td>${a.time}</td>
        <td><div class="session-chips">${chips}</div></td>
        <td><span class="badge ${STATUS_CLASS[a.status] ?? 'badge-blue'}">${a.status}</span></td>
      </tr>`;
  }).join('');

  tbody.querySelectorAll<HTMLElement>('[data-sessions]').forEach(chip => {
    chip.addEventListener('click', () => void openSessionModal(chip.dataset['sessions']!));
  });
}

el<HTMLInputElement>('session-search')?.addEventListener('input', () => void renderSessionTable());
el<HTMLSelectElement>('session-dept-filter')?.addEventListener('change', () => void renderSessionTable());

// ── All Students Grid ─────────────────────────────────────
async function renderAllStudentsSessions(): Promise<void> {
  const query    = (el<HTMLInputElement>('all-search')?.value ?? '').toLowerCase();
  const allStudents = await getStudents();
  const students = allStudents.filter(
    s => !query || `${s.firstName} ${s.lastName}`.toLowerCase().includes(query),
  );
  const appts    = await getAppointments();
  const grid     = el('all-students-grid');

  if (!students.length) {
    grid.innerHTML = `<div style="color:var(--text-muted);padding:40px 0;text-align:center;grid-column:1/-1;">No students found.</div>`;
    return;
  }

  const SESSION_LABELS: Record<string, string> = {
    first:'1st Session', second:'2nd Session', final:'Final Session',
  };
  const COLOR_MAP: Record<string, string> = {
    done:'badge-green', pending:'badge-orange', inactive:'badge-red',
  };

  grid.innerHTML = students.map(s => {
    const studentAppts = appts.filter(a => a.studentId === s.id);
    const latest       = studentAppts[studentAppts.length - 1];
    const sessions = latest
      ? (Object.entries(latest.sessions) as [string, string][]).map(([k, v]) => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border-color);">
            <span style="font-size:13px;color:var(--text-secondary);">${SESSION_LABELS[k] ?? k}</span>
            <span class="badge ${COLOR_MAP[v] ?? 'badge-blue'}">${v}</span>
          </div>`).join('')
      : `<div style="color:var(--text-muted);font-size:13px;padding:8px 0;">No appointments yet.</div>`;

    const initials  = getInitials(s.firstName, s.lastName);
    const totalDone = studentAppts.reduce(
      (acc, a) => acc + Object.values(a.sessions).filter(sv => sv === 'done').length,
      0,
    );

    // Show profile picture if available
    const avatarStyle = s.profilePicture
      ? `style="background:url(${s.profilePicture}) center/cover; font-size:0;"`
      : '';

    return `
      <div class="student-card">
        <div class="student-card-top">
          <div class="avatar avatar-md" ${avatarStyle}>${s.profilePicture ? '' : initials}</div>
          <div>
            <div class="student-card-name">${s.firstName} ${s.lastName}</div>
            <div class="student-card-meta">${s.year} · ${s.department}</div>
            <div style="font-size:12px;color:var(--accent-green);margin-top:4px;font-weight:600;">
              ${totalDone} session(s) completed
            </div>
          </div>
        </div>
        <div>${sessions}</div>
        <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-ghost btn-sm" data-goto-sessions>📊 Manage Sessions</button>
          <button class="btn btn-ghost btn-sm" data-message-student="${s.id}">💬 Message</button>
        </div>
      </div>`;
  }).join('');

  grid.querySelectorAll<HTMLElement>('[data-goto-sessions]').forEach(btn =>
    btn.addEventListener('click', () => navigate('sessions')),
  );
  grid.querySelectorAll<HTMLElement>('[data-message-student]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const sid = btn.dataset['messageStudent']!;
      navigate('inbox');
      const students2 = await getStudents();
      const student = students2.find(s => s.id === sid);
      if (student) openFacChat(sid, `${student.firstName} ${student.lastName}`);
    });
  });
}

el<HTMLInputElement>('all-search')?.addEventListener('input', () => void renderAllStudentsSessions());

// ── Facilitator Inbox ─────────────────────────────────────
async function loadFacilitatorInbox(): Promise<void> {
  const students  = await getStudents();
  const container = el('facilitator-conversations');

  const convData = await Promise.all(students.map(async s => {
    const msgs = await getConversation(user.id, s.id);
    return { s, msgs, last: msgs[msgs.length - 1] };
  }));

  container.innerHTML = convData.map(({ s, last }) => {
    const initials = getInitials(s.firstName, s.lastName);
    return `
      <div class="conversation-item ${currentChatStudentId === s.id ? 'active' : ''}"
          data-chat-student="${s.id}" data-chat-name="${s.firstName} ${s.lastName}">
        <div class="avatar avatar-sm">${initials}</div>
        <div class="conv-info">
          <div class="conv-name">${s.firstName} ${s.lastName}</div>
          <div class="conv-preview">${last ? last.text : 'No messages yet'}</div>
        </div>
        ${last ? `<span class="conv-time">${formatTime(last.timestamp)}</span>` : ''}
      </div>`;
  }).join('');

  container.querySelectorAll<HTMLElement>('[data-chat-student]').forEach(item => {
    item.addEventListener('click', () => {
      const sid  = item.dataset['chatStudent']!;
      const name = item.dataset['chatName']!;
      openFacChat(sid, name);
    });
  });

  if (currentChatStudentId) await renderFacMessages();
}

function openFacChat(studentId: string, studentName: string): void {
  currentChatStudentId = studentId;
  el('fac-chat-name').textContent = studentName;
  el('fac-chat-header').querySelector('.avatar')!.textContent = twoInitials(studentName);
  void loadFacilitatorInbox();
}

async function renderFacMessages(): Promise<void> {
  if (!currentChatStudentId) return;
  const msgs      = await getConversation(user.id, currentChatStudentId);
  const container = el('facilitator-messages');
  const initials  = el('fac-chat-header').querySelector('.avatar')?.textContent ?? '?';

  if (!msgs.length) {
    container.innerHTML = `<div style="text-align:center;color:var(--text-muted);padding:40px 0;font-size:14px;">Start the conversation! 👋</div>`;
    return;
  }

  container.innerHTML = msgs.map(m => {
    const isSent = m.from === user.id;
    return `
      <div class="message-row ${isSent ? 'sent' : ''}">
        ${!isSent ? `<div class="avatar avatar-sm">${initials}</div>` : ''}
        <div>
          <div class="message-bubble ${isSent ? 'sent' : 'received'}">${m.text}</div>
          <div class="message-time" style="text-align:${isSent ? 'right' : 'left'};margin-top:4px;">
            ${formatTime(m.timestamp)}
          </div>
        </div>
      </div>`;
  }).join('');
  container.scrollTop = container.scrollHeight;
}

async function facilitatorSendMessage(): Promise<void> {
  if (!currentChatStudentId) {
    showToast('Select a student first!', 'error');
    return;
  }
  const input = el<HTMLInputElement>('fac-chat-input');
  const text  = input.value.trim();
  if (!text) return;
  await sendMessage(user.id, currentChatStudentId, text);
  input.value = '';
  await renderFacMessages();
  await loadFacilitatorInbox();
}

el('fac-send-btn')?.addEventListener('click', () => void facilitatorSendMessage());
el<HTMLInputElement>('fac-chat-input')?.addEventListener('keypress', (e: KeyboardEvent) => {
  if (e.key === 'Enter') void facilitatorSendMessage();
});

// ── Facilitator Profile ───────────────────────────────────
async function loadFacProfile(): Promise<void> {
  const fac = await getFacilitator();
  if (!fac) return;
  applyAvatar(el('fac-avatar-big'), fac);
  el('fac-profile-name').textContent    = `${fac.firstName} ${fac.lastName}`;
  el('fac-profile-dept').textContent    = fac.department;
  el('fac-profile-contact').textContent = '📞 ' + (fac.contact || '—');
  (el<HTMLInputElement>('fpf-firstname')).value  = fac.firstName;
  (el<HTMLInputElement>('fpf-lastname')).value   = fac.lastName;
  (el<HTMLInputElement>('fpf-dept')).value       = fac.department;
  (el<HTMLInputElement>('fpf-contact')).value    = fac.contact;
  (el<HTMLTextAreaElement>('fpf-bio')).value     = fac.bio ?? '';
}

const facProfileForm = el<HTMLFormElement>('facProfileForm');
facProfileForm?.addEventListener('submit', async (e: SubmitEvent) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(facProfileForm)) as Partial<Facilitator>;
  const existing = await getFacilitator();
  if (!existing) return;
  const updated: Facilitator = { ...existing, ...data };
  await saveFacilitatorProfile(updated);
  user = { ...updated, role: 'facilitator' };
  setCurrentUser(user);
  showToast('Profile updated! ✅', 'success');
  await loadFacProfile();
  el('fac-greeting').textContent  = `Good day, ${updated.firstName}! 👩‍⚕️`;
  el('sidebar-name').textContent  = `${updated.firstName} ${updated.lastName}`;
});

// ── Facilitator Profile Picture Upload ────────────────────
el<HTMLInputElement>('fac-pic-input')?.addEventListener('change', function () {
  const file = (this as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (ev: ProgressEvent<FileReader>) => {
    const base64 = ev.target?.result as string;
    const existing = await getFacilitator();
    if (!existing) return;
    const updated: Facilitator = { ...existing, profilePicture: base64 };
    await saveFacilitatorProfile(updated);
    user = { ...updated, role: 'facilitator' };
    setCurrentUser(user);
    showToast('Profile picture saved! 📷', 'success');
    await loadFacProfile();
    applyAvatar(el('sidebar-avatar'), user);
  };
  reader.readAsDataURL(file);
});

// ── Boot ─────────────────────────────────────────────────
void initDashboard();

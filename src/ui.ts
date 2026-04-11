// =========================================================
//  SYSARCH — UI Utilities
// =========================================================

// ── Toast ────────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'info' | 'warning';

const TOAST_ICONS: Record<ToastType, string> = {
  success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️',
};

function getOrCreateToastContainer(): HTMLElement {
  let el = document.getElementById('toast-container');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast-container';
    document.body.appendChild(el);
  }
  return el;
}

export function showToast(message: string, type: ToastType = 'info'): void {
  const container = getOrCreateToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${TOAST_ICONS[type]}</span> ${message}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3100);
}

// ── Modal ────────────────────────────────────────────────
export function openModal(modalId: string): void {
  document.getElementById(modalId)?.classList.add('active');
  document.body.style.overflow = 'hidden';
}

export function closeModal(modalId: string): void {
  document.getElementById(modalId)?.classList.remove('active');
  document.body.style.overflow = '';
}

export function setupModalOverlayClose(): void {
  document.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('modal-overlay')) {
      target.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}

// ── Password Toggles ─────────────────────────────────────
export function setupPasswordToggles(): void {
  document.querySelectorAll<HTMLButtonElement>('.password-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.previousElementSibling as HTMLInputElement | null;
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
      } else {
        input.type = 'password';
        btn.textContent = '👁️';
      }
    });
  });
}

// ── String helpers ───────────────────────────────────────
export function getInitials(firstName: string, lastName: string): string {
  return ((firstName?.[0] ?? '') + (lastName?.[0] ?? '')).toUpperCase();
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

export function formatTime(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleTimeString('en-PH', {
    hour: '2-digit', minute: '2-digit',
  });
}

export function twoInitials(fullName: string): string {
  return fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ── Sidebar helpers ──────────────────────────────────────
export function navigateSections(
  sectionId: string,
  navId: string,
  titleMap: Record<string, string>,
  titleElId = 'topbar-title',
): void {
  document.querySelectorAll('.content-section').forEach(
    el => ((el as HTMLElement).style.display = 'none'),
  );
  document.querySelectorAll<HTMLButtonElement>('.nav-item').forEach(
    el => el.classList.remove('active'),
  );
  const section = document.getElementById(sectionId);
  if (section) section.style.display = 'block';
  const nav = document.getElementById(navId);
  if (nav) nav.classList.add('active');
  const titleEl = document.getElementById(titleElId);
  if (titleEl) titleEl.textContent = titleMap[sectionId] ?? 'Dashboard';
}

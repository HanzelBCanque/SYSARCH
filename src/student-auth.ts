// =========================================================
//  SYSARCH — Student Auth Page Entry
// =========================================================

import './style.css';
import { Auth } from './auth';
import { setupPasswordToggles, showToast } from './ui';
import { loginStudent, registerStudent } from './actions';
import type { SignUpData } from './actions';

// Redirect if already logged in as student
const current = Auth.current();
if (current?.role === 'student') {
  window.location.href = '/pages/student-dashboard.html';
}

// ── Tab Switch ───────────────────────────────────────────
function switchTab(tab: 'login' | 'signup'): void {
  document.querySelectorAll<HTMLButtonElement>('.auth-tab').forEach(t =>
    t.classList.remove('active'),
  );
  document.querySelectorAll<HTMLElement>('.auth-form').forEach(f =>
    (f.style.display = 'none'),
  );
  document.getElementById(`tab-${tab}`)?.classList.add('active');
  const form = document.getElementById(`form-${tab}`);
  if (form) form.style.display = 'block';
}

document.getElementById('tab-login')?.addEventListener('click', () => switchTab('login'));
document.getElementById('tab-signup')?.addEventListener('click', () => switchTab('signup'));
document.getElementById('go-signup')?.addEventListener('click', () => switchTab('signup'));
document.getElementById('go-login')?.addEventListener('click', () => switchTab('login'));

setupPasswordToggles();

// ── Login Form ───────────────────────────────────────────
const loginForm = document.getElementById('loginForm') as HTMLFormElement | null;
const loginBtn  = document.getElementById('login-btn') as HTMLButtonElement | null;

loginForm?.addEventListener('submit', async (e: SubmitEvent) => {
  e.preventDefault();
  if (!loginBtn) return;
  loginBtn.disabled = true;
  loginBtn.textContent = 'Logging in…';
  const data = Object.fromEntries(new FormData(loginForm)) as { email: string; password: string };
  const ok = await loginStudent(data.email, data.password);
  if (!ok) {
    loginBtn.disabled = false;
    loginBtn.innerHTML = '🔑 Login';
  }
});

// ── Sign Up Form ─────────────────────────────────────────
const signupForm = document.getElementById('signupForm') as HTMLFormElement | null;
const signupBtn  = document.getElementById('signup-btn') as HTMLButtonElement | null;

signupForm?.addEventListener('submit', async (e: SubmitEvent) => {
  e.preventDefault();
  if (!signupBtn) return;
  signupBtn.disabled = true;
  signupBtn.textContent = 'Creating account…';
  const data = Object.fromEntries(new FormData(signupForm)) as SignUpData;
  if (!data.firstName || !data.lastName || !data.email || !data.password) {
    showToast('Please fill in all required fields.', 'error');
    signupBtn.disabled = false;
    signupBtn.innerHTML = '🚀 Create Account';
    return;
  }
  const ok = await registerStudent(data);
  if (!ok) {
    signupBtn.disabled = false;
    signupBtn.innerHTML = '🚀 Create Account';
  }
});

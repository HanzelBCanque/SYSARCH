// =========================================================
//  SYSARCH — Facilitator Auth Page Entry
// =========================================================

import './style.css';
import { seedData } from './seed';
import { Auth } from './auth';
import { setupPasswordToggles } from './ui';
import { loginFacilitator } from './actions';

seedData();

const current = Auth.current();
if (current?.role === 'facilitator') {
  window.location.href = '/pages/facilitator-dashboard.html';
}

setupPasswordToggles();

const form = document.getElementById('facilitatorLoginForm') as HTMLFormElement | null;
const btn  = document.getElementById('fac-login-btn') as HTMLButtonElement | null;

form?.addEventListener('submit', (e: SubmitEvent) => {
  e.preventDefault();
  if (!btn) return;
  btn.disabled = true;
  btn.textContent = 'Signing in…';
  const data = Object.fromEntries(new FormData(form)) as { email: string; password: string };
  if (!loginFacilitator(data.email, data.password)) {
    btn.disabled = false;
    btn.innerHTML = '🔑 Sign In as Facilitator';
  }
});

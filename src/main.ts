// =========================================================
//  SYSARCH — Landing Page (index.html) Entry
// =========================================================

import './style.css';
import { seedData } from './seed';
import { Auth } from './auth';

seedData();

// Redirect if already logged in
const user = Auth.current();
if (user) {
  window.location.href =
    user.role === 'facilitator'
      ? '/pages/facilitator-dashboard.html'
      : '/pages/student-dashboard.html';
}

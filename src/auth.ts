// =========================================================
//  SYSARCH — Auth Module
// =========================================================

import { getCurrentUser, setCurrentUser, removeCurrentUser } from './store';
import type { CurrentUser, UserRole } from './types';

export const Auth = {
  login(user: CurrentUser): void {
    setCurrentUser(user);
  },

  logout(): void {
    removeCurrentUser();
    window.location.href = '/index.html';
  },

  current(): CurrentUser | null {
    return getCurrentUser();
  },

  /** Redirect to home if not logged-in or wrong role; returns user or null */
  requireAuth(role?: UserRole): CurrentUser | null {
    const user = this.current();
    if (!user) {
      window.location.href = '/index.html';
      return null;
    }
    if (role && user.role !== role) {
      window.location.href = '/index.html';
      return null;
    }
    return user;
  },
};

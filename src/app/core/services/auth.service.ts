import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly STORAGE_KEY = 'stockguard_logged_in';

  login(username: string, password: string): boolean {
    // MOCK ONLY — accepts anything non-empty for now.
    // Replace this with a real POST /api/auth/login call once backend auth exists.
    if (username.trim() && password.trim()) {
      localStorage.setItem(this.STORAGE_KEY, username);
      return true;
    }
    return false;
  }

  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.STORAGE_KEY);
  }

  getUsername(): string | null {
    return localStorage.getItem(this.STORAGE_KEY);
  }
}
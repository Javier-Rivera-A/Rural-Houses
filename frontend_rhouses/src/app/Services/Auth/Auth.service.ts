import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';

export interface LoggedUser {
  id: string;
  userName: string;
  accountType: 'customer' | 'owner';
  email?: string;
  token?: string; // JWT token para propietarios
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly STORAGE_KEY = 'rhouses_user';

  private _user = signal<LoggedUser | null>(this.loadFromStorage());

  readonly user        = this._user.asReadonly();
  readonly isLoggedIn  = computed(() => this._user() !== null);
  readonly isOwner     = computed(() => this._user()?.accountType === 'owner');
  readonly userInitial = computed(() => {
    const u = this._user();
    return u ? u.userName.charAt(0).toUpperCase() : '';
  });

  // Token JWT del propietario (para llamadas autenticadas)
  readonly token = computed(() => this._user()?.token ?? '');

  constructor(private router: Router) {}

  login(user: LoggedUser): void {
    this._user.set(user);
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    // Guardar token también por separado para fácil acceso
    if (user.token) {
      sessionStorage.setItem('rhouses_token', user.token);
    }
  }

  logout(): void {
    this._user.set(null);
    sessionStorage.removeItem(this.STORAGE_KEY);
    sessionStorage.removeItem('rhouses_token');
    this.router.navigate(['/']);
  }

  private loadFromStorage(): LoggedUser | null {
    try {
      const raw = sessionStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
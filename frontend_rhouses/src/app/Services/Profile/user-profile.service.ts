import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { LoggedUser } from '../Auth/Auth.service';

export interface UserProfile {
  id: string;
  userName: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  accountType: 'customer' | 'owner';
}

export interface UpdateProfilePayload {
  userName?: string;
  email?: string;
  phone?: string;
  /**
   * Para PROPIETARIO: es la nueva palabra de acceso (accessWord) — texto plano.
   *   → PUT /api/owners/{id}/access-word   { accessWord: "..." }
   *
   * Para CLIENTE: es la nueva contraseña BCrypt.
   *   → PUT /api/customers/{id}/password   { password: "..." }
   */
  password?: string;
  avatarUrl?: string;
}

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  private readonly base = 'http://localhost:8081';

  constructor(private http: HttpClient) {}

  /** Obtiene el perfil actual desde el backend */
  getProfile(user: LoggedUser): Observable<UserProfile> {
    const url = this.profileBaseUrl(user.accountType, user.id);
    return this.http.get<ApiResponse<any>>(url, { headers: this.headers() }).pipe(
      map((res) => this.normalizeProfile(res?.data, user))
    );
  }

  /**
   * Actualiza solo los campos que cambiaron usando los endpoints individuales.
   *
   * Endpoints PROPIETARIO:
   *   PUT /api/owners/{id}/username    { userName }
   *   PUT /api/owners/{id}/email       { email }
   *   PUT /api/owners/{id}/phone       { phone }
   *   PUT /api/owners/{id}/access-word { accessWord }   ← NO es BCrypt, es texto plano
   *
   * Endpoints CLIENTE:
   *   PUT /api/customers/{id}/username { userName }
   *   PUT /api/customers/{id}/email    { email }
   *   PUT /api/customers/{id}/phone    { phone }
   *   PUT /api/customers/{id}/password { password }     ← BCrypt
   */
  updateProfile(user: LoggedUser, payload: UpdateProfilePayload): Observable<UserProfile> {
    const headers = this.headers();
    const isOwner = user.accountType === 'owner';
    const base    = `${this.base}/api/${isOwner ? 'owners' : 'customers'}/${user.id}`;

    const requests: { [key: string]: Observable<any> } = {};

    if (payload.userName?.trim() && payload.userName !== user.userName) {
      requests['userName'] = this.http.put(
        `${base}/username`,
        { userName: payload.userName.trim() },
        { headers }
      ).pipe(catchError(err => { throw err; }));
    }

    if (payload.email?.trim() && payload.email !== user.email) {
      requests['email'] = this.http.put(
        `${base}/email`,
        { email: payload.email.trim() },
        { headers }
      ).pipe(catchError(err => { throw err; }));
    }

    if (payload.phone?.trim() && payload.phone !== user.phone) {
      requests['phone'] = this.http.put(
        `${base}/phone`,
        { phone: payload.phone.trim() },
        { headers }
      ).pipe(catchError(err => { throw err; }));
    }

    if (payload.password?.trim()) {
      if (isOwner) {
        // Propietario: la "contraseña" en el formulario es en realidad la palabra de acceso.
        // El backend la almacena en texto plano en el campo accessWord y la compara directamente.
        requests['accessWord'] = this.http.put(
          `${base}/access-word`,
          { accessWord: payload.password.trim() },
          { headers }
        ).pipe(catchError(err => { throw err; }));
      } else {
        // Cliente: contraseña real, el backend la encripta con BCrypt.
        requests['password'] = this.http.put(
          `${base}/password`,
          { password: payload.password.trim() },
          { headers }
        ).pipe(catchError(err => { throw err; }));
      }
    }

    // Sin cambios → devolvemos el perfil actual sin llamadas al backend
    if (Object.keys(requests).length === 0) {
      return of(this.normalizeProfile(null, user));
    }

    return forkJoin(requests).pipe(
      map(() => {
        // Construimos el perfil actualizado mezclando los cambios sobre la sesión actual
        const merged: LoggedUser = {
          ...user,
          userName:  payload.userName  ?? user.userName,
          email:     payload.email     ?? user.email,
          phone:     payload.phone     ?? user.phone,
          avatarUrl: payload.avatarUrl ?? user.avatarUrl
        };
        return this.normalizeProfile(null, merged);
      })
    );
  }

  // ── Helpers privados ────────────────────────────────────────────────────

  private profileBaseUrl(type: 'customer' | 'owner', id: string): string {
    return type === 'owner'
      ? `${this.base}/api/owners/${id}`
      : `${this.base}/api/customers/${id}`;
  }

  private headers(): HttpHeaders {
    const raw = sessionStorage.getItem('rhouses_user');
    let token = '';
    try { token = raw ? (JSON.parse(raw)?.token ?? '') : ''; } catch { token = ''; }
    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }

  private normalizeProfile(apiData: any, sessionUser: LoggedUser): UserProfile {
    return {
      id:          apiData?.id        ?? sessionUser.id,
      accountType: sessionUser.accountType,
      userName:    apiData?.userName  ?? sessionUser.userName,
      fullName:    apiData?.fullName  ?? sessionUser.fullName ?? sessionUser.userName,
      email:       apiData?.email     ?? sessionUser.email    ?? '',
      phone:       apiData?.phone     ?? sessionUser.phone    ?? '',
      avatarUrl:   apiData?.avatarUrl ?? sessionUser.avatarUrl ?? ''
    };
  }
}
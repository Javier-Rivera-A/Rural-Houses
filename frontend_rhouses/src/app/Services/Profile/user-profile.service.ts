import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
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
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  password?: string;
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

  getProfile(user: LoggedUser): Observable<UserProfile> {
    const url = this.profileUrl(user.accountType, user.id);
    return this.http.get<ApiResponse<any>>(url, { headers: this.headers() }).pipe(
      map((res) => this.normalizeProfile(res?.data, user))
    );
  }

  updateProfile(user: LoggedUser, payload: UpdateProfilePayload): Observable<UserProfile> {
    const url = this.profileUrl(user.accountType, user.id);
    const body: Record<string, unknown> = {
      userName: user.userName,
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      avatarUrl: payload.avatarUrl ?? ''
    };
    if (payload.password) body['password'] = payload.password;

    return this.http.put<ApiResponse<any>>(url, body, { headers: this.headers() }).pipe(
      map((res) => this.normalizeProfile(res?.data, user))
    );
  }

  private profileUrl(type: 'customer' | 'owner', id: string): string {
    return type === 'owner'
      ? `${this.base}/api/owners/${id}`
      : `${this.base}/api/customers/${id}`;
  }

  private headers(): HttpHeaders {
    const raw = sessionStorage.getItem('rhouses_user');
    let token = '';
    try { token = raw ? (JSON.parse(raw)?.token ?? '') : ''; } catch { token = ''; }
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  private normalizeProfile(apiData: any, sessionUser: LoggedUser): UserProfile {
    return {
      id: apiData?.id ?? sessionUser.id,
      accountType: sessionUser.accountType,
      userName: apiData?.userName ?? sessionUser.userName,
      fullName: apiData?.fullName ?? sessionUser.fullName ?? sessionUser.userName,
      email: apiData?.email ?? sessionUser.email ?? '',
      phone: apiData?.phone ?? sessionUser.phone ?? '',
      avatarUrl: apiData?.avatarUrl ?? sessionUser.avatarUrl ?? ''
    };
  }
}

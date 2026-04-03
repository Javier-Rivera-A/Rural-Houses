import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private readonly base = 'http://localhost:8081';

  constructor(private http: HttpClient) {}

  loginUsuario(credenciales: { userName: string; password: string }, isOwner: boolean): Observable<any> {
    if (isOwner) {
      // /auth/login devuelve { data: { token, type, ownerId, userName } }
      return this.http.post(`${this.base}/auth/login`, credenciales);
    } else {
      // /api/customers/login devuelve { data: "customerId" }
      return this.http.post(`${this.base}/api/customers/login`, credenciales);
    }
  }
}
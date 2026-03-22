import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private apiOwnersUrl = 'http://localhost:8081/api/owners/login';
  private apiCustomersUrl = 'http://localhost:8081/api/customers/login';

  constructor(private http: HttpClient) { }

  loginUsuario(credenciales: any, isOwner: boolean): Observable<any> {
    const url = isOwner ? this.apiOwnersUrl : this.apiCustomersUrl;
    return this.http.post(url, credenciales);
  }
}

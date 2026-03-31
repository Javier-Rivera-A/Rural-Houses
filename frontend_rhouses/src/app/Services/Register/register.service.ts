import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CustomerRegisterPayload {
  userName: string;
  password: string;
  email: string;
  phone: string;
}

export interface OwnerRegisterPayload {
  userName: string;
  password: string;
  accessWord: string;
  email: string;
  phone: string;
}

@Injectable({
  providedIn: 'root'
})
export class RegisterService {
  private apiCustomersUrl = 'http://localhost:8081/api/customers/register';
  private apiOwnersUrl = 'http://localhost:8081/api/owners/register';

  constructor(private http: HttpClient) {}

  registrarCliente(payload: CustomerRegisterPayload): Observable<any> {
    return this.http.post(this.apiCustomersUrl, payload);
  }

  registrarPropietario(payload: OwnerRegisterPayload): Observable<any> {
    return this.http.post(this.apiOwnersUrl, payload);
  }
}

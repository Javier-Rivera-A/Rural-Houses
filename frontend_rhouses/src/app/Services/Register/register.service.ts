import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserRegister } from './register.model';

@Injectable({
  providedIn: 'root'
})
export class RegisterService {
  private apiOwnersUrl = 'http://localhost:8081/api/owners/register';
  private apiCustomersUrl = 'http://localhost:8081/api/customers/register';

  constructor(private http: HttpClient) { }

  crearUsuario(usuario: UserRegister): Observable<any> {
    // Definimos qué URL usar según el rol
    const url = usuario.isOwner ? this.apiOwnersUrl : this.apiCustomersUrl;

    // Adaptar el payload en función de los DTOs que espera Spring Boot
    const requestPayload: any = {
      userName: usuario.username,
      password: usuario.password,
      email: usuario.email,
      phone: usuario.phone
    };

    if (usuario.isOwner) {
      requestPayload.accessWord = usuario.accessWord;
    }

    return this.http.post(url, requestPayload);
  }
}

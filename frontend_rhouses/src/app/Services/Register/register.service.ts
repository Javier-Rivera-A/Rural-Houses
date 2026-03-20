import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserRegister } from './register.model';

@Injectable({
  providedIn: 'root' // Esto hace que el servicio esté disponible en toda la app
})
export class RegisterService {
  // Aquí pondremos la URL del backend cuando este listo.
  private apiUrl = 'http://localhost:8080/api/register';

  // Inyectamos el HttpClient que se configuro en app.config.ts
  constructor(private http: HttpClient) { }

  // Este es el método que enviará los datos
  crearUsuario(usuario: UserRegister): Observable<any> {
    // Hacemos una petición POST, enviando el objeto 'usuario' a la 'apiUrl'
    return this.http.post(this.apiUrl, usuario);
  }
}

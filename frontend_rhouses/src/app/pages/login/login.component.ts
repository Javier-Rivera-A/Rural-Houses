import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { LoginService } from '../../Services/Login/login.service';

interface LoginForm {
  username: string;
  email: string;
  password: string;
  isOwner: boolean;
  accessWord: string;
  rememberMe: boolean;
}

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  accessWord?: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  formData: LoginForm = {
    username: '',
    email: '',
    password: '',
    isOwner: false,
    accessWord: '',
    rememberMe: false
  };

  errors: FormErrors = {};
  showPassword = false;
  showAccessWord = false;
  isLoading = false;

  constructor(
    private router: Router, 
    private toastr: ToastrService,
    private loginService: LoginService
  ) {}

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  onInputChange(field: keyof FormErrors): void {
    if (this.errors[field]) {
      delete this.errors[field];
    }
  }

  onOwnerCheckChange(): void {
    if (!this.formData.isOwner) {
      this.formData.accessWord = '';
      delete this.errors.accessWord;
    }
  }

  onSubmit(): void {
    // Validación de front-end
    const newErrors: FormErrors = {};

    if (!this.formData.username) {
      newErrors.username = 'El nombre de usuario es requerido';
    } 

    if (!this.formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } 

    if (this.formData.isOwner) {
      if (!this.formData.accessWord) {
        newErrors.accessWord = 'La palabra de acceso es requerida para propietarios';
      } 
    }

    if (Object.keys(newErrors).length > 0) {
      this.errors = newErrors;
      return;
    }

    this.isLoading = true;

    // Preparar el cuerpo de la petición.
    // Para clientes se envía el password normal. 
    // Para propietarios en este backend, el LoginRequest recibe en "password" la palabra de acceso.
    const requestBody = {
      userName: this.formData.username,
      password: this.formData.isOwner ? this.formData.accessWord : this.formData.password
    };

    // Llamada real al backend
    this.loginService.loginUsuario(requestBody, this.formData.isOwner).subscribe({
      next: (response) => {
        const userType = this.formData.isOwner ? 'propietario' : 'cliente';
        this.toastr.success(
          `Bienvenido de nuevo, ${this.formData.username} (${userType})`,
          '¡Inicio de sesión exitoso!'
        );
        console.log('Login exitoso:', response);
        this.isLoading = false;
        // Redirigir (ej. al inicio o dashboard)
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Login error:', error);
        let errorMsg = 'Por favor verifica tus credenciales.';
        if (error.error && error.error.message) {
            errorMsg = error.error.message;
        }
        this.toastr.error(errorMsg, 'Error al iniciar sesión');
        this.isLoading = false;
      }
    });
  }

  onSocialLogin(provider: string): void {
    this.toastr.info(`Esta es una demostración`, `Iniciando sesión con ${provider}...`);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleAccessWordVisibility(): void {
    this.showAccessWord = !this.showAccessWord;
  }
}


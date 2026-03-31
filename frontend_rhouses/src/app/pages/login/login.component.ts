import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { LoginService } from '../../Services/Login/login.service';

interface LoginForm {
  accountType: 'customer' | 'owner';
  username: string;
  password: string;
  accessWord: string;
  rememberMe: boolean;
}

interface FormErrors {
  username?: string;
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
    accountType: 'customer',
    username: '',
    password: '',
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

  get isOwner(): boolean {
    return this.formData.accountType === 'owner';
  }

  selectAccountType(type: 'customer' | 'owner'): void {
    this.formData.accountType = type;
    this.errors = {};
    if (type === 'customer') {
      this.formData.accessWord = '';
    }
  }

  onInputChange(field: keyof FormErrors): void {
    if (this.errors[field]) {
      delete this.errors[field];
    }
  }

  onSubmit(): void {
    const newErrors: FormErrors = {};

    if (!this.formData.username) {
      newErrors.username = 'El nombre de usuario es requerido';
    }

    if (!this.isOwner && !this.formData.password) {
      newErrors.password = 'La contraseña es requerida';
    }

    if (this.isOwner && !this.formData.accessWord) {
      newErrors.accessWord = 'La palabra de acceso es requerida';
    }

    if (Object.keys(newErrors).length > 0) {
      this.errors = newErrors;
      return;
    }

    this.isLoading = true;

    // El backend LoginRequest recibe userName y password.
    // Para propietarios, el "password" del request es la accessWord.
    const requestBody = {
      userName: this.formData.username,
      password: this.isOwner ? this.formData.accessWord : this.formData.password
    };

    this.loginService.loginUsuario(requestBody, this.isOwner).subscribe({
      next: (response) => {
        const tipo = this.isOwner ? 'propietario' : 'cliente';
        this.toastr.success(
          `Bienvenido de nuevo, ${this.formData.username} (${tipo})`,
          '¡Inicio de sesión exitoso!'
        );
        this.isLoading = false;
        this.router.navigate(['/']);
      },
      error: (error) => {
        let errorMsg = 'Por favor verifica tus credenciales.';
        if (error.error?.message) {
          errorMsg = error.error.message;
        }
        this.toastr.error(errorMsg, 'Error al iniciar sesión');
        this.isLoading = false;
      }
    });
  }

  onSocialLogin(provider: string): void {
    this.toastr.info('Esta es una demostración', `Iniciando sesión con ${provider}...`);
  }

  togglePasswordVisibility(): void { this.showPassword = !this.showPassword; }
  toggleAccessWordVisibility(): void { this.showAccessWord = !this.showAccessWord; }
}

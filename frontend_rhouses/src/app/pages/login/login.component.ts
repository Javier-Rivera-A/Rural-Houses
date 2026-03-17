import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

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

  constructor(private router: Router, private toastr: ToastrService) {}

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

  async onSubmit(): Promise<void> {
    // Validación
    const newErrors: FormErrors = {};

    if (!this.formData.username) {
      newErrors.username = 'El nombre de usuario es requerido';
    } else if (this.formData.username.length < 3) {
      newErrors.username = 'El usuario debe tener al menos 3 caracteres';
    }

    if (!this.formData.email) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!this.validateEmail(this.formData.email)) {
      newErrors.email = 'Por favor ingresa un correo electrónico válido';
    }

    if (!this.formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (this.formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (this.formData.isOwner) {
      if (!this.formData.accessWord) {
        newErrors.accessWord = 'La palabra de acceso es requerida para propietarios';
      } else if (this.formData.accessWord.length < 4) {
        newErrors.accessWord = 'La palabra de acceso debe tener al menos 4 caracteres';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      this.errors = newErrors;
      return;
    }

    // Simular login
    this.isLoading = true;

    try {
      // Simulación de llamada API
      await new Promise(resolve => setTimeout(resolve, 1500));

      const userType = this.formData.isOwner ? 'propietario' : 'usuario';
      this.toastr.success(
        `Bienvenido de nuevo, ${this.formData.username} (${userType})`,
        '¡Inicio de sesión exitoso!'
      );

      console.log('Login successful:', this.formData);
      // Aquí normalmente redirigirías al dashboard
      // this.router.navigate(['/dashboard']);
    } catch (error) {
      this.toastr.error(
        'Por favor verifica tus credenciales',
        'Error al iniciar sesión'
      );
    } finally {
      this.isLoading = false;
    }
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

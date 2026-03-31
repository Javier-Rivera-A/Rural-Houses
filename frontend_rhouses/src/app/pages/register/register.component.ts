import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { RegisterService } from '../../Services/Register/register.service';

interface RegisterForm {
  accountType: 'customer' | 'owner';
  fullName: string;
  email: string;
  phone: string;
  username: string;
  password: string;
  confirmPassword: string;
  accessWord: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
  accessWord?: string;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  step = 1;
  formData: RegisterForm = {
    accountType: 'customer',
    fullName: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    confirmPassword: '',
    accessWord: ''
  };

  errors: FormErrors = {};
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  showAccessWord = false;

  constructor(
    private router: Router,
    private toastr: ToastrService,
    private registerService: RegisterService
  ) {}

  get progressWidth(): number {
    return (this.step / 3) * 100;
  }

  get stepTitle(): string {
    switch (this.step) {
      case 1: return 'Información personal';
      case 2: return 'Credenciales de la cuenta';
      case 3: return 'Confirma y crea tu cuenta';
      default: return '';
    }
  }

  get isOwner(): boolean {
    return this.formData.accountType === 'owner';
  }

  selectAccountType(type: 'customer' | 'owner'): void {
    this.formData.accountType = type;
    // Limpiar accessWord si cambia a cliente
    if (type === 'customer') {
      this.formData.accessWord = '';
      delete this.errors.accessWord;
    }
  }

  onNext(): void {
    let newErrors: FormErrors = {};

    if (this.step === 1) {
      newErrors = this.validateStep1();
    } else if (this.step === 2) {
      newErrors = this.validateStep2();
    }

    if (Object.keys(newErrors).length > 0) {
      this.errors = newErrors;
      return;
    }

    if (this.step < 3) {
      this.isLoading = true;
      setTimeout(() => {
        this.step++;
        this.errors = {};
        this.isLoading = false;
      }, 400);
    } else {
      this.submitForm();
    }
  }

  onBack(): void {
    if (this.step > 1) {
      this.step--;
      this.errors = {};
    }
  }

  submitForm(): void {
    this.isLoading = true;

    if (this.isOwner) {
      const payload = {
        userName: this.formData.username,
        password: this.formData.password,
        accessWord: this.formData.accessWord,
        email: this.formData.email,
        phone: this.formData.phone
      };

      this.registerService.registrarPropietario(payload).subscribe({
        next: (res) => {
          this.toastr.success(
            `Bienvenido propietario, ${this.formData.fullName}`,
            '¡Cuenta creada!'
          );
          this.isLoading = false;
          setTimeout(() => this.router.navigate(['/']), 1800);
        },
        error: (err) => this.handleError(err)
      });
    } else {
      const payload = {
        userName: this.formData.username,
        password: this.formData.password,
        email: this.formData.email,
        phone: this.formData.phone
      };

      this.registerService.registrarCliente(payload).subscribe({
        next: (res) => {
          this.toastr.success(
            `Bienvenido, ${this.formData.fullName}`,
            '¡Cuenta creada!'
          );
          this.isLoading = false;
          setTimeout(() => this.router.navigate(['/']), 1800);
        },
        error: (err) => this.handleError(err)
      });
    }
  }

  handleError(err: any): void {
    this.isLoading = false;
    let msg = 'Por favor intenta nuevamente';
    if (err.error?.message) {
      msg = err.error.message;
    }
    if (err.error?.data) {
      const detalles = Object.values(err.error.data).join('\n');
      this.toastr.error(detalles, msg);
      return;
    }
    this.toastr.error(msg, 'Error al registrarse');
  }

  onInputChange(field: keyof FormErrors): void {
    if (this.errors[field]) {
      delete this.errors[field];
    }
  }

  onSocialRegister(provider: string): void {
    this.toastr.info('Esta es una demostración', `Registrando con ${provider}...`);
  }

  togglePasswordVisibility(): void { this.showPassword = !this.showPassword; }
  toggleConfirmPasswordVisibility(): void { this.showConfirmPassword = !this.showConfirmPassword; }
  toggleAccessWordVisibility(): void { this.showAccessWord = !this.showAccessWord; }

  validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  validatePhone(phone: string): boolean {
    return /^\+?[0-9]{7,15}$/.test(phone);
  }

  validateStep1(): FormErrors {
    const e: FormErrors = {};
    if (!this.formData.fullName) {
      e.fullName = 'El nombre completo es requerido';
    } else if (this.formData.fullName.length < 3) {
      e.fullName = 'El nombre debe tener al menos 3 caracteres';
    }
    if (!this.formData.email) {
      e.email = 'El correo electrónico es requerido';
    } else if (!this.validateEmail(this.formData.email)) {
      e.email = 'Por favor ingresa un correo válido';
    }
    if (!this.formData.phone) {
      e.phone = 'El teléfono es requerido';
    } else if (!this.validatePhone(this.formData.phone)) {
      e.phone = 'Ingresa entre 7 y 15 dígitos (puede incluir "+" al inicio)';
    }
    return e;
  }

  validateStep2(): FormErrors {
    const e: FormErrors = {};
    const userNameRegex = /^[a-zA-Z0-9_.-]+$/;
    const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).+$/;

    if (!this.formData.username) {
      e.username = 'El nombre de usuario es requerido';
    } else if (this.formData.username.length < 4 || this.formData.username.length > 30) {
      e.username = 'El usuario debe tener entre 4 y 30 caracteres';
    } else if (!userNameRegex.test(this.formData.username)) {
      e.username = 'Solo letras, números, puntos, guiones y guiones bajos';
    }

    if (!this.formData.password) {
      e.password = 'La contraseña es requerida';
    } else if (this.formData.password.length < 8) {
      e.password = 'La contraseña debe tener al menos 8 caracteres';
    } else if (!passwordRegex.test(this.formData.password)) {
      e.password = 'Debe contener al menos una mayúscula, un número y un carácter especial';
    }

    if (!this.formData.confirmPassword) {
      e.confirmPassword = 'Confirma tu contraseña';
    } else if (this.formData.password !== this.formData.confirmPassword) {
      e.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (this.isOwner) {
      if (!this.formData.accessWord) {
        e.accessWord = 'La palabra de acceso es requerida para propietarios';
      } else if (this.formData.accessWord.length < 4) {
        e.accessWord = 'La palabra de acceso debe tener al menos 4 caracteres';
      }
    }

    return e;
  }
}

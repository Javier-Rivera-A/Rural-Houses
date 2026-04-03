import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { RegisterService } from '../../Services/Register/register.service';
import { AuthService } from '../../Services/Auth/Auth.service';

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
  private router = inject(Router);
  private toastr = inject(ToastrService);
  private registerService = inject(RegisterService);
  private authService = inject(AuthService);

  step = 1;
  formData: RegisterForm = {
    accountType: 'customer',
    fullName: '', email: '', phone: '',
    username: '', password: '', confirmPassword: '', accessWord: ''
  };
  errors: FormErrors = {};
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  showAccessWord = false;

  get progressWidth(): number { return (this.step / 3) * 100; }
  get stepTitle(): string {
    return ['', 'Información personal', 'Credenciales de la cuenta', 'Confirma y crea tu cuenta'][this.step] ?? '';
  }
  get isOwner(): boolean { return this.formData.accountType === 'owner'; }

  selectAccountType(type: 'customer' | 'owner'): void {
    this.formData.accountType = type;
    if (type === 'customer') { this.formData.accessWord = ''; delete this.errors.accessWord; }
  }

  onNext(): void {
    let e: FormErrors = {};
    if (this.step === 1) e = this.validateStep1();
    else if (this.step === 2) e = this.validateStep2();

    if (Object.keys(e).length > 0) { this.errors = e; return; }

    if (this.step < 3) {
      this.isLoading = true;
      setTimeout(() => { this.step++; this.errors = {}; this.isLoading = false; }, 400);
    } else {
      this.submitForm();
    }
  }

  onBack(): void { if (this.step > 1) { this.step--; this.errors = {}; } }

  submitForm(): void {
    this.isLoading = true;

    const success = (id: string) => {
      this.authService.login({
        id,
        userName: this.formData.username,
        accountType: this.formData.accountType,
        email: this.formData.email
      });
      this.toastr.success(`Bienvenido, ${this.formData.fullName}`, '¡Cuenta creada!');
      this.isLoading = false;
      setTimeout(() => this.router.navigate(['/']), 1500);
    };

    if (this.isOwner) {
      this.registerService.registrarPropietario({
        userName: this.formData.username, password: this.formData.password,
        accessWord: this.formData.accessWord, email: this.formData.email, phone: this.formData.phone
      }).subscribe({
        next: (r) => success(r?.data ?? 'owner'),
        error: (e) => this.handleError(e)
      });
    } else {
      this.registerService.registrarCliente({
        userName: this.formData.username, password: this.formData.password,
        email: this.formData.email, phone: this.formData.phone
      }).subscribe({
        next: (r) => success(r?.data ?? 'customer'),
        error: (e) => this.handleError(e)
      });
    }
  }

  handleError(err: any): void {
    this.isLoading = false;
    let msg = 'Por favor intenta nuevamente';
    if (err.error?.message) msg = err.error.message;
    if (err.error?.data) {
      this.toastr.error(Object.values(err.error.data).join('\n'), msg);
      return;
    }
    this.toastr.error(msg, 'Error al registrarse');
  }

  onInputChange(field: keyof FormErrors): void { if (this.errors[field]) delete this.errors[field]; }
  onSocialRegister(p: string): void { this.toastr.info('Demo', `Registrando con ${p}...`); }
  togglePasswordVisibility():        void { this.showPassword        = !this.showPassword; }
  toggleConfirmPasswordVisibility(): void { this.showConfirmPassword = !this.showConfirmPassword; }
  toggleAccessWordVisibility():      void { this.showAccessWord      = !this.showAccessWord; }

  validateEmail(e: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
  validatePhone(p: string): boolean { return /^\+?[0-9]{7,15}$/.test(p); }

  validateStep1(): FormErrors {
    const e: FormErrors = {};
    if (!this.formData.fullName || this.formData.fullName.length < 3) e.fullName = 'Al menos 3 caracteres';
    if (!this.formData.email || !this.validateEmail(this.formData.email)) e.email = 'Correo inválido';
    if (!this.formData.phone || !this.validatePhone(this.formData.phone)) e.phone = '7 a 15 dígitos';
    return e;
  }

  validateStep2(): FormErrors {
    const e: FormErrors = {};
    if (!this.formData.username || this.formData.username.length < 4) e.username = 'Mínimo 4 caracteres';
    if (!this.formData.password || this.formData.password.length < 8) e.password = 'Mínimo 8 caracteres';
    else if (!/^(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).+$/.test(this.formData.password))
      e.password = 'Mayúscula, número y carácter especial';
    if (this.formData.password !== this.formData.confirmPassword) e.confirmPassword = 'Las contraseñas no coinciden';
    if (this.isOwner && (!this.formData.accessWord || this.formData.accessWord.length < 4))
      e.accessWord = 'Mínimo 4 caracteres';
    return e;
  }
}
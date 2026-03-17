import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

interface RegisterForm {
  fullName: string;
  email: string;
  phone: string;
  username: string;
  password: string;
  confirmPassword: string;
  isOwner: boolean;
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
    fullName: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    confirmPassword: '',
    isOwner: false,
    accessWord: ''
  };

  errors: FormErrors = {};
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  showAccessWord = false;

  constructor(private router: Router, private toastr: ToastrService) {}

  get progressWidth(): number {
    return (this.step / 3) * 100;
  }

  get stepTitle(): string {
    switch (this.step) {
      case 1:
        return 'Personal Information';
      case 2:
        return 'Account Credentials';
      case 3:
        return 'Preferences & Confirmation';
      default:
        return '';
    }
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validatePhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-()]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
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

  validateStep1(): FormErrors {
    const newErrors: FormErrors = {};

    if (!this.formData.fullName) {
      newErrors.fullName = 'El nombre completo es requerido';
    } else if (this.formData.fullName.length < 3) {
      newErrors.fullName = 'El nombre debe tener al menos 3 caracteres';
    }

    if (!this.formData.email) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!this.validateEmail(this.formData.email)) {
      newErrors.email = 'Por favor ingresa un correo electrónico válido';
    }

    if (!this.formData.phone) {
      newErrors.phone = 'El teléfono es requerido';
    } else if (!this.validatePhone(this.formData.phone)) {
      newErrors.phone = 'Por favor ingresa un número de teléfono válido';
    }

    return newErrors;
  }

  validateStep2(): FormErrors {
    const newErrors: FormErrors = {};

    if (!this.formData.username) {
      newErrors.username = 'El nombre de usuario es requerido';
    } else if (this.formData.username.length < 3) {
      newErrors.username = 'El usuario debe tener al menos 3 caracteres';
    }

    if (!this.formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (this.formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!this.formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (this.formData.password !== this.formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (this.formData.isOwner) {
      if (!this.formData.accessWord) {
        newErrors.accessWord = 'La palabra de acceso es requerida para propietarios';
      } else if (this.formData.accessWord.length < 4) {
        newErrors.accessWord = 'La palabra de acceso debe tener al menos 4 caracteres';
      }
    }

    return newErrors;
  }

  async onNext(): Promise<void> {
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

    this.isLoading = true;

    try {
      // Simulación de llamada API
      await new Promise(resolve => setTimeout(resolve, 800));

      if (this.step < 3) {
        this.step++;
        this.toastr.success('Continúa con el siguiente paso', `Paso ${this.step - 1} completado`);
      } else {
        // Registro completo
        const userType = this.formData.isOwner ? 'propietario' : 'usuario';
        this.toastr.success(
          `Bienvenido ${this.formData.fullName} como ${userType}`,
          '¡Cuenta creada exitosamente!'
        );
        console.log('Registration complete:', this.formData);
        setTimeout(() => this.router.navigate(['/']), 2000);
      }
    } catch (error) {
      this.toastr.error('Por favor intenta nuevamente', 'Error al procesar');
    } finally {
      this.isLoading = false;
    }
  }

  onBack(): void {
    if (this.step > 1) {
      this.step--;
    }
  }

  onSocialRegister(provider: string): void {
    this.toastr.info('Esta es una demostración', `Registrando con ${provider}...`);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  toggleAccessWordVisibility(): void {
    this.showAccessWord = !this.showAccessWord;
  }
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

// IMPORTAMOS EL SERVICIO
import { RegisterService } from '../../Services/Register/register.service';

interface RegisterForm {
  fullName: string;
  email: string;
  phone: string;
  username: string;
  password: string;
  confirmPassword: string;

}

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  username?: string;
  password?: string;
  confirmPassword?: string;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  // --- ESTADO DEL COMPONENTE ---
  step = 1; //Formulario en el que esta el usuario
  formData: RegisterForm = {
    fullName: '', email: '', phone: '', username: '',
    password: '', confirmPassword: ''
  }; //Formulario para el registro de un usuario

  errors: FormErrors = {}; //Errores que se van recopilando por cada falta de imformacion en un campo en especifico
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;

  // --- INYECCIÓN DE DEPENDENCIAS ---
  constructor(
    private router: Router,
    private toastr: ToastrService,
    private registerService: RegisterService
  ) {}

  // --- GETTERS PARA LA INTERFAZ GRÁFICA ---
  get progressWidth(): number {
    return (this.step / 3) * 100;
  }

  get stepTitle(): string {
    switch (this.step) {
      case 1: return 'Información personal';
      case 2: return 'Credenciales de la cuenta';
      case 3: return 'Confirmación y preferencias';
      default: return '';
    }
  }

  // --- MÉTODOS DE NAVEGACIÓN Y ENVÍO ---
  onNext(): void {
    let newErrors: FormErrors = {};

    // Validamos el paso actual
    if (this.step === 1) {
      newErrors = this.validateStep1();
    } else if (this.step === 2) {
      newErrors = this.validateStep2();
    }

    // Si hay errores, detenemos la ejecución
    if (Object.keys(newErrors).length > 0) {
      this.errors = newErrors;
      return;
    }

    this.isLoading = true;

    // Si aún no estamos en el paso final, avanzamos de página
    if (this.step < 3) {
      setTimeout(() => {
        this.step++; // Aumenta el número del paso del formulario
        this.toastr.success('Continúa con el siguiente paso', `Paso ${this.step - 1} completado`);
        this.isLoading = false;
      }, 500);
    }
    // Si estamos en el paso 3, enviamos al Backend
    else {
      // Sacamos confirmPassword y guardamos el resto en datosParaBackend
      const { confirmPassword, ...datosParaBackend } = this.formData;

      // Nos SUSCRIBIMOS a la respuesta del backend
      this.registerService.crearUsuario(datosParaBackend).subscribe({
        next: (respuestaDelServidor) => {
          const userType = 'propietario';
          this.toastr.success(`Bienvenido ${this.formData.fullName} como ${userType}`, '¡Cuenta creada exitosamente!');
          console.log('Respuesta exitosa del servidor:', respuestaDelServidor);
          this.isLoading = false;
          setTimeout(() => this.router.navigate(['/']), 2000);
        },
        error: (errorServidor) => {
          console.error('Error al registrar:', errorServidor);
          this.isLoading = false;

          let errorMsg = 'Por favor intenta nuevamente';

          if (errorServidor.error && errorServidor.error.message) {
            errorMsg = errorServidor.error.message;
            // Si hay errores de validación, tratar de ser más específico
            if (errorServidor.error.data) {
              const detalles = Object.values(errorServidor.error.data).join('\n');
              this.toastr.error(detalles, errorMsg);
              return;
            }
          }

          this.toastr.error(errorMsg, 'Error al registrarse');
        }
      });
    }
  }

  onBack(): void {
    if (this.step > 1) {
      this.step--; // Disminuye el número del paso y regresa visualmente
    }
  }

  // --- EVENTOS DE LA INTERFAZ (UI) ---
  onInputChange(field: keyof FormErrors): void {
    // Borra el error del campo específico cuando el usuario empieza a escribir
    if (this.errors[field]) {
      delete this.errors[field];
    }
  }



  onSocialRegister(provider: string): void {
    this.toastr.info('Esta es una demostración', `Registrando con ${provider}...`);
  }

  togglePasswordVisibility(): void { this.showPassword = !this.showPassword; }
  toggleConfirmPasswordVisibility(): void { this.showConfirmPassword = !this.showConfirmPassword; }

  // --- MÉTODOS DE VALIDACIÓN ---
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // 1. Actualizamos la validación del teléfono según el Backend
  validatePhone(phone: string): boolean {
    const phoneRegex = /^\+?[0-9]{7,15}$/;
    return phoneRegex.test(phone);
  }

  public validateStep1(): FormErrors {
    const newErrors: FormErrors = {};

    // El fullName se valida en el frontend, aunque el backend no lo guarde por ahora
    if (!this.formData.fullName) {
      newErrors.fullName = 'El nombre completo es requerido';
    } else if (this.formData.fullName.length < 3) {
      newErrors.fullName = 'El nombre debe tener al menos 3 caracteres';
    }

    if (!this.formData.email) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!this.validateEmail(this.formData.email)) {
      newErrors.email = 'Por favor ingresa un correo válido';
    }

    if (!this.formData.phone) {
      newErrors.phone = 'El teléfono es requerido';
    } else if (!this.validatePhone(this.formData.phone)) {
      newErrors.phone = 'Ingresa entre 7 y 15 dígitos (puede incluir "+" al inicio)';
    }

    return newErrors;
  }

  public validateStep2(): FormErrors {
    const newErrors: FormErrors = {};

    // 2. Actualizamos validación del Usuario según el Backend
    const userNameRegex = /^[a-zA-Z0-9_.-]+$/;

    if (!this.formData.username) {
      newErrors.username = 'El nombre de usuario es requerido';
    } else if (this.formData.username.length < 4 || this.formData.username.length > 30) {
      newErrors.username = 'El usuario debe tener entre 4 y 30 caracteres';
    } else if (!userNameRegex.test(this.formData.username)) {
      newErrors.username = 'Solo letras, números, puntos, guiones y guiones bajos';
    }

    // 3. Actualizamos validación de la Contraseña según el Backend
    const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).+$/;

    if (!this.formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (this.formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    } else if (!passwordRegex.test(this.formData.password)) {
      newErrors.password = 'Debe contener al menos una mayúscula, un número y un carácter especial';
    }

    if (!this.formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (this.formData.password !== this.formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    return newErrors;
  }
  public validateStep3(): FormErrors {
    return {};
  }
}

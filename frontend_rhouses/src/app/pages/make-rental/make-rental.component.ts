<<<<<<< HEAD
import { Component, inject, OnInit } from '@angular/core';
=======
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
>>>>>>> devVal
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../Services/Auth/Auth.service';
import { NavbarComponent } from '../homepage/components/navbar/navbar.component';
import { CountryHouseService, CountryHouseResponse, RentalPackageResponse } from '../../Services/CountryHouse/country-house.service';
import { RentalService, RentalResponse } from '../../Services/Rental/rental.service';
<<<<<<< HEAD

// Interfaz para la vista de la reserva confirmada
=======
import { AvailabilityCalendarComponent } from '../rental-package/Components/availability-calendar.component';
import { ReservationOverlay } from '../rental-package/Components/availability-calendar.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

>>>>>>> devVal
export interface ConfirmedRentalVM extends RentalResponse {
  uiCheckIn?: string;
  uiCheckOut?: string;
}

<<<<<<< HEAD
@Component({
  selector: 'app-make-rental',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
=======
interface StepDef {
  label: string;
}

@Component({
  selector: 'app-make-rental',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent, AvailabilityCalendarComponent],
>>>>>>> devVal
  templateUrl: './make-rental.component.html',
  styleUrls: ['./make-rental.component.css']
})
export class MakeRentalComponent implements OnInit {
  private route       = inject(ActivatedRoute);
  private router      = inject(Router);
  private toastr      = inject(ToastrService);
  private houseSvc    = inject(CountryHouseService);
  private rentalSvc   = inject(RentalService);
<<<<<<< HEAD
=======
  private destroyRef  = inject(DestroyRef);
>>>>>>> devVal
  authService         = inject(AuthService);

  house: CountryHouseResponse | null = null;
  packages: RentalPackageResponse[] = [];
  isLoading    = true;
  isSubmitting = false;

  confirmedRental: ConfirmedRentalVM | null = null;
<<<<<<< HEAD
=======
  reservationOverlays: ReservationOverlay[] = [];

  // ── PASO ACTUAL (mejora 2) ──────────────────────────────
  currentStep = 1;

  steps: StepDef[] = [
    { label: 'Paquete'   },
    { label: 'Fechas'    },
    { label: 'Detalles'  },
    { label: 'Confirmar' },
  ];

  // ── PAQUETE SELECCIONADO (mejora 1) ──────────────────────
  selectedPackage: RentalPackageResponse | null = null;
>>>>>>> devVal

  today = new Date().toISOString().split('T')[0];

  form = {
    checkInDate:          '',
    numberNights:         1,
    contactPhoneNumber:   '',
    typeRental:           'ENTIRE_HOUSE' as 'ENTIRE_HOUSE' | 'ROOMS',
    selectedBedroomCodes: [] as string[]
  };

  errors: Record<string, string> = {};

<<<<<<< HEAD
  // --- VARIABLES PRE-CALCULADAS PARA LA VISTA (Evitan el bucle infinito) ---
  calculatedCheckOutDate = '';
  calculatedPrice = 0;
  calculatedDeposit = 0;
  currentPackages: RentalPackageResponse[] = [];
  currentRentalOptions: { value: 'ENTIRE_HOUSE' | 'ROOMS'; label: string; desc: string; icon: string }[] = [];

  uiFormCheckIn = '';
  uiFormCheckOut = '';
  firstPhotoUrl = '';

  get houseId(): string { return this.route.snapshot.paramMap.get('id') ?? ''; }

  ngOnInit(): void {
    if (!this.houseId) { this.router.navigate(['/']); return; }
=======
  // ── VARIABLES PRE-CALCULADAS ─────────────────────────────
  calculatedCheckOutDate = '';
  calculatedPrice = 0;
  calculatedDeposit = 0;
  currentRentalOptions: { value: 'ENTIRE_HOUSE' | 'ROOMS'; label: string; desc: string; icon: string }[] = [];
  uiFormCheckIn  = '';
  uiFormCheckOut = '';
  firstPhotoUrl  = '';

  // ── VALIDACIÓN DE RANGO (mejora 4) ───────────────────────
  dateRangeError = '';
  maxNights = 0;
  maxCheckInDate = '';

  get houseId(): string { return this.route.snapshot.paramMap.get('id') ?? ''; }

  // ── Progreso del stepper ──────────────────────────────────
  get stepProgress(): number { return (this.currentStep / this.steps.length) * 100; }

  ngOnInit(): void {
    if (!this.houseId) { this.router.navigate(['/']); return; }

>>>>>>> devVal
    this.houseSvc.findById(this.houseId).subscribe({
      next: (res) => {
        this.house = res?.data ?? null;
        if (!this.house) { this.router.navigate(['/']); return; }

<<<<<<< HEAD
        // Configuramos la foto inicial
=======
>>>>>>> devVal
        this.firstPhotoUrl = this.house.photo?.[0]?.url?.trim()
          ? this.house.photo[0].url
          : 'https://images.unsplash.com/photo-1572345901383-be2fcd1625f3?w=800&q=80';

        this.loadPackages();
<<<<<<< HEAD
=======
        this.loadReservationOverlays();
        this.rentalSvc.observeActiveRentalsByHouse(this.house.code)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((rentals) => {
            this.reservationOverlays = rentals.map((r) => this.toOverlay(r));
          });
>>>>>>> devVal
      },
      error: () => {
        this.toastr.error('No se pudo cargar la casa', 'Error');
        this.router.navigate(['/']);
      }
    });
  }

  loadPackages(): void {
    this.houseSvc.getPackagesByHouse(this.houseId).subscribe({
      next: (res) => {
        this.packages  = res?.data ?? [];
        this.isLoading = false;
<<<<<<< HEAD
        this.updateCalculations(); // Calculamos todo por primera vez
=======
>>>>>>> devVal
      },
      error: () => { this.isLoading = false; }
    });
  }

<<<<<<< HEAD
  // --- LÓGICA DE CÁLCULO ESTÁTICO ---
  // Se llama desde el HTML usando (ngModelChange)
  onInputsChanged(field: string): void {
    this.errors[field] = '';
=======
  private loadReservationOverlays(): void {
    const user = this.authService.user();
    if (!user?.id) return;

    this.rentalSvc.findByCustomer(user.id).subscribe({
      next: () => {},
      error: () => {}
    });
  }

  // ── MEJORA 1: Selección explícita de paquete ─────────────
  selectPackage(pkg: RentalPackageResponse): void {
    this.selectedPackage = pkg;
    // Resetear fechas al cambiar de paquete
    this.form.checkInDate   = '';
    this.form.numberNights  = 1;
    this.dateRangeError     = '';
    this.calculatedPrice    = 0;
    this.calculatedDeposit  = 0;
    this.uiFormCheckIn      = '';
    this.uiFormCheckOut     = '';
    this.updateRentalOptions();
  }

  // ── MEJORA 2: Navegación entre pasos ─────────────────────
  canGoToStep(step: number): boolean {
    if (step === 1) return true;
    if (step === 2) return !!this.selectedPackage;
    if (step === 3) return !!this.selectedPackage && !!this.form.checkInDate && this.form.numberNights > 0 && !this.dateRangeError;
    if (step === 4) return this.canAdvanceStep3();
    return false;
  }

  goToStep(step: number): void {
    if (this.canGoToStep(step)) this.currentStep = step;
  }

  canAdvanceStep(): boolean {
    switch (this.currentStep) {
      case 1: return !!this.selectedPackage;
      case 2: return !!this.form.checkInDate && this.form.numberNights > 0 && !this.dateRangeError;
      case 3: return this.canAdvanceStep3();
      default: return true;
    }
  }

  private canAdvanceStep3(): boolean {
    if (!this.form.contactPhoneNumber.trim()) return false;
    if (this.form.typeRental === 'ROOMS' && this.form.selectedBedroomCodes.length === 0) return false;
    return true;
  }

  nextStep(): void {
    this.errors = {};
    if (!this.validateCurrentStep()) return;
    if (this.currentStep < this.steps.length) this.currentStep++;
  }

  prevStep(): void {
    if (this.currentStep > 1) { this.currentStep--; this.errors = {}; }
  }

  private validateCurrentStep(): boolean {
    switch (this.currentStep) {
      case 1:
        if (!this.selectedPackage) {
          this.toastr.warning('Selecciona un paquete de alquiler para continuar', 'Paquete requerido');
          return false;
        }
        return true;

      case 2:
        return this.validateDates();

      case 3:
        if (!this.form.contactPhoneNumber.trim()) {
          this.errors['phone'] = 'El teléfono de contacto es obligatorio';
          return false;
        }
        if (this.form.typeRental === 'ROOMS' && this.form.selectedBedroomCodes.length === 0) {
          this.errors['bedrooms'] = 'Selecciona al menos una habitación';
          return false;
        }
        return true;

      default:
        return true;
    }
  }

  // ── MEJORA 4: Validación de rango dentro del paquete ─────
  private validateDates(): boolean {
    this.dateRangeError = '';
    this.errors = {};

    if (!this.form.checkInDate) {
      this.errors['checkIn'] = 'La fecha de entrada es obligatoria';
      return false;
    }
    if (this.form.checkInDate < this.today) {
      this.errors['checkIn'] = 'La fecha no puede ser en el pasado';
      return false;
    }
    if (!this.form.numberNights || this.form.numberNights < 1) {
      this.errors['nights'] = 'Mínimo 1 noche';
      return false;
    }

    if (this.selectedPackage) {
      const pkgStart = this.selectedPackage.startingDate.split('T')[0];
      const pkgEnd   = this.selectedPackage.endingDate.split('T')[0];
      const checkIn  = this.form.checkInDate;
      const checkOut = this.calculatedCheckOutDate;

      if (checkIn < pkgStart) {
        this.errors['checkIn'] = `La fecha de entrada no puede ser antes del ${this.formatDate(pkgStart)}`;
        return false;
      }
      if (checkOut > pkgEnd) {
        const availableNights = this.getMaxNightsFromDate(checkIn);
        this.errors['nights'] = `Con esa fecha de entrada, el máximo es ${availableNights} noche${availableNights !== 1 ? 's' : ''} (el paquete termina el ${this.formatDate(pkgEnd)})`;
        return false;
      }
    }

    return true;
  }

  private getMaxNightsFromDate(checkIn: string): number {
    if (!this.selectedPackage || !checkIn) return 0;
    const pkgEnd = new Date(this.selectedPackage.endingDate.split('T')[0] + 'T00:00:00');
    const ci     = new Date(checkIn + 'T00:00:00');
    return Math.max(0, Math.floor((pkgEnd.getTime() - ci.getTime()) / (1000 * 60 * 60 * 24)));
  }

  // ── MEJORA 3 + 4: Cálculo en tiempo real ─────────────────
  onInputsChanged(field: string): void {
    this.errors[field] = '';
    this.dateRangeError = '';
>>>>>>> devVal
    this.updateCalculations();
  }

  updateCalculations(): void {
<<<<<<< HEAD
    // 1. Calcular Fecha de Check-Out
=======
    // Check-out
>>>>>>> devVal
    if (this.form.checkInDate && this.form.numberNights) {
      const d = new Date(this.form.checkInDate + 'T00:00:00');
      d.setDate(d.getDate() + this.form.numberNights);
      this.calculatedCheckOutDate = d.toISOString().split('T')[0];
    } else {
      this.calculatedCheckOutDate = '';
    }

<<<<<<< HEAD
    // Formateo visual de fechas
    this.uiFormCheckIn = this.formatDate(this.form.checkInDate);
    this.uiFormCheckOut = this.formatDate(this.calculatedCheckOutDate);

    // 2. Calcular Paquetes Disponibles
    if (!this.form.checkInDate) {
      this.currentPackages = [...this.packages];
    } else {
      const ci = new Date(this.form.checkInDate + 'T00:00:00');
      const co = this.calculatedCheckOutDate ? new Date(this.calculatedCheckOutDate + 'T00:00:00') : null;
      this.currentPackages = this.packages.filter(p => {
        const s = new Date(p.startingDate.split('T')[0] + 'T00:00:00');
        const e = new Date(p.endingDate.split('T')[0] + 'T00:00:00');
        return ci >= s && (!co || co <= e);
      });
    }

    // 3. Calcular Opciones de Reserva
    const options: any[] = [];
    const pkgTypes = new Set(this.currentPackages.map(p => p.typeRental));

    if (pkgTypes.has('ENTIRE_HOUSE') || pkgTypes.has('BOTH')) {
      options.push({ value: 'ENTIRE_HOUSE', label: 'Casa completa', desc: 'Reserva toda la propiedad', icon: '🏠' });
    }
    if (pkgTypes.has('ROOMS') || pkgTypes.has('BOTH')) {
      options.push({ value: 'ROOMS', label: 'Por habitaciones', desc: 'Elige las habitaciones que necesitas', icon: '🛏️' });
    }
    if (!options.length) {
      options.push({ value: 'ENTIRE_HOUSE', label: 'Casa completa', desc: 'Reserva toda la propiedad', icon: '🏠' });
      options.push({ value: 'ROOMS', label: 'Por habitaciones', desc: 'Elige las habitaciones que necesitas', icon: '🛏️' });
    }
    this.currentRentalOptions = options;

    // 4. Calcular Precio y Depósito
    if (this.currentPackages.length && this.form.numberNights) {
      this.calculatedPrice = this.currentPackages[0].priceNight * this.form.numberNights;
    } else {
      this.calculatedPrice = 0;
    }
    this.calculatedDeposit = this.calculatedPrice * 0.2;
  }

  // --- MANEJO DE HABITACIONES ---
=======
    this.uiFormCheckIn  = this.formatDate(this.form.checkInDate);
    this.uiFormCheckOut = this.formatDate(this.calculatedCheckOutDate);

    // Validar rango en tiempo real (mejora 4)
    this.dateRangeError = '';
    if (this.selectedPackage && this.form.checkInDate) {
      const pkgStart = this.selectedPackage.startingDate.split('T')[0];
      const pkgEnd   = this.selectedPackage.endingDate.split('T')[0];

      if (this.form.checkInDate < pkgStart) {
        this.dateRangeError = `La fecha de entrada debe ser a partir del ${this.formatDate(pkgStart)}`;
      } else if (this.calculatedCheckOutDate && this.calculatedCheckOutDate > pkgEnd) {
        const maxN = this.getMaxNightsFromDate(this.form.checkInDate);
        this.dateRangeError = `Con esa fecha de entrada, el máximo es ${maxN} noche${maxN !== 1 ? 's' : ''} (hasta el ${this.formatDate(pkgEnd)})`;
      }

      // Calcular max nights y max check-in
      this.maxNights = this.getMaxNightsFromDate(this.form.checkInDate);
      this.maxCheckInDate = this.computeMaxCheckInDate();
    }

    // Precio (mejora 3)
    if (this.selectedPackage && this.form.numberNights > 0 && !this.dateRangeError) {
      this.calculatedPrice   = this.selectedPackage.priceNight * this.form.numberNights;
      this.calculatedDeposit = this.calculatedPrice * 0.2;
    } else {
      this.calculatedPrice   = 0;
      this.calculatedDeposit = 0;
    }

    this.updateRentalOptions();
  }

  private computeMaxCheckInDate(): string {
    if (!this.selectedPackage) return '';
    // El check-in más tardío permite al menos 1 noche dentro del paquete
    const pkgEnd = new Date(this.selectedPackage.endingDate.split('T')[0] + 'T00:00:00');
    pkgEnd.setDate(pkgEnd.getDate() - 1);
    return pkgEnd.toISOString().split('T')[0];
  }

  private updateRentalOptions(): void {
    if (!this.selectedPackage) {
      this.currentRentalOptions = [
        { value: 'ENTIRE_HOUSE', label: 'Casa completa',    desc: 'Reserva toda la propiedad', icon: '🏠' },
        { value: 'ROOMS',        label: 'Por habitaciones', desc: 'Elige las habitaciones',     icon: '🛏️' }
      ];
      return;
    }

    const type = this.selectedPackage.typeRental;
    const options: typeof this.currentRentalOptions = [];

    if (type === 'ENTIRE_HOUSE' || type === 'BOTH') {
      options.push({ value: 'ENTIRE_HOUSE', label: 'Casa completa',    desc: 'Reserva toda la propiedad', icon: '🏠' });
    }
    if (type === 'ROOMS' || type === 'BOTH') {
      options.push({ value: 'ROOMS', label: 'Por habitaciones', desc: 'Elige las habitaciones que necesitas', icon: '🛏️' });
    }

    this.currentRentalOptions = options;

    // Si el tipo actual no está disponible, resetear al primero permitido
    const available = options.map(o => o.value);
    if (!available.includes(this.form.typeRental)) {
      this.form.typeRental = options[0]?.value ?? 'ENTIRE_HOUSE';
    }
  }

  // ── Habitaciones ──────────────────────────────────────────
>>>>>>> devVal
  toggleBedroom(code: any): void {
    const strCode = String(code);
    const idx = this.form.selectedBedroomCodes.indexOf(strCode);
    if (idx === -1) this.form.selectedBedroomCodes.push(strCode);
    else this.form.selectedBedroomCodes.splice(idx, 1);
    this.errors['bedrooms'] = '';
  }

  isBedroomSelected(code: any): boolean {
    return this.form.selectedBedroomCodes.includes(String(code));
  }

<<<<<<< HEAD
  // --- VALIDACIÓN Y ENVÍO ---
  validate(): boolean {
    const e: Record<string, string> = {};
    if (!this.form.checkInDate) e['checkIn']  = 'La fecha de entrada es obligatoria';
    else if (this.form.checkInDate < this.today) e['checkIn'] = 'La fecha no puede ser en el pasado';
    if (!this.form.numberNights || this.form.numberNights < 1) e['nights'] = 'Mínimo 1 noche';
    if (!this.form.contactPhoneNumber.trim()) e['phone'] = 'El teléfono de contacto es obligatorio';
    if (this.form.typeRental === 'ROOMS' && this.form.selectedBedroomCodes.length === 0) {
      e['bedrooms'] = 'Selecciona al menos una habitación';
    }
=======
  // ── Submit ────────────────────────────────────────────────
  validate(): boolean {
    const e: Record<string, string> = {};

    if (!this.selectedPackage) {
      this.toastr.warning('Selecciona un paquete de alquiler', 'Paquete requerido');
      this.currentStep = 1;
      return false;
    }
    if (!this.form.checkInDate) {
      e['checkIn'] = 'La fecha de entrada es obligatoria';
      this.currentStep = 2;
    } else if (this.dateRangeError) {
      e['checkIn'] = this.dateRangeError;
      this.currentStep = 2;
    }
    if (!this.form.numberNights || this.form.numberNights < 1) {
      e['nights'] = 'Mínimo 1 noche';
      this.currentStep = 2;
    }
    if (!this.form.contactPhoneNumber.trim()) {
      e['phone'] = 'El teléfono de contacto es obligatorio';
      if (this.currentStep > 2) this.currentStep = 3;
    }
    if (this.form.typeRental === 'ROOMS' && this.form.selectedBedroomCodes.length === 0) {
      e['bedrooms'] = 'Selecciona al menos una habitación';
      if (this.currentStep > 2) this.currentStep = 3;
    }

>>>>>>> devVal
    this.errors = e;
    return Object.keys(e).length === 0;
  }

  submit(): void {
    if (!this.validate()) return;

    const customerId = this.authService.isLoggedIn() && !this.authService.isOwner()
      ? this.authService.user()?.id ?? null
      : null;

    this.isSubmitting = true;

    const payload = {
<<<<<<< HEAD
      countryHouseCode:     this.house!.code,
      checkInDate:          this.form.checkInDate,
      numberNights:         this.form.numberNights,
      contactPhoneNumber:   this.form.contactPhoneNumber.trim(),
      typeRental:           this.form.typeRental,
      bedroomCodes:         this.form.typeRental === 'ROOMS' ? this.form.selectedBedroomCodes : undefined
=======
      countryHouseCode:   this.house!.code,
      checkInDate:        this.form.checkInDate,
      numberNights:       this.form.numberNights,
      contactPhoneNumber: this.form.contactPhoneNumber.trim(),
      typeRental:         this.form.typeRental,
      bedroomCodes:       this.form.typeRental === 'ROOMS' ? this.form.selectedBedroomCodes : undefined
>>>>>>> devVal
    };

    this.rentalSvc.makeRental(customerId, payload).subscribe({
      next: (res) => {
        const raw = res?.data;
        if (raw) {
<<<<<<< HEAD
          // Pre-formateamos las fechas de la respuesta
          this.confirmedRental = {
            ...raw,
            uiCheckIn: this.formatDate(raw.checkInDate),
=======
          this.confirmedRental = {
            ...raw,
            uiCheckIn:  this.formatDate(raw.checkInDate),
>>>>>>> devVal
            uiCheckOut: this.formatDate(raw.checkOutDate)
          };
        }
        this.isSubmitting = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (err) => {
        this.toastr.error(err?.error?.message ?? 'No se pudo crear la reserva', 'Error');
        this.isSubmitting = false;
      }
    });
  }

<<<<<<< HEAD
  goBack(): void { this.router.navigate(['/houses', this.houseId]); }
  goMyRentals(): void { this.router.navigate(['/my-rentals']); }
  goHome(): void { this.router.navigate(['/']); }

  private formatDate(d: string): string {
=======
  // ── Helpers ───────────────────────────────────────────────
  getRentalTypeLabel(type: string): string {
    const map: Record<string, string> = {
      ENTIRE_HOUSE: '🏠 Casa completa',
      ROOMS:        '🛏️ Por habitaciones',
      BOTH:         '✨ Ambas opciones'
    };
    return map[type] ?? type;
  }

  getRentalTypeClass(type: string): string {
    const map: Record<string, string> = {
      ENTIRE_HOUSE: 'bg-blue-50 text-blue-700',
      ROOMS:        'bg-purple-50 text-purple-700',
      BOTH:         'bg-green-50 text-green-700'
    };
    return map[type] ?? 'bg-gray-100 text-gray-600';
  }

  formatDate(d: string): string {
>>>>>>> devVal
    if (!d) return '';
    try {
      return new Date(d.split('T')[0] + 'T00:00:00').toLocaleDateString('es-CO', {
        day: '2-digit', month: 'long', year: 'numeric'
      });
<<<<<<< HEAD
    }
    catch { return d; }
  }
}
=======
    } catch { return d; }
  }

  getDurationDays(start: string, end: string): number {
    try {
      const s = new Date(start.split('T')[0] + 'T00:00:00').getTime();
      const e = new Date(end.split('T')[0]   + 'T00:00:00').getTime();
      return Math.max(0, Math.round((e - s) / (1000 * 60 * 60 * 24)));
    } catch { return 0; }
  }

  goBack():      void { this.router.navigate(['/houses', this.houseId]); }
  goMyRentals(): void { this.router.navigate(['/my-rentals']); }
  goHome():      void { this.router.navigate(['/']); }

  private toOverlay(rental: RentalResponse): ReservationOverlay {
    return {
      id: rental.id,
      rentalCode: rental.rentalCode,
      checkInDate: rental.checkInDate,
      checkOutDate: rental.checkOutDate,
      state: rental.state
    };
  }
}
>>>>>>> devVal

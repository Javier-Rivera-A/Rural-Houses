import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../Services/Auth/Auth.service';
import { NavbarComponent } from '../homepage/components/navbar/navbar.component';
import { CountryHouseService, CountryHouseResponse, RentalPackageResponse } from '../../Services/CountryHouse/country-house.service';
import { RentalService, RentalResponse } from '../../Services/Rental/rental.service';

// Interfaz para la vista de la reserva confirmada
export interface ConfirmedRentalVM extends RentalResponse {
  uiCheckIn?: string;
  uiCheckOut?: string;
}

@Component({
  selector: 'app-make-rental',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: './make-rental.component.html',
  styleUrls: ['./make-rental.component.css']
})
export class MakeRentalComponent implements OnInit {
  private route       = inject(ActivatedRoute);
  private router      = inject(Router);
  private toastr      = inject(ToastrService);
  private houseSvc    = inject(CountryHouseService);
  private rentalSvc   = inject(RentalService);
  authService         = inject(AuthService);

  house: CountryHouseResponse | null = null;
  packages: RentalPackageResponse[] = [];
  isLoading    = true;
  isSubmitting = false;

  confirmedRental: ConfirmedRentalVM | null = null;

  today = new Date().toISOString().split('T')[0];

  form = {
    checkInDate:          '',
    numberNights:         1,
    contactPhoneNumber:   '',
    typeRental:           'ENTIRE_HOUSE' as 'ENTIRE_HOUSE' | 'ROOMS',
    selectedBedroomCodes: [] as string[]
  };

  errors: Record<string, string> = {};

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
    this.houseSvc.findById(this.houseId).subscribe({
      next: (res) => {
        this.house = res?.data ?? null;
        if (!this.house) { this.router.navigate(['/']); return; }

        // Configuramos la foto inicial
        this.firstPhotoUrl = this.house.photo?.[0]?.url?.trim()
          ? this.house.photo[0].url
          : 'https://images.unsplash.com/photo-1572345901383-be2fcd1625f3?w=800&q=80';

        this.loadPackages();
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
        this.updateCalculations(); // Calculamos todo por primera vez
      },
      error: () => { this.isLoading = false; }
    });
  }

  // --- LÓGICA DE CÁLCULO ESTÁTICO ---
  // Se llama desde el HTML usando (ngModelChange)
  onInputsChanged(field: string): void {
    this.errors[field] = '';
    this.updateCalculations();
  }

  updateCalculations(): void {
    // 1. Calcular Fecha de Check-Out
    if (this.form.checkInDate && this.form.numberNights) {
      const d = new Date(this.form.checkInDate + 'T00:00:00');
      d.setDate(d.getDate() + this.form.numberNights);
      this.calculatedCheckOutDate = d.toISOString().split('T')[0];
    } else {
      this.calculatedCheckOutDate = '';
    }

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
      countryHouseCode:     this.house!.code,
      checkInDate:          this.form.checkInDate,
      numberNights:         this.form.numberNights,
      contactPhoneNumber:   this.form.contactPhoneNumber.trim(),
      typeRental:           this.form.typeRental,
      bedroomCodes:         this.form.typeRental === 'ROOMS' ? this.form.selectedBedroomCodes : undefined
    };

    this.rentalSvc.makeRental(customerId, payload).subscribe({
      next: (res) => {
        const raw = res?.data;
        if (raw) {
          // Pre-formateamos las fechas de la respuesta
          this.confirmedRental = {
            ...raw,
            uiCheckIn: this.formatDate(raw.checkInDate),
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

  goBack(): void { this.router.navigate(['/houses', this.houseId]); }
  goMyRentals(): void { this.router.navigate(['/my-rentals']); }
  goHome(): void { this.router.navigate(['/']); }

  private formatDate(d: string): string {
    if (!d) return '';
    try {
      return new Date(d.split('T')[0] + 'T00:00:00').toLocaleDateString('es-CO', {
        day: '2-digit', month: 'long', year: 'numeric'
      });
    }
    catch { return d; }
  }
}

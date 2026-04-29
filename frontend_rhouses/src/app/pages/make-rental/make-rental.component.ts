import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../Services/Auth/Auth.service';
import { NavbarComponent } from '../homepage/components/navbar/navbar.component';
import { CountryHouseService, CountryHouseResponse, RentalPackageResponse } from '../../Services/CountryHouse/country-house.service';
import { RentalService, RentalResponse } from '../../Services/Rental/rental.service';

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

  // Confirmation overlay
  confirmedRental: RentalResponse | null = null;

  today = new Date().toISOString().split('T')[0];

  form = {
    checkInDate:          '',
    numberNights:         1,
    contactPhoneNumber:   '',
    typeRental:           'ENTIRE_HOUSE' as 'ENTIRE_HOUSE' | 'ROOMS',
    selectedBedroomCodes: [] as string[]
  };

  errors: Record<string, string> = {};

  get houseId(): string { return this.route.snapshot.paramMap.get('id') ?? ''; }

  get checkOutDate(): string {
    if (!this.form.checkInDate || !this.form.numberNights) return '';
    const d = new Date(this.form.checkInDate + 'T00:00:00');
    d.setDate(d.getDate() + this.form.numberNights);
    return d.toISOString().split('T')[0];
  }

  get estimatedPrice(): number {
      if (!this.availablePackages.length || !this.form.numberNights) return 0;
      return this.availablePackages[0].priceNight * this.form.numberNights;
      }

  get deposit(): number { return this.estimatedPrice * 0.2; }

  get availablePackages(): RentalPackageResponse[] {
    if (!this.form.checkInDate) return this.packages;
    const ci = new Date(this.form.checkInDate + 'T00:00:00');
    const co = this.checkOutDate ? new Date(this.checkOutDate + 'T00:00:00') : null;
    return this.packages.filter(p => {
      const s = new Date(p.startingDate.split('T')[0] + 'T00:00:00');
      const e = new Date(p.endingDate.split('T')[0] + 'T00:00:00');
      return ci >= s && (!co || co <= e);
    });
  }

  get rentalTypeOptions(): { value: 'ENTIRE_HOUSE' | 'ROOMS'; label: string; desc: string; icon: string }[] {
    const options = [];
    const pkgTypes = new Set(this.availablePackages.map(p => p.typeRental));
    if (pkgTypes.has('ENTIRE_HOUSE') || pkgTypes.has('BOTH')) {
      options.push({ value: 'ENTIRE_HOUSE' as const, label: 'Casa completa', desc: 'Reserva toda la propiedad', icon: '🏠' });
    }
    if (pkgTypes.has('ROOMS') || pkgTypes.has('BOTH')) {
      options.push({ value: 'ROOMS' as const, label: 'Por habitaciones', desc: 'Elige las habitaciones que necesitas', icon: '🛏️' });
    }
    // fallback: show both if no packages yet
    if (!options.length) {
      options.push({ value: 'ENTIRE_HOUSE' as const, label: 'Casa completa', desc: 'Reserva toda la propiedad', icon: '🏠' });
      options.push({ value: 'ROOMS' as const, label: 'Por habitaciones', desc: 'Elige las habitaciones que necesitas', icon: '🛏️' });
    }
    return options;
  }

  ngOnInit(): void {
    if (!this.houseId) { this.router.navigate(['/']); return; }
    this.houseSvc.findById(this.houseId).subscribe({
      next: (res) => {
        this.house = res?.data ?? null;
        if (!this.house) { this.router.navigate(['/']); return; }
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
      },
      error: () => { this.isLoading = false; }
    });
  }

  toggleBedroom(bedroomCode: string): void {
    const idx = this.form.selectedBedroomCodes.indexOf(bedroomCode);
    if (idx === -1) this.form.selectedBedroomCodes.push(bedroomCode);
    else this.form.selectedBedroomCodes.splice(idx, 1);
    delete this.errors['bedrooms'];
  }

  isBedroomSelected(code: string): boolean {
    return this.form.selectedBedroomCodes.includes(code);
  }

  validate(): boolean {
    const e: Record<string, string> = {};
    if (!this.form.checkInDate)          e['checkIn']  = 'La fecha de entrada es obligatoria';
    else if (this.form.checkInDate < this.today) e['checkIn'] = 'La fecha no puede ser en el pasado';
    if (!this.form.numberNights || this.form.numberNights < 1) e['nights'] = 'Mínimo 1 noche';
    if (!this.form.contactPhoneNumber.trim()) e['phone'] = 'El teléfono de contacto es obligatorio';
    if (this.form.typeRental === 'ROOMS' && this.form.selectedBedroomCodes.length === 0)
      e['bedrooms'] = 'Selecciona al menos una habitación';
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
        this.confirmedRental = res?.data ?? null;
        this.isSubmitting    = false;
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

  formatDate(d: string): string {
    if (!d) return '';
    try { return new Date(d.split('T')[0] + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }); }
    catch { return d; }
  }

  formatCurrency(n: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
  }

  getFirstPhoto(): string {
    return this.house?.photo?.[0]?.url?.trim()
      ? this.house.photo[0].url
      : 'https://images.unsplash.com/photo-1572345901383-be2fcd1625f3?w=800&q=80';
  }
}
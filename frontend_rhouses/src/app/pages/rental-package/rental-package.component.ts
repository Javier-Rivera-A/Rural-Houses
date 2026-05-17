import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../Services/Auth/Auth.service';
import { CountryHouseService, CountryHouseResponse, RentalPackageResponse } from '../../Services/CountryHouse/country-house.service';
import { NavbarComponent } from '../homepage/components/navbar/navbar.component';
import { AvailabilityCalendarComponent } from './Components/availability-calendar.component';
import { ReservationOverlay } from './Components/availability-calendar.component';
import { RentalService, RentalResponse } from '../../Services/Rental/rental.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';

interface PackageForm {
  startingDate: string;
  endingDate:   string;
  priceNight:   number | null;
  pricePerRoomNight: number | null;
  typeRental:   'ENTIRE_HOUSE' | 'ROOMS' | 'BOTH';
}

@Component({
  selector: 'app-rental-package',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, AvailabilityCalendarComponent],
  templateUrl: './rental-package.component.html',
})
export class RentalPackageComponent implements OnInit {
  private route       = inject(ActivatedRoute);
  private router      = inject(Router);
  private authService = inject(AuthService);
  private houseSvc    = inject(CountryHouseService);
  private rentalSvc   = inject(RentalService);
  private toastr      = inject(ToastrService);
  private destroyRef  = inject(DestroyRef);

  ownerId: string | null = null;

  houses:          CountryHouseResponse[] = [];
  isLoadingHouses  = true;

  selectedHouseId: string = '';
  selectedHouse:   CountryHouseResponse | null = null;

  packages:     RentalPackageResponse[] = [];
  reservations: ReservationOverlay[] = [];
  isLoadingPkgs = false;
  private houseReservationsSub?: Subscription;

  showForm  = false;
  editingId: string | null = null;
  isSaving  = false;

  today = new Date().toISOString().split('T')[0];

  form: PackageForm = {
    startingDate: '',
    endingDate:   '',
    priceNight:   null,
    pricePerRoomNight: null,
    typeRental:   'ENTIRE_HOUSE'
  };

  rentalTypeOptions = [
    { value: 'ENTIRE_HOUSE', label: 'Casa completa',    desc: 'Se alquila todo' },
    { value: 'ROOMS',        label: 'Por habitaciones', desc: 'Solo cuartos'    },
    { value: 'BOTH',         label: 'Ambas',            desc: 'Ambas opciones'  }
  ];

  ngOnInit(): void {
    this.ownerId = this.route.snapshot.paramMap.get('ownerid');
    if (!this.authService.isOwner() || !this.ownerId) {
      this.toastr.warning('Acceso no autorizado', 'Error');
      this.router.navigate(['/']);
      return;
    }
    this.loadHouses();
  }

  loadHouses(): void {
    this.isLoadingHouses = true;
    this.houseSvc.findByOwner(this.ownerId!).subscribe({
      next: (res) => {
        this.houses = (res?.data ?? []).filter(h => h.stateCountryHouse === 'ACTIVE');
        this.isLoadingHouses = false;
        if (this.houses.length === 1) {
          this.onHouseChange(this.houses[0].id);
        }
      },
      error: () => {
        this.toastr.error('No se pudieron cargar tus casas', 'Error');
        this.isLoadingHouses = false;
      }
    });
  }

  onHouseChange(houseId: string): void {
    this.selectedHouseId = houseId;
    this.selectedHouse   = this.houses.find(h => h.id === houseId) ?? null;
    this.packages        = [];
    this.reservations    = [];
    this.showForm        = false;
    this.editingId       = null;
    if (houseId) this.loadPackages();
    if (this.selectedHouse?.code) this.loadOwnerReservations(this.selectedHouse.code);
  }

  loadPackages(): void {
    this.isLoadingPkgs = true;
    this.houseSvc.getPackagesByHouse(this.selectedHouseId).subscribe({
      next: (res) => {
        this.packages      = res?.data ?? [];
        this.isLoadingPkgs = false;
      },
      error: (err) => {
        this.toastr.error(err?.error?.message ?? 'No se pudieron cargar los paquetes', 'Error');
        this.isLoadingPkgs = false;
      }
    });
  }

  private loadOwnerReservations(houseCode: string): void {
    // 1. Limpiamos las reservas anteriores del calendario
    this.reservations = [];

    // 2. Cancelamos suscripciones anteriores por si acaso
    this.houseReservationsSub?.unsubscribe();

    // 3. ¡AQUÍ ESTÁ LA CORRECCIÓN!
    // Usamos el método 'findByOwner' pero pasándole el ID DE LA CASA (this.selectedHouseId)
    this.rentalSvc.findByOwner(this.selectedHouseId).subscribe({
      next: (res: any) => {
        // Obtenemos los datos de las reservas que devuelve el backend
        const houseRentals = res?.data ?? res ?? [];

        console.log('Reservas obtenidas para esta casa concreta:', houseRentals);

        // 4. Transformamos las reservas al formato del calendario
        this.reservations = houseRentals.map((r: any) => this.toOverlay(r));
      },
      error: (err) => {
        this.toastr.error('No se pudieron obtener las reservas de la casa', 'Error de Red');
        console.error('Error al llamar a findByOwner con el ID de la casa:', err);
      }
    });
  }
  openForm(): void {
    this.editingId = null;
    this.form = { startingDate: '', endingDate: '', priceNight: null, pricePerRoomNight: null,  typeRental: 'ENTIRE_HOUSE' };
    this.showForm = true;
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  }

  editPackage(pkg: RentalPackageResponse): void {
    this.editingId = pkg.id;
    this.form = {
      startingDate: (pkg.startingDate ?? '').split('T')[0],
      endingDate:   (pkg.endingDate   ?? '').split('T')[0],
      priceNight:   pkg.priceNight,
      pricePerRoomNight: pkg.pricePerRoomNight,
      typeRental:   pkg.typeRental as any
    };
    this.showForm = true;
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  }

  cancelForm(): void {
    this.showForm  = false;
    this.editingId = null;
  }

  savePackage(): void {
    const needsWholePrice = this.form.typeRental === 'ENTIRE_HOUSE' || this.form.typeRental === 'BOTH';
    const needsRoomPrice  = this.form.typeRental === 'ROOMS'        || this.form.typeRental === 'BOTH';

    if (!this.selectedHouseId) {
      this.toastr.warning('Selecciona una casa primero', 'Sin casa seleccionada');
      return;
    }

    if (!this.form.startingDate || !this.form.endingDate) {
      this.toastr.warning('Las fechas son obligatorias', 'Campos requeridos');
      return;
    }

    if (needsWholePrice && (!this.form.priceNight || this.form.priceNight <= 0)) {
      this.toastr.warning('El precio por noche de la casa es obligatorio y debe ser mayor a 0', 'Campos requeridos');
      return;
    }

    if (needsRoomPrice && (!this.form.pricePerRoomNight || this.form.pricePerRoomNight <= 0)) {
      this.toastr.warning('El precio por habitación/noche es obligatorio y debe ser mayor a 0', 'Campos requeridos');
      return;
    }

    if (new Date(this.form.startingDate) >= new Date(this.form.endingDate)) {
      this.toastr.warning('La fecha de inicio debe ser anterior a la fecha de fin', 'Fechas inválidas');
      return;
    }

    this.isSaving = true;

    const payload = {
      startingDate: this.form.startingDate,
      endingDate:   this.form.endingDate,
      priceNight:   Number(this.form.priceNight) || 0,
      pricePerRoomNight: Number(this.form.pricePerRoomNight) || 0,
      typeRental:   this.form.typeRental
    };

    if (this.editingId) {
      this.houseSvc.updateRentalPackage(this.ownerId!, this.editingId, payload).subscribe({
        next: (res) => {
          this.toastr.success('Paquete actualizado', '¡Éxito!');
          this.isSaving = false;
          this.cancelForm();
          this.loadPackages();
        },
        error: (err) => {
          this.toastr.error(err?.error?.message ?? 'Error al actualizar', 'Error');
          this.isSaving = false;
        }
      });
    } else {
      this.houseSvc.addRentalPackage(this.ownerId!, this.selectedHouseId, payload).subscribe({
        next: (res) => {
          this.toastr.success('Paquete creado', '¡Éxito!');
          this.isSaving = false;
          this.cancelForm();
          this.loadPackages();
        },
        error: (err) => {
          this.toastr.error(err?.error?.message ?? 'Error al crear el paquete', 'Error');
          this.isSaving = false;
        }
      });
    }
  }

  deletePackage(id: string): void {
    if (!confirm('¿Eliminar este paquete de alquiler?')) return;
    this.houseSvc.deleteRentalPackage(this.ownerId!, id).subscribe({
      next: () => {
        this.toastr.success('Paquete eliminado', '¡Listo!');
        this.loadPackages();
      },
      error: (err) => {
        this.toastr.error(err?.error?.message ?? 'Error al eliminar', 'Error');
      }
    });
  }

  goBack(): void { this.router.navigate(['/']); }

  formatDate(date: string): string {
    if (!date) return '';
    try {
      return new Date(date.split('T')[0] + 'T00:00:00').toLocaleDateString('es-CO', {
        day: '2-digit', month: 'long', year: 'numeric'
      });
    } catch { return date; }
  }

  getDurationDays(start: string, end: string): number {
    try {
      const s = new Date(start.split('T')[0] + 'T00:00:00').getTime();
      const e = new Date(end.split('T')[0]   + 'T00:00:00').getTime();
      return Math.max(0, Math.round((e - s) / (1000 * 60 * 60 * 24)));
    } catch { return 0; }
  }

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

  getFirstPhoto(house: CountryHouseResponse): string {
    return house.photo?.[0]?.url?.trim()
      ? house.photo[0].url
      : 'https://images.unsplash.com/photo-1572345901383-be2fcd1625f3?w=800&q=80';
  }

  private toOverlay(rental: any): ReservationOverlay {
    // Convertimos el estado a mayúsculas para evitar problemas de formato
    let stateUpper = rental.state ? rental.state.toUpperCase() : '';

    if (stateUpper === 'PAID') {
      stateUpper = 'CONFIRMED';
    }

    return {
      id:           rental.id,
      rentalCode:   rental.rentalCode ?? rental.code,
      checkInDate:  rental.checkInDate,
      checkOutDate: rental.checkOutDate,
      state:        stateUpper as any
    };
  }
}

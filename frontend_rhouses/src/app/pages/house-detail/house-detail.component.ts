import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../homepage/components/navbar/navbar.component';
import { AuthService } from '../../Services/Auth/Auth.service';
import { ToastrService } from 'ngx-toastr';
import { HouseDetailService, HouseDetailResponse } from '../../Services/HouseDetails/house-detail.service';
import { CountryHouseService, RentalPackageResponse } from '../../Services/CountryHouse/country-house.service';
import { AvailabilityCalendarComponent, ReservationOverlay} from '../rental-package/Components/availability-calendar.component';
import { RentalService, RentalResponse } from '../../Services/Rental/rental.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface PackageForm {
  startingDate: string;
  endingDate:   string;
  priceNight:   number | null;
  pricePerRoomNight: number | null;
  typeRental:   'ENTIRE_HOUSE' | 'ROOMS' | 'BOTH';
}

@Component({
  selector: 'app-house-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent, AvailabilityCalendarComponent],
  templateUrl: './house-detail.component.html'
})
export class HouseDetailComponent implements OnInit {

  private route      = inject(ActivatedRoute);
  private router     = inject(Router);
  private houseSvc   = inject(HouseDetailService);
  private countrySvc = inject(CountryHouseService);
  private rentalSvc  = inject(RentalService);
  authService        = inject(AuthService);
  private toastr     = inject(ToastrService);
  private destroyRef = inject(DestroyRef);

  house: HouseDetailResponse | null = null;
  isLoading     = true;
  selectedPhoto = 0;

  showDeactivateModal = false;
  isProcessing = false;

  private houseId = '';

  // ── Paquetes ────────────────────────────────────────────────
  packages:     RentalPackageResponse[] = [];
  reservations: ReservationOverlay[] = [];
  isLoadingPkgs = false;

  showPackageForm = false;
  editingPkgId:   string | null = null;
  isSavingPkg     = false;

  today = new Date().toISOString().split('T')[0];

  pkgForm: PackageForm = {
    startingDate: '',
    endingDate:   '',
    priceNight:   null ,
    pricePerRoomNight: null,
    typeRental:   'ENTIRE_HOUSE'
  };

  rentalTypeOptions = [
    { value: 'ENTIRE_HOUSE', label: 'Casa completa',    desc: 'Se alquila todo' },
    { value: 'ROOMS',        label: 'Por habitaciones', desc: 'Solo cuartos'    },
    { value: 'BOTH',         label: 'Ambas',            desc: 'Ambas opciones'  }
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/']); return; }
    this.houseId = id;

    this.houseSvc.getHouseById(id).subscribe({
      next: (res) => {
        this.house    = res?.data ?? null;
        this.isLoading = false;
        this.loadPackages();
        this.loadReservations();
      },
      error: () => {
        this.toastr.error('No se pudo cargar la casa rural', 'Error');
        this.isLoading = false;
        this.router.navigate(['/']);
      }
    });
  }

  loadPackages(): void {
    this.isLoadingPkgs = true;
    this.countrySvc.getPackagesByHouse(this.houseId).subscribe({
      next: (res) => {
        this.packages      = res?.data ?? [];
        console.log('packages:', this.packages);
        this.isLoadingPkgs = false;
      },
      error: () => {
        this.isLoadingPkgs = false;
      }
    });
  }

  loadReservations(): void {
    // 1. Limpiamos el calendario antes de cargar
    this.reservations = [];
    if (!this.houseId) return;

    // 2. Traemos TODAS las reservas de esta casa específica.
    // Usamos findByOwner porque internamente apunta a /api/rentals/house/{houseId}
    // lo que nos devuelve el estado de ocupación total de la casa.
    this.rentalSvc.findByOwner(this.houseId).subscribe({
      next: (res: any) => {
        const houseRentals = res?.data ?? res ?? [];

        console.log('Todas las reservas de la casa cargadas para el calendario:', houseRentals);

        // 3. Mapeamos todas las reservas para que se dibujen en el calendario
        this.reservations = houseRentals.map((r: any) => this.toOverlay(r));
      },
      error: (err) => {
        console.error('Error al obtener el estado de ocupación de la casa:', err);
      }
    });
  }

  // ── Formulario paquetes ──────────────────────────────────────
  openPkgForm(): void {
    this.editingPkgId = null;
    this.pkgForm = { startingDate: '', endingDate: '', priceNight: null,pricePerRoomNight: null, typeRental: 'ENTIRE_HOUSE' };
    this.showPackageForm = true;
  }

  editPackage(pkg: RentalPackageResponse): void {
    this.editingPkgId = pkg.id;
    this.pkgForm = {
      startingDate: (pkg.startingDate ?? '').split('T')[0],
      endingDate:   (pkg.endingDate   ?? '').split('T')[0],
      priceNight:   pkg.priceNight,
      pricePerRoomNight: pkg.pricePerRoomNight,
      typeRental:   pkg.typeRental as any
    };
    this.showPackageForm = true;
  }

  cancelPkgForm(): void {
    this.showPackageForm = false;
    this.editingPkgId   = null;
  }

  savePackage(): void {
    const needsWholePrice = this.pkgForm.typeRental === 'ENTIRE_HOUSE' || this.pkgForm.typeRental === 'BOTH';
    const needsRoomPrice  = this.pkgForm.typeRental === 'ROOMS'        || this.pkgForm.typeRental === 'BOTH';

    if (!this.pkgForm.startingDate || !this.pkgForm.endingDate) {
      this.toastr.warning('Las fechas son obligatorias', 'Campos requeridos');
      return;
    }
    if (needsWholePrice && (!this.pkgForm.priceNight || this.pkgForm.priceNight <= 0)) {
      this.toastr.warning('El precio por noche es obligatorio y debe ser mayor a 0', 'Campos requeridos');
      return;
    }
    if (needsRoomPrice && (!this.pkgForm.pricePerRoomNight || this.pkgForm.pricePerRoomNight <= 0)) {
      this.toastr.warning('El precio por habitación/noche es obligatorio y debe ser mayor a 0', 'Campos requeridos');
      return;
    }
    if (new Date(this.pkgForm.startingDate) >= new Date(this.pkgForm.endingDate)) {
      this.toastr.warning('La fecha de inicio debe ser anterior a la de fin', 'Fechas inválidas');
      return;
    }

    const ownerId = this.authService.user()?.id;
    if (!ownerId) return;

    this.isSavingPkg = true;
    const payload = {
      startingDate: this.pkgForm.startingDate,
      endingDate:   this.pkgForm.endingDate,
      priceNight:   Number(this.pkgForm.priceNight) || 0,
      pricePerRoomNight: Number(this.pkgForm.pricePerRoomNight) || 0,
      typeRental:   this.pkgForm.typeRental
    };


    if (this.editingPkgId) {
      this.countrySvc
        .updateRentalPackage(ownerId, this.editingPkgId, payload)
        .subscribe({
          next: (res) => {
            this.toastr.success('Paquete actualizado', '¡Éxito!');
            this.isSavingPkg = false;
            this.cancelPkgForm();
            this.loadPackages();
          },
          error: (err) => {
            this.toastr.error(
              err?.error?.message ?? 'Error al actualizar',
              'Error'
            );
            this.isSavingPkg = false;
          }
        });
    } else {
      this.countrySvc.addRentalPackage(ownerId, this.houseId, payload).subscribe({
        next: (res) => {
          this.toastr.success('Paquete creado', '¡Éxito!');
          this.isSavingPkg = false;
          this.cancelPkgForm();
          this.loadPackages();
        },
        error: (err) => {
          this.toastr.error(err?.error?.message ?? 'Error al crear', 'Error');
          this.isSavingPkg = false;
        }
      });
    }
  }

  deletePackage(id: string): void {
    if (!confirm('¿Eliminar este paquete?')) return;
    const ownerId = this.authService.user()?.id;
    if (!ownerId) return;
    this.countrySvc.deleteRentalPackage(ownerId, id).subscribe({
      next: () => {
        this.toastr.success('Paquete eliminado', '¡Listo!');
        this.loadPackages();
      },
      error: (err) => {
        this.toastr.error(err?.error?.message ?? 'Error al eliminar', 'Error');
      }
    });
  }

  // ── Casa ────────────────────────────────────────────────────
  get totalBathrooms(): number {
    if (!this.house) return 0;
    return (this.house.privateBathrooms ?? 0) + (this.house.publicBathrooms ?? 0);
  }

  get photos(): string[] {
    if (!this.house?.photo?.length)
      return ['https://images.unsplash.com/photo-1572345901383-be2fcd1625f3?w=800&q=80'];
    return this.house.photo.map(p => p.url).filter(u => u?.trim());
  }

  selectPhoto(i: number): void { this.selectedPhoto = i; }
  goBack(): void { this.router.navigate(['/']); }
  goToEdit(): void { this.router.navigate(['/edit-house', this.houseId]); }
  openDeactivateModal(): void { this.showDeactivateModal = true; }

  goToMakeRental(): void {
    this.router.navigate(['/make-rental', this.houseId]);
  }

  confirmDeactivate(): void {
    const ownerId = this.authService.user()?.id;
    if (!ownerId || !this.houseId) return;
    this.isProcessing = true;
    this.countrySvc.deactivate(ownerId, this.houseId).subscribe({
      next: () => {
        this.toastr.success('Casa desactivada correctamente', '¡Listo!');
        if (this.house) (this.house as any).stateCountryHouse = 'DISABLED';
        this.isProcessing = false;
        this.showDeactivateModal = false;
      },
      error: (err) => {
        this.toastr.error(err?.error?.message ?? 'Error al desactivar', 'Error');
        this.isProcessing = false;
        this.showDeactivateModal = false;
      }
    });
  }

  reactivateHouse(): void {
    const ownerId = this.authService.user()?.id;
    if (!ownerId || !this.houseId) return;
    this.isProcessing = true;
    this.countrySvc.reactivate(ownerId, this.houseId).subscribe({
      next: () => {
        this.toastr.success('Casa reactivada correctamente', '¡Listo!');
        if (this.house) (this.house as any).stateCountryHouse = 'ACTIVE';
        this.isProcessing = false;
      },
      error: (err) => {
        this.toastr.error(err?.error?.message ?? 'Error al reactivar', 'Error');
        this.isProcessing = false;
      }
    });
  }

  // ── Helpers paquetes ────────────────────────────────────────
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
      ENTIRE_HOUSE: '🏠 Casa completa', ROOMS: '🛏️ Por habitaciones', BOTH: '✨ Ambas opciones'
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

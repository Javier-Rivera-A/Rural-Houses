import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../Services/Auth/Auth.service';
import { CountryHouseService } from '../../Services/CountryHouse/country-house.service';
import { RentalResponse, RentalService } from '../../Services/Rental/rental.service';
import { NavbarComponent } from '../homepage/components/navbar/navbar.component';

@Component({
  selector: 'app-owner-reservations',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './owner-reservations.component.html',
  styleUrls: ['./owner-reservations.component.css']
})
export class OwnerReservationsComponent implements OnInit {
  private auth        = inject(AuthService);
  private rentalSvc   = inject(RentalService);
  private houseSvc    = inject(CountryHouseService);
  private toastr      = inject(ToastrService);
  private router      = inject(Router);
  private destroyRef  = inject(DestroyRef);

  rentals: RentalResponse[] = [];
  ownerHouseCodes = new Set<string>();
  isLoading       = true;

  /** ID de la reserva que está siendo procesada (confirmar/cancelar) */
  processingId: string | null = null;

  selectedTab: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED' | 'ALL' = 'ALL';

  // Modal de confirmación de pago
  confirmTarget: RentalResponse | null = null;
  // Modal de cancelación
  cancelTarget: RentalResponse | null = null;
  isCancelling = false;

  ngOnInit(): void {
    const ownerId = this.auth.user()?.id;
    if (!ownerId || !this.auth.isOwner()) {
      this.router.navigate(['/']);
      return;
    }

    this.houseSvc.findByOwner(ownerId).subscribe({
      next: (res) => {
        this.ownerHouseCodes = new Set((res?.data ?? []).map((h) => h.code));
        this.listenReactiveRentals();
        this.hydrateOwnerRentals(ownerId);
      },
      error: () => {
        this.toastr.error('No se pudieron cargar tus casas', 'Error');
        this.isLoading = false;
      }
    });
  }

  get filteredRentals(): RentalResponse[] {
    const filtered = this.rentals.filter((r) => this.ownerHouseCodes.has(r.countryHouseCode));
    if (this.selectedTab === 'ALL') return filtered;
    return filtered.filter((r) => r.state === this.selectedTab);
  }

  get pendingCount():   number { return this.rentals.filter(r => this.ownerHouseCodes.has(r.countryHouseCode) && r.state === 'PENDING').length; }
  get confirmedCount(): number { return this.rentals.filter(r => this.ownerHouseCodes.has(r.countryHouseCode) && r.state === 'CONFIRMED').length; }

  // ── Confirmar pago (propietario) ─────────────────────────────────────────

  openConfirmModal(rental: RentalResponse): void {
    this.confirmTarget = rental;
  }

  closeConfirmModal(): void {
    this.confirmTarget = null;
  }

  confirmPayment(): void {
    if (!this.confirmTarget) return;
    const ownerId = this.auth.user()?.id;
    if (!ownerId) return;

    const rental = this.confirmTarget;
    this.processingId = rental.id;
    this.confirmTarget = null;

    const amount = Math.ceil(rental.totalPrice * 0.2);

    this.rentalSvc.registerPaymentAsOwner(rental.id, amount, ownerId).subscribe({
      next: () => {
        this.toastr.success(
          `Reserva ${rental.rentalCode} confirmada. El cliente ha sido notificado.`,
          '✅ Pago confirmado'
        );
        this.processingId = null;
      },
      error: (err) => {
        this.toastr.error(err?.error?.message ?? 'No se pudo confirmar el pago', 'Error');
        this.processingId = null;
      }
    });
  }

  // ── Cancelar reserva (propietario) ───────────────────────────────────────

  openCancelModal(rental: RentalResponse): void {
    this.cancelTarget = rental;
  }

  closeCancelModal(): void {
    this.cancelTarget = null;
  }

  confirmCancel(): void {
    if (!this.cancelTarget) return;
    const ownerId = this.auth.user()?.id;
    if (!ownerId) return;

    const rental = this.cancelTarget;
    this.isCancelling  = true;
    this.cancelTarget  = null;

    this.rentalSvc.cancelAsOwner(rental.id, ownerId).subscribe({
      next: () => {
        this.toastr.warning(
          `Reserva ${rental.rentalCode} cancelada. El cliente ha sido notificado.`,
          '❌ Reserva cancelada'
        );
        this.isCancelling = false;
      },
      error: (err) => {
        this.toastr.error(err?.error?.message ?? 'No se pudo cancelar la reserva', 'Error');
        this.isCancelling = false;
      }
    });
  }

  canMarkExpired(rental: RentalResponse): boolean {
    if (rental.state !== 'PENDING') return false;
    const checkIn = new Date(rental.checkInDate.split('T')[0] + 'T00:00:00').getTime();
    return checkIn < new Date().setHours(0, 0, 0, 0);
  }

  markExpired(rental: RentalResponse): void {
    this.rentalSvc.updateRentalStateLocal(rental.id, 'EXPIRED');
    this.toastr.warning(`Reserva ${rental.rentalCode} marcada como vencida`, 'Vencida');
  }

  isProcessing(rentalId: string): boolean {
    return this.processingId === rentalId;
  }

  formatDate(date: string): string {
    return new Date(date.split('T')[0] + 'T00:00:00').toLocaleDateString('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  private listenReactiveRentals(): void {
    this.rentalSvc.observeRentals()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((rentals) => {
        this.rentals = [...rentals].sort((a, b) =>
          b.rentalDayMade.localeCompare(a.rentalDayMade)
        );
        this.isLoading = false;
      });
  }

  private hydrateOwnerRentals(ownerId: string): void {
    this.rentalSvc.findByOwner(ownerId).subscribe({
      next: () => {},
      error: () => { this.toastr.error('No se pudieron cargar las reservas', 'Error'); }
    });
  }
}
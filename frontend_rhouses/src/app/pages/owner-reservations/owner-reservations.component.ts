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

  processingId: string | null = null;

  selectedTab: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED' | 'ALL' = 'ALL';

  confirmTarget: RentalResponse | null = null;
  cancelTarget:  RentalResponse | null = null;
  isCancelling   = false;

  expiredTarget: RentalResponse | null = null;
  isProcessingExpired = false;

  ngOnInit(): void {
    const ownerId = this.auth.user()?.id;
    if (!ownerId || !this.auth.isOwner()) {
      this.router.navigate(['/']);
      return;
    }

    this.houseSvc.findByOwner(ownerId).subscribe({
      next: (res) => {
        const houses = res?.data ?? [];
        this.ownerHouseCodes = new Set(houses.map((h) => h.code));
        this.listenReactiveRentals();
        
        this.hydrateOwnerRentals(houses.map(h => h.id));
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

  get pendingCount(): number {
    return this.rentals.filter(r =>
      this.ownerHouseCodes.has(r.countryHouseCode) && r.state === 'PENDING'
    ).length;
  }

  get confirmedCount(): number {
    return this.rentals.filter(r =>
      this.ownerHouseCodes.has(r.countryHouseCode) && r.state === 'CONFIRMED'
    ).length;
  }

  get expiredPendingCount(): number {
    return this.rentals.filter(r =>
      this.ownerHouseCodes.has(r.countryHouseCode) &&
      r.state === 'PENDING' &&
      this.isOverdue(r)
    ).length;
  }

  // ── Escenario 1: Confirmar pago recibido ─────────────────────────────────

  openConfirmModal(rental: RentalResponse): void  { this.confirmTarget = rental; }
  closeConfirmModal(): void { this.confirmTarget = null; }

  confirmPayment(): void {
    if (!this.confirmTarget) return;
    const ownerId = this.auth.user()?.id;
    if (!ownerId) return;

    const rental = this.confirmTarget;
    this.processingId  = rental.id;
    this.confirmTarget = null;

    const amount = Math.ceil(rental.totalPrice * 0.2);

    this.rentalSvc.registerPaymentAsOwner(rental.id, amount, ownerId).subscribe({
      next: () => {
        this.toastr.success(
          `Reserva ${rental.rentalCode} confirmada. El cliente puede visualizar la confirmación.`,
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

  // ── Escenario 2: Pago vencido ─────────────────────────────────────────────

  isOverdue(rental: RentalResponse): boolean {
    if (rental.state !== 'PENDING') return false;
    try {
      const madeDateMs  = new Date(rental.rentalDayMade.split('T')[0] + 'T00:00:00').getTime();
      const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
      return Date.now() > madeDateMs + threeDaysMs;
    } catch {
      return false;
    }
  }

  daysSinceCreation(rental: RentalResponse): number {
    try {
      const madeDateMs = new Date(rental.rentalDayMade.split('T')[0] + 'T00:00:00').getTime();
      return Math.floor((Date.now() - madeDateMs) / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  }

  openExpiredModal(rental: RentalResponse): void  { this.expiredTarget = rental; }
  closeExpiredModal(): void { this.expiredTarget = null; }

  cancelExpiredRental(): void {
    if (!this.expiredTarget) return;
    const ownerId = this.auth.user()?.id;
    if (!ownerId) return;

    const rental = this.expiredTarget;
    this.isProcessingExpired = true;
    this.expiredTarget       = null;

    this.rentalSvc.cancelAsOwner(rental.id, ownerId).subscribe({
      next: () => {
        this.toastr.warning(
          `Reserva ${rental.rentalCode} cancelada por falta de pago. Las fechas quedan libres.`,
          '❌ Reserva cancelada'
        );
        this.isProcessingExpired = false;
      },
      error: (err) => {
        this.toastr.error(err?.error?.message ?? 'No se pudo cancelar la reserva', 'Error');
        this.isProcessingExpired = false;
      }
    });
  }

  keepExpiredRental(): void {
    if (!this.expiredTarget) return;
    const rental = this.expiredTarget;
    this.expiredTarget = null;
    this.toastr.info(
      `Reserva ${rental.rentalCode} mantenida. Puedes confirmar el pago cuando lo recibas.`,
      'Reserva mantenida'
    );
  }

  // ── Cancelar reserva (acción directa) ────────────────────────────────────

  openCancelModal(rental: RentalResponse): void  { this.cancelTarget = rental; }
  closeCancelModal(): void { this.cancelTarget = null; }

  confirmCancel(): void {
    if (!this.cancelTarget) return;
    const ownerId = this.auth.user()?.id;
    if (!ownerId) return;

    const rental = this.cancelTarget;
    this.isCancelling  = true;
    this.cancelTarget  = null;

    this.rentalSvc.cancelAsOwner(rental.id, ownerId).subscribe({
      next: () => {
        this.toastr.warning(`Reserva ${rental.rentalCode} cancelada.`, '❌ Reserva cancelada');
        this.isCancelling = false;
      },
      error: (err) => {
        this.toastr.error(err?.error?.message ?? 'No se pudo cancelar la reserva', 'Error');
        this.isCancelling = false;
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  canMarkExpired(rental: RentalResponse): boolean {
    return rental.state === 'PENDING' && this.isOverdue(rental);
  }

  markExpired(rental: RentalResponse): void {
    this.rentalSvc.updateRentalStateLocal(rental.id, 'EXPIRED');
    this.toastr.warning(`Reserva ${rental.rentalCode} marcada como vencida`, 'Vencida');
  }

  isProcessing(rentalId: string): boolean {
    return this.processingId === rentalId;
  }

  formatDate(date: string): string {
    if (!date) return '';
    try {
      return new Date(date.split('T')[0] + 'T00:00:00').toLocaleDateString('es-CO', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    } catch { return date; }
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


  private hydrateOwnerRentals(houseIds: string[]): void {
    if (houseIds.length === 0) {
      this.isLoading = false;
      return;
    }
    for (const houseId of houseIds) {
      this.rentalSvc.findByOwner(houseId).subscribe({
        next: () => {},
        error: () => {}
      });
    }
  }
}
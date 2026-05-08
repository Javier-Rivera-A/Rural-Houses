import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../Services/Auth/Auth.service';
import { NavbarComponent } from '../homepage/components/navbar/navbar.component';
import { RentalService, RentalResponse } from '../../Services/Rental/rental.service';
import { BankAccountService, BankAccountData } from '../../Services/BankAccount/BankAccount.service';
import { Subscription } from 'rxjs';

export interface RentalVM extends RentalResponse {
  uiDayMade?: string;
  uiCheckIn?: string;
  uiCheckOut?: string;
  uiBadge?: { label: string; class: string; icon: string };
  uiCanCancel?: boolean;
  uiCanPay?: boolean;
}

@Component({
  selector: 'app-my-rentals',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: './my-rentals.component.html',
  styleUrls: ['./my-rentals.component.css']
})
export class MyRentalsComponent implements OnInit, OnDestroy {
  private rentalSvc    = inject(RentalService);
  private bankSvc      = inject(BankAccountService);
  private router       = inject(Router);
  private toastr       = inject(ToastrService);
  authService          = inject(AuthService);

  rentals:   RentalVM[] = [];
  isLoading  = true;

  searchCode   = '';
  searchResult: RentalVM | null = null;
  searchError  = '';
  isSearching  = false;

  cancelTarget: RentalVM | null = null;
  isCancelling  = false;

  // ── PAGO ──────────────────────────────────────────
  payTarget:          RentalVM | null = null;
  isPaying            = false;
  paymentStep:        'select_account' | 'confirm' | 'processing' | 'success' = 'select_account';
  customerAccounts:   BankAccountData[] = [];
  isLoadingAccounts   = false;
  selectedAccountId:  string = '';

  activeTab: 'list' | 'search' = 'list';
  pendingCount   = 0;
  confirmedCount = 0;

  private rentalsSubscription?: Subscription;

  private readonly stateMap: Record<string, { label: string; class: string; icon: string }> = {
    PENDING:   { label: 'Pendiente',  class: 'bg-yellow-100 text-yellow-800 border-yellow-300',  icon: '⏳' },
    CONFIRMED: { label: 'Confirmada', class: 'bg-green-100  text-green-800  border-green-300',   icon: '✅' },
    CANCELLED: { label: 'Cancelada',  class: 'bg-red-100    text-red-800    border-red-300',     icon: '❌' },
    EXPIRED:   { label: 'Vencida',    class: 'bg-gray-100   text-gray-600   border-gray-300',    icon: '💤' }
  };
  private readonly defaultBadge = {
    label: 'Desconocido',
    class: 'bg-gray-100 text-gray-600 border-gray-300',
    icon: '•'
  };

  ngOnInit(): void {
    const user = this.authService.user();
    if (!user || this.authService.isOwner()) {
      this.toastr.warning('Debes iniciar sesión como cliente', 'Acceso denegado');
      this.router.navigate(['/']);
      return;
    }

    this.rentalsSubscription = this.rentalSvc.observeRentals().subscribe((allRentals) => {
      const myRentals = allRentals.filter(
        r => r.customerUserName === this.authService.user()?.userName
      );
      if (myRentals.length > 0 || !this.isLoading) {
        this.rentals = myRentals.map(r => this.mapToVM(r));
        this.updateCounters();
        if (this.searchResult) {
          const updated = myRentals.find(r => r.id === this.searchResult!.id);
          if (updated) this.searchResult = this.mapToVM(updated);
        }
      }
    });

    this.loadRentals(user.id);
  }

  ngOnDestroy(): void {
    this.rentalsSubscription?.unsubscribe();
  }

  loadRentals(customerId: string): void {
    this.isLoading = true;
    this.rentalSvc.findByCustomer(customerId).subscribe({
      next: (res) => {
        this.rentals = (res?.data ?? []).map(r => this.mapToVM(r));
        this.updateCounters();
        this.isLoading = false;
      },
      error: () => {
        this.toastr.error('No se pudieron cargar tus reservas', 'Error');
        this.isLoading = false;
      }
    });
  }

  private updateCounters(): void {
    this.pendingCount   = this.rentals.filter(r => r.state === 'PENDING').length;
    this.confirmedCount = this.rentals.filter(r => r.state === 'CONFIRMED').length;
  }

  // ── Búsqueda ──────────────────────────────────────
  searchByCode(): void {
    if (!this.searchCode.trim()) return;
    this.isSearching  = true;
    this.searchResult = null;
    this.searchError  = '';
    this.rentalSvc.findByCode(this.searchCode.trim()).subscribe({
      next: (res) => {
        this.searchResult = res?.data ? this.mapToVM(res.data) : null;
        this.isSearching  = false;
        if (!this.searchResult)
          this.searchError = 'No se encontró ninguna reserva con ese código.';
      },
      error: () => {
        this.searchError = 'No se encontró ninguna reserva con ese código.';
        this.isSearching = false;
      }
    });
  }

  // ── Cancelación ───────────────────────────────────
  openCancelModal(rental: RentalVM): void  { this.cancelTarget = rental; }
  closeCancelModal(): void                  { this.cancelTarget = null; }

  confirmCancel(): void {
    if (!this.cancelTarget) return;
    const user = this.authService.user();
    if (!user) return;

    this.isCancelling = true;
    this.rentalSvc.cancelByCustomer(this.cancelTarget.id, user.id).subscribe({
      next: (res) => {
        const vmUpdated = res?.data ? this.mapToVM(res.data) : null;
        if (vmUpdated) {
          const idx = this.rentals.findIndex(r => r.id === vmUpdated.id);
          if (idx !== -1) { this.rentals[idx] = vmUpdated; this.updateCounters(); }
          if (this.searchResult?.id === vmUpdated.id) this.searchResult = vmUpdated;
        }
        this.toastr.success('Reserva cancelada correctamente', '¡Cancelada!');
        this.isCancelling = false;
        this.cancelTarget = null;
      },
      error: (err) => {
        this.toastr.error(err?.error?.message ?? 'No se pudo cancelar', 'Error');
        this.isCancelling = false;
        this.cancelTarget = null;
      }
    });
  }

  // ── Pago real del anticipo ─────────────────────────
  openPayModal(rental: RentalVM): void {
    this.payTarget       = rental;
    this.paymentStep     = 'select_account';
    this.selectedAccountId = '';
    this.customerAccounts  = [];
    this.isPaying          = false;
    this.loadCustomerAccounts();
  }

  closePayModal(): void {
    if (this.isPaying) return;
    this.payTarget         = null;
    this.selectedAccountId = '';
    this.paymentStep       = 'select_account';
  }

  private loadCustomerAccounts(): void {
    const userId = this.authService.user()?.id;
    if (!userId) return;
    this.isLoadingAccounts = true;
    this.bankSvc.getByUser(userId).subscribe({
      next: (res) => {
        this.customerAccounts  = res?.data ?? [];
        this.isLoadingAccounts = false;
        // Preseleccionar la primera cuenta si solo hay una
        if (this.customerAccounts.length === 1) {
          this.selectedAccountId = this.customerAccounts[0].id;
        }
      },
      error: () => {
        this.toastr.error('No se pudieron cargar tus cuentas bancarias', 'Error');
        this.isLoadingAccounts = false;
      }
    });
  }

  get depositAmount(): number {
    return this.payTarget ? this.payTarget.totalPrice * 0.2 : 0;
  }

  get selectedAccount(): BankAccountData | undefined {
    return this.customerAccounts.find(a => a.id === this.selectedAccountId);
  }

  get hasSufficientFunds(): boolean {
    if (!this.selectedAccount) return false;
    return this.selectedAccount.mount >= this.depositAmount;
  }

  proceedToConfirm(): void {
    if (!this.selectedAccountId) {
      this.toastr.warning('Selecciona una cuenta bancaria', 'Cuenta requerida');
      return;
    }
    if (!this.hasSufficientFunds) {
      this.toastr.error(
        `Saldo insuficiente. Necesitas $${this.depositAmount.toFixed(2)} pero tu cuenta tiene $${this.selectedAccount?.mount.toFixed(2)}`,
        'Saldo insuficiente'
      );
      return;
    }
    this.paymentStep = 'confirm';
  }

  confirmPayment(): void {
    if (!this.payTarget || !this.selectedAccountId) return;
    const user = this.authService.user();
    if (!user) return;

    this.isPaying    = true;
    this.paymentStep = 'processing';

    this.rentalSvc.payDeposit(
      this.payTarget.id,
      user.id,
      this.selectedAccountId
    ).subscribe({
      next: (res) => {
        // Actualizar el VM en la lista con la reserva confirmada
        const updated = res?.data ? this.mapToVM(res.data) : null;
        if (updated) {
          const idx = this.rentals.findIndex(r => r.id === updated.id);
          if (idx !== -1) { this.rentals[idx] = updated; this.updateCounters(); }
          if (this.searchResult?.id === updated.id) this.searchResult = updated;
        }
        this.paymentStep = 'success';
        this.isPaying    = false;
      },
      error: (err) => {
        this.toastr.error(
          err?.error?.message ?? 'No se pudo procesar el pago',
          'Error en el pago'
        );
        this.paymentStep = 'confirm';
        this.isPaying    = false;
      }
    });
  }

  formatBalance(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0
    }).format(amount);
  }

  // ── Helpers ───────────────────────────────────────
  private mapToVM(rental: RentalResponse): RentalVM {
    return {
      ...rental,
      uiDayMade:  this.formatDate(rental.rentalDayMade),
      uiCheckIn:  this.formatDate(rental.checkInDate),
      uiCheckOut: this.formatDate(rental.checkOutDate),
      uiBadge:    this.stateMap[rental.state] ?? this.defaultBadge,
      uiCanCancel: rental.state === 'PENDING',
      uiCanPay:    rental.state === 'PENDING'
    };
  }

  private formatDate(d: string): string {
    if (!d) return '';
    try {
      return new Date(d.split('T')[0] + 'T00:00:00').toLocaleDateString('es-CO', {
        day: '2-digit', month: 'long', year: 'numeric'
      });
    } catch { return d; }
  }
}
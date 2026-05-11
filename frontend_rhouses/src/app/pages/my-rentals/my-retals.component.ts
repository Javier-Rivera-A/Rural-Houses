import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../Services/Auth/Auth.service';
import { BankAccountService, BankAccountData } from '../../Services/BankAccount/BankAccount.service';
import { RentalResponse, RentalService } from '../../Services/Rental/rental.service';
import { NavbarComponent } from '../homepage/components/navbar/navbar.component';

interface RentalVM extends RentalResponse {
  uiCheckIn:  string;
  uiCheckOut: string;
  uiDayMade:  string;
  uiBadge?: { label: string; icon: string; class: string };
  uiCanPay:    boolean;
  uiCanCancel: boolean;
}

@Component({
  selector: 'app-my-rentals',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: './my-rentals.component.html',
  styleUrls: ['./my-rentals.component.css']
})
export class MyRentalsComponent implements OnInit {
  private auth       = inject(AuthService);
  private rentalSvc  = inject(RentalService);
  private bankSvc    = inject(BankAccountService);
  private toastr     = inject(ToastrService);
  private router     = inject(Router);

  activeTab: 'list' | 'search' = 'list';
  isLoading   = true;
  isSearching = false;

  rentals:      RentalVM[] = [];
  searchCode    = '';
  searchResult: RentalVM | null = null;
  searchError   = '';

  // Cancel modal
  cancelTarget: RentalVM | null = null;
  isCancelling  = false;

  // Pay modal
  payTarget:       RentalVM | null = null;
  depositAmount    = 0;
  paymentStep: 'select_account' | 'confirm' | 'processing' | 'success' = 'select_account';
  isPaying         = false;
  isLoadingAccounts = false;
  customerAccounts: BankAccountData[] = [];
  selectedAccountId = '';

  get selectedAccount(): BankAccountData | undefined {
    return this.customerAccounts.find(a => a.id === this.selectedAccountId);
  }

  get hasSufficientFunds(): boolean {
    return (this.selectedAccount?.mount ?? 0) >= this.depositAmount;
  }

  get pendingCount():   number { return this.rentals.filter(r => r.state === 'PENDING').length; }
  get confirmedCount(): number { return this.rentals.filter(r => r.state === 'CONFIRMED').length; }

  ngOnInit(): void {
    const user = this.auth.user();
    if (!user || this.auth.isOwner()) {
      this.router.navigate(['/']);
      return;
    }
    this.loadRentals(user.id);
  }

  loadRentals(customerId: string): void {
    this.isLoading = true;
    this.rentalSvc.findByCustomer(customerId).subscribe({
      next: (res) => {
        const raw = res?.data ?? [];
        this.rentals = raw
          .map(r => this.toVM(r))
          .sort((a, b) => b.rentalDayMade.localeCompare(a.rentalDayMade));
        this.isLoading = false;
      },
      error: () => {
        this.toastr.error('No se pudieron cargar tus reservas', 'Error');
        this.isLoading = false;
      }
    });
  }

  searchByCode(): void {
    if (!this.searchCode.trim()) return;
    this.isSearching  = true;
    this.searchResult = null;
    this.searchError  = '';

    this.rentalSvc.findByCode(this.searchCode.trim()).subscribe({
      next: (res) => {
        this.searchResult = res?.data ? this.toVM(res.data) : null;
        if (!this.searchResult) this.searchError = 'No se encontró ninguna reserva con ese código.';
        this.isSearching = false;
      },
      error: () => {
        this.searchError  = 'No se encontró ninguna reserva con ese código.';
        this.isSearching  = false;
      }
    });
  }

  // ── Cancel modal ──────────────────────────────────────────────────────────

  openCancelModal(rental: RentalVM): void  { this.cancelTarget = rental; }
  closeCancelModal(): void { this.cancelTarget = null; }

  confirmCancel(): void {
    if (!this.cancelTarget) return;
    const customerId = this.auth.user()?.id;
    if (!customerId) return;

    const rental = this.cancelTarget;
    this.isCancelling  = true;
    this.cancelTarget  = null;

    
    this.rentalSvc.updateRentalStateLocal(rental.id, 'CANCELLED');
    this.rentals = this.rentals.map(r =>
      r.id === rental.id ? this.toVM({ ...r, state: 'CANCELLED' }) : r
    );
    this.toastr.info(
      `Reserva ${rental.rentalCode} marcada como cancelada. Contacta con el propietario para confirmar.`,
      'Cancelación solicitada'
    );
    this.isCancelling = false;
  }

  // ── Pay modal ─────────────────────────────────────────────────────────────

  openPayModal(rental: RentalVM): void {
    this.payTarget       = rental;
    this.depositAmount   = parseFloat((rental.totalPrice * 0.2).toFixed(2));
    this.paymentStep     = 'select_account';
    this.selectedAccountId = '';
    this.loadCustomerAccounts();
  }

  closePayModal(): void {
    if (this.isPaying) return;
    this.payTarget = null;
    this.customerAccounts = [];
    this.selectedAccountId = '';
  }

  loadCustomerAccounts(): void {
    const userId = this.auth.user()?.id;
    if (!userId) return;
    this.isLoadingAccounts = true;
    this.bankSvc.getByUser(userId).subscribe({
      next: (res) => {
        this.customerAccounts = (res?.data ?? []).map((a: any) => ({
          id:            a.id,
          numberAccount: a.numberAccount ?? '',
          bank:          a.bank ?? a.bankName ?? 'Sin banco',
          accountType:   a.accountType ?? '',
          mount:         a.mount ?? 0
        }));
        // Auto-select first account with sufficient funds
        const suitable = this.customerAccounts.find(a => a.mount >= this.depositAmount);
        if (suitable) this.selectedAccountId = suitable.id;
        this.isLoadingAccounts = false;
      },
      error: () => {
        this.toastr.error('No se pudieron cargar tus cuentas bancarias', 'Error');
        this.isLoadingAccounts = false;
      }
    });
  }

  proceedToConfirm(): void {
    if (!this.selectedAccountId || !this.hasSufficientFunds) return;
    this.paymentStep = 'confirm';
  }

  confirmPayment(): void {
    if (!this.payTarget) return;
    const customerId = this.auth.user()?.id;
    if (!customerId) return;

    this.paymentStep = 'processing';
    this.isPaying    = true;

    this.rentalSvc.payDeposit(this.payTarget.id, customerId, this.depositAmount).subscribe({
      next: () => {
        this.paymentStep = 'success';
        this.isPaying    = false;
        // Refresh the rental in the list
        this.rentals = this.rentals.map(r =>
          r.id === this.payTarget?.id ? this.toVM({ ...r, state: 'CONFIRMED' }) : r
        );
        if (this.searchResult?.id === this.payTarget?.id) {
          this.searchResult = this.toVM({ ...this.searchResult, state: 'CONFIRMED' });
        }
      },
      error: (err) => {
        this.toastr.error(err?.error?.message ?? 'Error al procesar el pago', 'Error');
        this.paymentStep = 'select_account';
        this.isPaying    = false;
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  formatBalance(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', maximumFractionDigits: 0
    }).format(amount ?? 0);
  }

  private toVM(r: RentalResponse): RentalVM {
    const canAct = r.state === 'PENDING' || r.state === 'CONFIRMED';
    return {
      ...r,
      uiCheckIn:  this.formatDate(r.checkInDate),
      uiCheckOut: this.formatDate(r.checkOutDate),
      uiDayMade:  this.formatDate(r.rentalDayMade),
      uiBadge:    this.getBadge(r.state),
      uiCanPay:    r.state === 'PENDING',
      uiCanCancel: r.state === 'PENDING'
    };
  }

  private getBadge(state: RentalResponse['state']): RentalVM['uiBadge'] {
    const map: Record<string, RentalVM['uiBadge']> = {
      PENDING:   { label: 'Pendiente de pago', icon: '⏳', class: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
      CONFIRMED: { label: 'Confirmada',         icon: '✅', class: 'bg-green-50 text-green-800 border-green-200' },
      CANCELLED: { label: 'Cancelada',          icon: '❌', class: 'bg-red-50 text-red-700 border-red-200' },
      EXPIRED:   { label: 'Vencida',            icon: '💤', class: 'bg-gray-50 text-gray-500 border-gray-200' }
    };
    return map[state];
  }

  private formatDate(d: string): string {
    if (!d) return '';
    try {
      return new Date(d.split('T')[0] + 'T00:00:00').toLocaleDateString('es-CO', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    } catch { return d; }
  }
}
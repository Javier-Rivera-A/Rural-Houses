import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../Services/Auth/Auth.service';
import { NavbarComponent } from '../homepage/components/navbar/navbar.component';
import { RentalService, RentalResponse } from '../../Services/Rental/rental.service';


@Component({
  selector: 'app-my-rentals',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: './my-rentals.component.html',
  styleUrls: ['./my-rentals.component.css']
})
export class MyRentalsComponent implements OnInit {
  private rentalSvc = inject(RentalService);
  private router    = inject(Router);
  private toastr    = inject(ToastrService);
  authService       = inject(AuthService);

  rentals:   RentalResponse[] = [];
  isLoading  = true;

  // Search by code
  searchCode = '';
  searchResult: RentalResponse | null = null;
  searchError  = '';
  isSearching  = false;

  // Cancel confirm
  cancelTarget: RentalResponse | null = null;
  isCancelling  = false;

  // Tabs
  activeTab: 'list' | 'search' = 'list';

  ngOnInit(): void {
    const user = this.authService.user();
    if (!user || this.authService.isOwner()) {
      this.toastr.warning('Debes iniciar sesión como cliente', 'Acceso denegado');
      this.router.navigate(['/']);
      return;
    }
    this.loadRentals(user.id);
  }

  loadRentals(customerId: string): void {
    this.isLoading = true;
    this.rentalSvc.findByCustomer(customerId).subscribe({
      next: (res) => {
        this.rentals   = res?.data ?? [];
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
        this.searchResult = res?.data ?? null;
        this.isSearching  = false;
        if (!this.searchResult) this.searchError = 'No se encontró ninguna reserva con ese código.';
      },
      error: () => {
        this.searchError = 'No se encontró ninguna reserva con ese código.';
        this.isSearching = false;
      }
    });
  }

  openCancelModal(rental: RentalResponse): void { this.cancelTarget = rental; }
  closeCancelModal(): void { this.cancelTarget = null; }

  confirmCancel(): void {
    if (!this.cancelTarget) return;
    const customerId = this.authService.user()?.id;
    if (!customerId) return;

    this.isCancelling = true;
    this.rentalSvc.cancelByCustomer(this.cancelTarget.id, customerId).subscribe({
      next: (res) => {
        const updated = res?.data;
        // Update in list
        const idx = this.rentals.findIndex(r => r.id === this.cancelTarget!.id);
        if (idx !== -1 && updated) this.rentals[idx] = updated;
        // Update search result if same
        if (this.searchResult?.id === this.cancelTarget!.id && updated) this.searchResult = updated;
        this.toastr.success('Reserva cancelada. Las fechas han sido liberadas.', '¡Cancelada!');
        this.isCancelling = false;
        this.cancelTarget = null;
      },
      error: (err) => {
        this.toastr.error(err?.error?.message ?? 'No se pudo cancelar la reserva', 'Error');
        this.isCancelling = false;
        this.cancelTarget = null;
      }
    });
  }

  // Helpers
  formatDate(d: string): string {
    if (!d) return '';
    try { return new Date(d.split('T')[0] + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }); }
    catch { return d; }
  }

  getStateBadge(state: string): { label: string; class: string; icon: string } {
    const map: Record<string, { label: string; class: string; icon: string }> = {
      PENDING:   { label: 'Pendiente',  class: 'bg-yellow-100 text-yellow-800 border-yellow-300',  icon: '⏳' },
      CONFIRMED: { label: 'Confirmada', class: 'bg-green-100  text-green-800  border-green-300',   icon: '✅' },
      CANCELLED: { label: 'Cancelada',  class: 'bg-red-100    text-red-800    border-red-300',     icon: '❌' },
      EXPIRED:   { label: 'Vencida',    class: 'bg-gray-100   text-gray-600   border-gray-300',    icon: '💤' }
    };
    return map[state] ?? { label: state, class: 'bg-gray-100 text-gray-600 border-gray-300', icon: '•' };
  }

  canCancel(rental: RentalResponse): boolean { return rental.state === 'PENDING'; }

  get pendingCount(): number   { return this.rentals.filter(r => r.state === 'PENDING').length; }
  get confirmedCount(): number { return this.rentals.filter(r => r.state === 'CONFIRMED').length; }
}
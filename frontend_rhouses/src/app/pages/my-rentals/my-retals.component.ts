import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../Services/Auth/Auth.service';
import { NavbarComponent } from '../homepage/components/navbar/navbar.component';
import { RentalService, RentalResponse } from '../../Services/Rental/rental.service';

// 1. Interfaz extendida para la vista (View Model)
export interface RentalVM extends RentalResponse {
  uiDayMade?: string;
  uiCheckIn?: string;
  uiCheckOut?: string;
  uiBadge?: { label: string; class: string; icon: string };
  uiCanCancel?: boolean;
}

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

  // Ahora usamos nuestra interfaz extendida
  rentals: RentalVM[] = [];
  isLoading = true;

  searchCode = '';
  searchResult: RentalVM | null = null;
  searchError  = '';
  isSearching  = false;

  cancelTarget: RentalVM | null = null;
  isCancelling  = false;

  activeTab: 'list' | 'search' = 'list';

  pendingCount: number = 0;
  confirmedCount: number = 0;

  private readonly stateMap: Record<string, { label: string; class: string; icon: string }> = {
    PENDING:   { label: 'Pendiente',  class: 'bg-yellow-100 text-yellow-800 border-yellow-300',  icon: '⏳' },
    CONFIRMED: { label: 'Confirmada', class: 'bg-green-100  text-green-800  border-green-300',   icon: '✅' },
    CANCELLED: { label: 'Cancelada',  class: 'bg-red-100    text-red-800    border-red-300',     icon: '❌' },
    EXPIRED:   { label: 'Vencida',    class: 'bg-gray-100   text-gray-600   border-gray-300',    icon: '💤' }
  };
  private readonly defaultBadge = { label: 'Desconocido', class: 'bg-gray-100 text-gray-600 border-gray-300', icon: '•' };

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
        const rawRentals = res?.data ?? [];
        // 2. Mapeamos TODA la info visual una sola vez al cargar
        this.rentals = rawRentals.map(r => this.mapRentalToVM(r));
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
    this.pendingCount = this.rentals.filter(r => r.state === 'PENDING').length;
    this.confirmedCount = this.rentals.filter(r => r.state === 'CONFIRMED').length;
  }

  searchByCode(): void {
    if (!this.searchCode.trim()) return;
    this.isSearching  = true;
    this.searchResult = null;
    this.searchError  = '';
    this.rentalSvc.findByCode(this.searchCode.trim()).subscribe({
      next: (res) => {
        const raw = res?.data ?? null;
        // Mapeamos también el resultado de búsqueda
        this.searchResult = raw ? this.mapRentalToVM(raw) : null;
        this.isSearching  = false;
        if (!this.searchResult) this.searchError = 'No se encontró ninguna reserva con ese código.';
      },
      error: () => {
        this.searchError = 'No se encontró ninguna reserva con ese código.';
        this.isSearching = false;
      }
    });
  }

  openCancelModal(rental: RentalVM): void { this.cancelTarget = rental; }
  closeCancelModal(): void { this.cancelTarget = null; }

  confirmCancel(): void {
    if (!this.cancelTarget) return;
    const user = this.authService.user();
    if (!user) return;

    this.isCancelling = true;
    this.rentalSvc.cancelByCustomer(this.cancelTarget.id, user.id).subscribe({
      next: (res) => {
        const updated = res?.data;
        if (updated) {
          const vmUpdated = this.mapRentalToVM(updated);
          const idx = this.rentals.findIndex(r => r.id === vmUpdated.id);
          if (idx !== -1) {
            this.rentals[idx] = vmUpdated;
            this.updateCounters();
          }
          if (this.searchResult?.id === vmUpdated.id) {
            this.searchResult = vmUpdated;
          }
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

  // 3. Centralizamos el formateo aquí
  private mapRentalToVM(rental: RentalResponse): RentalVM {
    return {
      ...rental,
      uiDayMade: this.formatDate(rental.rentalDayMade),
      uiCheckIn: this.formatDate(rental.checkInDate),
      uiCheckOut: this.formatDate(rental.checkOutDate),
      uiBadge: this.stateMap[rental.state] ?? this.defaultBadge,
      uiCanCancel: rental.state === 'PENDING'
    };
  }

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

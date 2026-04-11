import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NavbarComponent } from '../homepage/components/navbar/navbar.component';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../Services/Auth/Auth.service';
import { CountryHouseService, CountryHouseResponse } from '../../Services/CountryHouse/country-house.service';

@Component({
  selector: 'app-my-houses',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  templateUrl: './my-houses.component.html'
})
export class MyHousesComponent implements OnInit {
  authService      = inject(AuthService);
  private router   = inject(Router);
  private toastr   = inject(ToastrService);
  private houseSvc = inject(CountryHouseService);

  houses:    CountryHouseResponse[] = [];
  isLoading  = true;

  showDeactivateModal  = false;
  houseToDeactivate:   CountryHouseResponse | null = null;
  isDeactivating       = false;

  ngOnInit(): void {
    if (!this.authService.isLoggedIn() || !this.authService.isOwner()) {
      this.toastr.warning('Debes ser propietario para ver tus casas', 'Acceso denegado');
      this.router.navigate(['/']);
      return;
    }
    this.loadHouses();
  }

  loadHouses(): void {
    const ownerId = this.authService.user()?.id ?? '';
    this.isLoading = true;

    this.houseSvc.findByOwner(ownerId).subscribe({
      next: (res) => {
        this.houses    = res?.data ?? [];
        this.isLoading = false;
      },
      error: () => {
        this.toastr.error('No se pudieron cargar tus casas', 'Error');
        this.isLoading = false;
      }
    });
  }

  get activeCount():   number { return this.houses.filter(h => h.stateCountryHouse === 'ACTIVE').length; }
  get disabledCount(): number { return this.houses.filter(h => h.stateCountryHouse === 'DISABLED').length; }

  goToDetail(houseId: string):   void { this.router.navigate(['/houses', houseId]); }
  goToEdit(houseId: string):     void { this.router.navigate(['/edit-house', houseId]); }
  goToRegister():                void { this.router.navigate(['/register-house']); }

  protected goToRentalPackages( houseId: string) {
    const ownerId = this.authService.user()?.id;

    if(!ownerId){
      this.toastr.error('No se pudo identificar al propietario', 'Error');
      return;
    }
    this.router.navigate(['/rental-packages', ownerId, houseId]);
  }
  protected getOwnerId() {
    return this.authService.user()?.id;
  }
  openDeactivateModal(house: CountryHouseResponse): void {
    this.houseToDeactivate  = house;
    this.showDeactivateModal = true;
  }

  closeDeactivateModal(): void {
    this.houseToDeactivate  = null;
    this.showDeactivateModal = false;
  }

  confirmDeactivate(): void {
    if (!this.houseToDeactivate) return;
    const ownerId = this.authService.user()?.id;
    if (!ownerId) return;

    this.isDeactivating = true;

    this.houseSvc.deactivate(ownerId, this.houseToDeactivate.id).subscribe({
      next: () => {
        this.toastr.success(`"${this.houseToDeactivate!.code}" ha sido desactivada`, '¡Desactivada!');
        const idx = this.houses.findIndex(h => h.id === this.houseToDeactivate!.id);
        if (idx !== -1) {
          this.houses[idx] = { ...this.houses[idx], stateCountryHouse: 'DISABLED' };
        }
        this.isDeactivating     = false;
        this.showDeactivateModal = false;
        this.houseToDeactivate  = null;
      },
      error: (err) => {
        this.toastr.error(err?.error?.message ?? 'Error al desactivar la casa', 'Error');
        this.isDeactivating = false;
      }
    });
  }

  reactivateHouse(house: CountryHouseResponse): void {
    const ownerId = this.authService.user()?.id;
    if (!ownerId) return;

    this.houseSvc.reactivate(ownerId, house.id).subscribe({
      next: () => {
        this.toastr.success(`"${house.code}" ha sido reactivada`, '¡Reactivada!');
        const idx = this.houses.findIndex(h => h.id === house.id);
        if (idx !== -1) {
          this.houses[idx] = { ...this.houses[idx], stateCountryHouse: 'ACTIVE' };
        }
      },
      error: (err) => {
        this.toastr.error(err?.error?.message ?? 'Error al reactivar la casa', 'Error');
      }
    });
  }

  getFirstPhoto(house: CountryHouseResponse): string {
    return house.photo?.[0]?.url?.trim()
      ? house.photo[0].url
      : 'https://images.unsplash.com/photo-1572345901383-be2fcd1625f3?w=800&q=80';
  }

  getTotalBathrooms(house: CountryHouseResponse): number {
    return (house.privateBathrooms ?? 0) + (house.publicBathrooms ?? 0);
  }

  isActive(house: CountryHouseResponse): boolean {
    return house.stateCountryHouse === 'ACTIVE';
  }

}

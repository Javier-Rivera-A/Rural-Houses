import { Component, DestroyRef, Input, OnChanges, OnInit, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CountryHouseResponse, CountryHouseService, AvailabilityResponse } from '../../../../Services/CountryHouse/country-house.service';
import { SearchParams } from '../hero-section/hero-section.component';
import { RentalService } from '../../../../Services/Rental/rental.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../../Services/Auth/Auth.service';

export interface RentalPackageInfo {
  id: string;
  startingDate: string;
  endingDate: string;
  priceNight: number;
  typeRental: string;
}

interface HouseWithAvailability extends CountryHouseResponse {
  availabilityLoaded: boolean;
  entireHouseAvailable: boolean | null;
  checkingAvailability: boolean;
  hasReservationOverlap: boolean;
  packages: RentalPackageInfo[] | undefined;
  loadingPackages: boolean;
}

@Component({
  selector: 'app-house-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './house-grid.component.html'
})
export class HouseGridComponent implements OnChanges, OnInit {
  @Input() houses: CountryHouseResponse[] = [];
  @Input() loading = false;
  @Input() searchParams: SearchParams = { poblacion: '', fecha: '', noches: 2, tipoAlquiler: 'ambas' };

  enrichedHouses: HouseWithAvailability[] = [];

  private router               = inject(Router);
  private countryHouseService  = inject(CountryHouseService);
  private rentalService        = inject(RentalService);
  private destroyRef           = inject(DestroyRef);
  private authService          = inject(AuthService);

  ngOnInit(): void {
    this.hydrateRentalsForSession();

    this.rentalService.observeRentals()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshReservationOverlaps());
  }

  get empty(): boolean {
    return !this.loading && this.enrichedHouses.length === 0;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['houses']) {
      this.enrichedHouses = this.houses.map(h => ({
        ...h,
        availabilityLoaded: false,
        entireHouseAvailable: null,
        checkingAvailability: false,
        hasReservationOverlap: false,
        packages: undefined,
        loadingPackages: true
      }));

      // Cargar paquetes y disponibilidad para cada casa
      this.enrichedHouses.forEach(h => {
        this.loadPackages(h);
        if (this.searchParams.fecha && this.searchParams.noches > 0) {
          this.loadAvailability(h);
        }
      });

      this.refreshReservationOverlaps();
    }

    if (changes['searchParams'] && !changes['houses']) {
      this.refreshReservationOverlaps();
    }
  }

  loadPackages(house: HouseWithAvailability): void {
    house.loadingPackages = true;
    this.countryHouseService.getPackagesByHouse(house.id).subscribe({
      next: (res) => {
        house.packages = res?.data ?? [];
        house.loadingPackages = false;
      },
      error: () => {
        house.packages = [];
        house.loadingPackages = false;
      }
    })
  }

  loadAvailability(house: HouseWithAvailability): void {
    if (!this.searchParams.fecha) return;
    house.checkingAvailability = true;

    this.countryHouseService.checkAvailability(
      house.code,
      this.searchParams.fecha,
      this.searchParams.noches
    ).subscribe({
      next: (res) => {
        const avail: AvailabilityResponse = res?.data;
        house.availabilityLoaded   = true;
        house.checkingAvailability = false;
        if (avail?.dailyAvailability) {
          const days = Object.values(avail.dailyAvailability);
          house.entireHouseAvailable = days.every(d => d.entireHouseStatus === 'FREE');
        }
        house.hasReservationOverlap = this.computeReservationOverlap(house);
      },
      error: () => {
        house.checkingAvailability = false;
        house.availabilityLoaded   = true;
        house.hasReservationOverlap = this.computeReservationOverlap(house);
      }
    });
  }

  private refreshReservationOverlaps(): void {
    this.enrichedHouses = this.enrichedHouses.map((house) => ({
      ...house,
      hasReservationOverlap: this.computeReservationOverlap(house)
    }));
  }

  private computeReservationOverlap(house: HouseWithAvailability): boolean {
    if (!this.searchParams.fecha || this.searchParams.noches <= 0) return false;
    return this.rentalService.hasActiveOverlap(
      house.code,
      this.searchParams.fecha,
      this.searchParams.noches
    );
  }

  private hydrateRentalsForSession(): void {
    const user = this.authService.user();
    if (!user) return;

    const hydrate$ = this.authService.isOwner()
      ? this.rentalService.findByOwner(user.id)
      : this.rentalService.findByCustomer(user.id);

    hydrate$.subscribe({ next: () => {}, error: () => {} });
  }

  navigateToDetail(houseId: string): void {
    this.router.navigate(['/houses', houseId]);
  }

  getTotalBathrooms(house: CountryHouseResponse): number {
    return (house.privateBathrooms ?? 0) + (house.publicBathrooms ?? 0);
  }

  getFirstPhoto(house: CountryHouseResponse): string {
    return house.photo?.[0]?.url?.trim()
      ? house.photo[0].url
      : 'https://images.unsplash.com/photo-1572345901383-be2fcd1625f3?w=800&q=80';
  }

  trackByHouseId(_: number, house: CountryHouseResponse): string {
    return house.id;
  }

  formatPackageDate(date: string): string {
    if (!date) return '';
    try {
      return new Date(date.split('T')[0] + 'T00:00:00').toLocaleDateString('es-CO', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    } catch { return date; }
  }
}
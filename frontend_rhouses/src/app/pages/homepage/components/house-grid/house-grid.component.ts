import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CountryHouseResponse, CountryHouseService, AvailabilityResponse } from '../../../../Services/CountryHouse/country-house.service';
import { SearchParams } from '../hero-section/hero-section.component';

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
  packages: RentalPackageInfo[] | undefined;
  loadingPackages: boolean;
}

@Component({
  selector: 'app-house-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './house-grid.component.html'
})
export class HouseGridComponent implements OnChanges {
  @Input() houses: CountryHouseResponse[] = [];
  @Input() loading = false;
  @Input() searchParams: SearchParams = { poblacion: '', fecha: '', noches: 2, tipoAlquiler: 'ambas' };

  enrichedHouses: HouseWithAvailability[] = [];

  private router               = inject(Router);
  private countryHouseService  = inject(CountryHouseService);

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
    });
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
      },
      error: () => {
        house.checkingAvailability = false;
        house.availabilityLoaded   = true;
      }
    });
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

  formatPackageDate(date: string): string {
    if (!date) return '';
    try {
      const d = new Date(date + 'T00:00:00');
      return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return date;
    }
  }

  trackByHouseId(_: number, house: CountryHouseResponse): string {
    return house.id;
  }
}
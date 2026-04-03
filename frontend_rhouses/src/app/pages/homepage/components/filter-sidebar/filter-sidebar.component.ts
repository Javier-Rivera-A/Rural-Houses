import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CountryHouseResponse } from '../../../../Services/CountryHouse/country-house.service';
import { SearchParams } from '../hero-section/hero-section.component';

@Component({
  selector: 'app-filter-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-sidebar.component.html',
  styleUrls: ['./filter-sidebar.component.css']
})
export class FilterSidebarComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() houses: CountryHouseResponse[] = [];
  @Input() searchParams: SearchParams = { poblacion: '', fecha: '', noches: 2, tipoAlquiler: 'ambas' };

  @Output() close = new EventEmitter<void>();
  @Output() filtered = new EventEmitter<CountryHouseResponse[]>();

  filters = {
    minBathrooms: 0,
    minBedrooms: 0,
    minGarage: 0,
    habitacionesConBano: false,
    lavavajillas: false,
    lavadora: false,
    tipoCamas: 'todas'
  };

  priceRange = [50, 500];
  minPrice = 0;
  maxPrice = 1000;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['houses']) {
      this.applyFilters();
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onPriceChange(type: 'min' | 'max', event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value);
    if (type === 'min') this.priceRange[0] = value;
    else this.priceRange[1] = value;
  }

  applyFilters(): void {
    let result = [...this.houses];

    if (this.filters.minBathrooms > 0) {
      result = result.filter(h =>
        (h.privateBathrooms ?? 0) + (h.publicBathrooms ?? 0) >= this.filters.minBathrooms
      );
    }

    if (this.filters.minBedrooms > 0) {
      result = result.filter(h => (h.bedrooms?.length ?? 0) >= this.filters.minBedrooms);
    }

    if (this.filters.minGarage > 0) {
      result = result.filter(h => (h.garagePlaces ?? 0) >= this.filters.minGarage);
    }

    if (this.filters.habitacionesConBano) {
      result = result.filter(h => h.bedrooms?.some(b => b.bathroom));
    }

    if (this.filters.lavavajillas) {
      result = result.filter(h => h.diningRooms?.some(k => k.dishWasher));
    }

    if (this.filters.lavadora) {
      result = result.filter(h => h.diningRooms?.some(k => k.washingMachine));
    }

    if (this.filters.tipoCamas !== 'todas') {
      const tipo = this.filters.tipoCamas === 'dobles' ? 'DOUBLE' : 'SIMPLE';
      result = result.filter(h => h.bedrooms?.some(b => b.typesOfBeds?.includes(tipo)));
    }

    this.filtered.emit(result);
  }

  clearFilters(): void {
    this.filters = {
      minBathrooms: 0,
      minBedrooms: 0,
      minGarage: 0,
      habitacionesConBano: false,
      lavavajillas: false,
      lavadora: false,
      tipoCamas: 'todas'
    };
    this.priceRange = [50, 500];
    this.filtered.emit([...this.houses]);
  }
}
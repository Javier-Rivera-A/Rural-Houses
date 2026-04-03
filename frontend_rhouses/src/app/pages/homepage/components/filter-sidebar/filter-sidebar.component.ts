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
    poblacion:            '',
    codigoCasa:           '',
    fechaEntrada:         '',
    noches:               1,
    casaCompleta:         false,
    porHabitaciones:      false,
    numPersonas:          0,
    dormitorios:          0,
    banos:                0,
    cocinas:              0,
    garajes:              0,
    habitacionesConBano:  false,
    lavavajillas:         false,
    lavadora:             false,
    tipoCamas:            'todas'
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

    // Filtro por población
    if (this.filters.poblacion?.trim()) {
      result = result.filter(h =>
        h.populationName?.toLowerCase().includes(this.filters.poblacion.toLowerCase())
      );
    }

    // Filtro por código de casa
    if (this.filters.codigoCasa?.trim()) {
      result = result.filter(h =>
        h.code?.toLowerCase().includes(this.filters.codigoCasa.toLowerCase())
      );
    }

    // Filtro por tipo de alquiler
    if (this.filters.casaCompleta && !this.filters.porHabitaciones) {
      // Solo casas que permitan alquiler completo — filtramos por tener pocas habitaciones
      // (lógica aproximada, ya que el tipo de alquiler viene del paquete, no de la casa)
      result = result.filter(h => (h.bedrooms?.length ?? 0) > 0);
    }

    // Filtro por número mínimo de personas (aproximado con camas)
    if (this.filters.numPersonas > 0) {
      result = result.filter(h => {
        const totalCamas = h.bedrooms?.reduce((acc, b) => acc + (b.numberBeds ?? 0), 0) ?? 0;
        return totalCamas >= this.filters.numPersonas;
      });
    }

    // Filtro por número mínimo de dormitorios
    if (this.filters.dormitorios > 0) {
      result = result.filter(h =>
        (h.bedrooms?.length ?? 0) >= this.filters.dormitorios
      );
    }

    // Filtro por número mínimo de baños
    if (this.filters.banos > 0) {
      result = result.filter(h =>
        ((h.privateBathrooms ?? 0) + (h.publicBathrooms ?? 0)) >= this.filters.banos
      );
    }

    // Filtro por número mínimo de cocinas
    if (this.filters.cocinas > 0) {
      result = result.filter(h =>
        (h.diningRooms?.length ?? 0) >= this.filters.cocinas
      );
    }

    // Filtro por garajes mínimos
    if (this.filters.garajes > 0) {
      result = result.filter(h =>
        (h.garagePlaces ?? 0) >= this.filters.garajes
      );
    }

    // Filtro habitaciones con baño privado
    if (this.filters.habitacionesConBano) {
      result = result.filter(h =>
        h.bedrooms?.some(b => b.bathroom)
      );
    }

    // Filtro lavavajillas
    if (this.filters.lavavajillas) {
      result = result.filter(h =>
        h.diningRooms?.some(k => k.dishWasher)
      );
    }

    // Filtro lavadora
    if (this.filters.lavadora) {
      result = result.filter(h =>
        h.diningRooms?.some(k => k.washingMachine)
      );
    }

    // Filtro por tipo de camas
    if (this.filters.tipoCamas !== 'todas') {
      const tipo = this.filters.tipoCamas === 'dobles' ? 'DOUBLE' : 'SIMPLE';
      result = result.filter(h =>
        h.bedrooms?.some(b => b.typesOfBeds?.includes(tipo))
      );
    }

    this.filtered.emit(result);
  }

  clearFilters(): void {
    this.filters = {
      poblacion:            '',
      codigoCasa:           '',
      fechaEntrada:         '',
      noches:               1,
      casaCompleta:         false,
      porHabitaciones:      false,
      numPersonas:          0,
      dormitorios:          0,
      banos:                0,
      cocinas:              0,
      garajes:              0,
      habitacionesConBano:  false,
      lavavajillas:         false,
      lavadora:             false,
      tipoCamas:            'todas'
    };
    this.priceRange = [50, 500];
    this.filtered.emit([...this.houses]);
  }
}
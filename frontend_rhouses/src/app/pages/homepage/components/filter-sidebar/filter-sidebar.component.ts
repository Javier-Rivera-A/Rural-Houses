import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-filter-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-sidebar.component.html',
  styleUrls: ['./filter-sidebar.component.css']
})
export class FilterSidebarComponent {
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();

  // Filtros
  filters = {
    poblacion: '',
    codigoCasa: '',
    fechaEntrada: '',
    noches: 2,
    casaCompleta: true,
    porHabitaciones: true,
    numPersonas: 2,
    dormitorios: 0,
    banos: 0,
    cocinas: 0,
    garajes: 0,
    habitacionesConBano: false,
    lavavajillas: false,
    lavadora: false,
    tipoCamas: 'todas'
  };

  priceRange = [50, 500];
  minPrice = 0;
  maxPrice = 1000;

  onClose() {
    this.close.emit();
  }

  onPriceChange(type: 'min' | 'max', event: Event) {
    const value = parseInt((event.target as HTMLInputElement).value);
    if (type === 'min') {
      this.priceRange[0] = value;
    } else {
      this.priceRange[1] = value;
    }
  }

  applyFilters() {
    console.log('Aplicando filtros:', this.filters, 'Precio:', this.priceRange);
  }

  clearFilters() {
    this.filters = {
      poblacion: '',
      codigoCasa: '',
      fechaEntrada: '',
      noches: 2,
      casaCompleta: true,
      porHabitaciones: true,
      numPersonas: 2,
      dormitorios: 0,
      banos: 0,
      cocinas: 0,
      garajes: 0,
      habitacionesConBano: false,
      lavavajillas: false,
      lavadora: false,
      tipoCamas: 'todas'
    };
    this.priceRange = [50, 500];
  }
}

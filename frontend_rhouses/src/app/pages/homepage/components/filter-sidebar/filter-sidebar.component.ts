import {Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CountryHouseResponse, CountryHouseService } from '../../../../Services/CountryHouse/country-house.service';
import { SearchParams } from '../hero-section/hero-section.component';

@Component({
  selector: 'app-filter-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-sidebar.component.html',
  styleUrls: ['./filter-sidebar.component.css']
})
export class FilterSidebarComponent implements OnChanges {

  private countryHouseService = inject(CountryHouseService);

  @Input() isOpen = false;
  @Input() houses: CountryHouseResponse[] = [];
  @Input() searchParams: SearchParams = { poblacion: '', fecha: '', noches: 2, tipoAlquiler: 'ambas' };

  @Output() close = new EventEmitter<void>();
  @Output() filtered = new EventEmitter<CountryHouseResponse[]>();
  @Output() filterApplied = new EventEmitter<{ population: string, minBedrooms: number, minGaragePlaces: number }>();
  filters = {
    poblacion: '',
    codigoCasa: '',
    fechaEntrada: '',
    noches: 1,
    casaCompleta: false,
    porHabitaciones: false,
    numPersonas: 0,
    dormitorios: 0,
    banos: 0,
    cocinas: 0,
    garajes: 0,
    habitacionesConBano: false,
    lavavajillas: false,
    lavadora: false,
    tipoCamas: 'todas'
  };

  priceRange = [10000, 2000000];
  minPrice = 0;
  maxPrice = 2000000;
  protected fechaEntrada: any;

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
    // 1. Mapeamos tus filtros del objeto 'filters' a los nombres que espera el Backend
    const params = {
      population: this.filters.poblacion,
      code: this.filters.codigoCasa,
      minBedrooms: this.filters.dormitorios,
      minBathrooms: this.filters.banos,
      minKitchens: this.filters.cocinas,
      minGaragePlaces: this.filters.garajes,
      hasPrivateBathroom: this.filters.habitacionesConBano,
      hasDishwasher: this.filters.lavavajillas,
      hasWashingMachine: this.filters.lavadora,
      bedType: this.filters.tipoCamas // El backend ya maneja 'todas', 'simples', 'dobles'
    };

    // 2. Llamamos al backend
    this.countryHouseService.searchHouses(params).subscribe({
      next: (response) => {
        if (response.data) {
          // Emitimos los resultados reales que vienen del servidor
          this.filtered.emit(response.data);

          // Opcional: Notificamos que se aplicaron (según tu código original)
          this.filterApplied.emit({
            population: this.filters.poblacion,
            minBedrooms: this.filters.dormitorios,
            minGaragePlaces: this.filters.garajes
          });

          // Cerramos el sidebar si es necesario
          this.onClose();
        }
      },
      error: (err) => {
        console.error('Error filtrando casas:', err);
        alert('Hubo un error al realizar la búsqueda.');
      }
    });
  }


  clearFilters(): void {
    this.filters = {
      poblacion: '',
      codigoCasa: '',
      fechaEntrada: '',
      noches: 1,
      casaCompleta: false,
      porHabitaciones: false,
      numPersonas: 0,
      dormitorios: 0,
      banos: 0,
      cocinas: 0,
      garajes: 0,
      habitacionesConBano: false,
      lavavajillas: false,
      lavadora: false,
      tipoCamas: 'todas'
    };


    this.priceRange = [10000, 2000000 ];
    this.filtered.emit([...this.houses]);
    this.applyFilters(); // Recarga la lista completa desde el backend
  }


}

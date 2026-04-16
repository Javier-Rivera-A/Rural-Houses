import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CountryHouseService, CountryHouseResponse } from '../../../../Services/CountryHouse/country-house.service';
import { ToastrService } from 'ngx-toastr';

export interface SearchParams {
  poblacion: string;
  fecha: string;
  noches: number;
  tipoAlquiler: string;
}

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hero-section.component.html'
})
export class HeroSectionComponent {

  @Output() searchResults = new EventEmitter<{ houses: CountryHouseResponse[], params: SearchParams }>();
  @Output() searchLoading = new EventEmitter<void>();

  searchData: SearchParams = {
    poblacion: '',
    fecha: '',
    noches: 2,
    tipoAlquiler: 'ambas'
  };

  isLoading = false;
  protected fechaEntrada: any;

  constructor(
    private countryHouseService: CountryHouseService,
    private toastr: ToastrService
  ) {}

  onSearch(): void {
    if (!this.searchData.poblacion.trim()) {
      this.toastr.warning('Escribe una población para buscar', 'Campo requerido');
      return;
    }

    this.isLoading = true;
    this.searchLoading.emit();

    // 1. Preparamos el objeto con el filtro de población para el nuevo endpoint
    const apiParams = {
      population: this.searchData.poblacion.trim()
    };

    // 2. Usamos el método searchHouses pasándole el parámetro
    this.countryHouseService.searchHouses(apiParams).subscribe({
      next: (res) => {
        const houses: CountryHouseResponse[] = res?.data ?? [];

        // 3. Emitimos la lista de casas y adjuntamos todos los parámetros del front
        this.searchResults.emit({
          houses,
          params: {
            ...this.searchData,
            fecha: this.fechaEntrada // Incluimos la fecha seleccionada en el HTML
          }
        });

        this.isLoading = false;

        if (houses.length === 0) {
          this.toastr.info(`No se encontraron casas en "${this.searchData.poblacion}"`, 'Sin resultados');
        } else {
          this.toastr.success(`${houses.length} casa(s) encontrada(s)`, '¡Listo!');
        }
      },
      error: () => {
        this.toastr.error('Error al conectar con el servidor', 'Error');
        this.isLoading = false;
      }
    });
  }

  openPicker(event: any) {
    event.stopPropagation();
    if ('showPicker' in event.target) {
      event.target.showPicker();
    }
  }
}

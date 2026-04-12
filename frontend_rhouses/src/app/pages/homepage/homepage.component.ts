import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent }        from './components/navbar/navbar.component';
import { HeroSectionComponent, SearchParams } from './components/hero-section/hero-section.component';
import { FilterSidebarComponent } from './components/filter-sidebar/filter-sidebar.component';
import { FilterTriggerComponent } from './components/filter-trigger/filter-trigger.component';
import { HouseGridComponent }     from './components/house-grid/house-grid.component';
import { FooterComponent }        from './components/footer/footer.component';
import {
  ApiResponse,
  CountryHouseResponse,
  CountryHouseService
} from '../../Services/CountryHouse/country-house.service';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    HeroSectionComponent,
    FilterSidebarComponent,
    FilterTriggerComponent,
    HouseGridComponent,
    FooterComponent
  ],
  templateUrl: './homepage.component.html'
})
export class HomepageComponent implements OnInit {
  isFilterOpen = false;
  isLoading    = true;
  showingSuggestions = false; // <-- NUEVA VARIABLE: Para mostrar el aviso de sugerencias

  allHouses:      CountryHouseResponse[] = [];
  filteredHouses: CountryHouseResponse[] = [];
  searchParams:   SearchParams = { poblacion: '', fecha: '', noches: 2, tipoAlquiler: 'ambas' };

  constructor(private countryHouseService: CountryHouseService) {}

  ngOnInit(): void {
    // Cargar todas las casas activas al entrar al homepage
    this.countryHouseService.findAll().subscribe({
      next: (res) => {
        this.allHouses      = res?.data ?? [];
        this.filteredHouses = [...this.allHouses];
        this.isLoading      = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  toggleFilter() { this.isFilterOpen = !this.isFilterOpen; }
  closeFilter()  { this.isFilterOpen = false; }

  // El hero busca por población y reemplaza el listado
  onSearchResults(event: { houses: CountryHouseResponse[], params: SearchParams }): void {
    this.allHouses      = event.houses;
    this.filteredHouses = event.houses;
    this.searchParams   = event.params;
    this.isLoading      = false;
    this.showingSuggestions = false; // <-- Reseteamos la variable al buscar desde el Hero
  }

  onSearchLoading(): void {
    this.isLoading = true;
  }

  // El sidebar filtra localmente sobre allHouses
  onFiltered(houses: CountryHouseResponse[]): void {
    this.filteredHouses = houses;
    this.showingSuggestions = false;
  }

  onFilterApplied(filters: any): void {
    // 1. Iniciamos carga y quitamos sugerencias anteriores
    this.isLoading = true;
    this.showingSuggestions = false;

    // 2. Llamamos al servicio pasando el objeto 'filters' completo
    // Nota: Ahora pasamos 'filters' como un solo argumento
    this.countryHouseService.searchHouses(filters).subscribe({
      next: (res: ApiResponse<CountryHouseResponse[]>) => {
        const foundHouses = res?.data ?? [];

        if (foundHouses.length > 0) {
          // Se encontraron casas que coinciden con los filtros
          this.filteredHouses = foundHouses;
          this.showingSuggestions = false;
        } else {
          // No hay resultados exactos: mostramos todas como sugerencia
          this.showingSuggestions = true;
          this.filteredHouses = [...this.allHouses];
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error en búsqueda avanzada:', err);
        // En caso de error, volvemos al estado inicial
        this.showingSuggestions = true;
        this.filteredHouses = [...this.allHouses];
        this.isLoading = false;
      }
    });
  }
}

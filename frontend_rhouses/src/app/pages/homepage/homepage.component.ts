import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent }        from './components/navbar/navbar.component';
import { HeroSectionComponent, SearchParams } from './components/hero-section/hero-section.component';
import { FilterSidebarComponent } from './components/filter-sidebar/filter-sidebar.component';
import { FilterTriggerComponent } from './components/filter-trigger/filter-trigger.component';
import { HouseGridComponent }     from './components/house-grid/house-grid.component';
import { FooterComponent }        from './components/footer/footer.component';
import { CountryHouseResponse, CountryHouseService } from '../../Services/CountryHouse/country-house.service';

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

  // <-- NUEVO MÉTODO: Búsqueda al backend con los 3 parámetros exactos
  onFilterApplied(filters: { population: string, minBedrooms: number, minGaragePlaces: number }): void {
    // Verificamos que los labels donde se ingresa la info no estén vacíos
    if (filters.population && filters.minBedrooms && filters.minGaragePlaces) {
      this.isLoading = true;
      this.showingSuggestions = false;

      // Llamamos al nuevo método del servicio que conecta con  @GetMapping("/search")
      this.countryHouseService.searchHouses(filters.population, filters.minBedrooms, filters.minGaragePlaces)
        .subscribe({
          next: (res) => {
            const foundHouses = res?.data ?? [];

            if (foundHouses.length > 0) {
              // Se encontró la casa exacta, actualizamos el grid
              this.filteredHouses = foundHouses;
            } else {
              // No se encontró, mostramos el aviso y cargamos sugerencias (todas las casas)
              this.showingSuggestions = true;
              this.filteredHouses = [...this.allHouses];
            }
            this.isLoading = false;
          },
          error: () => {
            // Por precaución, si falla la petición, mostramos sugerencias
            this.showingSuggestions = true;
            this.filteredHouses = [...this.allHouses];
            this.isLoading = false;
          }
        });
    } else {
      // Si falta alguno de los 3 datos, puedes imprimir esto para depurar
      console.log("Se requieren los tres datos (población, cuartos y garaje) para la búsqueda en el servidor.");
    }
  }
}

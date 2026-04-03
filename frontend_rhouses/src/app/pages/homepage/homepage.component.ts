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
  }

  onSearchLoading(): void {
    this.isLoading = true;
  }

  // El sidebar filtra localmente sobre allHouses
  onFiltered(houses: CountryHouseResponse[]): void {
    this.filteredHouses = houses;
  }
}
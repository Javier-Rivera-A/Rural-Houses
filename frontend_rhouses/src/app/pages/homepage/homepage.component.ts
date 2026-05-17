import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { HeroSectionComponent, SearchParams } from './components/hero-section/hero-section.component';
import { FilterSidebarComponent } from './components/filter-sidebar/filter-sidebar.component';
import { FilterTriggerComponent } from './components/filter-trigger/filter-trigger.component';
import { HouseGridComponent } from './components/house-grid/house-grid.component';
import { FooterComponent } from './components/footer/footer.component';
import { AuthService } from '../../Services/Auth/Auth.service';
import { ApiResponse, CountryHouseResponse, CountryHouseService } from '../../Services/CountryHouse/country-house.service';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
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
  showingSuggestions = false;

  allHouses:      CountryHouseResponse[] = [];
  filteredHouses: CountryHouseResponse[] = [];
  searchParams:   SearchParams = { poblacion: '', fecha: '', noches: 2, tipoAlquiler: 'ambas' };

  constructor(
    private countryHouseService: CountryHouseService,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.authService.isOwner()) {
      this.isLoading = false;
      return;
    }
    this.loadHouses();
  }

  loadHouses(): void {
    this.isLoading = true;
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

  onSearchResults(event: { houses: CountryHouseResponse[], params: SearchParams }): void {
    this.allHouses      = event.houses;
    this.filteredHouses = event.houses;
    this.searchParams   = event.params;
    this.isLoading      = false;
    this.showingSuggestions = false;
  }

  onSearchLoading(): void {
    this.isLoading = true;
  }

  onFiltered(houses: CountryHouseResponse[]): void {
    this.filteredHouses = houses;
    this.showingSuggestions = false;
  }


  onFilterApplied(filters: any): void {
    this.isLoading = true;
    this.showingSuggestions = false;

    this.countryHouseService.searchHouses(filters).subscribe({
      next: (res: ApiResponse<CountryHouseResponse[]>) => {
        const foundHouses = res?.data ?? [];
        if (foundHouses.length > 0) {
          this.filteredHouses = foundHouses;
          this.showingSuggestions = false;
        } else {
          this.showingSuggestions = true;
          this.filteredHouses = [...this.allHouses];
        }
        this.isLoading = false;
      },
      error: () => {
        this.showingSuggestions = true;
        this.filteredHouses = [...this.allHouses];
        this.isLoading = false;
      }
    });
  }

 // Owner quick actions
  goToMyHouses()      { this.router.navigate(['/my-houses']); }
  goToRegisterHouse() { this.router.navigate(['/register-house']); }
  goToSettings()      { this.router.navigate(['/settings']); }
  goToRentalPackages() { const ownerId = this.authService.user()?.id; this.router.navigate(['/rental-packages', ownerId]);}
  goToOwnerReservations() { this.router.navigate(['/owner-reservations']); }
  goToStatsDashBoard() { this.router.navigate(['/estadisticas']);}

}

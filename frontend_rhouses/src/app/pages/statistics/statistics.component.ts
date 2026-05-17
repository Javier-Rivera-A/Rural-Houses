import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { forkJoin } from 'rxjs';

import { NavbarComponent } from './componentes/navbar/navbar.component';
import { HouseCardComponent } from './componentes/house-card/house-card.component';
import { StatsDashboardComponent } from './componentes/stats-dashboard/stats-dashboard.component';
import { DateRange } from './componentes/date-range-picker/date-range-picker.component';

import { CountryHouseService, CountryHouseResponse } from '../../Services/CountryHouse/country-house.service';
import { RentalService, RentalResponse } from '../../Services/Rental/rental.service'; // Ajusta la ruta de RentalService

type View = 'list' | 'global' | 'individual';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    NavbarComponent,
    HouseCardComponent,
    StatsDashboardComponent
  ],
  templateUrl: './statistics.component.html'
})
export class StatisticsComponent implements OnInit {
  view: View = 'list';
  selectedHouse: CountryHouseResponse | null = null;
  searchTerm: string = '';

  // Rango de fechas por defecto
  dateRange: DateRange = {
    from: new Date(2026, 0, 1),
    to: new Date(2026, 4, 16)
  };

  houses: CountryHouseResponse[] = [];
  ownerId: string = '';

  // ── VARIABLES DE DATOS PARA LAS GRÁFICAS ──
  // Estructuras vacías que llenaremos dinámicamente con la API
  revenueData: any[] = [];
  occupancyData: any[] = [];
  reservationStatusData: any[] = [];
  fourthChartData: any = { title: '', type: 'pie', data: [] };

  kpis = {
    revenue: '$0.00',
    occupancy: '0%',
    reservations: 0
  };

  constructor(
    private router: Router,
    private countryHouseService: CountryHouseService,
    private rentalService: RentalService
  ) {}

  ngOnInit(): void {
    this.loadOwnerHouses();
  }

  loadOwnerHouses(): void {
    const rawUser = sessionStorage.getItem('rhouses_user');
    if (rawUser) {
      try {
        const user = JSON.parse(rawUser);
        this.ownerId = user.id;

        if (this.ownerId) {
          this.countryHouseService.findByOwner(this.ownerId).subscribe({
            next: (response) => {
              // FIX: Extraemos la data directamente como en OwnerReservationsComponent
              this.houses = response?.data || [];
            },
            error: (err) => console.error('Error cargando casas:', err)
          });
        }
      } catch (e) {
        console.error('Error parseando usuario', e);
      }
    }
  }

  // Helper para convertir objeto Date a formato 'YYYY-MM-DD' que pide el backend
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

// Helper para agrupar ingresos por mes basándonos en una lista de reservas
  private processMonthlyRevenue(rentals: RentalResponse[]): any[] {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const revenueMap: { [key: string]: number } = {};

    rentals.forEach(r => {
      // 1. Validar que la reserva tenga fecha válida para evitar NaN
      if (!r.checkInDate) return;
      const date = new Date(r.checkInDate);
      if (isNaN(date.getTime())) return;

      const monthName = months[date.getMonth()];

      // Inicializar el mes si no existe en el mapa
      if (revenueMap[monthName] === undefined) {
        revenueMap[monthName] = 0;
      }

      // 2. Usar toUpperCase para evitar problemas de mayúsculas/minúsculas
      const state = r.state ? r.state.toUpperCase() : '';
      if (state === 'CONFIRMED' || state === 'PAID') {
        revenueMap[monthName] += (r.totalPrice || 0); // Evitar sumar null o undefined
      }
    });

    // 3. Salvavidas: Si no hubo ninguna fecha válida, retornar al menos un mes en 0
    // para que la gráfica no se ponga en blanco.
    if (Object.keys(revenueMap).length === 0) {
      const currentMonth = months[this.dateRange.from.getMonth()];
      return [{ month: currentMonth, ingresos: 0 }];
    }

    return Object.keys(revenueMap).map(month => ({
      month: month,
      ingresos: revenueMap[month]
    }));
  }
  private processReservationStatus(rentals: RentalResponse[]): any[] {
    let confirmadas = 0;
    let pendientes = 0;
    let canceladas = 0;

    rentals.forEach(r => {
      // Usar toUpperCase para que coincida siempre
      const state = r.state ? r.state.toUpperCase() : '';

      if (state === 'CONFIRMED' || state === 'PAID') confirmadas++;
      else if (state === 'PENDING') pendientes++;
      else if (state === 'CANCELLED' || state === 'EXPIRED') canceladas++;
    });

    // 1. Calculamos el total de las reservas válidas en estos estados
    const total = confirmadas + pendientes + canceladas;

    // 2. Calculamos los porcentajes (validando que total > 0 para evitar NaN%)
    const percConfirmadas = total > 0 ? Math.round((confirmadas / total) * 100) : 0;
    const percPendientes = total > 0 ? Math.round((pendientes / total) * 100) : 0;
    const percCanceladas = total > 0 ? Math.round((canceladas / total) * 100) : 0;

    // 3. Inyectamos el porcentaje directamente en el nombre para que la gráfica lo lea
    return [
      { name: `Confirmadas (${percConfirmadas}%)`, value: confirmadas, color: '#2CA58D' },
      { name: `Pendientes (${percPendientes}%)`, value: pendientes, color: '#F59E0B' },
      { name: `Canceladas (${percCanceladas}%)`, value: canceladas, color: '#999999' }
    ];
  }
// ── CARGAR ESTADÍSTICAS GLOBALES ──
  calculateGlobalStats(): void {
    if (this.houses.length === 0) return;

    const startStr = this.formatDate(this.dateRange.from);
    const endStr = this.formatDate(this.dateRange.to);

    const occupancyRequests = this.houses.map(h => this.countryHouseService.getOccupancy(h.id, startStr, endStr));
    const rentalRequests = this.houses.map(h => this.rentalService.findByOwner(h.id));

    forkJoin({
      occupancies: forkJoin(occupancyRequests),
      rentalsList: forkJoin(rentalRequests)
    }).subscribe({
      next: ({ occupancies, rentalsList }) => {
        const allRentals = rentalsList.flatMap(res => res?.data || []);

        const totalRevenue = allRentals
          .filter(r => r.state && (r.state.toUpperCase() === 'CONFIRMED' || r.state.toUpperCase() === 'PAID'))
          .reduce((sum, r) => sum + (r.totalPrice || 0), 0);

        // FIX: Cambiamos 'percentage' por 'occupancyPercentage' tal como viene del Backend
        const validOccupancies = occupancies.filter(res => res?.data && typeof res.data.occupancyPercentage === 'number');
        const avgOccupancy = validOccupancies.length > 0
          ? validOccupancies.reduce((sum, res) => sum + res.data.occupancyPercentage, 0) / validOccupancies.length
          : 0;

        this.kpis = {
          revenue: `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          occupancy: `${Math.round(avgOccupancy)}%`,
          reservations: allRentals.filter(r => r.state && r.state.toUpperCase() !== 'CANCELLED').length
        };

        this.revenueData = this.processMonthlyRevenue(allRentals);
        this.reservationStatusData = this.processReservationStatus(allRentals);

        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        this.occupancyData = [{ period: months[this.dateRange.from.getMonth()], ocupacion: Math.round(avgOccupancy) }];

        const propertyRevenueMap: { [name: string]: number } = {};
        this.houses.forEach((h, index) => {
          const houseRentals = rentalsList[index]?.data || [];
          const revenue = houseRentals
            .filter(r => r.state && (r.state.toUpperCase() === 'CONFIRMED' || r.state.toUpperCase() === 'PAID'))
            .reduce((sum, r) => sum + (r.totalPrice || 0), 0);

          const houseName = h.description || h.code || `Casa ${index + 1}`;
          propertyRevenueMap[houseName] = revenue;
        });

        this.fourthChartData = {
          title: 'Rendimiento por Propiedad',
          type: 'horizontal-bar',
          data: Object.keys(propertyRevenueMap).map(name => ({ name, ingresos: propertyRevenueMap[name] }))
        };
      },
      error: (err) => console.error('Error calculando estadísticas globales:', err)
    });
  }

  // ── CARGAR ESTADÍSTICAS INDIVIDUALES ──
  calculateIndividualStats(house: CountryHouseResponse): void {
    const startStr = this.formatDate(this.dateRange.from);
    const endStr = this.formatDate(this.dateRange.to);

    forkJoin({
      occupancyRes: this.countryHouseService.getOccupancy(house.id, startStr, endStr),
      rentalsRes: this.rentalService.findByOwner(house.id),
      packagesRes: this.countryHouseService.getPackagesByHouse(house.id)
    }).subscribe({
      next: ({ occupancyRes, rentalsRes, packagesRes }) => {
        const rentals = rentalsRes?.data || [];

        // FIX: Cambiamos 'percentage' por 'occupancyPercentage' aquí también
        const occupancyVal = (occupancyRes?.data && typeof occupancyRes.data.occupancyPercentage === 'number')
          ? occupancyRes.data.occupancyPercentage
          : 0;

        const packages = packagesRes?.data || [];

        const totalRevenue = rentals
          .filter(r => r.state && (r.state.toUpperCase() === 'CONFIRMED' || r.state.toUpperCase() === 'PAID'))
          .reduce((sum, r) => sum + (r.totalPrice || 0), 0);

        this.kpis = {
          revenue: `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          occupancy: `${Math.round(occupancyVal)}%`,
          reservations: rentals.filter(r => r.state && r.state.toUpperCase() !== 'CANCELLED').length
        };

        this.revenueData = this.processMonthlyRevenue(rentals);
        this.reservationStatusData = this.processReservationStatus(rentals);

        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        this.occupancyData = [{ period: months[this.dateRange.from.getMonth()], ocupacion: Math.round(occupancyVal) }];

        let entireHouseRevenue = 0;
        let roomsRevenue = 0;

        rentals.forEach(r => {
          if (r.state && (r.state.toUpperCase() === 'CONFIRMED' || r.state.toUpperCase() === 'PAID')) {
            const pkg = packages.find(p => p.countryHouseCode === r.countryHouseCode);
            if (pkg && pkg.typeRental === 'ROOMS') {
              roomsRevenue += (r.totalPrice || 0);
            } else {
              entireHouseRevenue += (r.totalPrice || 0);
            }
          }
        });

        this.fourthChartData = {
          title: 'Ingresos por Tipo de Paquete',
          type: 'pie',
          data: [
            { name: 'Casa completa', value: entireHouseRevenue, color: '#AA4465' },
            { name: 'Por habitaciones', value: roomsRevenue, color: '#2CA58D' }
          ]
        };
      },
      error: (err) => console.error('Error calculando estadísticas individuales:', err)
    });
  }
  // ── MANEJO DE FLUJOS DE VISTA ──

  get filteredHouses(): CountryHouseResponse[] {
    if (!this.searchTerm) return this.houses;
    const term = this.searchTerm.toLowerCase();
    return this.houses.filter(h =>
      (h.code && h.code.toLowerCase().includes(term)) ||
      (h.description && h.description.toLowerCase().includes(term))
    );
  }

  handleBack(): void {
    if (this.view === 'individual') this.view = 'list';
    else if (this.view === 'global') this.view = 'list';
    else this.router.navigate(['/']);
  }

  handleHome(): void {
    this.view = 'list';
  }

  openGlobalStats(): void {
    this.view = 'global';
    this.calculateGlobalStats();
  }

  openIndividualStats(house: CountryHouseResponse): void {
    this.selectedHouse = house;
    this.view = 'individual';
    this.calculateIndividualStats(house);
  }

  updateDateRange(newRange: DateRange): void {
    this.dateRange = newRange;
    // Si cambia la fecha y estamos en un dashboard, recalculamos los datos de inmediato
    if (this.view === 'global') {
      this.calculateGlobalStats();
    } else if (this.view === 'individual' && this.selectedHouse) {
      this.calculateIndividualStats(this.selectedHouse);
    }
  }
}

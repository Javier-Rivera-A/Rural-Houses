import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxChartsModule, LegendPosition } from '@swimlane/ngx-charts';

import { DateRangePickerComponent, DateRange } from '../date-range-picker/date-range-picker.component';
import { KpiCardComponent } from '../kpi-card/kpi-card.component';
import { ChartCardComponent } from '../chart-card/chart-card.component';

@Component({
  selector: 'app-stats-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    NgxChartsModule,
    DateRangePickerComponent,
    KpiCardComponent,
    ChartCardComponent
  ],
  templateUrl: './stats-dashboard.component.html'
})
export class StatsDashboardComponent implements OnChanges {
  @Input({ required: true }) title!: string;
  @Input() subtitle?: string;
  @Input({ required: true }) dateRange!: any;
  @Input({ required: true }) revenueData!: any[];
  @Input({ required: true }) occupancyData!: any[];
  @Input({ required: true }) reservationStatusData!: any[];
  @Input({ required: true }) fourthChart!: { title: string, type: 'horizontal-bar' | 'pie', data: any[] };
  @Input({ required: true }) kpis!: { revenue: string, occupancy: string, reservations: number };
  @Input() isEmpty: boolean = false;

  @Output() dateRangeChange = new EventEmitter<DateRange>();

  legendPositionBelow: LegendPosition = LegendPosition.Below;

  // Variables reales que las gráficas pueden leer sin volverse locas
  chartRevenueData: any[] = [];
  chartOccupancyData: any[] = [];
  chartStatusData: any[] = [];
  chartFourthData: any[] = [];

  // Este método se dispara SOLO cuando llegan nuevos datos de la base de datos
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['revenueData'] && this.revenueData) {
      // Como ahora usaremos barras en vez de línea, simplificamos el arreglo
      this.chartRevenueData = this.revenueData.map(d => ({ name: d.month, value: d.ingresos }));
    }

    if (changes['occupancyData'] && this.occupancyData) {
      this.chartOccupancyData = this.occupancyData.map(d => ({ name: d.period, value: d.ocupacion }));
    }

    if (changes['reservationStatusData'] && this.reservationStatusData) {
      // FILTRAMOS LOS CEROS: Para que el pastel no se rompa intentando dibujar "0 Canceladas"
      this.chartStatusData = this.reservationStatusData.filter(d => d.value > 0);
    }

    if (changes['fourthChart'] && this.fourthChart) {
      if (this.fourthChart.type === 'horizontal-bar') {
        this.chartFourthData = this.fourthChart.data.map(d => ({ name: d.name, value: d.ingresos }));
      } else {
        // En caso de ser pastel, también filtramos los ceros
        this.chartFourthData = this.fourthChart.data.filter(d => d.value > 0).map(d => ({ name: d.name, value: d.value }));
      }
    }
  }

  colorSchemeRevenue: any = { domain: ['#AA4465'] };
  colorSchemeOccupancy: any = { domain: ['#2CA58D'] };

  customColorsStatus = (name: string) => {
    const item = this.reservationStatusData?.find(d => d.name === name);
    return item ? item.color : '#333745';
  };

  customColorsFourth = (name: string) => {
    if (this.fourthChart?.type === 'pie') {
      const item = this.fourthChart.data.find(d => d.name === name);
      return item ? item.color : '#AA4465';
    }
    return '#AA4465';
  };
}

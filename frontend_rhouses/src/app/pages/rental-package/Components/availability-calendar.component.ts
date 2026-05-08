import { Component, OnInit, OnChanges, Input, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RentalPackageResponse } from '../../../Services/CountryHouse/country-house.service';

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  packages: RentalPackageResponse[];
  reservations: ReservationOverlay[];
}

export interface ReservationOverlay {
  id: string;
  rentalCode: string;
  checkInDate: string;
  checkOutDate: string;
  state: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';
}

@Component({
  selector: 'app-availability-calendar',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    :host { display: block; }
    .cal-day { min-height: 88px; }
    .pkg-pill {
      display: block;
      font-size: 10px;
      line-height: 1.3;
      padding: 2px 5px;
      border-radius: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: white;
      font-weight: 600;
    }
    .rental-pill {
      display: block;
      font-size: 9px;
      line-height: 1.2;
      padding: 1px 5px;
      border-radius: 4px;
      color: white;
      font-weight: 700;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `],
  template: `
    <div class="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">

      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-5 border-b border-gray-100">
        <div>
          <h2 class="text-lg font-black" style="color: var(--rhouses-secondary-dark)">
            Calendario de paquetes
          </h2>
          <p class="text-xs text-gray-400 mt-0.5">
            {{ packages.length }} paquete{{ packages.length !== 1 ? 's' : '' }} registrado{{ packages.length !== 1 ? 's' : '' }}
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button (click)="prevMonth()"
            class="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            style="color: var(--rhouses-secondary-dark)">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <span class="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold min-w-[150px] text-center"
                style="color: var(--rhouses-secondary-dark)">
            {{ monthLabel }}
          </span>
          <button (click)="nextMonth()"
            class="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            style="color: var(--rhouses-secondary-dark)">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
          </button>
          <button (click)="goToday()"
            class="ml-1 px-3 py-2 rounded-xl text-xs font-bold border transition-colors"
            [style]="isCurrentMonthToday
              ? 'border-color:#AA4465;color:#AA4465;background:#AA446512'
              : 'border-color:#e5e7eb;color:#9ca3af'">
            Hoy
          </button>
        </div>
      </div>

      <!-- Leyenda -->
      <div class="flex flex-wrap items-center gap-x-5 gap-y-1.5 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500">
        <div class="flex items-center gap-1.5">
          <span class="w-3 h-3 rounded-sm" style="background:#AA4465"></span> Casa completa
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-3 h-3 rounded-sm" style="background:#7C5CBF"></span> Por habitaciones
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-3 h-3 rounded-sm" style="background:#2CA58D"></span> Ambas opciones
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-3 h-3 rounded-sm" style="background:#f59e0b"></span> Reserva pendiente
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-3 h-3 rounded-sm" style="background:#166534"></span> Reserva confirmada
        </div>
      </div>

      <!-- Días de la semana -->
      <div class="grid grid-cols-7 border-b border-gray-100">
        <div *ngFor="let d of weekDays"
             class="py-2 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
          {{ d }}
        </div>
      </div>

      <!-- Grilla -->
      <div class="grid grid-cols-7">
        <div *ngFor="let cell of calendarDays; let i = index"
             class="cal-day p-1.5 border-b border-r border-gray-100 overflow-hidden"
             [style.background]="!cell.isCurrentMonth ? '#fafafa' : 'white'"
             [style.border-right]="(i + 1) % 7 === 0 ? 'none' : ''">

          <!-- Número -->
          <div class="flex items-center justify-center mb-1">
            <span class="w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold"
                  [style.background]="cell.isToday ? '#AA4465' : 'transparent'"
                  [style.color]="cell.isToday ? 'white' : (!cell.isCurrentMonth ? '#d1d5db' : '#374151')">
              {{ cell.dayNumber }}
            </span>
          </div>

          <!-- Paquetes del día -->
          <div *ngIf="cell.isCurrentMonth && cell.packages.length > 0" class="flex flex-col gap-0.5">
            <span *ngFor="let pkg of cell.packages.slice(0, 2)"
                  class="pkg-pill"
                  [style.background]="getPkgColor(pkg.typeRental)">
              <ng-container *ngIf="isStartDay(cell.date, pkg)">
                $ {{ pkg.priceNight }} &middot; {{ getRentalLabel(pkg.typeRental) }}
              </ng-container>
              <ng-container *ngIf="!isStartDay(cell.date, pkg)">&nbsp;</ng-container>
            </span>
            <span *ngIf="cell.packages.length > 2"
                  class="text-center text-gray-400 font-semibold"
                  style="font-size:9px">
              +{{ cell.packages.length - 2 }} más
            </span>
          </div>

          <!-- Overlay de reservas -->
          <div *ngIf="cell.isCurrentMonth && cell.reservations.length > 0" class="flex flex-col gap-0.5 mt-1">
            <span *ngFor="let reservation of cell.reservations.slice(0, 1)"
                  class="rental-pill"
                  [style.background]="getReservationColor(reservation.state)">
              <ng-container *ngIf="isReservationStartDay(cell.date, reservation)">
                {{ reservation.state === 'PENDING' ? 'Pendiente' : 'Confirmada' }}
              </ng-container>
              <ng-container *ngIf="!isReservationStartDay(cell.date, reservation)">&nbsp;</ng-container>
            </span>
            <span *ngIf="cell.reservations.length > 1"
                  class="text-center text-gray-400 font-semibold"
                  style="font-size:9px">
              +{{ cell.reservations.length - 1 }} reserva{{ cell.reservations.length - 1 !== 1 ? 's' : '' }}
            </span>
          </div>

          <!-- Sin paquetes -->
          <div *ngIf="cell.isCurrentMonth && cell.packages.length === 0"
               class="flex items-end justify-center" style="height:48px">
            <span style="font-size:9px;color:#d1d5db;font-weight:600">—</span>
          </div>

        </div>
      </div>

      <!-- Sin paquetes en el mes -->
      <div *ngIf="packagesInMonth === 0 && packages.length > 0"
           class="py-6 text-center text-sm text-gray-400 border-t border-gray-100">
        No hay paquetes en este mes — navega a otro mes o crea uno nuevo.
      </div>

      <!-- Resumen del mes -->
      <div *ngIf="packagesInMonthList.length > 0" class="border-t border-gray-100 px-6 py-4">
        <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
          Paquetes en {{ monthLabel }}
        </p>
        <div class="space-y-2">
          <div *ngFor="let pkg of packagesInMonthList"
               class="flex items-center gap-3 text-sm">
            <span class="w-2.5 h-2.5 rounded-sm shrink-0"
                  [style.background]="getPkgColor(pkg.typeRental)"></span>
            <span class="font-semibold text-gray-700 flex-1">
              {{ formatDate(pkg.startingDate) }} &rarr; {{ formatDate(pkg.endingDate) }}
            </span>
            <span class="font-black" style="color:#AA4465">$ {{ pkg.priceNight }}/noche</span>
            <span class="text-xs px-2 py-0.5 rounded-full font-semibold"
                  [style.background]="getPkgLightColor(pkg.typeRental)"
                  [style.color]="getPkgColor(pkg.typeRental)">
              {{ getRentalLabel(pkg.typeRental) }}
            </span>
          </div>
        </div>
      </div>

    </div>
  `
})
export class AvailabilityCalendarComponent implements OnInit, OnChanges {

  @Input() packages: RentalPackageResponse[] = [];
  @Input() reservations: ReservationOverlay[] = [];

  weekDays    = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  calendarDays: CalendarDay[] = [];

  currentYear  = new Date().getFullYear();
  currentMonth = new Date().getMonth();

  get monthLabel(): string {
    return new Date(this.currentYear, this.currentMonth, 1)
      .toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
      .replace(/^\w/, c => c.toUpperCase());
  }

  get isCurrentMonthToday(): boolean {
    const n = new Date();
    return this.currentMonth === n.getMonth() && this.currentYear === n.getFullYear();
  }

  get packagesInMonthList(): RentalPackageResponse[] {
    const first = new Date(this.currentYear, this.currentMonth, 1);
    const last  = new Date(this.currentYear, this.currentMonth + 1, 0);
    return this.packages.filter(pkg => {
      const s = this.parseDate(pkg.startingDate);
      const e = this.parseDate(pkg.endingDate);
      return s <= last && e >= first;
    });
  }

  get packagesInMonth(): number {
    return this.packagesInMonthList.length;
  }

  ngOnInit(): void  { this.buildCalendar(); }
  ngOnChanges(c: SimpleChanges): void {
    if (c['packages'] || c['reservations']) this.buildCalendar();
  }

  prevMonth(): void {
    if (this.currentMonth === 0) { this.currentMonth = 11; this.currentYear--; }
    else { this.currentMonth--; }
    this.buildCalendar();
  }

  nextMonth(): void {
    if (this.currentMonth === 11) { this.currentMonth = 0; this.currentYear++; }
    else { this.currentMonth++; }
    this.buildCalendar();
  }

  goToday(): void {
    const n = new Date();
    this.currentMonth = n.getMonth();
    this.currentYear  = n.getFullYear();
    this.buildCalendar();
  }

  buildCalendar(): void {
    const today      = new Date();
    const firstDay   = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay    = new Date(this.currentYear, this.currentMonth + 1, 0);
    const startPad   = firstDay.getDay();
    const totalCells = Math.ceil((startPad + lastDay.getDate()) / 7) * 7;

    this.calendarDays = Array.from({ length: totalCells }, (_, i) => {
      const date           = new Date(this.currentYear, this.currentMonth, 1 - startPad + i);
      const isCurrentMonth = date.getMonth() === this.currentMonth;
      const isToday        = date.toDateString() === today.toDateString();

      const pkgsForDay = this.packages.filter(pkg => {
        const s = this.parseDate(pkg.startingDate);
        const e = this.parseDate(pkg.endingDate);
        return date >= s && date <= e;
      });

      const reservationsForDay = this.reservations.filter((reservation) => {
        if (reservation.state !== 'PENDING' && reservation.state !== 'CONFIRMED') return false;
        const start = this.parseDate(reservation.checkInDate);
        const end = this.parseDate(reservation.checkOutDate);
        return date >= start && date < end;
      });

      return {
        date,
        dayNumber: date.getDate(),
        isCurrentMonth,
        isToday,
        packages: pkgsForDay,
        reservations: reservationsForDay
      };
    });
  }

  isStartDay(date: Date, pkg: RentalPackageResponse): boolean {
    return this.parseDate(pkg.startingDate).toDateString() === date.toDateString();
  }

  isReservationStartDay(date: Date, reservation: ReservationOverlay): boolean {
    return this.parseDate(reservation.checkInDate).toDateString() === date.toDateString();
  }

  parseDate(dateStr: string): Date {
    return new Date(dateStr.split('T')[0] + 'T00:00:00');
  }

  formatDate(dateStr: string): string {
    return this.parseDate(dateStr).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getRentalLabel(type: string): string {
    const map: Record<string, string> = {
      ENTIRE_HOUSE: 'Casa', ROOMS: 'Cuartos', BOTH: 'Ambas'
    };
    return map[type] ?? type;
  }

  getPkgColor(type: string): string {
    const map: Record<string, string> = {
      ENTIRE_HOUSE: '#AA4465', ROOMS: '#7C5CBF', BOTH: '#2CA58D'
    };
    return map[type] ?? '#E06C3B';
  }

  getPkgLightColor(type: string): string {
    const map: Record<string, string> = {
      ENTIRE_HOUSE: '#AA446518', ROOMS: '#7C5CBF18', BOTH: '#2CA58D18'
    };
    return map[type] ?? '#E06C3B18';
  }

  getReservationColor(state: ReservationOverlay['state']): string {
    if (state === 'PENDING') return '#f59e0b';
    return '#166534';
  }
}
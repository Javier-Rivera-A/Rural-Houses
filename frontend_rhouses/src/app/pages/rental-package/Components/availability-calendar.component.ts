import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges
} from '@angular/core';

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
  state: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED' | 'PAID';
}

@Component({
  selector: 'app-availability-calendar',
  standalone: true,
  imports: [CommonModule],

  styles: [`
    :host {
      display: block;
    }

    .calendar-container {
      background: white;
      border-radius: 24px;
      overflow: hidden;
      border: 1px solid #e5e7eb;
      box-shadow:
        0 1px 2px rgba(0,0,0,.04),
        0 8px 24px rgba(0,0,0,.04);
    }

    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
    }

    .cal-day {
      min-height: 110px;
      border-right: 1px solid #f1f5f9;
      border-bottom: 1px solid #f1f5f9;
      position: relative;
      overflow: hidden;
      padding: 6px;
      transition: all .18s ease;
      background: white;
    }

    .cal-day:hover {
      z-index: 10;
      transform: scale(1.015);
      box-shadow: 0 4px 18px rgba(0,0,0,.06);
    }

    .day-number {
      width: 28px;
      height: 28px;
      border-radius: 999px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 800;
    }

    .range-bar {
      width: 100%;
      height: 18px;
      margin-bottom: 2px;
      display: flex;
      align-items: center;
      color: white;
      font-size: 9px;
      font-weight: 700;
      padding-inline: 6px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .reservation-bar {
      width: 100%;
      height: 16px;
      margin-top: 2px;
      display: flex;
      align-items: center;
      color: white;
      font-size: 8px;
      font-weight: 800;
      padding-inline: 6px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .occupation-dot {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      position: absolute;
      top: 8px;
      right: 8px;
    }

    .empty-day {
      height: 55px;
      display: flex;
      align-items: end;
      justify-content: center;
      color: #d1d5db;
      font-size: 10px;
      font-weight: 700;
    }

    @media (max-width: 768px) {

      .cal-day {
        min-height: 78px;
        padding: 4px;
      }

      .range-bar {
        height: 14px;
        font-size: 7px;
        padding-inline: 4px;
      }

      .reservation-bar {
        height: 13px;
        font-size: 7px;
        padding-inline: 4px;
      }

      .day-number {
        width: 22px;
        height: 22px;
        font-size: 10px;
      }
    }
  `],

  template: `
    <div class="calendar-container">

      <!-- HEADER -->
      <div
        class="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-white sticky top-0 z-20">

        <div>
          <h2
            class="text-lg font-black"
            style="color: var(--rhouses-secondary-dark)">
            Calendario de disponibilidad
          </h2>

          <p class="text-xs text-gray-400 mt-1">
            {{ packages.length }}
            paquete{{ packages.length !== 1 ? 's' : '' }}
          </p>
        </div>

        <div class="flex items-center gap-2">

          <button
            (click)="prevMonth()"
            class="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all">

            <svg xmlns="http://www.w3.org/2000/svg"
                 width="18"
                 height="18"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="2"
                 viewBox="0 0 24 24">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>

          <div
            class="px-5 py-2 rounded-xl border border-gray-200 text-sm font-bold min-w-[180px] text-center">
            {{ monthLabel }}
          </div>

          <button
            (click)="nextMonth()"
            class="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all">

            <svg xmlns="http://www.w3.org/2000/svg"
                 width="18"
                 height="18"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="2"
                 viewBox="0 0 24 24">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>

          <button
            (click)="goToday()"
            class="px-4 py-2 rounded-xl border text-xs font-bold transition-all"
            [style]="isCurrentMonthToday
              ? 'border-color:#AA4465;color:#AA4465;background:#AA446512'
              : 'border-color:#e5e7eb;color:#9ca3af'">

            Hoy
          </button>
        </div>
      </div>

      <!-- LEYENDA -->
      <div
        class="flex flex-wrap items-center gap-x-6 gap-y-2 px-6 py-4 bg-gray-50 border-b border-gray-200 text-sm font-bold text-gray-500">

        <div class="flex items-center gap-2">
          <span class="w-4 h-4 rounded-md" style="background:#AA4465"></span>
          Casa completa
        </div>

        <div class="flex items-center gap-2">
          <span class="w-4 h-4 rounded-md" style="background:#7C5CBF"></span>
          Por habitaciones
        </div>

        <div class="flex items-center gap-2">
          <span class="w-4 h-4 rounded-md" style="background:#2CA58D"></span>
          Ambas opciones
        </div>

        <div class="flex items-center gap-2">
          <span class="w-4 h-4 rounded-md" style="background:#f59e0b"></span>
          Reserva pendiente
        </div>

        <div class="flex items-center gap-2">
          <span class="w-4 h-4 rounded-md" style="background:#166534"></span>
          Reserva confirmada
        </div>
      </div>

      <!-- DIAS -->
      <div class="calendar-grid border-b border-gray-200 bg-gray-50">

        <div
          *ngFor="let d of weekDays"
          class="py-3 text-center text-xs font-black uppercase tracking-wider text-gray-400">

          {{ d }}
        </div>
      </div>

      <!-- GRID -->
      <div class="calendar-grid">

        <div
          *ngFor="let cell of calendarDays; trackBy: trackByDate; let i = index"
          class="cal-day"

          [style.background]="cell.isCurrentMonth
            ? getCellBackground(cell)
            : '#fafafa'"

          [style.border-right]="(i + 1) % 7 === 0 ? 'none' : ''"

          [style.boxShadow]="
            hasConfirmedReservation(cell)
              ? 'inset 0 0 0 2px #166534'
              : ''
          ">

          <!-- Indicador -->
          <div
            class="occupation-dot"
            [style.background]="getOccupationColor(cell)">
          </div>

          <!-- Numero -->
          <div class="flex justify-center mb-2">

            <div
              class="day-number"
              [style.background]="cell.isToday ? '#AA4465' : 'transparent'"
              [style.color]="cell.isToday
                ? 'white'
                : (!cell.isCurrentMonth ? '#d1d5db' : '#374151')">

              {{ cell.dayNumber }}
            </div>
          </div>

          <!-- CONTENIDO -->
          <ng-container *ngIf="cell.isCurrentMonth">

            <!-- PAQUETES -->
            <div
              *ngFor="let pkg of cell.packages.slice(0, 2)"
              class="range-bar"
              [style.background]="getPkgColor(pkg.typeRental)"
              [style.borderRadius]="getRangeRadius(cell.date, pkg)">

              <ng-container *ngIf="isStartDay(cell.date, pkg)">
                {{ formatPrice(
                  pkg.typeRental === 'ROOMS'
                    ? pkg.pricePerRoomNight
                    : pkg.priceNight
                ) }}
              </ng-container>

            </div>

            <!-- RESERVAS -->
            <div
              *ngFor="let reservation of cell.reservations.slice(0, 2)"
              class="reservation-bar"
              [style.background]="getReservationColor(reservation.state)"
              [style.borderRadius]="getReservationRadius(cell.date, reservation)">

              <ng-container *ngIf="isReservationStartDay(cell.date, reservation)">

                {{ reservation.rentalCode }}

                ·

                {{
                  reservation.state === 'PENDING'
                    ? 'Pendiente'
                    : 'Confirmada'
                }}

              </ng-container>

            </div>

            <!-- MAS -->
            <div
              *ngIf="cell.packages.length > 2 || cell.reservations.length > 2"
              class="text-center text-[9px] font-bold text-gray-400 mt-1">

              +más
            </div>

            <!-- VACIO -->
            <div
              *ngIf="
                cell.packages.length === 0 &&
                cell.reservations.length === 0
              "
              class="empty-day">

              —
            </div>

          </ng-container>

        </div>
      </div>

      <!-- FOOTER -->
      <div
        *ngIf="packagesInMonthList.length > 0"
        class="border-t border-gray-200 px-6 py-5 bg-white">

        <p
          class="text-xs font-black uppercase tracking-wider text-gray-400 mb-4">

          Paquetes del mes
        </p>

        <div class="space-y-3">

          <div
            *ngFor="let pkg of packagesInMonthList"
            class="flex items-center gap-3 flex-wrap">

            <span
              class="w-3 h-3 rounded-md"
              [style.background]="getPkgColor(pkg.typeRental)">
            </span>

            <span class="font-bold text-gray-700">
              {{ formatDate(pkg.startingDate) }}
              →
              {{ formatDate(pkg.endingDate) }}
            </span>

            <span
              class="font-black"
              style="color:#AA4465">

              {{
                formatPrice(
                  pkg.typeRental === 'ROOMS'
                    ? pkg.pricePerRoomNight
                    : pkg.priceNight
                )
              }}

            </span>

            <span
              class="px-2 py-1 rounded-full text-xs font-bold"
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

export class AvailabilityCalendarComponent
  implements OnInit, OnChanges {

  @Input() packages: RentalPackageResponse[] = [];
  @Input() reservations: ReservationOverlay[] = [];

  weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  calendarDays: CalendarDay[] = [];

  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth();

  private packagesByDate =
    new Map<string, RentalPackageResponse[]>();

  private reservationsByDate =
    new Map<string, ReservationOverlay[]>();

  ngOnInit(): void {

    this.prepareMaps();
    this.buildCalendar();
  }

  ngOnChanges(changes: SimpleChanges): void {

    if (
      changes['packages'] ||
      changes['reservations']
    ) {

      this.prepareMaps();
      this.buildCalendar();
    }
  }

  get monthLabel(): string {

    return new Date(
      this.currentYear,
      this.currentMonth,
      1
    )
      .toLocaleDateString('es-CO', {
        month: 'long',
        year: 'numeric'
      })
      .replace(/^\w/, c => c.toUpperCase());
  }

  get packagesInMonthList(): RentalPackageResponse[] {

    const first =
      new Date(this.currentYear, this.currentMonth, 1);

    const last =
      new Date(this.currentYear, this.currentMonth + 1, 0);

    return this.packages.filter(pkg => {

      const s = this.parseDate(pkg.startingDate);
      const e = this.parseDate(pkg.endingDate);

      return s <= last && e >= first;
    });
  }

  get isCurrentMonthToday(): boolean {

    const now = new Date();

    return (
      this.currentMonth === now.getMonth() &&
      this.currentYear === now.getFullYear()
    );
  }

  prevMonth(): void {

    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }

    this.buildCalendar();
  }

  nextMonth(): void {

    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }

    this.buildCalendar();
  }

  goToday(): void {

    const now = new Date();

    this.currentMonth = now.getMonth();
    this.currentYear = now.getFullYear();

    this.buildCalendar();
  }

  buildCalendar(): void {

    const today = new Date();

    const firstDay =
      new Date(this.currentYear, this.currentMonth, 1);

    const lastDay =
      new Date(this.currentYear, this.currentMonth + 1, 0);

    const startPadding =
      firstDay.getDay();

    const totalCells =
      Math.ceil((startPadding + lastDay.getDate()) / 7) * 7;

    this.calendarDays = Array.from(
      { length: totalCells },
      (_, i) => {

        const date = new Date(
          this.currentYear,
          this.currentMonth,
          1 - startPadding + i
        );

        const key = date.toDateString();

        return {

          date,

          dayNumber:
            date.getDate(),

          isCurrentMonth:
            date.getMonth() === this.currentMonth,

          isToday:
            date.toDateString() === today.toDateString(),

          packages:
            this.packagesByDate.get(key) || [],

          reservations:
            this.reservationsByDate.get(key) || []
        };
      }
    );
  }

  prepareMaps(): void {

    this.packagesByDate.clear();
    this.reservationsByDate.clear();

    // PAQUETES
    for (const pkg of this.packages) {

      let current =
        this.parseDate(pkg.startingDate);

      const end =
        this.parseDate(pkg.endingDate);

      while (current <= end) {

        const key =
          current.toDateString();

        if (!this.packagesByDate.has(key)) {
          this.packagesByDate.set(key, []);
        }

        this.packagesByDate.get(key)!.push(pkg);

        current = new Date(
          current.getFullYear(),
          current.getMonth(),
          current.getDate() + 1
        );
      }
    }

    // RESERVAS
    for (const reservation of this.reservations) {

      if (
        reservation.state !== 'PENDING' &&
        reservation.state !== 'CONFIRMED'&&
        reservation.state !== 'PAID'
      ) {
        continue;
      }

      let current =
        this.parseDate(reservation.checkInDate);

      const end =
        this.parseDate(reservation.checkOutDate);

      while (current <= end) {

        const key =
          current.toDateString();

        if (!this.reservationsByDate.has(key)) {
          this.reservationsByDate.set(key, []);
        }

        this.reservationsByDate.get(key)!.push(reservation);

        current = new Date(
          current.getFullYear(),
          current.getMonth(),
          current.getDate() + 1
        );
      }
    }
  }

  parseDate(dateStr: string): Date {

    const onlyDate =
      dateStr.split('T')[0];

    const [year, month, day] =
      onlyDate.split('-').map(Number);

    return new Date(year, month - 1, day);
  }

  formatDate(date: string): string {

    return this.parseDate(date)
      .toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
  }

  formatPrice(value: number): string {

    if (value >= 1000000) {
      return '$' + (value / 1000000).toFixed(1) + 'M';
    }

    if (value >= 1000) {
      return '$' + Math.floor(value / 1000) + 'k';
    }

    return '$' + value;
  }

  trackByDate(index: number, item: CalendarDay): string {
    return item.date.toISOString();
  }

  getRentalLabel(type: string): string {

    const map: Record<string, string> = {
      ENTIRE_HOUSE: 'Casa completa',
      ROOMS: 'Por habitaciones',
      BOTH: 'Ambas opciones'
    };

    return map[type] ?? type;
  }

  getPkgColor(type: string): string {

    const map: Record<string, string> = {
      ENTIRE_HOUSE: '#AA4465',
      ROOMS: '#7C5CBF',
      BOTH: '#2CA58D'
    };

    return map[type] ?? '#AA4465';
  }

  getPkgLightColor(type: string): string {

    const map: Record<string, string> = {
      ENTIRE_HOUSE: '#AA446518',
      ROOMS: '#7C5CBF18',
      BOTH: '#2CA58D18'
    };

    return map[type] ?? '#AA446518';
  }

  getReservationColor(state: ReservationOverlay['state']): string {

    return state === 'PENDING'
      ? '#f59e0b'
      : '#166534';
  }

  getCellBackground(cell: CalendarDay): string {

    const hasConfirmed =
      cell.reservations.some(
        r => r.state === 'CONFIRMED'|| r.state === 'PAID'
      );

    if (hasConfirmed) {
      return '#16653422';
    }

    const hasPending =
      cell.reservations.some(
        r => r.state === 'PENDING'
      );

    if (hasPending) {
      return '#f59e0b22';
    }

    if (cell.packages.some(p => p.typeRental === 'BOTH')) {
      return '#2CA58D10';
    }

    if (cell.packages.some(p => p.typeRental === 'ROOMS')) {
      return '#7C5CBF10';
    }

    if (cell.packages.some(p => p.typeRental === 'ENTIRE_HOUSE')) {
      return '#AA446510';
    }

    return 'white';
  }

  getOccupationColor(cell: CalendarDay): string {

    if (
      cell.reservations.some(
        r => r.state === 'CONFIRMED'|| r.state === 'PAID'
      )
    ) {
      return '#166534';
    }

    if (
      cell.reservations.length > 0 ||
      cell.packages.length > 0
    ) {
      return '#f59e0b';
    }

    return '#d1d5db';
  }

  hasConfirmedReservation(cell: CalendarDay): boolean {

    return cell.reservations.some(
      r => r.state === 'CONFIRMED'|| r.state === 'PAID'
    );
  }

  isStartDay(
    date: Date,
    pkg: RentalPackageResponse
  ): boolean {

    return (
      this.parseDate(pkg.startingDate)
        .toDateString() === date.toDateString()
    );
  }

  isEndDay(
    date: Date,
    pkg: RentalPackageResponse
  ): boolean {

    return (
      this.parseDate(pkg.endingDate)
        .toDateString() === date.toDateString()
    );
  }

  getRangeRadius(
    date: Date,
    pkg: RentalPackageResponse
  ): string {

    const isStart =
      this.isStartDay(date, pkg);

    const isEnd =
      this.isEndDay(date, pkg);

    if (isStart && isEnd) {
      return '6px';
    }

    if (isStart) {
      return '6px 0 0 6px';
    }

    if (isEnd) {
      return '0 6px 6px 0';
    }

    return '0';
  }

  isReservationStartDay(
    date: Date,
    reservation: ReservationOverlay
  ): boolean {

    return (
      this.parseDate(reservation.checkInDate)
        .toDateString() === date.toDateString()
    );
  }

  isReservationEndDay(
    date: Date,
    reservation: ReservationOverlay
  ): boolean {

    return (
      this.parseDate(reservation.checkOutDate)
        .toDateString() === date.toDateString()
    );
  }

  getReservationRadius(
    date: Date,
    reservation: ReservationOverlay
  ): string {

    const isStart =
      this.isReservationStartDay(date, reservation);

    const isEnd =
      this.isReservationEndDay(date, reservation);

    if (isStart && isEnd) {
      return '6px';
    }

    if (isStart) {
      return '6px 0 0 6px';
    }

    if (isEnd) {
      return '0 6px 6px 0';
    }

    return '0';
  }
}

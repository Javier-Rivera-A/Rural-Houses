import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  ChevronLeft,
  ChevronRight,
  Calendar
} from 'lucide-angular';

// Definimos la estructura de datos para un día del calendario
interface CalendarDay {
  day: number | string;
  status: 'available' | 'booked' | 'maintenance' | 'none';
  isCurrentMonth: boolean;
}

@Component({
  selector: 'app-availability-calendar',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule
  ],
  template: `
    <div class="bg-white p-8 rounded-xl shadow-sm border border-gray-100">

      <div class="flex items-center justify-between mb-8">
        <div>
          <h2 class="text-2xl font-bold text-[#333745] flex items-center gap-3">
            <lucide-icon name="calendar" class="text-[#AA4465]" [size]="28"></lucide-icon>
            Calendario de Disponibilidad
          </h2>
          <p class="text-gray-500 mt-1">Vista previa interactiva (Mockup de la funcionalidad)</p>
        </div>
        <div class="flex gap-2">
          <button class="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-[#333745]">
            <lucide-icon name="chevron-left" [size]="20"></lucide-icon>
          </button>
          <div class="px-6 py-2 border border-gray-200 rounded-xl font-semibold text-[#333745] flex items-center">
            Octubre 2026
          </div>
          <button class="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-[#333745]">
            <lucide-icon name="chevron-right" [size]="20"></lucide-icon>
          </button>
        </div>
      </div>

      <div class="flex items-center gap-6 mb-8 text-sm">
        <div class="flex items-center gap-2 text-gray-600 font-medium">
          <span class="w-4 h-4 rounded-full bg-[#E1E5F2] border border-[#2CA58D] text-[#2CA58D] flex items-center justify-center text-[10px] font-bold">✓</span>
          Disponible
        </div>
        <div class="flex items-center gap-2 text-gray-600 font-medium">
          <span class="w-4 h-4 rounded-full bg-[#AA4465]"></span>
          Reservado
        </div>
        <div class="flex items-center gap-2 text-gray-600 font-medium">
          <span class="w-4 h-4 rounded-full bg-gray-300"></span>
          Mantenimiento
        </div>
      </div>

      <div class="border border-gray-200 rounded-xl overflow-hidden">

        <div class="grid grid-cols-7 bg-[#333745]">
          @for (day of daysOfWeek; track $index) {
            <div class="py-3 text-center text-sm font-semibold text-white">
              {{ day }}
            </div>
          }
        </div>

        <div class="grid grid-cols-7 border-t border-gray-200 bg-white">
          @for (d of days; track $index) {
            <div
              [class]="'min-h-[120px] border-r border-b border-gray-200 p-2 relative transition-colors ' +
                (!d.isCurrentMonth ? 'bg-gray-50/50' : 'hover:bg-gray-50 cursor-pointer') +
                ($index % 7 === 6 ? ' border-r-0' : '')"
            >
              @if (d.day) {
                <span [class]="'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ' +
                  (d.day === 15 ? 'bg-[#333745] text-white' : 'text-[#333745]')">
                  {{ d.day }}
                </span>
              }

              @if (d.isCurrentMonth) {
                <div class="absolute bottom-2 left-2 right-2 flex flex-col gap-1">
                  @if (d.status === 'available') {
                    <div class="text-[10px] bg-[#E1E5F2] text-[#2CA58D] font-bold py-1.5 px-2 rounded-lg border border-[#2CA58D]/20 text-center truncate">
                      3 Paquetes Libres
                    </div>
                  }
                  @if (d.status === 'booked') {
                    <div class="text-[10px] bg-[#AA4465] text-white font-medium py-1.5 px-2 rounded-lg text-center truncate shadow-sm">
                      Lleno
                    </div>
                  }
                  @if (d.status === 'maintenance') {
                    <div class="text-[10px] bg-gray-200 text-gray-600 font-medium py-1.5 px-2 rounded-lg text-center truncate">
                      Cerrado
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>

      </div>
    </div>
  `
})
export class AvailabilityCalendarComponent implements OnInit {
  daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  days: CalendarDay[] = [];

  // Se ejecuta al iniciar el componente (equivalente a correr la lógica al montar)
  ngOnInit() {
    this.days = Array.from({ length: 35 }, (_, i) => {
      const day = i - 2; // Offset para empezar en un día diferente
      const isCurrentMonth = day > 0 && day <= 31;

      let status: 'available' | 'booked' | 'maintenance' | 'none' = 'none';
      if (isCurrentMonth) {
        if ([5, 6, 12, 13, 19, 20, 26, 27].includes(day)) {
          status = 'booked';
        } else if ([14, 15].includes(day)) {
          status = 'maintenance';
        } else {
          status = 'available';
        }
      }

      return { day: isCurrentMonth ? day : '', status, isCurrentMonth };
    });
  }
}

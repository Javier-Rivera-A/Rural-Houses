import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RentalPackage } from '../rental-package.model';
import {
  LucideAngularModule,
  Edit2,
  Trash2,
  CalendarDays,
  CheckCircle2
} from 'lucide-angular';

@Component({
  selector: 'app-package-card',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule
  ],
  template: `
    <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group flex flex-col h-full">

      <div class="flex justify-between items-start mb-4 gap-4">
        <div class="flex-1">
          <span [class]="'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-3 ' +
            (isDraft ? 'bg-gray-100 text-[#333745]' : 'bg-[#E1E5F2] text-[#2CA58D]')">
            <span [class]="'w-1.5 h-1.5 rounded-full ' + (isDraft ? 'bg-gray-400' : 'bg-[#2CA58D]')"></span>
            {{ pkg.status }}
          </span>
          <h3 class="text-xl font-bold text-[#333745] line-clamp-1" [title]="pkg.title">
            {{ pkg.title }}
          </h3>
        </div>
        <div class="text-right shrink-0">
          <p class="text-2xl font-bold text-[#AA4465]">\${{ pkg.price }}</p>
          <p class="text-sm text-gray-500 flex items-center gap-1 justify-end mt-1">
            <lucide-icon name="calendar-days" [size]="14"></lucide-icon>
            / {{ pkg.durationDays }} {{ pkg.durationDays === 1 ? 'día' : 'días' }}
          </p>
        </div>
      </div>

      <p class="text-gray-600 text-sm mb-6 line-clamp-2 flex-1" [title]="pkg.description">
        {{ pkg.description }}
      </p>

      <ul class="mb-6 space-y-2">
        @if (pkg.features.length > 0) {
          @for (feature of pkg.features.slice(0, 3); track $index) {
            <li class="flex items-start gap-2 text-sm text-[#333745]">
              <lucide-icon name="check-circle-2" [size]="16" class="text-[#2CA58D] shrink-0 mt-0.5"></lucide-icon>
              <span class="line-clamp-1">{{ feature }}</span>
            </li>
          }
          @if (pkg.features.length > 3) {
            <li class="text-xs text-gray-400 font-medium pl-6">
              + {{ pkg.features.length - 3 }} características más
            </li>
          }
        } @else {
          <li class="text-sm text-gray-400 italic py-1">Sin características añadidas</li>
        }
      </ul>

      <div class="pt-4 border-t border-gray-100 flex justify-end gap-2 mt-auto">
        <button
          (click)="onEditClick()"
          class="p-2 text-gray-400 hover:text-[#AA4465] hover:bg-[#E1E5F2] rounded-xl transition-colors"
          title="Editar paquete"
        >
          <lucide-icon name="edit-2" [size]="18"></lucide-icon>
        </button>
        <button
          (click)="onDeleteClick()"
          class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          title="Eliminar paquete"
        >
          <lucide-icon name="trash-2" [size]="18"></lucide-icon>
        </button>
      </div>
    </div>
  `
})
export class PackageCardComponent {
  // Entradas de datos (Props)
  @Input({ required: true }) pkg!: RentalPackage;

  // Eventos de salida (Callbacks)
  @Output() edit = new EventEmitter<RentalPackage>();
  @Output() delete = new EventEmitter<string>();

  // Getter para facilitar la lectura en el HTML
  get isDraft(): boolean {
    return this.pkg.status === 'Borrador';
  }

  // Funciones disparadoras de eventos
  onEditClick() {
    this.edit.emit(this.pkg);
  }

  onDeleteClick() {
    this.delete.emit(this.pkg.id);
  }
}

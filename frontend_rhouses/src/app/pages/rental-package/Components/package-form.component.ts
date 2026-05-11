import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RentalPackage } from '../rental-package.model';
import {
  LucideAngularModule,
  Plus,
  Trash2,
  Save,
  ArrowLeft
} from 'lucide-angular';

@Component({
  selector: 'app-package-form',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 max-w-3xl mx-auto overflow-hidden">
      <div class="flex items-center gap-4 p-6 border-b border-gray-100 bg-[#E1E5F2]/30">
        <button (click)="onCancel()" class="p-2 bg-white hover:bg-gray-50 text-[#333745] rounded-xl border border-gray-200 shadow-sm">
          <lucide-icon name="arrow-left" [size]="20"></lucide-icon>
        </button>
        <h2 class="text-2xl font-bold text-[#AA4465]">
          {{ initialData ? 'Editar Paquete' : 'Crear Nuevo Paquete' }}
        </h2>
      </div>

      <form (ngSubmit)="handleSubmit()" class="p-8 space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div class="space-y-2 md:col-span-2">
            <label class="block text-sm font-semibold text-[#333745]">Tipo de Alquiler / Título <span class="text-[#AA4465]">*</span></label>
            <input required type="text" name="typeRental" [(ngModel)]="typeRental" placeholder="Ej. Temporada Alta"
                   class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#AA4465] focus:ring-2 focus:ring-[#AA4465]/20 outline-none transition-all"/>
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-semibold text-[#333745]">Precio por Noche ($) <span class="text-[#AA4465]">*</span></label>
            <input required type="number" min="0" name="priceNight" [(ngModel)]="priceNight" placeholder="0.00"
                   class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#AA4465] focus:ring-2 focus:ring-[#AA4465]/20 outline-none transition-all"/>
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-semibold text-[#333745]">Estado <span class="text-[#AA4465]">*</span></label>
            <select name="status" [(ngModel)]="status" class="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none">
              <option value="Activo">Activo</option>
              <option value="Borrador">Borrador</option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-semibold text-[#333745]">
              Fecha de Inicio <span class="text-[#AA4465]">*</span>
            </label>
            <div class="relative">
              <input
                required
                type="date"
                name="startingDate"
                [(ngModel)]="startingDate"
                class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#AA4465] focus:ring-2 focus:ring-[#AA4465]/20 outline-none transition-all text-[#333745] bg-white"
              />
            </div>
            <p class="text-[10px] text-gray-400">Día / Mes / Año</p>
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-semibold text-[#333745]">
              Fecha de Fin <span class="text-[#AA4465]">*</span>
            </label>
            <div class="relative">
              <input
                required
                type="date"
                name="endingDate"
                [(ngModel)]="endingDate"
                class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#AA4465] focus:ring-2 focus:ring-[#AA4465]/20 outline-none transition-all text-[#333745] bg-white"
              />
            </div>
            <p class="text-[10px] text-gray-400">Día / Mes / Año</p>

          </div>


          <div class="space-y-2 md:col-span-2">
            <label class="block text-sm font-semibold text-[#333745]">Descripción del Paquete <span class="text-[#AA4465]">*</span></label>
            <textarea name="description" [(ngModel)]="description" placeholder="¿Qué incluye este precio?" rows="3"
                      class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#AA4465] outline-none resize-none"></textarea>
          </div>
        </div>

        <div class="pt-8 border-t border-gray-100 flex justify-end gap-4">
          <button type="button" (click)="onCancel()" class="px-6 py-3 text-[#333745] font-medium hover:bg-gray-100 rounded-xl transition-colors">
            Cancelar
          </button>
          <button type="submit" class="px-8 py-3 bg-[#AA4465] text-white font-semibold rounded-xl hover:bg-[#8c3552] transition-colors shadow-sm flex items-center gap-2">
            <lucide-icon name="save" [size]="20"></lucide-icon>
            {{ initialData ? 'Actualizar' : 'Guardar' }}
          </button>
        </div>
      </form>
    </div>
  `
})
export class PackageFormComponent implements OnInit {
  @Input() initialData?: RentalPackage | null;
  @Output() save = new EventEmitter<RentalPackage>();
  @Output() cancel = new EventEmitter<void>();

  typeRental = '';
  priceNight: number | null = null;
  startingDate = '';
  endingDate = '';
  description = '';
  status: 'Activo' | 'Borrador' = 'Activo';
  features: string[] = [];
  newFeature = '';


  ngOnInit() {
    if (this.initialData) {
      this.typeRental = this.initialData.typeRental;
      this.priceNight = this.initialData.priceNight;
      this.startingDate = this.initialData.startingDate;
      this.endingDate = this.initialData.endingDate;
      this.description = this.initialData.description;
      this.status = this.initialData.status || 'Activo';
      this.features = [...this.initialData.features];
    }
  }


  handleSubmit() {
    if (!this.typeRental || !this.priceNight || !this.startingDate || !this.endingDate) {
      alert('Por favor, completa todos los campos obligatorios.');
      return;
    }

    if (new Date(this.startingDate) >= new Date(this.endingDate)) {
      alert('La fecha de inicio debe ser anterior a la fecha de fin.');
      return;
    }

    const packagePayload = {
      typeRental: this.typeRental,
      priceNight: Number(this.priceNight),
      startingDate: this.startingDate, // Formato YYYY-MM-DD ya viene del input date
      endingDate: this.endingDate,
      description: this.description,
      status: this.status
    };

    this.save.emit(packagePayload);
  }

  addFeature() {
    if (this.newFeature.trim()) {
      this.features.push(this.newFeature.trim());
      this.newFeature = ''; // Limpiamos el input
    }
  }

  removeFeature(index: number) {
    this.features.splice(index, 1);
  }

  onCancel() {
    this.cancel.emit();
  }

}
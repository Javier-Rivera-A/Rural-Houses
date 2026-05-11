import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
// Importamos los íconos de lucide-angular
import { LucideAngularModule, Package, Calendar, Settings, Home } from 'lucide-angular';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule
  ],
  template: `
    <div class="w-64 bg-white h-screen border-r border-gray-200 flex flex-col fixed left-0 top-0 z-10 shadow-sm">

      <div class="p-6">
        <h1 class="text-2xl font-bold text-[#AA4465] flex items-center gap-2">
          <div class="w-8 h-8 rounded-xl bg-[#AA4465] flex items-center justify-center text-white text-lg">
            r
          </div>
          rhouses
        </h1>
      </div>

      <nav class="flex-1 px-4 space-y-2 mt-4">
        @for (item of navItems; track item.id) {
          <button
            (click)="onNavigateClick(item.id)"
            [class]="'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ' +
              (isActive(item.id)
                ? 'bg-[#E1E5F2] text-[#AA4465] font-semibold'
                : 'text-[#333745] hover:bg-gray-50')"
          >
            <lucide-icon
              [name]="item.iconName"
              [size]="20"
              [class]="isActive(item.id) ? 'text-[#AA4465]' : 'text-[#333745] opacity-70'">
            </lucide-icon>
            {{ item.label }}
          </button>
        }
      </nav>

      <div class="p-4 border-t border-gray-100">
        <div class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
          <div class="w-10 h-10 rounded-full bg-[#E1E5F2] flex items-center justify-center text-[#AA4465] font-bold shadow-sm border border-white">
            <lucide-icon name="user" [size]="20"></lucide-icon>
          </div>
          <div class="text-sm text-left flex-1">
            <p class="font-medium text-[#333745]">{{ userName }}</p>
            <p class="text-gray-500 text-xs">{{ userEmail }}</p>
          </div>
        </div>
      </div>

    </div>
  `
})
export class SidebarComponent {
  @Input() currentView: string = 'dashboard';
  @Output() navigate = new EventEmitter<string>();
  @Input() userName: string = 'Usuario';
  @Input() userEmail: string = 'correo@ejemplo.com';

  navItems = [
    { id: 'dashboard', label: 'Resumen', iconName: 'home' },
    { id: 'packages', label: 'Paquetes', iconName: 'package' },
    { id: 'calendar', label: 'Disponibilidad', iconName: 'calendar' },
  ];

  isActive(itemId: string): boolean {
    return this.currentView === itemId || (this.currentView === 'form' && itemId === 'packages');
  }

  onNavigateClick(id: string) {
    this.navigate.emit(id);
  }
  onMenuClick(view: string) {
    this.navigate.emit(view);
  }
}
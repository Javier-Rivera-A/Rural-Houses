import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SidebarComponent } from './Components/sidebar.component';
import { PackageCardComponent } from './Components/package-card.component';
import { PackageFormComponent } from './Components/package-form.component';
import { AvailabilityCalendarComponent } from './Components/availability-calendar.component';
import {AuthService} from '../../Services/Auth/Auth.service';
// Importamos el modelo y los íconos
import { RentalPackage } from './rental-package.model';
import { LucideAngularModule, Plus, Package as PackageIcon, LayoutGrid, Settings } from 'lucide-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    PackageCardComponent,
    PackageFormComponent,
    AvailabilityCalendarComponent,
    LucideAngularModule
  ],
  template: `
    <div class="min-h-screen bg-[#E1E5F2]/50 flex font-sans">
      <app-sidebar
        [currentView]="currentView"
        [userName]="ownerName"
        [userEmail]="ownerEmail"
        (navigate)="handleNavigate($event)">
      </app-sidebar>

      <main class="flex-1 ml-64 p-8">
        <div class="max-w-6xl mx-auto">

          <header class="flex justify-between items-center mb-10 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div>
              <h1 class="text-3xl font-bold text-[#333745]">
                @if (currentView === 'dashboard') { Resumen de los paquetes de rentas }
                @if (currentView === 'packages') { Gestión de Paquetes }
                @if (currentView === 'calendar') { Calendario de Disponibilidad }
                @if (currentView === 'form') { {{ editingPackage ? 'Editar Paquete' : 'Nuevo Paquete' }} }
              </h1>
              <p class="text-gray-500 mt-2 font-medium">
                Bienvenido al panel de creacion de paquetes de alquiler de rhouses.
              </p>
            </div>

            @if ((currentView === 'dashboard' || currentView === 'packages') && packages.length > 0) {
              <button
                (click)="handleNavigate('form')"
                class="bg-[#333745] text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-[#232630] transition-colors shadow-sm"
              >
                <lucide-icon name="plus" [size]="20"></lucide-icon>
                Nuevo Paquete
              </button>
            }
          </header>

          <ng-template #emptyState>
            <div class="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-xl shadow-sm border border-gray-100 mt-6">
              <div class="w-24 h-24 bg-[#E1E5F2] rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-sm">
                <lucide-icon name="package" class="text-[#AA4465]" [size]="40"></lucide-icon>
              </div>
              <h2 class="text-2xl font-bold text-[#333745] mb-3">No hay paquetes creados</h2>
              <p class="text-gray-500 max-w-md mx-auto mb-8 text-lg">
                Comienza a gestionar tu negocio creando tu primer paquete de alquiler para tus clientes.
              </p>
              <button
                (click)="handleNavigate('form')"
                class="bg-[#AA4465] text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 hover:bg-[#8c3552] transition-colors shadow-sm hover:shadow-md hover:-translate-y-0.5 duration-200"
              >
                <lucide-icon name="plus" [size]="24"></lucide-icon>
                Crear Primer Paquete
              </button>
            </div>
          </ng-template>

          @switch (currentView) {

            @case ('dashboard') {
              <div class="space-y-8">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-5">
                    <div class="w-16 h-16 rounded-2xl bg-[#E1E5F2] flex items-center justify-center text-[#AA4465]">
                      <lucide-icon name="package" [size]="32"></lucide-icon>
                    </div>
                    <div>
                      <p class="text-gray-500 font-medium">Total Paquetes</p>
                      <p class="text-4xl font-bold text-[#333745]">{{ packages.length }}</p>
                    </div>
                  </div>
                  <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-5">
                    <div class="w-16 h-16 rounded-2xl bg-[#E1E5F2] flex items-center justify-center text-[#2CA58D]">
                      <lucide-icon name="layout-grid" [size]="32"></lucide-icon>
                    </div>
                    <div>
                      <p class="text-gray-500 font-medium">Paquetes Activos</p>
                      <p class="text-4xl font-bold text-[#333745]">{{ activePackagesCount }}</p>
                    </div>
                  </div>
                </div>

                @if (packages.length === 0) {
                  <ng-container *ngTemplateOutlet="emptyState"></ng-container>
                } @else {
                  <div>
                    <h3 class="text-xl font-bold text-[#333745] mb-6 flex items-center gap-2">
                      <lucide-icon name="package" class="text-[#AA4465]" [size]="24"></lucide-icon>
                      Agregados Recientemente
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                      @for (pkg of packages.slice(0, 3); track pkg.id) {
                        <app-package-card
                          [pkg]="pkg"
                          (edit)="handleEdit($event)"
                          (delete)="handleDelete($event)">
                        </app-package-card>
                      }
                    </div>
                  </div>
                }
              </div>
            }

            @case ('packages') {
              <div>
                @if (packages.length === 0) {
                  <ng-container *ngTemplateOutlet="emptyState"></ng-container>
                } @else {
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                    @for (pkg of packages; track pkg.id) {
                      <app-package-card
                        [pkg]="pkg"
                        (edit)="handleEdit($event)"
                        (delete)="handleDelete($event)">
                      </app-package-card>
                    }
                  </div>
                }
              </div>
            }

            @case ('form') {
              <app-package-form
                [initialData]="editingPackage"
                (save)="handleSave($event)"
                (cancel)="handleNavigate('packages')">
              </app-package-form>
            }

            @case ('calendar') {
              <app-availability-calendar></app-availability-calendar>
            }

          }
        </div>
      </main>
    </div>
  `
})
export class RentalPackageComponent implements OnInit{

  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  // Variables para guardar los IDs
  ownerId: string | null = null;
  houseId: string | null = null;
  currentView = 'paquetes de renta';
  packages: RentalPackage[] = [];
  editingPackage: RentalPackage | null = null;
  ownerName: string = 'Cargando...';
  ownerEmail: string = '';

  ngOnInit(): void {
    this.ownerId = this.route.snapshot.paramMap.get('ownerid');
    this.houseId = this.route.snapshot.paramMap.get('houseid');

    const user = this.authService.user();


    if(user){
      this.ownerName = user.userName;
      this.ownerEmail = user.email;
    }else{
      this.ownerName = 'Usuario Desconocido';
      this.ownerEmail = 'sin-email@rhouses.com';
    }


    console.log('ID del Dueño:', this.ownerId);
    console.log('ID de la Casa:', this.houseId);
  }

  // Getter para calcular los paquetes activos fácilmente en el HTML
  get activePackagesCount(): number {
    return this.packages.filter(p => p.status === 'Activo').length;
  }

  // Métodos de navegación y lógica
  handleNavigate(view: string) {
    this.currentView = view;
    if (view !== 'form') {
      this.editingPackage = null;
    }
  }

  handleEdit(pkg: RentalPackage) {
    this.editingPackage = pkg;
    this.currentView = 'form';
  }

  handleDelete(id: string) {
    if (confirm('¿Estás seguro de que deseas eliminar este paquete?')) {
      this.packages = this.packages.filter(p => p.id !== id);
    }
  }

  handleSave(pkg: RentalPackage) {
    if (this.editingPackage) {
      // Actualizar existente
      this.packages = this.packages.map(p => p.id === pkg.id ? pkg : p);
    } else {
      // Crear nuevo
      this.packages = [...this.packages, pkg];
    }
    this.currentView = 'packages';
    this.editingPackage = null;
  }
}

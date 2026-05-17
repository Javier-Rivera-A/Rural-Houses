import { Component, Input, Output, EventEmitter, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {
  @Input() userName: string = 'María González';
  @Input() userInitial: string = 'M';

  @Output() back = new EventEmitter<void>();
  @Output() home = new EventEmitter<void>();

  open = false;

  // Hacemos referencia al div contenedor del menú para detectar clics fuera de él
  @ViewChild('menuContainer') menuContainer!: ElementRef;

  toggleOpen(): void {
    this.open = !this.open;
  }

  // Equivalente al useEffect de React para escuchar clics en el documento
  @HostListener('document:mousedown', ['$event'])
  onGlobalClick(event: MouseEvent): void {
    if (!this.menuContainer) return;
    // Si el clic ocurrió fuera del contenedor del menú, lo cerramos
    if (!this.menuContainer.nativeElement.contains(event.target)) {
      this.open = false;
    }
  }
}

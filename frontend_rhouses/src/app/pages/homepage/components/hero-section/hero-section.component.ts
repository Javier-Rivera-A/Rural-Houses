import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hero-section.component.html'
})
export class HeroSectionComponent {
  searchData = {
    poblacion: '',
    fecha: '',
    noches: 2,
    tipoAlquiler: 'ambas'
  };

  onSearch() {
    console.log('Búsqueda:', this.searchData);
  }
}

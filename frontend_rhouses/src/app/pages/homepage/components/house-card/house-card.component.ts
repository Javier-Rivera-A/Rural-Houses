import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { House } from '../../house.model';

@Component({
  selector: 'app-house-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './house-card.component.html'
})
export class HouseCardComponent {
  @Input() house!: House;

  get typeLabel(): string {
    const labels: Record<string, string> = {
      completa: 'Casa completa',
      habitaciones: 'Por habitaciones',
      ambas: 'Ambas opciones',
    };
    return labels[this.house.type] || '';
  }
}

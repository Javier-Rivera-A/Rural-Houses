import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chart-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chart-card.component.html'
})
export class ChartCardComponent {
  @Input({ required: true }) title!: string;
  @Input() isEmpty: boolean = false;
}

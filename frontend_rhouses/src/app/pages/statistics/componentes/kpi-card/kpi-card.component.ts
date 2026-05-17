import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './kpi-card.component.html'
})
export class KpiCardComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) value!: string | number;
  @Input({ required: true }) iconName!: string;
  @Input() valueColor: string = '#2CA58D';
  @Input() suffix: string = '';
  @Input() isEmpty: boolean = false;
}

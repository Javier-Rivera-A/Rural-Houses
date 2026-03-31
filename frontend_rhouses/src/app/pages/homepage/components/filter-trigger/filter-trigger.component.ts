import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-filter-trigger',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './filter-trigger.component.html'
})
export class FilterTriggerComponent {
  @Output() triggerClick = new EventEmitter<void>();

  onClick() {
    this.triggerClick.emit();
  }
}

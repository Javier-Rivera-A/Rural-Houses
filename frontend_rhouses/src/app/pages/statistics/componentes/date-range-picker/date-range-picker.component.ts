import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

export interface DateRange {
  from: Date;
  to: Date;
}

@Component({
  selector: 'app-date-range-picker',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './date-range-picker.component.html'
})
export class DateRangePickerComponent {
  @Input({ required: true }) value!: DateRange;
  // Usamos 'valueChange' para emitir los datos modificados al componente padre
  @Output() valueChange = new EventEmitter<DateRange>();

  isOpen = false;

  toggleOpen(): void {
    this.isOpen = !this.isOpen;
  }

  closePicker(): void {
    this.isOpen = false;
  }

  // Getters para transformar el objeto Date al formato 'yyyy-MM-dd' que exige el <input type="date">
  get fromDateString(): string {
    return this.formatDateForInput(this.value.from);
  }

  get toDateString(): string {
    return this.formatDateForInput(this.value.to);
  }

  // Métodos que capturan el cambio en el input y lo devuelven al padre
  onFromChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.value) {
      // Agregamos T00:00:00 para forzar la zona horaria local
      this.valueChange.emit({ ...this.value, from: new Date(input.value + 'T00:00:00') });
    }
  }

  onToChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.value) {
      this.valueChange.emit({ ...this.value, to: new Date(input.value + 'T00:00:00') });
    }
  }

  // Función auxiliar privada para formatear
  private formatDateForInput(date: Date): string {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

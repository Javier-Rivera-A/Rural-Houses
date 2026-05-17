import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CountryHouseResponse } from '../../../../Services/CountryHouse/country-house.service';

@Component({
  selector: 'app-house-card',
  standalone: true,
  imports: [CommonModule], // Ya no necesitamos LucideAngularModule porque el HTML usa SVGs nativos
  templateUrl: './house-card.component.html'
})
export class HouseCardComponent {
  @Input({ required: true }) house!: CountryHouseResponse;
  @Output() viewStats = new EventEmitter<CountryHouseResponse>();

  onViewStats(): void {
    if (this.isActive()) {
      this.viewStats.emit(this.house);
    }
  }

  getFirstPhoto(): string {
    return this.house.photo?.[0]?.url?.trim()
      ? this.house.photo[0].url
      : 'https://images.unsplash.com/photo-1572345901383-be2fcd1625f3?w=800&q=80';
  }

  getTotalBathrooms(): number {
    return (this.house.privateBathrooms ?? 0) + (this.house.publicBathrooms ?? 0);
  }

  isActive(): boolean {
    return this.house.stateCountryHouse === 'ACTIVE';
  }
}

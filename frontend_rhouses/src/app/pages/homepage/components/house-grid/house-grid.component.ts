import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HouseCardComponent } from '../house-card/house-card.component';
import { House } from '../../house.model';

@Component({
  selector: 'app-house-grid',
  standalone: true,
  imports: [CommonModule, HouseCardComponent],
  templateUrl: './house-grid.component.html'
})
export class HouseGridComponent {
  @Input() loading: boolean = false;
  @Input() empty: boolean = false;

  mockHouses: House[] = [
    {
      id: '1',
      name: 'Casa Rural El Refugio',
      location: 'Valle de Baztán, Navarra',
      price: 350,
      image: 'https://images.unsplash.com/photo-1762424361602-3715f4ab20f6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3p5JTIwY290dGFnZSUyMHN0b25lJTIwaG91c2V8ZW58MXx8fHwxNzc0OTMzNjY2fDA&ixlib=rb-4.1.0&q=80&w=1080',
      type: 'completa',
      available: true,
      bedrooms: 4,
      bathrooms: 2,
      capacity: 8,
      parking: 2,
    },
    {
      id: '2',
      name: 'Cabaña Montaña Perdida',
      location: 'Pirineos, Huesca',
      price: 280,
      image: 'https://images.unsplash.com/photo-1774450660512-7039c14faf09?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMGNhYmluJTIwdmFjYXRpb24lMjBob21lfGVufDF8fHx8MTc3NDkzMzY2Nnww&ixlib=rb-4.1.0&q=80&w=1080',
      type: 'ambas',
      available: true,
      bedrooms: 3,
      bathrooms: 2,
      capacity: 6,
      parking: 1,
    },
    {
      id: '3',
      name: 'Casa de Piedra Los Robles',
      location: 'Sierra de Gredos, Ávila',
      price: 420,
      image: 'https://images.unsplash.com/photo-1768573490914-0a92fe98c1be?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxydXN0aWMlMjBmYXJtaG91c2UlMjBleHRlcmlvcnxlbnwxfHx8fDE3NzQ4ODM0MTh8MA&ixlib=rb-4.1.0&q=80&w=1080',
      type: 'completa',
      available: false,
      bedrooms: 5,
      bathrooms: 3,
      capacity: 10,
      parking: 3,
    },
    {
      id: '4',
      name: 'Villa Rural Vista Verde',
      location: 'Picos de Europa, Asturias',
      price: 380,
      image: 'https://images.unsplash.com/photo-1640792834041-41020424330f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3VudHJ5JTIwaG91c2UlMjBnYXJkZW58ZW58MXx8fHwxNzc0OTMzNjY3fDA&ixlib=rb-4.1.0&q=80&w=1080',
      type: 'habitaciones',
      available: true,
      bedrooms: 6,
      bathrooms: 4,
      capacity: 12,
      parking: 2,
    },
    {
      id: '5',
      name: 'Cortijo Andaluz',
      location: 'Alpujarras, Granada',
      price: 320,
      image: 'https://images.unsplash.com/photo-1768123919526-264182edf2e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmFkaXRpb25hbCUyMHJ1cmFsJTIwaG9tZXxlbnwxfHx8fDE3NzQ5MzM2Njd8MA&ixlib=rb-4.1.0&q=80&w=1080',
      type: 'ambas',
      available: true,
      bedrooms: 4,
      bathrooms: 3,
      capacity: 8,
      parking: 2,
    },
    {
      id: '6',
      name: 'Masía Catalana',
      location: 'Garrotxa, Girona',
      price: 450,
      image: 'https://images.unsplash.com/photo-1634744439740-950e23983eed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aWxsYWdlJTIwaG91c2UlMjBjb3VudHJ5c2lkZXxlbnwxfHx8fDE3NzQ5MzM2Njh8MA&ixlib=rb-4.1.0&q=80&w=1080',
      type: 'completa',
      available: true,
      bedrooms: 7,
      bathrooms: 4,
      capacity: 14,
      parking: 4,
    },
    {
      id: '7',
      name: 'Casa Rural San Miguel',
      location: 'Rioja Alta, La Rioja',
      price: 295,
      image: 'https://images.unsplash.com/photo-1640304593673-a88ca138c56a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcGFuaXNoJTIwcnVyYWwlMjBob3VzZXxlbnwxfHx8fDE3NzQ5MzM2Njh8MA&ixlib=rb-4.1.0&q=80&w=1080',
      type: 'habitaciones',
      available: true,
      bedrooms: 3,
      bathrooms: 2,
      capacity: 6,
      parking: 1,
    },
    {
      id: '8',
      name: 'Albergue Rural Estrella del Norte',
      location: 'Picos de Europa, Cantabria',
      price: 340,
      image: 'https://images.unsplash.com/photo-1572345901383-be2fcd1625f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxydXJhbCUyMGhvdXNlJTIwY291bnRyeXNpZGUlMjBsYW5kc2NhcGV8ZW58MXx8fHwxNzc0OTMzNjY2fDA&ixlib=rb-4.1.0&q=80&w=1080',
      type: 'ambas',
      available: false,
      bedrooms: 5,
      bathrooms: 3,
      capacity: 10,
      parking: 2,
    },
  ];

  trackByHouseId(index: number, house: House): string {
    return house.id;
  }
}

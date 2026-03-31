export interface House {
  id: string;
  name: string;
  location: string;
  price: number;
  image: string;
  type: 'completa' | 'habitaciones' | 'ambas';
  available: boolean;
  bedrooms: number;
  bathrooms: number;
  capacity: number;
  parking?: number;
}

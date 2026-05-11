export type PackageStatus = 'Activo' | 'Borrador';

export interface RentalPackage {
  typeRental: string;    
  priceNight: number;    
  startingDate: string;  
  endingDate: string;    
  id?: string;          
  title?: string;
  description?: string;
  price?: number;
  durationDays?: number;
  status?: PackageStatus;
  features?: string[];
}
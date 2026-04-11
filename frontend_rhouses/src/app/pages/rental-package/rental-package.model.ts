export type PackageStatus = 'Activo' | 'Borrador';

export interface RentalPackage {
  // --- CAMPOS REQUERIDOS POR EL BACKEND (NUEVOS) ---
  typeRental: string;    // El nombre del paquete para el backend
  priceNight: number;    // El valor positivo
  startingDate: string;  // Formato "YYYY-MM-DD"
  endingDate: string;    // Formato "YYYY-MM-DD"

  // --- CAMPOS DE IDENTIFICACIÓN ---
  id?: string;           // Opcional porque al crear uno nuevo el backend suele generarlo

  // --- CAMPOS ACTUALES (Cambiados a opcionales para no romper el resto) ---
  // Al ponerles el "?" los componentes viejos no darán error.
  title?: string;
  description?: string;
  price?: number;
  durationDays?: number;
  status?: PackageStatus;
  features?: string[];
}

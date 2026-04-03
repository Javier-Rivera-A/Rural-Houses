import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../Services/Auth/Auth.service';
import { NavbarComponent } from '../homepage/components/navbar/navbar.component';
import { CountryHouseService, RegisterHousePayload } from '../../Services/CountryHouse/country-house.service';

interface BedroomForm {
  bedroomCode: number | null;
  bathroom: boolean;
  numberBeds: number;
  typesOfBeds: string[];
}

interface KitchenForm {
  idCocina: string;
  dishWasher: boolean;
  washingMachine: boolean;
}

interface PhotoForm {
  url: string;
  description: string;
}

@Component({
  selector: 'app-register-house',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: './register-house.component.html',
  styleUrls: ['./register-house.component.css']
})
export class RegisterHouseComponent implements OnInit {
  private router          = inject(Router);
  private toastr          = inject(ToastrService);
  private countryHouseSvc = inject(CountryHouseService);
  authService             = inject(AuthService);

  step      = 1;
  isLoading = false;
  errors: Record<string, string> = {};

  form = {
    code:             '',
    description:      '',
    privateBathrooms: 1,
    publicBathrooms:  1,
    garagePlaces:     0,
    populationName:   '',
    bedrooms:         [] as BedroomForm[],
    diningRooms:      [] as KitchenForm[],
    photo:            [] as PhotoForm[]
  };

  ngOnInit(): void {
    // Guard: solo propietarios pueden registrar casas
    if (!this.authService.isLoggedIn()) {
      this.toastr.warning('Debes iniciar sesión para registrar una casa', 'Acceso denegado');
      this.router.navigate(['/login']);
      return;
    }
    if (!this.authService.isOwner()) {
      this.toastr.warning('Solo los propietarios pueden registrar casas rurales', 'Acceso denegado');
      this.router.navigate(['/']);
      return;
    }
  }

  get progressWidth(): number { return (this.step / 4) * 100; }

  get stepTitle(): string {
    const titles: Record<number, string> = {
      1: 'Información general',
      2: 'Habitaciones',
      3: 'Cocinas y fotos',
      4: 'Confirmar y registrar'
    };
    return titles[this.step] ?? '';
  }

  get photoCount(): number {
    let count = 0;
    for (const p of this.form.photo) {
      if (p.url && p.url.trim() !== '') count++;
    }
    return count;
  }

  // ── Habitaciones ──────────────────────────────────────────────────────────

  addBedroom(): void {
    this.form.bedrooms.push({ bedroomCode: null, bathroom: false, numberBeds: 1, typesOfBeds: ['SIMPLE'] });
  }

  removeBedroom(i: number): void { this.form.bedrooms.splice(i, 1); }

  updateBedTypes(bedroom: BedroomForm, count: number): void {
    const n = Math.max(1, count);
    while (bedroom.typesOfBeds.length < n) bedroom.typesOfBeds.push('SIMPLE');
    bedroom.typesOfBeds = bedroom.typesOfBeds.slice(0, n);
    bedroom.numberBeds  = n;
  }

  setBedType(bedroom: BedroomForm, idx: number, type: string): void {
    bedroom.typesOfBeds[idx] = type;
  }

  bedRange(n: number): number[] { return Array.from({ length: n }, (_, i) => i); }

  // ── Cocinas ───────────────────────────────────────────────────────────────

  addKitchen(): void {
    this.form.diningRooms.push({
      idCocina: 'COC-' + Date.now(),
      dishWasher: false,
      washingMachine: false
    });
  }

  removeKitchen(i: number): void { this.form.diningRooms.splice(i, 1); }

  // ── Fotos ─────────────────────────────────────────────────────────────────

  addPhoto(): void { this.form.photo.push({ url: '', description: '' }); }
  removePhoto(i: number): void { this.form.photo.splice(i, 1); }

  // ── Navegación ────────────────────────────────────────────────────────────

  onNext(): void {
    this.errors = {};
    if (this.step === 1 && !this.validateStep1()) return;
    if (this.step === 2 && !this.validateStep2()) return;
    if (this.step === 3 && !this.validateStep3()) return;

    if (this.step < 4) {
      // Al pasar del step 1 al 2, pre-añadir 3 habitaciones vacías si no hay ninguna
      if (this.step === 1 && this.form.bedrooms.length === 0) {
        this.addBedroom(); this.addBedroom(); this.addBedroom();
      }
      // Al pasar del step 2 al 3, pre-añadir 1 cocina y 1 foto si no hay ninguna
      if (this.step === 2 && this.form.diningRooms.length === 0) {
        this.addKitchen();
      }
      if (this.step === 2 && this.form.photo.length === 0) {
        this.addPhoto();
      }
      this.step++;
    } else {
      this.submit();
    }
  }

  onBack(): void {
    if (this.step > 1) { this.step--; this.errors = {}; }
  }

  // ── Validaciones ──────────────────────────────────────────────────────────

  validateStep1(): boolean {
    const e: Record<string, string> = {};
    if (!this.form.code.trim())           e['code']           = 'El código es obligatorio';
    if (!this.form.populationName.trim()) e['populationName'] = 'La población es obligatoria';
    if ((this.form.privateBathrooms + this.form.publicBathrooms) < 2)
      e['bathrooms'] = 'La casa debe tener al menos 2 baños en total';
    this.errors = e;
    return Object.keys(e).length === 0;
  }

  validateStep2(): boolean {
    const e: Record<string, string> = {};
    if (this.form.bedrooms.length < 3)
      e['bedrooms'] = 'Debes añadir al menos 3 habitaciones';
    const codes = this.form.bedrooms.map(b => b.bedroomCode);
    if (codes.some(c => c === null || c === undefined))
      e['bedroomNull'] = 'Todas las habitaciones deben tener un código';
    else if (codes.some((c, i) => codes.indexOf(c) !== i))
      e['bedroomCodes'] = 'Los códigos de habitación deben ser únicos';
    this.errors = e;
    return Object.keys(e).length === 0;
  }

  validateStep3(): boolean {
    const e: Record<string, string> = {};
    if (this.form.diningRooms.length < 1)
      e['kitchens'] = 'Debes añadir al menos 1 cocina';

    // Fotos obligatorias: al menos 1 foto con URL válida
    const validPhotos = this.form.photo.filter(p => p.url && p.url.trim() !== '');
    if (validPhotos.length === 0) {
      e['photos'] = 'Debes añadir al menos 1 foto con una URL válida';
    } else {
      // Verificar que todas las filas que tengan algo rellenado tengan URL
      for (const p of this.form.photo) {
        if (!p.url || p.url.trim() === '') {
          e['photos'] = 'Todas las fotos añadidas deben tener una URL';
          break;
        }
      }
    }
    this.errors = e;
    return Object.keys(e).length === 0;
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  submit(): void {
    const ownerId = this.authService.user()?.id;
    if (!ownerId) {
      this.toastr.error('Debes iniciar sesión como propietario', 'Sin sesión');
      this.router.navigate(['/login']);
      return;
    }

    this.isLoading = true;

    const validPhotos: { url: string; description: string }[] = [];
    for (const p of this.form.photo) {
      if (p.url && p.url.trim() !== '') {
        validPhotos.push({ url: p.url.trim(), description: p.description.trim() });
      }
    }

    const payload: RegisterHousePayload = {
      code:             this.form.code.trim(),
      description:      this.form.description.trim(),
      privateBathrooms: this.form.privateBathrooms,
      publicBathrooms:  this.form.publicBathrooms,
      garagePlaces:     this.form.garagePlaces,
      populationName:   this.form.populationName.trim(),
      bedrooms: this.form.bedrooms.map(b => ({
        bedroomCode:  b.bedroomCode as number,
        bathroom:     b.bathroom,
        numberBeds:   b.numberBeds,
        typesOfBeds:  b.typesOfBeds
      })),
      diningRooms: this.form.diningRooms.map(k => ({
        idCocina:       k.idCocina,
        dishWasher:     k.dishWasher,
        washingMachine: k.washingMachine
      })),
      photo: validPhotos
    };

    this.countryHouseSvc.register(ownerId, payload).subscribe({
      next: () => {
        this.toastr.success('¡Casa rural registrada correctamente!', '¡Éxito!');
        this.isLoading = false;
        this.router.navigate(['/']);
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Error al registrar la casa';
        this.toastr.error(msg, 'Error');
        this.isLoading = false;
      }
    });
  }
}
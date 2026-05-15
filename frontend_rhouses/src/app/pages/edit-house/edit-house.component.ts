import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
  selector: 'app-edit-house',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: './edit-house.component.html',
  styleUrls: ['./edit-house.component.css']
})
export class EditHouseComponent implements OnInit {
  private router          = inject(Router);
  private route           = inject(ActivatedRoute);
  private toastr          = inject(ToastrService);
  private countryHouseSvc = inject(CountryHouseService);
  authService             = inject(AuthService);

  houseId   = '';
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
    if (!this.authService.isLoggedIn() || !this.authService.isOwner()) {
      this.toastr.warning('Debes ser propietario para editar una casa', 'Acceso denegado');
      this.router.navigate(['/']);
      return;
    }
    this.houseId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.houseId) {
      this.toastr.error('ID de casa no encontrado', 'Error');
      this.router.navigate(['/my-houses']);
      return;
    }
    this.loadHouseData();
  }

  loadHouseData(): void {
    this.isLoading = true;
    this.countryHouseSvc.findById(this.houseId).subscribe({
      next: (res) => {
        const house = res?.data;
        if (!house) { this.router.navigate(['/my-houses']); return; }

        this.form.code             = house.code;
        this.form.description      = house.description ?? '';
        this.form.privateBathrooms = house.privateBathrooms ?? 1;
        this.form.publicBathrooms  = house.publicBathrooms ?? 1;
        this.form.garagePlaces     = house.garagePlaces ?? 0;
        this.form.populationName   = house.populationName ?? '';

        // Ordenar habitaciones por código al cargar
        const sorted = [...(house.bedrooms ?? [])].sort(
          (a: any, b: any) => (Number(a.bedroomCode) || 0) - (Number(b.bedroomCode) || 0)
        );
        this.form.bedrooms = sorted.map((b: any) => ({
          bedroomCode: b.bedroomCode != null ? Number(b.bedroomCode) : null,
          bathroom:    !!b.bathroom,
          numberBeds:  Number(b.numberBeds) || 1,
          typesOfBeds: Array.isArray(b.typesOfBeds) && b.typesOfBeds.length > 0
                         ? [...b.typesOfBeds]
                         : ['SIMPLE']
        }));

        this.form.diningRooms = (house.diningRooms ?? []).map((k: any) => ({
          idCocina:       k.idCocina ?? ('COC-' + Date.now()),
          dishWasher:     !!k.dishWasher,
          washingMachine: !!k.washingMachine
        }));

        this.form.photo = (house.photo ?? []).map((p: any) => ({
          url:         p.url ?? '',
          description: p.description ?? ''
        }));

        this.isLoading = false;
      },
      error: () => {
        this.toastr.error('No se pudo cargar la casa', 'Error');
        this.isLoading = false;
        this.router.navigate(['/my-houses']);
      }
    });
  }

  // ── Getters ───────────────────────────────────────────────────────────────

  get progressWidth(): number { return (this.step / 4) * 100; }

  get stepTitle(): string {
    const titles: Record<number, string> = {
      1: 'Información general',
      2: 'Habitaciones',
      3: 'Cocinas y fotos',
      4: 'Confirmar cambios'
    };
    return titles[this.step] ?? '';
  }

  get photoCount(): number {
    return this.form.photo.filter(p => p.url?.trim()).length;
  }

  bedRange(n: number): number[] {
    return Array.from({ length: Math.max(0, n) }, (_, i) => i);
  }

  // ── Habitaciones: getters/setters por índice ──────────────────────────────
  // Usar getters/setters explícitos evita que ngModel pierda la referencia
  // al objeto cuando Angular re-renderiza el *ngFor al mutar el array.

  getBedroomCode(i: number): string {
    const v = this.form.bedrooms[i]?.bedroomCode;
    return v != null ? String(v) : '';
  }
  setBedroomCode(i: number, val: string): void {
    if (!this.form.bedrooms[i]) return;
    this.form.bedrooms[i].bedroomCode = val !== '' ? Number(val) : null;
    delete this.errors['bedroomNull'];
    delete this.errors['bedroomCodes'];
  }

  getBathroom(i: number): boolean      { return this.form.bedrooms[i]?.bathroom ?? false; }
  setBathroom(i: number, v: boolean): void {
    if (this.form.bedrooms[i]) this.form.bedrooms[i].bathroom = v;
  }

  getNumberBeds(i: number): number     { return this.form.bedrooms[i]?.numberBeds ?? 1; }
  setNumberBeds(i: number, val: string): void {
    if (!this.form.bedrooms[i]) return;
    const n = Math.max(1, Math.min(6, Number(val) || 1));
    const types = this.form.bedrooms[i].typesOfBeds;
    while (types.length < n) types.push('SIMPLE');
    this.form.bedrooms[i].typesOfBeds = types.slice(0, n);
    this.form.bedrooms[i].numberBeds  = n;
  }

  getBedType(i: number, j: number): string {
    return this.form.bedrooms[i]?.typesOfBeds[j] ?? 'SIMPLE';
  }
  setBedType(i: number, j: number, type: string): void {
    if (this.form.bedrooms[i]) this.form.bedrooms[i].typesOfBeds[j] = type;
  }

  addBedroom(): void {
    // Spread para forzar nueva referencia del array → Angular detecta el cambio
    this.form.bedrooms = [
      ...this.form.bedrooms,
      { bedroomCode: null, bathroom: false, numberBeds: 1, typesOfBeds: ['SIMPLE'] }
    ];
    delete this.errors['bedrooms'];
    delete this.errors['bedroomNull'];
    delete this.errors['bedroomCodes'];
  }

  removeBedroom(i: number): void {
    this.form.bedrooms = this.form.bedrooms.filter((_, idx) => idx !== i);
  }

  // ── Cocinas: getters/setters por índice ───────────────────────────────────

  getDishWasher(i: number): boolean    { return this.form.diningRooms[i]?.dishWasher ?? false; }
  setDishWasher(i: number, v: boolean): void {
    if (this.form.diningRooms[i]) this.form.diningRooms[i].dishWasher = v;
  }

  getWashingMachine(i: number): boolean { return this.form.diningRooms[i]?.washingMachine ?? false; }
  setWashingMachine(i: number, v: boolean): void {
    if (this.form.diningRooms[i]) this.form.diningRooms[i].washingMachine = v;
  }

  addKitchen(): void {
    this.form.diningRooms = [
      ...this.form.diningRooms,
      { idCocina: 'COC-' + Date.now(), dishWasher: false, washingMachine: false }
    ];
    delete this.errors['kitchens'];
  }

  removeKitchen(i: number): void {
    this.form.diningRooms = this.form.diningRooms.filter((_, idx) => idx !== i);
  }

  // ── Fotos: getters/setters por índice ─────────────────────────────────────

  getPhotoUrl(i: number): string         { return this.form.photo[i]?.url ?? ''; }
  setPhotoUrl(i: number, v: string): void {
    if (this.form.photo[i]) {
      this.form.photo[i].url = v;
      delete this.errors['photos'];
    }
  }

  getPhotoDesc(i: number): string        { return this.form.photo[i]?.description ?? ''; }
  setPhotoDesc(i: number, v: string): void {
    if (this.form.photo[i]) this.form.photo[i].description = v;
  }

  addPhoto(): void {
    this.form.photo = [...this.form.photo, { url: '', description: '' }];
    delete this.errors['photos'];
  }

  removePhoto(i: number): void {
    this.form.photo = this.form.photo.filter((_, idx) => idx !== i);
  }

  // ── Navegación ────────────────────────────────────────────────────────────

  onNext(): void {
    this.errors = {};
    if (this.step === 1 && !this.validateStep1()) return;
    if (this.step === 2 && !this.validateStep2()) return;
    if (this.step === 3 && !this.validateStep3()) return;
    if (this.step < 4) { this.step++; } else { this.submit(); }
  }

  onBack(): void {
    if (this.step > 1) { this.step--; this.errors = {}; }
  }

  // ── Validaciones ──────────────────────────────────────────────────────────

  validateStep1(): boolean {
    const e: Record<string, string> = {};
    if (!this.form.code.trim())           e['code']           = 'El código es obligatorio';
    if (!this.form.populationName.trim()) e['populationName'] = 'La población es obligatoria';
    if ((Number(this.form.privateBathrooms) + Number(this.form.publicBathrooms)) < 2)
      e['bathrooms'] = 'La casa debe tener al menos 2 baños en total';
    this.errors = e;
    return Object.keys(e).length === 0;
  }

  validateStep2(): boolean {
    const e: Record<string, string> = {};
    if (this.form.bedrooms.length < 3) {
      e['bedrooms'] = 'Debes tener al menos 3 habitaciones';
      this.errors = e; return false;
    }
    if (this.form.bedrooms.some(b => b.bedroomCode === null || b.bedroomCode === undefined)) {
      e['bedroomNull'] = 'Todas las habitaciones deben tener un código numérico';
      this.errors = e; return false;
    }
    const codes = this.form.bedrooms.map(b => Number(b.bedroomCode));
    if (new Set(codes).size !== codes.length) {
      e['bedroomCodes'] = 'Los códigos de habitación deben ser únicos';
      this.errors = e; return false;
    }
    this.errors = e;
    return true;
  }

  validateStep3(): boolean {
    const e: Record<string, string> = {};
    if (this.form.diningRooms.length < 1)
      e['kitchens'] = 'Debes tener al menos 1 cocina';
    const valid = this.form.photo.filter(p => p.url?.trim());
    if (valid.length === 0)
      e['photos'] = 'Debes tener al menos 1 foto con URL válida';
    else if (this.form.photo.some(p => !p.url?.trim()))
      e['photos'] = 'Todas las fotos añadidas deben tener una URL';
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

    const payload: RegisterHousePayload = {
      code:             this.form.code.trim(),
      description:      this.form.description.trim(),
      privateBathrooms: Number(this.form.privateBathrooms),
      publicBathrooms:  Number(this.form.publicBathrooms),
      garagePlaces:     Number(this.form.garagePlaces),
      populationName:   this.form.populationName.trim(),
      bedrooms: this.form.bedrooms.map(b => ({
        bedroomCode:  Number(b.bedroomCode),
        bathroom:     b.bathroom,
        numberBeds:   b.numberBeds,
        typesOfBeds:  b.typesOfBeds
      })),
      diningRooms: this.form.diningRooms.map(k => ({
        idCocina:       k.idCocina,
        dishWasher:     k.dishWasher,
        washingMachine: k.washingMachine
      })),
      photo: this.form.photo
        .filter(p => p.url?.trim())
        .map(p => ({ url: p.url.trim(), description: p.description.trim() }))
    };

    this.countryHouseSvc.update(ownerId, this.houseId, payload).subscribe({
      next: () => {
        this.toastr.success('¡Casa rural actualizada correctamente!', '¡Éxito!');
        this.isLoading = false;
        this.router.navigate(['/my-houses']);
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Error al actualizar la casa';
        this.toastr.error(msg, 'Error');
        this.isLoading = false;
      }
    });
  }
}
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BehaviorSubject, map, tap } from 'rxjs';

export interface RentalRequest {
  countryHouseCode: string;
  checkInDate: string;       // YYYY-MM-DD
  numberNights: number;
  contactPhoneNumber: string;
  bedroomCodes?: string[];
  typeRental: 'ENTIRE_HOUSE' | 'ROOMS';
}

/** Body que espera el backend en POST /api/rentals/{rentalId}/pay */
export interface PayRentalRequest {
  customerBankAccountId: string;
  ownerBankAccountId: string;
  amount: number;
}

export interface RentalResponse {
  id: string;
  rentalCode: string;
  rentalDayMade: string;
  checkInDate: string;
  checkOutDate: string;
  numberNights: number;
  state: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED' | 'PAID';
  contactPhoneNumber: string;
  totalPrice: number;
  totalPaid?: number;
  remainingBalance?: number;
  depositRequired?: number;
  rentalPlaceId: string[];
  countryHouseCode: string;
  customerUserName: string | null;
  ownerBankAccount?: string | string[];
  ownerId?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class RentalService {
  private readonly base = 'http://localhost:8081/api/rentals';
  private readonly rentalsCache$ = new BehaviorSubject<Record<string, RentalResponse>>({});

  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    const raw = sessionStorage.getItem('rhouses_user');
    let token = '';
    try { token = raw ? (JSON.parse(raw)?.token ?? '') : ''; } catch { token = ''; }
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  /** Crear reserva */
  makeRental(customerId: string | null, body: RentalRequest): Observable<ApiResponse<RentalResponse>> {
    const params = customerId ? `?customerId=${customerId}` : '';
    return this.http.post<ApiResponse<RentalResponse>>(
      `${this.base}${params}`, body, { headers: this.headers() }
    ).pipe(tap((res) => this.upsertRental(res?.data)));
  }

  /** Consultar por código */
  findByCode(rentalCode: string): Observable<ApiResponse<RentalResponse>> {
    return this.http.get<ApiResponse<RentalResponse>>(`${this.base}/${rentalCode}`);
  }

  /** Listar reservas del cliente */
  findByCustomer(customerId: string): Observable<ApiResponse<RentalResponse[]>> {
    return this.http.get<ApiResponse<RentalResponse[]>>(
      `${this.base}/customer/${customerId}`, { headers: this.headers() }
    ).pipe(tap((res) => this.hydrateRentals(res?.data ?? [])));
  }

  /** Listar reservas de una casa concreta (propietario) */
  findByOwner(houseId: string): Observable<ApiResponse<RentalResponse[]>> {
    return this.http.get<ApiResponse<RentalResponse[]>>(
      `${this.base}/house/${houseId}`, { headers: this.headers() }
    ).pipe(tap((res) => this.hydrateRentals(res?.data ?? [])));
  }

  /**
   * Reservas con plazo vencido (+3 días sin pago) de un propietario.
   * Endpoint: GET /api/rentals/expired?ownerId={id}
   */
  getExpiredRentals(ownerId: string): Observable<ApiResponse<RentalResponse[]>> {
    return this.http.get<ApiResponse<RentalResponse[]>>(
      `${this.base}/expired?ownerId=${ownerId}`, { headers: this.headers() }
    ).pipe(tap((res) => this.hydrateRentals(res?.data ?? [])));
  }

  // ── Acciones del propietario ──────────────────────────────────────────────

  /**
   * El propietario registra el cobro del anticipo.
   * Endpoint: POST /api/rentals/{rentalId}/payment?ownerId={id}&amount={importe}
   * Cambia el estado a CONFIRMED cuando el pago cubre el anticipo mínimo (20 %).
   */
  registerPaymentAsOwner(rentalId: string, amount: number, ownerId: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(
      `${this.base}/${rentalId}/payment?ownerId=${ownerId}&amount=${amount}`,
      {},
      { headers: this.headers() }
    ).pipe(
      tap(() => {
        const rental = this.rentalsCache$.value[rentalId];
        if (rental) this.upsertRental({ ...rental, state: 'CONFIRMED' });
      })
    );
  }

  /**
   * El propietario cancela una reserva.
   * Endpoint: POST /api/rentals/{rentalId}/cancel?ownerId={id}
   */
  cancelAsOwner(rentalId: string, ownerId: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(
      `${this.base}/${rentalId}/cancel?ownerId=${ownerId}`,
      {},
      { headers: this.headers() }
    ).pipe(
      tap(() => {
        const rental = this.rentalsCache$.value[rentalId];
        if (rental) this.upsertRental({ ...rental, state: 'CANCELLED' });
      })
    );
  }

  // ── Acciones del cliente ──────────────────────────────────────────────────

  /**
   * El cliente paga transfiriendo desde su cuenta bancaria a la del propietario.
   * Endpoint: POST /api/rentals/{rentalId}/pay?customerId={id}&amount={importe}
   *
   * El backend requiere en el BODY:
   *   { customerBankAccountId, ownerBankAccountId, amount }
   *
   * Si el pago cubre el anticipo (20 %), el estado pasa a CONFIRMED.
   * Si cubre el total, pasa a PAID.
   */
  payDeposit(
    rentalId: string,
    customerId: string,
    payload: PayRentalRequest
  ): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(
      `${this.base}/${rentalId}/pay?customerId=${customerId}`,
      payload,
      { headers: this.headers() }
    ).pipe(
      tap(() => {
        const rental = this.rentalsCache$.value[rentalId];
        if (rental) {
          // Optimistic update: si el pago es >= 20 % marcamos CONFIRMED
          this.upsertRental({ ...rental, state: 'CONFIRMED' });
        }
      })
    );
  }

  // ── Observadores reactivos ────────────────────────────────────────────────

  observeRentals(): Observable<RentalResponse[]> {
    return this.rentalsCache$.asObservable().pipe(
      map((cache) => Object.values(cache))
    );
  }

  observeActiveRentalsByHouse(houseCode: string): Observable<RentalResponse[]> {
    return this.observeRentals().pipe(
      map((rentals) =>
        rentals.filter((r) =>
          r.countryHouseCode === houseCode &&
          (r.state === 'PENDING' || r.state === 'CONFIRMED')
        )
      )
    );
  }

  observeRentalById(rentalId: string): Observable<RentalResponse | undefined> {
    return this.rentalsCache$.asObservable().pipe(
      map((cache) => cache[rentalId])
    );
  }

  updateRentalStateLocal(rentalId: string, state: RentalResponse['state']): void {
    const current = this.rentalsCache$.value[rentalId];
    if (!current) return;
    this.upsertRental({ ...current, state });
  }

  hasActiveOverlap(houseCode: string, checkIn: string, nights: number): boolean {
    if (!houseCode || !checkIn || nights <= 0) return false;
    const cache = this.rentalsCache$.value;
    const rentals = Object.values(cache).filter((r) =>
      r.countryHouseCode === houseCode &&
      (r.state === 'PENDING' || r.state === 'CONFIRMED')
    );
    const searchStart = this.parseDate(checkIn);
    const searchEnd = new Date(searchStart);
    searchEnd.setDate(searchEnd.getDate() + nights);
    return rentals.some((r) => {
      const rentalStart = this.parseDate(r.checkInDate);
      const rentalEnd = this.parseDate(r.checkOutDate);
      return searchStart < rentalEnd && searchEnd > rentalStart;
    });
  }

  // ── Helpers del caché ─────────────────────────────────────────────────────

  private hydrateRentals(rentals: RentalResponse[]): void {
    if (!rentals?.length) return;
    const next = { ...this.rentalsCache$.value };
    for (const rental of rentals) {
      if (rental?.id) next[rental.id] = rental;
    }
    this.rentalsCache$.next(next);
  }

  upsertRental(rental: RentalResponse | undefined): void {
    if (!rental?.id) return;
    this.rentalsCache$.next({
      ...this.rentalsCache$.value,
      [rental.id]: rental
    });
  }

  private parseDate(dateValue: string): Date {
    return new Date(dateValue.split('T')[0] + 'T00:00:00');
  }
}
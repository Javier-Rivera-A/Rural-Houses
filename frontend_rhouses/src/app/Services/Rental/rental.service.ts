import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RentalRequest {
  countryHouseCode: string;
  checkInDate: string;       // YYYY-MM-DD
  numberNights: number;
  contactPhoneNumber: string;
  bedroomCodes?: string[];   // solo si typeRental === 'ROOMS'
  typeRental: 'ENTIRE_HOUSE' | 'ROOMS';
}

export interface RentalResponse {
  id: string;
  rentalCode: string;
  rentalDayMade: string;
  checkInDate: string;
  checkOutDate: string;
  numberNights: number;
  state: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';
  contactPhoneNumber: string;
  totalPrice: number;
  rentalPlaceId: string[];
  countryHouseCode: string;
  customerUserName: string | null;
  ownerBankAccount?: string;
  depositRequired?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class RentalService {
  private readonly base = 'http://localhost:8081/api/rentals';

  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    const raw = sessionStorage.getItem('rhouses_user');
    let token = '';
    try { token = raw ? (JSON.parse(raw)?.token ?? '') : ''; } catch { token = ''; }
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  /** US15 – Crear reserva */
  makeRental(customerId: string | null, body: RentalRequest): Observable<ApiResponse<RentalResponse>> {
    const params = customerId ? `?customerId=${customerId}` : '';
    return this.http.post<ApiResponse<RentalResponse>>(
      `${this.base}${params}`, body, { headers: this.headers() }
    );
  }

  /** US09 – Consultar por código */
  findByCode(rentalCode: string): Observable<ApiResponse<RentalResponse>> {
    return this.http.get<ApiResponse<RentalResponse>>(`${this.base}/${rentalCode}`);
  }

  /** Listar reservas del cliente */
  findByCustomer(customerId: string): Observable<ApiResponse<RentalResponse[]>> {
    return this.http.get<ApiResponse<RentalResponse[]>>(
      `${this.base}/customer/${customerId}`, { headers: this.headers() }
    );
  }

  /** US13 – Cancelar reserva (cliente) */
  cancelByCustomer(rentalId: string, customerId: string): Observable<ApiResponse<RentalResponse>> {
    return this.http.delete<ApiResponse<RentalResponse>>(
      `${this.base}/${rentalId}?customerId=${customerId}`, { headers: this.headers() }
    );
  }
}
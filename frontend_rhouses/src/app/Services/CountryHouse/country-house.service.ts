import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CountryHouseResponse {
  id: string;
  code: string;
  description: string;
  privateBathrooms: number;
  publicBathrooms: number;
  garagePlaces: number;
  stateCountryHouse: string;
  populationName: string;
  ownerUserName: string;
  bedrooms: BedroomResponse[];
  diningRooms: KitchenResponse[];
  photo: PhotoResponse[];
}

export interface BedroomResponse {
  id: string;
  bedroomCode: number;
  bathroom: boolean;
  numberBeds: number;
  typesOfBeds: string[];
}

export interface KitchenResponse {
  idCocina: string;
  dishWasher: boolean;
  washingMachine: boolean;
}

export interface PhotoResponse {
  id: string;
  url: string;
  description: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface AvailabilityResponse {
  countryHouseCode: string;
  dailyAvailability: {
    [date: string]: {
      entireHouseStatus: string;
      bedroomsStatus: { [bedroomCode: number]: string };
    };
  };
}

export interface RentalPackageResponse {
  id: string;
  startingDate: string;
  endingDate: string;
  priceNight: number;
  typeRental: string;
  countryHouseCode: string;
}

export interface RegisterHousePayload {
  code: string;
  description: string;
  privateBathrooms: number;
  publicBathrooms: number;
  garagePlaces: number;
  populationName: string;
  bedrooms: {
    bedroomCode: number;
    bathroom: boolean;
    numberBeds: number;
    typesOfBeds: string[];
  }[];
  diningRooms: {
    idCocina: string;
    dishWasher: boolean;
    washingMachine: boolean;
  }[];
  photo: {
    url: string;
    description: string;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class CountryHouseService {
  private readonly apiUrl = 'http://localhost:8081/api/houses';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const raw = sessionStorage.getItem('rhouses_user');
    let token = '';
    if (raw) {
      try {
        const user = JSON.parse(raw);
        token = user?.token ?? '';
      } catch { token = ''; }
    }
    if (!token) {
      token = sessionStorage.getItem('rhouses_token') ?? '';
    }
    return token
      ? new HttpHeaders({ 'Authorization': `Bearer ${token}` })
      : new HttpHeaders();
  }

  // ── Búsquedas públicas ────────────────────────────────────────────────────

  findAll(): Observable<ApiResponse<CountryHouseResponse[]>> {
    return this.http.get<ApiResponse<CountryHouseResponse[]>>(`${this.apiUrl}`);
  }

  findByPopulation(population: string): Observable<ApiResponse<CountryHouseResponse[]>> {
    return this.http.get<ApiResponse<CountryHouseResponse[]>>(
      `${this.apiUrl}/search?population=${encodeURIComponent(population)}`
    );
  }

  findById(id: string): Observable<ApiResponse<CountryHouseResponse>> {
    return this.http.get<ApiResponse<CountryHouseResponse>>(`${this.apiUrl}/${id}`);
  }

  findByCode(code: string): Observable<ApiResponse<CountryHouseResponse>> {
    return this.http.get<ApiResponse<CountryHouseResponse>>(`${this.apiUrl}/code/${code}`);
  }

  checkAvailability(code: string, checkIn: string, nights: number): Observable<ApiResponse<AvailabilityResponse>> {
    return this.http.get<ApiResponse<AvailabilityResponse>>(
      `${this.apiUrl}/${code}/availability?checkIn=${checkIn}&nights=${nights}`
    );
  }

  /**
   * GET /api/houses/{houseId}/packages
   * FIX: se añaden headers de autenticación — sin ellos el backend devuelve 401
   * y el componente muestra lista vacía sin error visible.
   */
  getPackagesByHouse(houseId: string): Observable<ApiResponse<RentalPackageResponse[]>> {
    return this.http.get<ApiResponse<RentalPackageResponse[]>>(
      `${this.apiUrl}/${houseId}/packages`,
      { headers: this.getAuthHeaders() }
    );
  }

  // ── Operaciones del propietario ───────────────────────────────────────────

  findByOwner(ownerId: string): Observable<ApiResponse<CountryHouseResponse[]>> {
    return this.http.get<ApiResponse<CountryHouseResponse[]>>(
      `${this.apiUrl}/owner/${ownerId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  register(ownerId: string, payload: RegisterHousePayload): Observable<ApiResponse<CountryHouseResponse>> {
    return this.http.post<ApiResponse<CountryHouseResponse>>(
      `${this.apiUrl}?ownerId=${ownerId}`,
      payload,
      { headers: this.getAuthHeaders() }
    );
  }

  update(ownerId: string, houseId: string, payload: RegisterHousePayload): Observable<ApiResponse<CountryHouseResponse>> {
    return this.http.put<ApiResponse<CountryHouseResponse>>(
      `${this.apiUrl}/${houseId}?ownerId=${ownerId}`,
      payload,
      { headers: this.getAuthHeaders() }
    );
  }

  deactivate(ownerId: string, houseId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/${houseId}?ownerId=${ownerId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  reactivate(ownerId: string, houseId: string): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(
      `${this.apiUrl}/${houseId}/reactivate?ownerId=${ownerId}`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  addRentalPackage(ownerId: string, houseId: string, pkg: any): Observable<ApiResponse<RentalPackageResponse>> {
    return this.http.post<ApiResponse<RentalPackageResponse>>(
      `${this.apiUrl}/${houseId}/packages?ownerId=${ownerId}`,
      pkg,
      { headers: this.getAuthHeaders() }
    );
  }

  updateRentalPackage(ownerId: string, packageId: string, pkg: any): Observable<ApiResponse<RentalPackageResponse>> {
    return this.http.put<ApiResponse<RentalPackageResponse>>(
      `${this.apiUrl}/packages/${packageId}?ownerId=${ownerId}`,
      pkg,
      { headers: this.getAuthHeaders() }
    );
  }

  deleteRentalPackage(ownerId: string, packageId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/packages/${packageId}?ownerId=${ownerId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  searchHouses(params: any): Observable<ApiResponse<CountryHouseResponse[]>> {
    const queryParams = Object.keys(params)
      .filter(key =>
        params[key] !== null &&
        params[key] !== undefined &&
        params[key] !== '' &&
        params[key] !== false &&
        params[key] !== 0
      )
      .reduce((obj, key) => {
        obj[key] = params[key];
        return obj;
      }, {} as any);

    return this.http.get<ApiResponse<CountryHouseResponse[]>>(`${this.apiUrl}/search`, {
      params: queryParams
    });
  }
}
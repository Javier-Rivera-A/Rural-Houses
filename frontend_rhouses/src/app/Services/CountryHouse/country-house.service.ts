import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
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
  message: String;
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

  findAll(): Observable<any> {
    return this.http.get(`${this.apiUrl}`);
  }

  findByPopulation(population: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/search?population=${encodeURIComponent(population)}`);
  }

  findById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  findByCode(code: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/code/${code}`);
  }

  checkAvailability(code: string, checkIn: string, nights: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${code}/availability?checkIn=${checkIn}&nights=${nights}`);
  }

  // ── Operaciones del propietario ───────────────────────────────────────────

  findByOwner(ownerId: string): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/owner/${ownerId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  register(ownerId: string, payload: RegisterHousePayload): Observable<any> {
    return this.http.post(
      `${this.apiUrl}?ownerId=${ownerId}`,
      payload,
      { headers: this.getAuthHeaders() }
    );
  }

  update(ownerId: string, houseId: string, payload: RegisterHousePayload): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/${houseId}?ownerId=${ownerId}`,
      payload,
      { headers: this.getAuthHeaders() }
    );
  }

  deactivate(ownerId: string, houseId: string): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/${houseId}?ownerId=${ownerId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  /** PUT /api/houses/{houseId}/reactivate?ownerId={id} */
  reactivate(ownerId: string, houseId: string): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/${houseId}/reactivate?ownerId=${ownerId}`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  addRentalPackage(ownerId: string, houseId: string, pkg: any): Observable<ApiResponse<any>> {
    // El backend espera ownerId como @RequestParam (?ownerId=...)
    // y houseId como @PathVariable (/{houseId}/packages)
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/${houseId}/packages?ownerId=${ownerId}`,
      pkg
    );
  }
  searchHouses(params: any): Observable<ApiResponse<CountryHouseResponse[]>> {
    // 1. Filtramos los parámetros
    // Eliminamos nulos, vacíos, false (para los booleanos que no se marcan)
    // y mantenemos el 0 solo si es un número válido, aunque para filtros min... suele ser mejor ignorar el 0.
    const queryParams = Object.keys(params)
      .filter(key =>
        params[key] !== null &&
        params[key] !== undefined &&
        params[key] !== '' &&
        params[key] !== false &&
        params[key] !== 0 // Omitimos ceros para que el backend use sus valores por defecto
      )
      .reduce((obj, key) => {
        obj[key] = params[key];
        return obj;
      }, {} as any);

    // 2. Retornamos la petición con el tipo de dato correcto
    return this.http.get<ApiResponse<CountryHouseResponse[]>>(`${this.apiUrl}/search`, {
      params: queryParams
    });

  }


}

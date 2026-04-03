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

  // Obtiene headers con JWT si existe en sessionStorage
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

  addRentalPackage(ownerId: string, houseId: string, payload: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${houseId}/packages?ownerId=${ownerId}`,
      payload,
      { headers: this.getAuthHeaders() }
    );
  }
}
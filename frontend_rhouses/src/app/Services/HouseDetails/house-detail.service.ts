import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/* ── Interfaces (puedes reutilizar las mismas) ───────────────────────── */

export interface HouseDetailResponse {
  id: string;
  code: string;
  description: string;
  privateBathrooms: number;
  publicBathrooms: number;
  garagePlaces: number;
  stateCountryHouse: string;
  populationName: string;
  ownerUserName: string;
  bedrooms: Bedroom[];
  diningRooms: Kitchen[];
  photo: Photo[];
}

export interface Bedroom {
  bedroomCode: number;
  bathroom: boolean;
  numberBeds: number;
  typesOfBeds: string[];
}

export interface Kitchen {
  idCocina: string;
  dishWasher: boolean;
  washingMachine: boolean;
}

export interface Photo {
  url: string;
  description: string;
}

/* ── Service ───────────────────────────────────────────────────────── */

@Injectable({
  providedIn: 'root'
})
export class HouseDetailService {

  private readonly apiUrl = 'http://localhost:8081/api/houses';

  constructor(private http: HttpClient) {}

  getHouseById(id: string): Observable<{ data: HouseDetailResponse }> {
    return this.http.get<{ data: HouseDetailResponse }>(
      `${this.apiUrl}/${id}`
    );
  }

  getHouseByCode(code: string): Observable<{ data: HouseDetailResponse }> {
    return this.http.get<{ data: HouseDetailResponse }>(
      `${this.apiUrl}/code/${code}`
    );
  }

}
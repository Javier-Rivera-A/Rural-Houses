import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface BankAccountPayload {
  numberAccount: string;
  bank: string;
  accountType: string;
}

export interface BankAccountData {
  id: string;
  numberAccount: string;
  bank: string;
  accountType: string;
  mount: number;
}

@Injectable({
  providedIn: 'root'
})
export class BankAccountService {
  private readonly apiUrl = 'http://localhost:8081/api/bank-accounts';

  constructor(private http: HttpClient) {}

  getByUser(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}?userId=${userId}`);
  }

  addAccount(userId: string, payload: BankAccountPayload): Observable<any> {
    return this.http.post(`${this.apiUrl}?userId=${userId}`, payload);
  }

  updateAccount(userId: string, accountId: string, payload: BankAccountPayload): Observable<any> {
    return this.http.put(`${this.apiUrl}/${accountId}?userId=${userId}`, payload);
  }

  deleteAccount(userId: string, accountId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${accountId}?userId=${userId}`);
  }
}
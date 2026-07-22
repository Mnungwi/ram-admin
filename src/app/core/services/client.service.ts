import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Client, ClientRequest } from '../models/index';

export interface ClientsResponse {
  success: boolean;
  data: Client[];
  pagination: { total: number; page: number; limit: number; totalPages: number; };
}

export interface ClientResponse {
  success: boolean;
  data: { client: Client };
}

@Injectable({ providedIn: 'root' })
export class ClientService {
  private base = `${environment.apiUrl}/clients`;

  constructor(private http: HttpClient) {}

  getClients(params?: { search?: string; isActive?: boolean; page?: number; limit?: number }): Observable<ClientsResponse> {
    let p = new HttpParams();
    if (params?.search)   p = p.set('search', params.search);
    if (params?.isActive !== undefined) p = p.set('isActive', String(params.isActive));
    if (params?.page)     p = p.set('page', String(params.page));
    if (params?.limit)    p = p.set('limit', String(params.limit));
    return this.http.get<ClientsResponse>(this.base, { params: p });
  }

  getClient(id: string): Observable<Client> {
    return this.http.get<ClientResponse>(`${this.base}/${id}`).pipe(
      map(res => res.data.client)
    );
  }

  createClient(data: ClientRequest): Observable<Client> {
    return this.http.post<ClientResponse>(this.base, data).pipe(
      map(res => res.data.client)
    );
  }

  updateClient(id: string, data: Partial<ClientRequest>): Observable<Client> {
    return this.http.put<ClientResponse>(`${this.base}/${id}`, data).pipe(
      map(res => res.data.client)
    );
  }

  deleteClient(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}

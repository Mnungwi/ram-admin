import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SystemUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle?: string;
  department?: string;
  avatar?: string;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private base = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getUsers(params?: { search?: string; limit?: number }): Observable<SystemUser[]> {
    let p = new HttpParams().set('limit', String(params?.limit || 100));
    if (params?.search) p = p.set('search', params.search);
    return this.http.get<any>(this.base, { params: p }).pipe(
      map(res => res.data || [])
    );
  }

  getFullName(u: SystemUser): string {
    return `${u.firstName} ${u.lastName}`;
  }

  getInitials(u: SystemUser): string {
    return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
  }

  getAvatarColor(u: SystemUser): string {
    const colors = ['#3b82f6','#22c55e','#f59e0b','#a855f7','#ef4444','#0ea5e9'];
    return colors[(u.firstName.charCodeAt(0) + u.lastName.charCodeAt(0)) % colors.length];
  }
}

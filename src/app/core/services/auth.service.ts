import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError } from 'rxjs/operators';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, User, LoginRequest, ApiResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;

  // Signals for reactive state
  private _currentUser = signal<User | null>(this.loadUser());
  private _permissions = signal<string[]>(this.loadPermissions());
  private _isLoading = signal(false);

  currentUser = this._currentUser.asReadonly();
  permissions = this._permissions.asReadonly();
  isLoading = this._isLoading.asReadonly();

  isLoggedIn = computed(() => !!this._currentUser());
  userFullName = computed(() => {
    const u = this._currentUser();
    return u ? `${u.firstName} ${u.lastName}` : '';
  });
  userInitials = computed(() => {
    const u = this._currentUser();
    return u ? `${u.firstName[0]}${u.lastName[0]}`.toUpperCase() : '';
  });

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  login(credentials: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap((res) => {
          if (res.success) {
            this.saveSession(res.data);
          }
        }),
      );
  }

  // logout(): void {
  //   this.http.post(`${this.apiUrl}/auth/logout`, {}).subscribe();
  //   this.clearSession();
  //   this.router.navigate(['/auth/login']);
  // }

  logout(): void {
    this.http.post(`${this.apiUrl}/auth/logout`, {}).subscribe({
      next: () => this.forceLogout(),

      error: () => this.forceLogout(),
    });
  }

  private finishLogout(): void {
    this.clearSession();
    this._isLoading.set(false);
    this.router.navigate(['/auth/login']);
  }

  refreshToken(): Observable<any> {
    const refreshToken = localStorage.getItem('refreshToken');

    return this.http
      .post<any>(`${this.apiUrl}/auth/refresh`, { refreshToken })
      .pipe(
        tap((res) => {
          if (res.success) {
            localStorage.setItem('accessToken', res.data.accessToken);

            localStorage.setItem('refreshToken', res.data.refreshToken);
          }
        }),
      );
  }
  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/auth/me`).pipe(
      tap((res) => {
        if (res.success) {
          this._currentUser.set(res.data.user);
          this._permissions.set(res.data.permissions);
          localStorage.setItem('user', JSON.stringify(res.data.user));
          localStorage.setItem(
            'permissions',
            JSON.stringify(res.data.permissions),
          );
        }
      }),
    );
  }

  hasPermission(permission: string): boolean {
    return this._permissions().includes(permission);
  }

  hasAnyPermission(...permissions: string[]): boolean {
    return permissions.some((p) => this._permissions().includes(p));
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  private saveSession(data: AuthResponse): void {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('permissions', JSON.stringify(data.permissions));
    this._currentUser.set(data.user);
    this._permissions.set(data.permissions);
  }

  private clearSession(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('permissions');
    this._currentUser.set(null);
    this._permissions.set([]);
  }

  private loadUser(): User | null {
    try {
      const s = localStorage.getItem('user');
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  }

  private loadPermissions(): string[] {
    try {
      const s = localStorage.getItem('permissions');
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  }

  forceLogout(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }
}

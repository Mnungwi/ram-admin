import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message?: string | null;
  link?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

interface ListResponse {
  success: boolean;
  data: { notifications: AppNotification[]; unreadCount: number };
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private base = `${environment.apiUrl}/notifications`;

  /** Latest fetched list + unread count, shared with the bell component. */
  readonly items = signal<AppNotification[]>([]);
  readonly unread = signal(0);

  private pollHandle: any = null;

  constructor(private http: HttpClient) {}

  list(unreadOnly = false, limit = 20): Observable<ListResponse> {
    let p = new HttpParams().set('limit', String(limit));
    if (unreadOnly) p = p.set('unreadOnly', 'true');
    return this.http.get<ListResponse>(this.base, { params: p }).pipe(
      tap((res) => {
        if (res?.success) {
          this.items.set(res.data.notifications || []);
          this.unread.set(res.data.unreadCount || 0);
        }
      }),
    );
  }

  refreshCount(): void {
    this.http
      .get<{ success: boolean; data: { count: number } }>(`${this.base}/unread-count`)
      .subscribe({ next: (r) => r?.success && this.unread.set(r.data.count || 0) });
  }

  markRead(id: string): Observable<any> {
    return this.http.patch(`${this.base}/${id}/read`, {}).pipe(
      tap(() => {
        this.items.update((list) =>
          list.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
        );
        this.unread.update((c) => Math.max(0, c - 1));
      }),
    );
  }

  markAllRead(): Observable<any> {
    return this.http.post(`${this.base}/read-all`, {}).pipe(
      tap(() => {
        this.items.update((list) => list.map((n) => ({ ...n, isRead: true })));
        this.unread.set(0);
      }),
    );
  }

  /** Poll the unread count every `ms` while the app is open. Safe to call twice. */
  startPolling(ms = 60000): void {
    if (this.pollHandle) return;
    this.refreshCount();
    this.pollHandle = setInterval(() => this.refreshCount(), ms);
  }

  stopPolling(): void {
    if (this.pollHandle) {
      clearInterval(this.pollHandle);
      this.pollHandle = null;
    }
  }
}

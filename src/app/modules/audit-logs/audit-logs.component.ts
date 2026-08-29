import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Audit Logs</h1>
        <p class="page-subtitle">System-wide activity trail — every create, update, delete and approval across the app</p>
      </div>
      @if (auth.hasPermission('audit:export')) {
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary btn-sm" [disabled]="exporting()" (click)="downloadCsv()">
            <i class="bi bi-file-earmark-spreadsheet me-1"></i> Excel/CSV
          </button>
          <button class="btn btn-outline-primary btn-sm" [disabled]="exporting()" (click)="downloadPdf()">
            <i class="bi bi-file-earmark-pdf me-1"></i> Full Audit Report (PDF)
          </button>
        </div>
      }
    </div>

    @if (!auth.hasPermission('audit:view')) {
      <div class="alert alert-warning">
        <i class="bi bi-lock me-1"></i> You do not have permission to view audit logs.
      </div>
    } @else {

      <!-- Filters -->
      <div class="filters-bar d-flex flex-wrap gap-2 mb-3">
        <input type="text" class="form-control" style="max-width:220px" placeholder="Search action, resource, IP..."
               [(ngModel)]="filters.search" (ngModelChange)="onFilterChange()">
        <select class="form-control" style="max-width:170px" [(ngModel)]="filters.action" (ngModelChange)="onFilterChange()">
          <option value="">All Actions</option>
          @for (a of meta().actions; track a) { <option [value]="a">{{ a }}</option> }
        </select>
        <select class="form-control" style="max-width:170px" [(ngModel)]="filters.resource" (ngModelChange)="onFilterChange()">
          <option value="">All Resources</option>
          @for (r of meta().resources; track r) { <option [value]="r">{{ r }}</option> }
        </select>
        <input type="date" class="form-control" style="max-width:160px" [(ngModel)]="filters.dateFrom" (ngModelChange)="onFilterChange()">
        <input type="date" class="form-control" style="max-width:160px" [(ngModel)]="filters.dateTo" (ngModelChange)="onFilterChange()">
        @if (hasActiveFilter()) {
          <button class="btn btn-outline-secondary btn-sm" (click)="clearFilters()">
            <i class="bi bi-x-circle me-1"></i> Clear
          </button>
        }
      </div>

      @if (loading()) {
        <div class="d-flex justify-content-center py-5">
          <div class="spinner-border text-primary"></div>
        </div>
      } @else {
        <div class="card">
          <div class="table-responsive">
            <table class="table mb-0">
              <thead>
                <tr>
                  <th>Date/Time</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>Resource ID</th>
                  <th>Project</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                @for (l of logs(); track l.id) {
                  <tr>
                    <td style="font-size:12px">{{ l.createdAt | date:'medium' }}</td>
                    <td>{{ l.user ? (l.user.firstName + ' ' + l.user.lastName) : 'System' }}</td>
                    <td><span class="badge bg-light text-dark">{{ l.action }}</span></td>
                    <td>{{ l.resource }}</td>
                    <td class="text-truncate" style="max-width:160px">{{ l.resourceId || '—' }}</td>
                    <td>{{ l.project?.name || '—' }}</td>
                    <td style="font-size:12px">{{ l.ipAddress || '—' }}</td>
                  </tr>
                }
                @if (logs().length === 0) {
                  <tr><td colspan="7" class="text-center py-5 text-muted">
                    <i class="bi bi-clock-history fs-1 d-block mb-2"></i> No audit log entries found.
                  </td></tr>
                }
              </tbody>
            </table>
          </div>

          @if (pagination().totalPages > 1) {
            <div class="d-flex justify-content-between align-items-center p-3 border-top">
              <span class="text-muted small">{{ pagination().total }} entries total</span>
              <ul class="pagination pagination-sm mb-0">
                <li class="page-item" [class.disabled]="pagination().page === 1">
                  <button class="page-link" (click)="changePage(pagination().page - 1)">‹</button>
                </li>
                @for (p of getPages(); track p) {
                  <li class="page-item" [class.active]="p === pagination().page">
                    <button class="page-link" (click)="changePage(p)">{{ p }}</button>
                  </li>
                }
                <li class="page-item" [class.disabled]="pagination().page === pagination().totalPages">
                  <button class="page-link" (click)="changePage(pagination().page + 1)">›</button>
                </li>
              </ul>
            </div>
          }
        </div>
      }
    }
  `
})
export class AuditLogsComponent implements OnInit {
  logs = signal<any[]>([]);
  meta = signal<{ actions: string[]; resources: string[] }>({ actions: [], resources: [] });
  pagination = signal({ total: 0, page: 1, limit: 20, totalPages: 1 });
  loading = signal(false);
  exporting = signal(false);

  filters: any = { search: '', action: '', resource: '', dateFrom: '', dateTo: '' };

  private apiUrl = `${environment.apiUrl}/audit-logs`;

  constructor(private http: HttpClient, public auth: AuthService) {}

  ngOnInit(): void {
    if (!this.auth.hasPermission('audit:view')) return;
    this.loadMeta();
    this.load();
  }

  private buildParams(): string {
    const p: any = { ...this.filters, page: this.pagination().page, limit: this.pagination().limit };
    Object.keys(p).forEach(k => { if (p[k] === '' || p[k] == null) delete p[k]; });
    return new URLSearchParams(p).toString();
  }

  load(): void {
    this.loading.set(true);
    this.http.get<any>(`${this.apiUrl}?${this.buildParams()}`).subscribe({
      next: (res) => {
        this.logs.set(res.data || []);
        if (res.pagination) this.pagination.set(res.pagination);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); Swal.fire('Error', 'Failed to retrieve audit logs.', 'error'); }
    });
  }

  loadMeta(): void {
    this.http.get<any>(`${this.apiUrl}/meta`).subscribe({
      next: (res) => this.meta.set(res.data || { actions: [], resources: [] }),
      error: () => {}
    });
  }

  onFilterChange(): void {
    this.pagination.update(pg => ({ ...pg, page: 1 }));
    this.load();
  }

  clearFilters(): void {
    this.filters = { search: '', action: '', resource: '', dateFrom: '', dateTo: '' };
    this.onFilterChange();
  }

  hasActiveFilter(): boolean {
    return !!(this.filters.search || this.filters.action || this.filters.resource || this.filters.dateFrom || this.filters.dateTo);
  }

  changePage(p: number): void {
    if (p < 1 || p > this.pagination().totalPages) return;
    this.pagination.update(pg => ({ ...pg, page: p }));
    this.load();
  }

  getPages(): number[] {
    const total = this.pagination().totalPages;
    const current = this.pagination().page;
    const start = Math.max(1, Math.min(current - 2, total - 4));
    const count = Math.min(total, 5);
    return Array.from({ length: count }, (_, i) => start + i);
  }

  private exportParams(): string {
    const p: any = { ...this.filters };
    Object.keys(p).forEach(k => { if (p[k] === '' || p[k] == null) delete p[k]; });
    return new URLSearchParams(p).toString();
  }

  private downloadBlob(path: string, filename: string): void {
    this.exporting.set(true);
    this.http.get(`${this.apiUrl}${path}?${this.exportParams()}`, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename;
        a.click(); URL.revokeObjectURL(url);
        this.exporting.set(false);
      },
      error: () => { this.exporting.set(false); Swal.fire('Error', 'Failed to generate the report.', 'error'); }
    });
  }

  downloadCsv(): void {
    this.downloadBlob('/report/csv', `audit-report-${Date.now()}.csv`);
  }

  downloadPdf(): void {
    this.downloadBlob('/report/pdf', `audit-report-${Date.now()}.pdf`);
  }
}

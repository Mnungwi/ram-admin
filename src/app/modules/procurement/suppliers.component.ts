import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SupplierService } from '../../core/services/domain.services';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <div><h1 class="page-title">Suppliers</h1><p class="page-subtitle">Manage all contractors and vendors</p></div>
      @if (auth.hasPermission('supplier:create')) {
        <button class="btn btn-primary btn-sm" (click)="showForm.set(true)">
          <i class="bi bi-plus-lg"></i> Add Supplier
        </button>
      }
    </div>

    <div class="filters-bar mb-3">
      <div class="input-group" style="max-width:260px">
        <div class="input-group-prepend"><span class="input-group-text"><i class="bi bi-search"></i></span></div>
        <input class="form-control" placeholder="Search suppliers..." [(ngModel)]="search">
      </div>
    </div>

    @if (loading()) {
      <div class="loading-overlay"><div class="spinner-border"></div></div>
    } @else {
      <div class="row">
        @for (s of suppliers(); track s.id) {
          <div class="col-lg-4 col-md-6 mb-3">
            <div class="card">
              <div class="card-body">
                <div class="d-flex align-items-start gap-3 mb-3">
                  <div class="supplier-avatar">{{ s.name[0] }}</div>
                  <div class="flex-1">
                    <div class="fw-600" style="color:#111827">{{ s.name }}</div>
                    <div class="text-muted text-small">{{ s.category || 'General' }}</div>
                  </div>
                  <span class="badge" [class.badge-active]="s.isActive" [class.badge-cancelled]="!s.isActive">
                    {{ s.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </div>
                @if (s.email) {
                  <div class="d-flex gap-2 text-small text-muted mb-1">
                    <i class="bi bi-envelope"></i> {{ s.email }}
                  </div>
                }
                @if (s.phone) {
                  <div class="d-flex gap-2 text-small text-muted mb-1">
                    <i class="bi bi-phone"></i> {{ s.phone }}
                  </div>
                }
                @if (s.address) {
                  <div class="d-flex gap-2 text-small text-muted">
                    <i class="bi bi-geo-alt"></i> {{ s.address }}
                  </div>
                }
              </div>
            </div>
          </div>
        }
        @if (!loading() && suppliers().length === 0) {
          <div class="col-12">
            <div class="card">
              <div class="empty-state">
                <div class="empty-icon">🏭</div>
                <div class="empty-title">No suppliers yet</div>
                <div class="empty-desc">Add your first supplier to get started</div>
              </div>
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .supplier-avatar {
      width:40px;height:40px;border-radius:8px;background:#1e3a5f;color:#fff;
      display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;flex-shrink:0;
    }
  `]
})
export class SuppliersComponent implements OnInit {
  suppliers = signal<any[]>([]);
  loading = signal(true);
  showForm = signal(false);
  search = '';

  constructor(private svc: SupplierService, public auth: AuthService) {}

  ngOnInit(): void {
    this.svc.getAll().subscribe({
      next: (r: any) => { this.suppliers.set(r.data?.suppliers || []); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}

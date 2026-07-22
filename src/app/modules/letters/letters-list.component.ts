import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { LetterService, ProjectService } from '../../core/services/domain.services';
import { ClientService } from '../../core/services/client.service';
import { AuthService } from '../../core/services/auth.service';
import { Letter } from '../../core/models/index';

@Component({
  selector: 'app-letters-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Letters</h1>
        <p class="page-subtitle">Manage all project correspondence</p>
      </div>
      <div class="d-flex gap-2">
        <a routerLink="/letters/inbox" class="btn btn-outline-primary btn-sm">
          <i class="bi bi-inbox"></i> My Inbox
          @if (inboxCount() > 0) {
            <span class="badge badge-pill ml-1" style="background:#ef4444;color:#fff;font-size:10px">{{ inboxCount() }}</span>
          }
        </a>
        @if (auth.hasPermission('letter:create')) {
          <a routerLink="/letters/new" class="btn btn-primary btn-sm">
            <i class="bi bi-envelope-plus"></i> Compose Letter
          </a>
        }
      </div>
    </div>

    <!-- Stats row -->
    <div class="row mb-4">
      @for (s of stats; track s.label) {
        <div class="col-lg-2 col-md-4 col-4 mb-2">
          <div class="letter-stat-card" [class.active]="filters.status === s.filterVal" (click)="setStatusFilter(s.filterVal)">
            <div class="letter-stat-icon {{ s.color }}">
              <i class="bi bi-{{ s.icon }}"></i>
            </div>
            <div class="letter-stat-val">{{ s.value }}</div>
            <div class="letter-stat-label">{{ s.label }}</div>
          </div>
        </div>
      }
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="input-group" style="max-width:280px">
        <div class="input-group-prepend">
          <span class="input-group-text"><i class="bi bi-search"></i></span>
        </div>
        <input class="form-control" placeholder="Search subject, ref, recipient..."
               [(ngModel)]="filters.search" (ngModelChange)="load()">
      </div>
      <select class="form-control" style="max-width:140px" [(ngModel)]="filters.type" (ngModelChange)="load()">
        <option value="">All Types</option>
        <option value="outgoing">Outgoing</option>
        <option value="incoming">Incoming</option>
        <option value="internal">Internal</option>
        <option value="memo">Memo</option>
      </select>
      <select class="form-control" style="max-width:160px" [(ngModel)]="filters.priority" (ngModelChange)="load()">
        <option value="">All Priority</option>
        <option value="urgent">Urgent</option>
        <option value="high">High</option>
        <option value="normal">Normal</option>
        <option value="low">Low</option>
      </select>
      <select class="form-control" style="max-width:180px" [(ngModel)]="filters.projectId" (ngModelChange)="load()">
        <option value="">All Projects</option>
        @for (p of projectsList(); track p.id) {
          <option [value]="p.id">{{ p.projectCode }} - {{ p.name }}</option>
        }
      </select>
      <select class="form-control" style="max-width:180px" [(ngModel)]="filters.clientId" (ngModelChange)="load()">
        <option value="">All Clients</option>
        @for (c of clientsList(); track c.id) {
          <option [value]="c.id">{{ c.name }}</option>
        }
      </select>
      @if (hasActiveFilter()) {
        <button class="btn btn-sm btn-outline-secondary ml-auto" (click)="clearFilters()">
          <i class="bi bi-x-circle"></i> Clear
        </button>
      }
    </div>

    @if (loading()) {
      <div class="loading-overlay"><div class="spinner-border"></div></div>
    } @else if (letters().length === 0) {
      <div class="card">
        <div class="empty-state">
          <div class="empty-icon">✉️</div>
          <div class="empty-title">No letters found</div>
          <div class="empty-desc">{{ hasActiveFilter() ? 'Try clearing your filters' : 'Compose your first letter to get started' }}</div>
          @if (auth.hasPermission('letter:create') && !hasActiveFilter()) {
            <a routerLink="/letters/new" class="btn btn-primary mt-3">
              <i class="bi bi-envelope-plus"></i> Compose Letter
            </a>
          }
        </div>
      </div>
    } @else {
      <div class="table-card">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th style="width:40px"></th>
                <th>Ref No</th>
                <th>Subject</th>
                <th>To / From</th>
                <th>Type</th>
                <th>Priority</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (l of letters(); track l.id) {
                <tr [class.table-warning]="l.priority === 'urgent'"
                    [class.unread]="false">
                  <td>
                    <div class="type-dot {{ l.type }}"></div>
                  </td>
                  <td>
                    <span class="fw-600 text-small" style="color:#2563eb; font-family:monospace">{{ l.letterNo }}</span>
                  </td>
                  <td>
                    <div class="fw-600" style="color:#111827; max-width:260px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap">
                      {{ l.subject }}
                    </div>
                    @if (l.referenceNo) {
                      <div class="text-muted text-small">Ref: {{ l.referenceNo }}</div>
                    }
                    @if (l.project) {
                      <div class="text-muted text-small mt-1">
                        <i class="fa fa-folder-open mr-1"></i>Project: <span class="badge badge-info text-small px-2" style="font-size:10px; background:#eff6ff; color:#2563eb; border:1px solid #bfdbfe">{{ l.project.projectCode }}</span>
                      </div>
                    } @else {
                      <div class="text-muted text-small mt-1">
                        <i class="fa fa-envelope-open mr-1"></i>Type: <span class="badge badge-secondary text-small px-2" style="font-size:10px; background:#f3f4f6; color:#6b7280; border:1px solid #e5e7eb">General Letter</span>
                      </div>
                    }
                    @if (l.attachments && l.attachments.length > 0) {
                      <div class="text-small mt-1 d-flex flex-wrap gap-1">
                        @for (att of l.attachments; track $index) {
                          <a [href]="svc.getAttachmentDownloadUrl(l.id)" target="_blank" class="badge bg-light text-success border font-weight-bold" style="text-decoration:none">
                            <i class="fa fa-paperclip me-1"></i>{{ att.fileName || att.title }}
                          </a>
                        }
                      </div>
                    } @else if (l.attachmentFileName) {
                      <div class="text-small mt-1">
                        <a [href]="svc.getAttachmentDownloadUrl(l.id)" target="_blank" class="text-success font-weight-bold" style="text-decoration:none">
                          <i class="fa fa-paperclip mr-1"></i>Attachment: {{ l.attachmentFileName }}
                        </a>
                      </div>
                    }
                  </td>
                  <td>
                    <div class="text-medium">{{ l.type === 'incoming' ? l.fromName : l.toName }}</div>
                    <div class="text-muted text-small">{{ l.type === 'incoming' ? l.fromOrg : l.toOrg }}</div>
                  </td>
                  <td>
                    <span class="badge badge-{{ l.type }}">{{ l.type }}</span>
                  </td>
                  <td>
                    <span class="priority-badge priority-{{ l.priority }}">
                      {{ l.priority }}
                    </span>
                  </td>
                  <td class="text-small text-muted">{{ l.letterDate | date:'dd MMM yy' }}</td>
                  <td>
                    <span class="badge badge-{{ l.status }}">{{ formatStatus(l.status) }}</span>
                  </td>
                  <td>
                    <div class="d-flex gap-1">
                      <button class="action-btn text-primary" title="Preview Sheet" (click)="openPreviewModal(l)">
                        <i class="bi bi-eye"></i>
                      </button>
                      <a [routerLink]="['/letters', l.id]" class="action-btn" title="View Details">
                        <i class="bi bi-card-text"></i>
                      </a>
                      @if (auth.hasPermission('letter:download')) {
                        <button class="action-btn" title="Download PDF" (click)="download(l)">
                          <i class="bi bi-file-pdf"></i>
                        </button>
                      }
                      @if (auth.hasPermission('letter:update') && ['draft','pending approval','pending_approval'].includes((l.status || '').toLowerCase())) {
                        <a [routerLink]="['/letters', l.id, 'edit']" class="action-btn" title="Edit">
                          <i class="bi bi-pencil"></i>
                        </a>
                      }
                      @if (auth.hasPermission('letter:send') && (l.status || '').toLowerCase() === 'draft') {
                        <button class="action-btn success" title="Submit for Approval" (click)="submitLetter(l)">
                          <i class="bi bi-send"></i>
                        </button>
                      }
                      @if (auth.hasPermission('letter:approve') && ['pending approval','pending_approval'].includes((l.status || '').toLowerCase())) {
                        <button class="action-btn success" title="Approve" (click)="approveLetter(l)">
                          <i class="bi bi-check-lg"></i>
                        </button>
                      }
                      @if (auth.hasPermission('letter:delete') || (l.status || '').toLowerCase() === 'draft') {
                        <button class="action-btn danger" title="Delete" (click)="deleteLetter(l)">
                          <i class="bi bi-trash"></i>
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        @if (pagination().totalPages > 1) {
          <div class="d-flex justify-content-between align-items-center p-3 border-top">
            <span class="text-muted text-small">
              {{ pagination().total }} letters total
            </span>
            <nav>
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
            </nav>
          </div>
        }
      </div>
    }

    <!-- ELEGANT LETTER PREVIEW MODAL -->
    @if (previewModalLetter()) {
      <div class="modal-backdrop-custom" (click)="closePreviewModal()" style="position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:1050;backdrop-filter:blur(3px)"></div>
      <div class="modal-custom" style="position:fixed;inset:0;z-index:1055;display:flex;align-items:center;justify-content:center;padding:20px">
        <div class="modal-content shadow-lg border-0" style="max-width:900px;width:100%;height:88vh;border-radius:12px;background:#fff;display:flex;flex-direction:column;overflow:hidden">
          <div class="modal-header bg-dark text-white py-3 px-4 d-flex justify-content-between align-items-center" style="border-top-left-radius:12px;border-top-right-radius:12px">
            <div class="d-flex align-items-center gap-2">
              <i class="bi bi-file-earmark-text text-warning fs-4"></i>
              <div>
                <h6 class="modal-title mb-0 fw-bold text-white">{{ previewModalLetter()!.letterNo }}</h6>
                <span class="small text-muted" style="font-size:11px;color:#9ca3af !important">{{ previewModalLetter()!.subject }}</span>
              </div>
            </div>
            <div class="d-flex align-items-center gap-2">
              <button type="button" class="btn btn-sm btn-outline-light" (click)="download(previewModalLetter()!)">
                <i class="bi bi-download me-1"></i> Download PDF
              </button>
              <a [routerLink]="['/letters', previewModalLetter()!.id]" class="btn btn-sm btn-primary" (click)="closePreviewModal()">
                <i class="bi bi-box-arrow-up-right me-1"></i> View Full Page
              </a>
              <button type="button" class="close text-white ml-2" (click)="closePreviewModal()"><span style="font-size:24px">&times;</span></button>
            </div>
          </div>
          <div class="modal-body p-0 flex-grow-1" style="background:#f3f4f6">
            <iframe [src]="previewModalSafeUrl()!" style="width:100%;height:100%;border:none"></iframe>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .letter-stat-card {
      background: #fff; border: 1px solid #e5e7eb; border-radius: 8px;
      padding: 12px; text-align: center; cursor: pointer; transition: all .2s;
      &:hover { border-color: #2563eb; box-shadow: 0 0 0 2px rgba(37,99,235,.1); }
      &.active { border-color: #2563eb; background: #eff6ff; }
    }
    .letter-stat-icon {
      width: 36px; height: 36px; border-radius: 8px; margin: 0 auto 6px;
      display: flex; align-items: center; justify-content: center; font-size: 16px;
      &.blue   { background: #eff6ff; color: #2563eb; }
      &.green  { background: #f0fdf4; color: #16a34a; }
      &.orange { background: #fff7ed; color: #f97316; }
      &.gray   { background: #f3f4f6; color: #6b7280; }
      &.red    { background: #fef2f2; color: #dc2626; }
      &.purple { background: #faf5ff; color: #9333ea; }
    }
    .letter-stat-val   { font-size: 20px; font-weight: 700; color: #111827; line-height: 1.2; }
    .letter-stat-label { font-size: 11px; color: #9ca3af; }

    .type-dot {
      width: 8px; height: 8px; border-radius: 50%; margin: auto;
      &.outgoing { background: #9333ea; }
      &.incoming { background: #0891b2; }
      &.internal { background: #f97316; }
      &.memo     { background: #6b7280; }
    }

    .priority-badge {
      display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 500;
      &.priority-urgent { background: #fee2e2; color: #991b1b; }
      &.priority-high   { background: #fff7ed; color: #9a3412; }
      &.priority-normal { background: #f0f9ff; color: #0369a1; }
      &.priority-low    { background: #f3f4f6; color: #6b7280; }
    }

    tr.table-warning td { background: #fffbeb !important; }
  `]
})
export class LettersListComponent implements OnInit {
  letters = signal<Letter[]>([]);
  loading = signal(true);
  inboxCount = signal(0);
  pagination = signal({ total: 0, page: 1, limit: 20, totalPages: 1 });
  filters: any = { search: '', type: '', status: '', priority: '', projectId: '', clientId: '' };
  
  projectsList = signal<any[]>([]);
  clientsList = signal<any[]>([]);

  stats = [
    { label: 'Total',    icon: 'envelope',         color: 'blue',   value: 0, filterVal: '' },
    { label: 'Draft',    icon: 'pencil-square',     color: 'gray',   value: 0, filterVal: 'draft' },
    { label: 'Pending',  icon: 'hourglass-split',   color: 'orange', value: 0, filterVal: 'pending_approval' },
    { label: 'Sent',     icon: 'send-check',        color: 'green',  value: 0, filterVal: 'sent' },
    { label: 'Incoming', icon: 'envelope-arrow-down',color:'purple', value: 0, filterVal: 'received' },
    { label: 'Archived', icon: 'archive',           color: 'red',    value: 0, filterVal: 'archived' },
  ];

  previewModalLetter = signal<Letter | null>(null);
  previewModalSafeUrl = signal<SafeResourceUrl | null>(null);

  constructor(
    public svc: LetterService, 
    public auth: AuthService,
    private projectSvc: ProjectService,
    private clientSvc: ClientService,
    private sanitizer: DomSanitizer
  ) {}

  openPreviewModal(l: Letter): void {
    this.previewModalLetter.set(l);
    const tsUrl = `${this.svc.getPreviewUrl(l.id)}?t=${Date.now()}`;
    this.previewModalSafeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(tsUrl));
  }

  closePreviewModal(): void {
    this.previewModalLetter.set(null);
    this.previewModalSafeUrl.set(null);
  }

  ngOnInit(): void {
    this.load();
    this.loadStats();
    this.loadFilterOptions();
  }

  loadFilterOptions(): void {
    this.projectSvc.getAll().subscribe({
      next: (res: any) => this.projectsList.set(res?.data?.rows || res?.data || [])
    });
    this.clientSvc.getClients().subscribe({
      next: (res: any) => this.clientsList.set(res?.data?.rows || res?.data || [])
    });
  }

  load(): void {
    this.loading.set(true);
    this.svc.getAll({ ...this.filters, page: this.pagination().page, limit: 20 }).subscribe({
      next: (res: any) => {
        this.letters.set(res.data || []);
        if (res.pagination) this.pagination.set(res.pagination);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadStats(): void {
    this.svc.getStats().subscribe({
      next: (res: any) => {
        const d = res.data?.stats || res.data || {};
        this.stats[0].value = d.total || 0;
        this.stats[1].value = d.draft || 0;
        this.stats[2].value = d.pendingApproval || 0;
        this.stats[3].value = d.sent || 0;
        this.stats[4].value = d.incoming || 0;
        this.stats[5].value = d.archived || 0;
        this.inboxCount.set(d.pendingApproval || 0);
      }
    });
  }

  setStatusFilter(val: string): void {
    this.filters.status = this.filters.status === val ? '' : val;
    this.load();
  }

  clearFilters(): void {
    this.filters = { search: '', type: '', status: '', priority: '', projectId: '', clientId: '' };
    this.load();
  }

  hasActiveFilter(): boolean {
    return !!(this.filters.search || this.filters.type || this.filters.status || this.filters.priority || this.filters.projectId || this.filters.clientId);
  }

  submitLetter(l: Letter): void {
    this.svc.submit(l.id).subscribe({ next: () => this.load() });
  }

  approveLetter(l: Letter): void {
    this.svc.approve(l.id).subscribe({ next: () => this.load() });
  }

  deleteLetter(l: Letter): void {
    if (confirm(`Are you sure you want to delete letter "${l.subject}"?`)) {
      this.svc.deleteLetter(l.id).subscribe({
        next: () => {
          this.load();
          this.loadStats();
        },
        error: (err) => alert(err.error?.message || 'Failed to delete letter')
      });
    }
  }

  download(l: Letter): void {
    this.svc.downloadPdf(l.id).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${l.letterNo}.pdf`;
      a.click(); URL.revokeObjectURL(url);
    });
  }

  changePage(p: number): void {
    if (p < 1 || p > this.pagination().totalPages) return;
    this.pagination.update(pg => ({ ...pg, page: p }));
    this.load();
  }

  getPages(): number[] {
    return Array.from({ length: Math.min(this.pagination().totalPages, 5) }, (_, i) => i + 1);
  }

  formatStatus(s: string): string {
    return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}

import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { LetterService } from '../../core/services/domain.services';
import { AuthService } from '../../core/services/auth.service';
import { Letter } from '../../core/models';

@Component({
  selector: 'app-letter-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    @if (loading()) {
      <div class="loading-overlay"><div class="spinner-border"></div></div>
    } @else if (letter()) {
      <!-- Header -->
      <div class="page-header">
        <div>
          <div class="d-flex align-items-center gap-2 mb-1">
            <a routerLink="/letters" class="text-muted text-small">
              <i class="bi bi-arrow-left"></i> Letters
            </a>
            <span class="text-muted">/</span>
            <span class="text-small fw-600" style="color:#2563eb; font-family:monospace">{{ letter()!.letterNo }}</span>
          </div>
          <h1 class="page-title">{{ letter()!.subject }}</h1>
          <div class="d-flex align-items-center gap-2 mt-1">
            <span class="badge badge-{{ letter()!.type }}">{{ letter()!.type }}</span>
            <span class="priority-badge priority-{{ letter()!.priority }}">{{ letter()!.priority }}</span>
            <span class="badge badge-{{ letter()!.status }}">{{ formatStatus(letter()!.status) }}</span>
          </div>
        </div>
        <div class="d-flex gap-2 flex-wrap">
          <!-- Workflow actions -->
          @if (auth.hasPermission('letter:send') && (letter()!.status || '').toLowerCase() === 'draft') {
            <button class="btn btn-warning btn-sm" (click)="submit()">
              <i class="bi bi-send"></i> Submit for Approval
            </button>
          }
          @if (auth.hasPermission('letter:approve') && ['pending approval','pending_approval'].includes((letter()!.status || '').toLowerCase())) {
            <button class="btn btn-success btn-sm" (click)="approve()">
              <i class="bi bi-check-lg"></i> Approve
            </button>
          }
          @if (auth.hasPermission('letter:send') && ['draft','approved'].includes((letter()!.status || '').toLowerCase())) {
            <button class="btn btn-primary btn-sm" (click)="send()">
              <i class="bi bi-send-check"></i> Send Letter
            </button>
          }
          @if (auth.hasPermission('letter:update') && ['draft','pending approval','pending_approval'].includes((letter()!.status || '').toLowerCase())) {
            <a [routerLink]="['/letters', letter()!.id, 'edit']" class="btn btn-outline-secondary btn-sm">
              <i class="bi bi-pencil"></i> Edit
            </a>
          }
          @if (auth.hasPermission('letter:download')) {
            <button class="btn btn-outline-secondary btn-sm" (click)="downloadPdf()">
              <i class="bi bi-file-pdf"></i> Download PDF
            </button>
          }
          @if (auth.hasPermission('letter:view')) {
            <button class="btn btn-outline-secondary btn-sm" (click)="togglePreview()">
              <i class="bi bi-eye"></i> {{ showPreview() ? 'Hide' : 'Preview' }}
            </button>
          }
        </div>
      </div>

      @if (actionMsg()) {
        <div class="alert alert-success alert-dismissible fade show mb-3" role="alert">
          <i class="bi bi-check-circle mr-2"></i> {{ actionMsg() }}
          <button type="button" class="close" (click)="actionMsg.set('')"><span>&times;</span></button>
        </div>
      }

      <div class="row">
        <!-- Letter details -->
        <div [class]="showPreview() ? 'col-lg-4' : 'col-lg-4'">
          <!-- Meta card -->
          <div class="card mb-3">
            <div class="card-header"><h5 class="card-title">Letter Info</h5></div>
            <div class="card-body">
              <dl class="detail-list">
                <dt>Reference No</dt>
                <dd style="font-family:monospace; color:#2563eb">{{ letter()!.letterNo }}</dd>
                <dt>Letter Date</dt>
                <dd>{{ letter()!.letterDate | date:'dd MMMM yyyy' }}</dd>
                <dt>Type</dt>
                <dd><span class="badge badge-{{ letter()!.type }}">{{ letter()!.type }}</span></dd>
                <dt>Priority</dt>
                <dd><span class="priority-badge priority-{{ letter()!.priority }}">{{ letter()!.priority }}</span></dd>
                <dt>Status</dt>
                <dd><span class="badge badge-{{ letter()!.status }}">{{ formatStatus(letter()!.status) }}</span></dd>
                @if (letter()!.referenceNo) {
                  <dt>Ext. Reference</dt>
                  <dd>{{ letter()!.referenceNo }}</dd>
                }
                @if (letter()!.sentAt) {
                  <dt>Sent At</dt>
                  <dd>{{ letter()!.sentAt | date:'dd MMM yyyy, HH:mm' }}</dd>
                }
              </dl>
            </div>
          </div>

          <!-- From -->
          <div class="card mb-3">
            <div class="card-header"><h5 class="card-title">From</h5></div>
            <div class="card-body">
              <div class="person-row">
                <div class="person-avatar blue">{{ letter()!.fromName?.[0] || 'F' }}</div>
                <div>
                  <div class="fw-600">{{ letter()!.fromName || '—' }}</div>
                  <div class="text-muted text-small">{{ letter()!.fromTitle }}</div>
                  <div class="text-muted text-small">{{ letter()!.fromOrg }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- To -->
          <div class="card mb-3">
            <div class="card-header"><h5 class="card-title">To</h5></div>
            <div class="card-body">
              <div class="person-row">
                <div class="person-avatar green">{{ letter()!.toName?.[0] || 'T' }}</div>
                <div>
                  <div class="fw-600">{{ letter()!.toName }}</div>
                  <div class="text-muted text-small">{{ letter()!.toTitle }}</div>
                  <div class="text-muted text-small">{{ letter()!.toOrg }}</div>
                  @if (letter()!.toEmail) {
                    <div class="text-small" style="color:#2563eb">{{ letter()!.toEmail }}</div>
                  }
                </div>
              </div>
            </div>
          </div>

          <!-- CC -->
          @if (letter()!.ccRecipients && letter()!.ccRecipients!.length > 0) {
            <div class="card mb-3">
              <div class="card-header"><h5 class="card-title">CC ({{ letter()!.ccRecipients!.length }})</h5></div>
              <div class="card-body">
                @for (cc of letter()!.ccRecipients!; track $index) {
                  <div class="person-row" style="margin-bottom:10px">
                    <div class="person-avatar orange">{{ cc.name?.[0] || 'C' }}</div>
                    <div>
                      <div class="fw-600 text-medium">{{ cc.name }}</div>
                      <div class="text-muted text-small">{{ cc.title }}</div>
                      @if (cc.email) {
                        <div class="text-small" style="color:#2563eb">{{ cc.email }}</div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Attachments -->
          @if (letter()!.attachments && letter()!.attachments.length > 0) {
            <div class="card mb-3">
              <div class="card-header"><h5 class="card-title"><i class="bi bi-paperclip me-1"></i> Attachments ({{ letter()!.attachments.length }})</h5></div>
              <div class="card-body p-2">
                @for (att of letter()!.attachments; track $index) {
                  <div class="d-flex align-items-center justify-content-between p-2 border-bottom">
                    <div class="d-flex align-items-center gap-2 overflow-hidden me-2">
                      <i class="bi bi-file-earmark-text text-primary fs-5"></i>
                      <span class="text-truncate text-small fw-600">{{ att.fileName || att.title }}</span>
                    </div>
                    <a [href]="getAttachmentUrl(att, $index)" target="_blank" class="btn btn-outline-primary btn-xs flex-shrink-0">
                      <i class="bi bi-box-arrow-up-right"></i> View
                    </a>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Read by -->
          @if (letter()!.reads && letter()!.reads!.length > 0) {
            <div class="card mb-3">
              <div class="card-header">
                <h5 class="card-title">Read by ({{ letter()!.reads!.length }})</h5>
              </div>
              <div class="card-body" style="padding: 12px">
                @for (r of letter()!.reads!; track $index) {
                  <div class="d-flex align-items-center gap-2 mb-2">
                    <i class="bi bi-check2-circle text-success"></i>
                    <span class="text-small">{{ r.user?.firstName }} {{ r.user?.lastName }}</span>
                    <span class="text-muted text-small ml-auto">{{ r.readAt | date:'dd MMM, HH:mm' }}</span>
                  </div>
                }
              </div>
            </div>
          }
        </div>

        <!-- Body / Preview -->
        <div [class]="showPreview() ? 'col-lg-8' : 'col-lg-8'">
          @if (showPreview() && safeUrl()) {
            <!-- Embedded preview -->
            <div class="card">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="card-title mb-0"><i class="bi bi-file-text mr-2"></i>Letter Preview</h5>
                <button type="button" class="btn btn-outline-primary btn-sm" (click)="showFullPreviewModal.set(true)">
                  <i class="bi bi-arrows-fullscreen me-1"></i> Open Full Modal
                </button>
              </div>
              <div class="card-body p-0">
                <iframe [src]="safeUrl()!" class="letter-preview-frame" style="border:none; border-radius:0 0 8px 8px; height:700px"></iframe>
              </div>
            </div>
          } @else {
            <!-- Text body -->
            <div class="card">
              <div class="card-header">
                <h5 class="card-title"><i class="bi bi-body-text mr-2"></i>Letter Body</h5>
              </div>
              <div class="card-body" style="font-family:'Times New Roman',serif; font-size:14px; line-height:1.8; color:#222" [innerHTML]="letter()!.body"></div>
            </div>
            @if (letter()!.notes) {
              <div class="card mt-3">
                <div class="card-header"><h5 class="card-title">Internal Notes</h5></div>
                <div class="card-body text-muted">{{ letter()!.notes }}</div>
              </div>
            }
          }
        </div>
      </div>
    }

    <!-- FULL SCREEN PREVIEW MODAL -->
    @if (showFullPreviewModal() && letter()) {
      <div class="modal-backdrop-custom" (click)="showFullPreviewModal.set(false)" style="position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:1050;backdrop-filter:blur(3px)"></div>
      <div class="modal-custom" style="position:fixed;inset:0;z-index:1055;display:flex;align-items:center;justify-content:center;padding:20px">
        <div class="modal-content shadow-lg border-0" style="max-width:920px;width:100%;height:90vh;border-radius:12px;background:#fff;display:flex;flex-direction:column;overflow:hidden">
          <div class="modal-header bg-dark text-white py-3 px-4 d-flex justify-content-between align-items-center" style="border-top-left-radius:12px;border-top-right-radius:12px">
            <div class="d-flex align-items-center gap-2">
              <i class="bi bi-file-earmark-text text-warning fs-4"></i>
              <div>
                <h6 class="modal-title mb-0 fw-bold text-white">{{ letter()!.letterNo }}</h6>
                <span class="small text-muted" style="font-size:11px;color:#9ca3af !important">{{ letter()!.subject }}</span>
              </div>
            </div>
            <div class="d-flex align-items-center gap-2">
              <button type="button" class="btn btn-sm btn-outline-light" (click)="downloadPdf()">
                <i class="bi bi-download me-1"></i> Download PDF
              </button>
              <button type="button" class="close text-white ml-2" (click)="showFullPreviewModal.set(false)"><span style="font-size:24px">&times;</span></button>
            </div>
          </div>
          <div class="modal-body p-0 flex-grow-1" style="background:#f3f4f6">
            <iframe [src]="safeUrl()!" style="width:100%;height:100%;border:none"></iframe>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .detail-list {
      dt { font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 2px; }
      dd { font-size: 13.5px; color: #374151; margin-bottom: 12px; }
    }
    .person-row { display: flex; align-items: flex-start; gap: 10px; }
    .person-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 14px; flex-shrink: 0; color: #fff;
      &.blue   { background: #2563eb; }
      &.green  { background: #16a34a; }
      &.orange { background: #f97316; }
    }
    .priority-badge {
      display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 500;
      &.priority-urgent { background: #fee2e2; color: #991b1b; }
      &.priority-high   { background: #fff7ed; color: #9a3412; }
      &.priority-normal { background: #eff6ff; color: #1e40af; }
      &.priority-low    { background: #f3f4f6; color: #6b7280; }
    }
    .modal-backdrop-custom{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:1040;}
    .modal-custom{position:fixed;inset:0;z-index:1050;display:flex;align-items:center;justify-content:center;padding:16px;}
  `]
})
export class LetterDetailComponent implements OnInit {
  letter = signal<any>(null);
  loading = signal(true);
  showPreview = signal(false);
  showFullPreviewModal = signal(false);
  actionMsg = signal('');
  safeUrl = signal<SafeResourceUrl | null>(null);

  constructor(
    private route: ActivatedRoute,
    private svc: LetterService,
    public auth: AuthService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.svc.getOne(id).subscribe({
      next: (res: any) => {
        const l = res.data?.letter || res.data;
        this.letter.set(l);
        if (l) this.updateSafeUrl(l.id);
        this.loading.set(false);
      }
    });
  }

  updateSafeUrl(id: string): void {
    const tsUrl = `${this.svc.getPreviewUrl(id)}?t=${Date.now()}`;
    this.safeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(tsUrl));
  }

  previewUrl(): string {
    return this.letter() ? this.svc.getPreviewUrl(this.letter().id) : '';
  }

  getAttachmentUrl(att: any, index: number): string {
    return this.letter() ? this.svc.getAttachmentDownloadUrl(this.letter().id, att, index) : '';
  }

  togglePreview(): void { this.showPreview.update(v => !v); }

  submit(): void {
    this.svc.submit(this.letter().id).subscribe({
      next: (res: any) => {
        const l = res.data?.letter || res.data;
        this.letter.set(l);
        if (l) this.updateSafeUrl(l.id);
        this.actionMsg.set('Letter submitted for approval.');
      }
    });
  }

  approve(): void {
    this.svc.approve(this.letter().id).subscribe({
      next: (res: any) => {
        const l = res.data?.letter || res.data;
        this.letter.set(l);
        if (l) this.updateSafeUrl(l.id);
        this.actionMsg.set('Letter approved successfully.');
      }
    });
  }

  send(): void {
    this.svc.send(this.letter().id).subscribe({
      next: (res: any) => {
        const l = res.data?.letter || res.data;
        this.letter.set(l);
        if (l) this.updateSafeUrl(l.id);
        this.actionMsg.set('Letter has been sent.');
      }
    });
  }

  downloadPdf(): void {
    this.svc.downloadPdf(this.letter().id).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${this.letter().letterNo}.pdf`;
      a.click(); URL.revokeObjectURL(url);
    });
  }

  formatStatus(s: string): string {
    return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}

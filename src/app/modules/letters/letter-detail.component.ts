import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { LetterService, UserService } from '../../core/services/domain.services';
import { AuthService } from '../../core/services/auth.service';
import { Letter } from '../../core/models';
import Swal from 'sweetalert2';

// Shared "nice, modern" confirmation styling for this component's actions —
// buttonsStyling:false hands button appearance to our own Bootstrap classes
// instead of SweetAlert2's plain defaults, so it matches the app's theme.
const prettyAlert = Swal.mixin({
  buttonsStyling: false,
  reverseButtons: true,
  customClass: {
    popup: 'rounded-4 shadow-lg',
    confirmButton: 'btn btn-primary rounded-pill px-4 me-2',
    cancelButton: 'btn btn-outline-secondary rounded-pill px-4',
  },
});

@Component({
  selector: 'app-letter-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
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
          @if (canSignThisLetter()) {
            <button class="btn btn-success btn-sm" (click)="signLetter()">
              <i class="bi bi-pen"></i> Sign
            </button>
          }
          @if (auth.hasPermission('letter:approve') && ['pending approval','pending_approval'].includes((letter()!.status || '').toLowerCase())) {
            <button class="btn btn-outline-primary btn-sm" (click)="openForwardModal()">
              <i class="bi bi-send-arrow-up"></i> Forward for Signature
            </button>
          }
          @if (auth.hasPermission('letter:send') && ['draft','approved'].includes((letter()!.status || '').toLowerCase())) {
            <button class="btn btn-primary btn-sm" (click)="send()">
              <i class="bi bi-send-check"></i> Send Letter
            </button>
          }
          @if (auth.hasPermission('letter:update') && !['sent','archived'].includes((letter()!.status || '').toLowerCase())) {
            <a [routerLink]="['/letters', letter()!.id, 'edit']" class="btn btn-outline-secondary btn-sm"
               [title]="['approved','pending signature','pending_signature'].includes((letter()!.status || '').toLowerCase()) ? 'Editing sends it back to Draft — the existing signature no longer applies to changed content' : ''">
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
                @if (letter()!.forwardedTo) {
                  <dt>Forwarded To (for signature)</dt>
                  <dd><i class="bi bi-send-arrow-up text-primary me-1"></i>{{ letter()!.forwardedTo.firstName }} {{ letter()!.forwardedTo.lastName }}</dd>
                }
                @if (letter()!.approvedBy && letter()!.approvedAt) {
                  <dt>Signed By</dt>
                  <dd><i class="bi bi-patch-check-fill text-success me-1"></i>{{ letter()!.approvedBy.firstName }} {{ letter()!.approvedBy.lastName }} — {{ letter()!.approvedAt | date:'dd MMM yyyy' }}</dd>
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

          <!-- Notes / Comments -->
          <div class="card mb-3">
            <div class="card-header"><h5 class="card-title"><i class="bi bi-chat-left-text me-1"></i>Notes & Comments ({{ letter()!.comments?.length || 0 }})</h5></div>
            <div class="card-body">
              @for (c of letter()!.comments; track c.id) {
                <div class="comment-item mb-2 pb-2 border-bottom">
                  <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="fw-600 text-small">{{ c.user?.firstName }} {{ c.user?.lastName }}</span>
                    <span class="badge" [ngClass]="{
                      'bg-success-subtle text-success': c.type === 'sign',
                      'bg-primary-subtle text-primary': c.type === 'forward',
                      'bg-secondary-subtle text-secondary': c.type === 'note'
                    }" style="font-size:10px">{{ c.type }}</span>
                  </div>
                  <div class="text-small" style="color:#374151">{{ c.comment }}</div>
                  <div class="text-muted" style="font-size:11px">{{ c.createdAt | date:'dd MMM yyyy, HH:mm' }}</div>
                </div>
              }
              @if (!letter()!.comments || letter()!.comments.length === 0) {
                <div class="text-muted text-small py-2">No notes yet.</div>
              }
              @if (auth.hasPermission('letter:view')) {
                <div class="d-flex gap-2 mt-3">
                  <input class="form-control form-control-sm" [(ngModel)]="newComment" placeholder="Add a note..." (keyup.enter)="addComment()">
                  <button class="btn btn-sm btn-outline-primary flex-shrink-0" [disabled]="!newComment.trim()" (click)="addComment()">
                    <i class="bi bi-send"></i>
                  </button>
                </div>
              }
            </div>
          </div>

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

  newComment = '';

  constructor(
    private route: ActivatedRoute,
    private svc: LetterService,
    private userSvc: UserService,
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
    prettyAlert.fire({
      title: 'Submit for approval?',
      text: 'This letter will move out of Draft and be ready for signing.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Submit',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.svc.submit(this.letter().id).subscribe({
        next: (res: any) => {
          const l = res.data?.letter || res.data;
          this.letter.set(l);
          if (l) this.updateSafeUrl(l.id);
          this.actionMsg.set('Letter submitted for approval.');
        }
      });
    });
  }

  reload(): void {
    this.svc.getOne(this.letter().id).subscribe({
      next: (res: any) => {
        const l = res.data?.letter || res.data;
        this.letter.set(l);
        if (l) this.updateSafeUrl(l.id);
      }
    });
  }

  // The generic letter:approve permission alone isn't enough once a letter
  // has been forwarded to a SPECIFIC designated signer ("Signing As" on
  // Compose, or "Forward for Signature" here) — only that person should be
  // able to click Sign, otherwise anyone with approve rights (e.g. the
  // secretary who prepared it) could sign on the designated signer's
  // behalf without them ever actually seeing it.
  canSignThisLetter(): boolean {
    const l = this.letter();
    if (!l || !this.auth.hasPermission('letter:approve')) return false;
    const status = (l.status || '').toLowerCase();
    if (!['pending approval', 'pending_approval', 'pending signature', 'pending_signature'].includes(status)) {
      return false;
    }
    if (['pending signature', 'pending_signature'].includes(status) && (l as any).forwardedToId) {
      return (l as any).forwardedToId === this.auth.currentUser()?.id;
    }
    return true;
  }

  signLetter(): void {
    prettyAlert.fire({
      title: 'Sign this letter?',
      html: '<p class="text-muted mb-2">Signing confirms you approve the content and authorize it to be sent.</p>',
      input: 'textarea',
      inputPlaceholder: 'Add a signing note (optional)...',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-pen me-1"></i> Yes, Sign It',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.svc.sign(this.letter().id, result.value || '').subscribe({
        next: () => {
          this.reload();
          this.actionMsg.set('Letter signed successfully.');
          prettyAlert.fire({ title: 'Signed!', text: 'The letter has been signed.', icon: 'success', timer: 1800, showConfirmButton: false });
        },
        error: (err) => {
          prettyAlert.fire({ title: 'Could not sign', text: err?.error?.message || 'Something went wrong.', icon: 'error' });
        }
      });
    });
  }

  openForwardModal(): void {
    this.userSvc.getAll({ limit: 200 }).subscribe({
      next: (res: any) => {
        const users = res.data || [];
        const options: Record<string, string> = {};
        users.forEach((u: any) => { options[u.id] = `${u.firstName} ${u.lastName}${u.jobTitle ? ' — ' + u.jobTitle : ''}`; });

        prettyAlert.fire({
          title: 'Forward for Signature',
          html: `
            <p class="text-muted mb-2 text-start" style="font-size:13px">Choose who should review and sign this letter.</p>
            <textarea id="swal-fwd-note" class="swal2-textarea" placeholder="Optional note for the signer..." style="margin-top:8px"></textarea>
          `,
          input: 'select',
          inputOptions: options,
          inputPlaceholder: 'Select a signer...',
          showCancelButton: true,
          confirmButtonText: '<i class="bi bi-send-arrow-up me-1"></i> Forward',
          cancelButtonText: 'Cancel',
          preConfirm: (userId) => {
            if (!userId) {
              Swal.showValidationMessage('Please choose who to forward this letter to');
              return false;
            }
            const noteEl = document.getElementById('swal-fwd-note') as HTMLTextAreaElement | null;
            return { userId, note: noteEl?.value || '' };
          }
        }).then((result) => {
          if (!result.isConfirmed || !result.value) return;
          const { userId, note } = result.value;
          this.svc.forward(this.letter().id, userId, note).subscribe({
            next: (fwdRes: any) => {
              this.reload();
              this.actionMsg.set(fwdRes?.message || 'Letter forwarded for signature.');
              prettyAlert.fire({ title: 'Forwarded!', text: 'The letter has been sent for signature.', icon: 'success', timer: 1800, showConfirmButton: false });
            },
            error: (err) => {
              prettyAlert.fire({ title: 'Could not forward', text: err?.error?.message || 'Something went wrong.', icon: 'error' });
            }
          });
        });
      },
      error: () => prettyAlert.fire({ title: 'Error', text: 'Could not load users list.', icon: 'error' })
    });
  }

  addComment(): void {
    const text = this.newComment.trim();
    if (!text) return;
    this.svc.addComment(this.letter().id, text).subscribe({
      next: () => {
        this.newComment = '';
        this.reload();
      },
      error: () => prettyAlert.fire({ title: 'Error', text: 'Could not add note.', icon: 'error' })
    });
  }

  send(): void {
    prettyAlert.fire({
      title: 'Send this letter?',
      text: `An email will be sent to ${this.letter().toEmail || 'the recipient'} now.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '<i class="bi bi-send-check me-1"></i> Yes, Send It',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.svc.send(this.letter().id).subscribe({
        next: (res: any) => {
          const l = res.data?.letter || res.data;
          this.letter.set(l);
          if (l) this.updateSafeUrl(l.id);
          this.actionMsg.set('Letter has been sent.');
          prettyAlert.fire({ title: 'Sent!', text: 'The letter has been emailed successfully.', icon: 'success', timer: 1800, showConfirmButton: false });
        },
        error: (err) => prettyAlert.fire({ title: 'Could not send', text: err?.error?.message || 'Something went wrong.', icon: 'error' })
      });
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

import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LetterService } from '../../core/services/domain.services';

@Component({
  selector: 'app-letters-inbox',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">My Inbox</h1>
        <p class="page-subtitle">Letters addressed to you</p>
      </div>
      <a routerLink="/letters" class="btn btn-outline-secondary btn-sm">
        <i class="bi bi-arrow-left"></i> All Letters
      </a>
    </div>

    @if (loading()) {
      <div class="loading-overlay"><div class="spinner-border"></div></div>
    } @else if (letters().length === 0) {
      <div class="card">
        <div class="empty-state">
          <div class="empty-icon">📬</div>
          <div class="empty-title">Your inbox is empty</div>
          <div class="empty-desc">No letters have been sent to you yet</div>
        </div>
      </div>
    } @else {
      <div class="table-card">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr><th>Ref No</th><th>Subject</th><th>From</th><th>Priority</th><th>Date</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              @for (l of letters(); track l.id) {
                <tr>
                  <td style="font-family:monospace; color:#2563eb; font-size:12px">{{ l.letterNo }}</td>
                  <td style="font-weight:500; color:#111827">{{ l.subject }}</td>
                  <td>
                    <div class="text-medium">{{ l.fromName || l.createdBy?.firstName }}</div>
                    <div class="text-muted text-small">{{ l.fromOrg }}</div>
                  </td>
                  <td>
                    <span class="priority-badge priority-{{ l.priority }}">{{ l.priority }}</span>
                  </td>
                  <td class="text-small text-muted">{{ l.letterDate | date:'dd MMM yy' }}</td>
                  <td><span class="badge badge-{{ l.status }}">{{ l.status }}</span></td>
                  <td>
                    <a [routerLink]="['/letters', l.id]" class="btn btn-outline-primary btn-sm">
                      <i class="bi bi-eye"></i> View
                    </a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }
  `,
  styles: [`
    .priority-badge {
      display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 500;
      &.priority-urgent { background: #fee2e2; color: #991b1b; }
      &.priority-high   { background: #fff7ed; color: #9a3412; }
      &.priority-normal { background: #eff6ff; color: #1e40af; }
      &.priority-low    { background: #f3f4f6; color: #6b7280; }
    }
  `]
})
export class LettersInboxComponent implements OnInit {
  letters = signal<any[]>([]);
  loading = signal(true);

  constructor(private svc: LetterService) {}

  ngOnInit(): void {
    this.svc.getInbox().subscribe({
      next: (res: any) => { this.letters.set(res.data || []); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}

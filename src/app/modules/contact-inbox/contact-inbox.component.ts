import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-contact-inbox',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Contact Inbox</h1>
        <p class="page-subtitle">Messages and career applications submitted from the public website</p>
      </div>
    </div>

    <!-- Tabs -->
    <ul class="nav nav-tabs mb-4">
      <li class="nav-item">
        <a class="nav-link" [class.active]="activeTab==='messages'" href="javascript:void(0)" (click)="setTab('messages')">
          <i class="bi bi-envelope me-1"></i> Messages
          <span class="badge bg-primary ms-1" *ngIf="unreadMessages() > 0">{{ unreadMessages() }}</span>
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link" [class.active]="activeTab==='applications'" href="javascript:void(0)" (click)="setTab('applications')">
          <i class="bi bi-briefcase me-1"></i> Career Applications
          <span class="badge bg-primary ms-1" *ngIf="unreadApplications() > 0">{{ unreadApplications() }}</span>
        </a>
      </li>
    </ul>

    @if (loading()) {
      <div class="d-flex justify-content-center py-5">
        <div class="spinner-border text-primary"></div>
      </div>
    } @else {

      <!-- MESSAGES TABLE -->
      @if (activeTab === 'messages') {
        <div class="card">
          <div class="table-responsive">
            <table class="table mb-0">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Subject</th>
                  <th>Received</th>
                  <th class="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (m of messages(); track m.id) {
                  <tr [class.fw-bold]="m.status === 'new'">
                    <td><span class="badge" [ngClass]="statusClass(m.status)">{{ m.status }}</span></td>
                    <td>{{ m.name }}</td>
                    <td>{{ m.email }}</td>
                    <td class="text-truncate" style="max-width:220px">{{ m.subject || '—' }}</td>
                    <td style="font-size:12px">{{ m.createdAt | date:'medium' }}</td>
                    <td class="text-center">
                      <div class="d-flex justify-content-center gap-1">
                        <button class="btn btn-xs btn-outline-secondary" (click)="viewMessage(m)"><i class="bi bi-eye"></i> View</button>
                        <button class="btn btn-xs btn-outline-danger" (click)="deleteMessage(m)"><i class="bi bi-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                }
                @if (messages().length === 0) {
                  <tr><td colspan="6" class="text-center py-5 text-muted">
                    <i class="bi bi-inbox fs-1 d-block mb-2"></i> No messages yet.
                  </td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- APPLICATIONS TABLE -->
      @if (activeTab === 'applications') {
        <div class="card">
          <div class="table-responsive">
            <table class="table mb-0">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Position</th>
                  <th>Applied</th>
                  <th class="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (a of applications(); track a.id) {
                  <tr [class.fw-bold]="a.status === 'new'">
                    <td><span class="badge" [ngClass]="statusClass(a.status)">{{ a.status }}</span></td>
                    <td>{{ a.name }}</td>
                    <td>{{ a.email }}</td>
                    <td>{{ a.position || '—' }}</td>
                    <td style="font-size:12px">{{ a.createdAt | date:'medium' }}</td>
                    <td class="text-center">
                      <div class="d-flex justify-content-center gap-1">
                        <button class="btn btn-xs btn-outline-secondary" (click)="viewApplication(a)"><i class="bi bi-eye"></i> View</button>
                        <a *ngIf="a.resumeFilename" class="btn btn-xs btn-outline-primary" [href]="resumeUrl(a)" target="_blank">
                          <i class="bi bi-file-earmark-pdf"></i> CV
                        </a>
                        <button class="btn btn-xs btn-outline-danger" (click)="deleteApplication(a)"><i class="bi bi-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                }
                @if (applications().length === 0) {
                  <tr><td colspan="6" class="text-center py-5 text-muted">
                    <i class="bi bi-inbox fs-1 d-block mb-2"></i> No applications yet.
                  </td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    }

    <!-- MESSAGE DETAIL MODAL -->
    <div *ngIf="viewingMessage" class="modal fade show d-block" style="background: rgba(0,0,0,0.5); z-index:1050;">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">Message from {{ viewingMessage.name }}</h5>
            <button type="button" class="btn-close" (click)="viewingMessage = null"><span aria-hidden="true">&times;</span></button>
          </div>
          <div class="modal-body">
            <p class="mb-1"><strong>Email:</strong> {{ viewingMessage.email }}</p>
            <p class="mb-1" *ngIf="viewingMessage.phone"><strong>Phone:</strong> {{ viewingMessage.phone }}</p>
            <p class="mb-1"><strong>Subject:</strong> {{ viewingMessage.subject || '—' }}</p>
            <hr>
            <p style="white-space:pre-wrap">{{ viewingMessage.message }}</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary btn-sm" (click)="viewingMessage = null">Close</button>
            <button type="button" class="btn btn-outline-secondary btn-sm" (click)="markStatus(viewingMessage, 'archived', 'messages')">Archive</button>
          </div>
        </div>
      </div>
    </div>

    <!-- APPLICATION DETAIL MODAL -->
    <div *ngIf="viewingApplication" class="modal fade show d-block" style="background: rgba(0,0,0,0.5); z-index:1050;">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">Application from {{ viewingApplication.name }}</h5>
            <button type="button" class="btn-close" (click)="viewingApplication = null"><span aria-hidden="true">&times;</span></button>
          </div>
          <div class="modal-body">
            <p class="mb-1"><strong>Email:</strong> {{ viewingApplication.email }}</p>
            <p class="mb-1" *ngIf="viewingApplication.phone"><strong>Phone:</strong> {{ viewingApplication.phone }}</p>
            <p class="mb-1"><strong>Position:</strong> {{ viewingApplication.position || '—' }}</p>
            <p class="mb-1" *ngIf="viewingApplication.coverMessage"><strong>Message:</strong></p>
            <p style="white-space:pre-wrap" *ngIf="viewingApplication.coverMessage">{{ viewingApplication.coverMessage }}</p>
            <a *ngIf="viewingApplication.resumeFilename" class="btn btn-sm btn-primary mt-2" [href]="resumeUrl(viewingApplication)" target="_blank">
              <i class="bi bi-file-earmark-pdf me-1"></i> Download CV
            </a>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary btn-sm" (click)="viewingApplication = null">Close</button>
            <button type="button" class="btn btn-outline-primary btn-sm" (click)="markStatus(viewingApplication, 'reviewed', 'applications')">Mark Reviewed</button>
            <button type="button" class="btn btn-outline-secondary btn-sm" (click)="markStatus(viewingApplication, 'archived', 'applications')">Archive</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ContactInboxComponent implements OnInit {
  activeTab: 'messages' | 'applications' = 'messages';
  messages = signal<any[]>([]);
  applications = signal<any[]>([]);
  loading = signal(false);

  viewingMessage: any = null;
  viewingApplication: any = null;

  private apiUrl = `${environment.apiUrl}/inquiries`;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.load();
  }

  setTab(tab: 'messages' | 'applications'): void {
    this.activeTab = tab;
    this.load();
  }

  load(): void {
    this.loading.set(true);
    if (this.activeTab === 'messages') {
      this.http.get<any>(this.apiUrl).subscribe({
        next: (res) => { this.messages.set(res.data || []); this.loading.set(false); },
        error: () => { this.loading.set(false); Swal.fire('Error', 'Failed to retrieve messages.', 'error'); }
      });
    } else {
      this.http.get<any>(`${this.apiUrl}/careers`).subscribe({
        next: (res) => { this.applications.set(res.data || []); this.loading.set(false); },
        error: () => { this.loading.set(false); Swal.fire('Error', 'Failed to retrieve applications.', 'error'); }
      });
    }
  }

  unreadMessages(): number {
    return this.messages().filter(m => m.status === 'new').length;
  }

  unreadApplications(): number {
    return this.applications().filter(a => a.status === 'new').length;
  }

  statusClass(status: string): string {
    switch (status) {
      case 'new': return 'bg-primary';
      case 'read':
      case 'reviewed': return 'bg-info text-dark';
      case 'archived': return 'bg-secondary';
      default: return 'bg-light text-dark';
    }
  }

  resumeUrl(a: any): string {
    const token = localStorage.getItem('accessToken');
    return `${this.apiUrl}/careers/${a.id}/resume?token=${token}`;
  }

  viewMessage(m: any): void {
    this.viewingMessage = m;
    if (m.status === 'new') this.markStatus(m, 'read', 'messages', true);
  }

  viewApplication(a: any): void {
    this.viewingApplication = a;
    if (a.status === 'new') this.markStatus(a, 'reviewed', 'applications', true);
  }

  markStatus(item: any, status: string, kind: 'messages' | 'applications', silent = false): void {
    const base = kind === 'messages' ? this.apiUrl : `${this.apiUrl}/careers`;
    this.http.patch(`${base}/${item.id}/status`, { status }).subscribe({
      next: () => {
        item.status = status;
        if (!silent) {
          Swal.fire({ icon: 'success', title: 'Updated', timer: 1200, showConfirmButton: false });
          this.viewingMessage = null;
          this.viewingApplication = null;
        }
      },
      error: () => Swal.fire('Error', 'Failed to update status.', 'error')
    });
  }

  deleteMessage(m: any): void {
    Swal.fire({
      title: 'Delete this message?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete'
    }).then(res => {
      if (res.isConfirmed) {
        this.http.delete(`${this.apiUrl}/${m.id}`).subscribe({
          next: () => { Swal.fire({ icon: 'success', title: 'Deleted', timer: 1200, showConfirmButton: false }); this.load(); },
          error: () => Swal.fire('Error', 'Failed to delete message.', 'error')
        });
      }
    });
  }

  deleteApplication(a: any): void {
    Swal.fire({
      title: 'Delete this application?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete'
    }).then(res => {
      if (res.isConfirmed) {
        this.http.delete(`${this.apiUrl}/careers/${a.id}`).subscribe({
          next: () => { Swal.fire({ icon: 'success', title: 'Deleted', timer: 1200, showConfirmButton: false }); this.load(); },
          error: () => Swal.fire('Error', 'Failed to delete application.', 'error')
        });
      }
    });
  }
}

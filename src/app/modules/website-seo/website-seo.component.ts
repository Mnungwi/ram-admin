import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-website-seo',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Website Search Engine Optimization</h1>
        <p class="page-subtitle">Manage browser page title metadata, keywords, and descriptions dynamically from the database</p>
      </div>
    </div>

    @if (loading()) {
      <div class="d-flex justify-content-center py-5">
        <div class="spinner-border text-primary"></div>
      </div>
    } @else {
      <div class="table-card">
        <div class="table-responsive">
          <table class="table align-middle">
            <thead>
              <tr>
                <th>Page Key</th>
                <th>Meta Title</th>
                <th>Meta Description</th>
                <th>Meta Keywords</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (item of seoSettings(); track item.pageKey) {
                <tr>
                  <td><span class="badge badge-primary text-uppercase">{{ item.pageKey }}</span></td>
                  <td><strong class="text-dark">{{ item.title }}</strong></td>
                  <td class="text-muted small" style="max-width:300px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                    {{ item.description || '—' }}
                  </td>
                  <td class="text-muted small" style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                    {{ item.keywords || '—' }}
                  </td>
                  <td class="text-center">
                    <button class="btn btn-primary btn-xs" (click)="openEditForm(item)">
                      <i class="bi bi-pencil"></i> Edit SEO
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }

    <!-- Modal Form (Edit SEO) -->
    <div *ngIf="showForm()" class="modal fade show d-block" style="background: rgba(0,0,0,0.5); z-index:1050;">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">Edit SEO Config: <span class="text-primary text-uppercase">{{ activePageKey }}</span></h5>
            <button type="button" class="btn-close" (click)="closeForm()"><span aria-hidden="true">&times;</span></button>
          </div>
          <form [formGroup]="seoForm" (ngSubmit)="saveSEO()">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Meta Title (Browser Tab Title)</label>
                <input type="text" class="form-control" formControlName="title" placeholder="Meta title tags...">
              </div>
              <div class="mb-3">
                <label class="form-label">Meta Description</label>
                <textarea class="form-control" formControlName="description" rows="4" placeholder="Brief page summary context..."></textarea>
              </div>
              <div class="mb-3">
                <label class="form-label">Meta Keywords (Comma separated)</label>
                <input type="text" class="form-control" formControlName="keywords" placeholder="construction, contractor, zanzibar...">
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary btn-sm" (click)="closeForm()">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm" [disabled]="seoForm.invalid">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class WebsiteSeoComponent implements OnInit {
  seoSettings = signal<any[]>([]);
  loading = signal(false);

  showForm = signal(false);
  activePageKey: string | null = null;
  seoForm: FormGroup;

  private apiUrl = `${environment.apiUrl}/admin-website/seo`;

  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.seoForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      keywords: ['']
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.http.get<any>(this.apiUrl).subscribe({
      next: (res) => {
        this.seoSettings.set(res.data || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        Swal.fire('Error', 'Failed to retrieve SEO configurations.', 'error');
      }
    });
  }

  openEditForm(item: any): void {
    this.activePageKey = item.pageKey;
    this.seoForm.patchValue({
      title: item.title,
      description: item.description,
      keywords: item.keywords
    });
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  saveSEO(): void {
    if (this.seoForm.invalid || !this.activePageKey) return;

    this.http.put(`${this.apiUrl}/${this.activePageKey}`, this.seoForm.value).subscribe({
      next: () => {
        Swal.fire('Updated', `SEO settings for page "${this.activePageKey}" updated successfully.`, 'success');
        this.closeForm();
        this.load();
      },
      error: () => Swal.fire('Error', 'Failed to update SEO configurations.', 'error')
    });
  }
}

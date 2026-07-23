import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-website-gallery',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Website Media Gallery</h1>
        <p class="page-subtitle">Configure display order and visibility options for images uploaded inside Project Galleries</p>
      </div>
    </div>

    <!-- Info Alert -->
    <div class="alert alert-info py-2 px-3 mb-4 text-small" style="font-size:13px;">
      <i class="bi bi-info-circle-fill me-1"></i>
      To add new photos or drone videos, go to <strong>Projects</strong>, select a project, open its <strong>Gallery</strong> tab, and upload them. They will automatically show up here for you to set visibility parameters.
    </div>

    <!-- Filters -->
    <div class="filters-bar mb-3">
      <select class="form-control" style="max-width:160px;" [(ngModel)]="filterType">
        <option value="all">All Types</option>
        <option value="photo">Photos Only</option>
        <option value="drone">Drone Footage</option>
      </select>
    </div>

    @if (loading()) {
      <div class="d-flex justify-content-center py-5">
        <div class="spinner-border text-primary"></div>
      </div>
    } @else {
      <!-- Gallery list grid -->
      <div class="row">
        @for (item of getFilteredItems(); track item.id) {
          <div class="col-md-3 mb-4">
            <div class="card h-100 border rounded overflow-hidden">
              <div class="position-relative" style="height: 160px; background: #e9ecef;">
                <img [src]="item.imageUrl" class="w-100 h-100" style="object-fit: cover;">
                <span class="badge position-absolute top-0 end-0 m-2" [class.bg-success]="item.visibility === 'public'" [class.bg-secondary]="item.visibility === 'private'">
                  {{ item.visibility }}
                </span>
              </div>
              <div class="card-body p-3">
                <small class="text-primary d-block text-truncate fw-600 mb-1" style="font-size: 11px;">Project: {{ item.projectName || 'General' }}</small>
                <h6 class="fw-bold mb-1 text-truncate text-dark">{{ item.caption || '—' }}</h6>
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <small class="text-uppercase text-muted" style="font-size:10px">{{ item.type }}</small>
                  <small class="text-muted" style="font-size:11px">Order: {{ item.displayOrder }}</small>
                </div>
                <div class="d-flex gap-1 justify-content-end">
                  <button class="btn btn-xs btn-outline-secondary" (click)="openEditForm(item)"><i class="bi bi-pencil"></i> Edit Status</button>
                  <button class="btn btn-xs btn-outline-danger" (click)="deleteItem(item)"><i class="bi bi-trash"></i> Delete</button>
                </div>
              </div>
            </div>
          </div>
        }
        @if (getFilteredItems().length === 0) {
          <div class="col-12 text-center py-5 text-muted">
            <i class="bi bi-images fs-1 mb-2"></i>
            <h5>No project gallery items found</h5>
          </div>
        }
      </div>
    }

    <!-- Modal Form (Edit) -->
    <div *ngIf="showForm()" class="modal fade show d-block" style="background: rgba(0,0,0,0.5); z-index:1050;">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">Edit Display Status</h5>
            <button type="button" class="btn-close" (click)="closeForm()"></button>
          </div>
          <form [formGroup]="galleryForm" (ngSubmit)="saveItem()">
            <div class="modal-body">
              <div class="mb-3 text-center" style="height: 120px; background: #eee;">
                <img [src]="activeImageUrl" class="h-100 rounded" style="object-fit: contain;">
              </div>
              <div class="mb-3">
                <label class="form-label">Image Caption</label>
                <input type="text" class="form-control" formControlName="caption" placeholder="Short description...">
              </div>
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Category Type</label>
                  <select class="form-control" formControlName="type">
                    <option value="photo">Photo</option>
                    <option value="drone">Drone Footage</option>
                  </select>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Visibility</label>
                  <select class="form-control" formControlName="visibility">
                    <option value="public">Public (Show on Website)</option>
                    <option value="private">Private (Admin Portal Only)</option>
                  </select>
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">Display Order</label>
                <input type="number" class="form-control" formControlName="displayOrder">
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary btn-sm" (click)="closeForm()">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm" [disabled]="galleryForm.invalid">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class WebsiteGalleryComponent implements OnInit {
  items = signal<any[]>([]);
  loading = signal(false);
  filterType = 'all';

  showForm = signal(false);
  editingId: string | null = null;
  activeImageUrl = '';
  galleryForm: FormGroup;

  private apiUrl = `${environment.apiUrl}/admin-website/gallery`;

  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.galleryForm = this.fb.group({
      caption: [''],
      type: ['photo', Validators.required],
      visibility: ['public', Validators.required],
      displayOrder: [0, Validators.required]
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.http.get<any>(this.apiUrl).subscribe({
      next: (res) => {
        this.items.set(res.data || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        Swal.fire('Error', 'Failed to retrieve website gallery.', 'error');
      }
    });
  }

  getFilteredItems() {
    if (this.filterType === 'all') return this.items();
    return this.items().filter(item => item.type === this.filterType);
  }

  openEditForm(item: any): void {
    this.editingId = item.id;
    this.activeImageUrl = item.imageUrl;
    this.galleryForm.patchValue({
      caption: item.caption,
      type: item.type,
      visibility: item.visibility,
      displayOrder: item.displayOrder
    });
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  saveItem(): void {
    if (this.galleryForm.invalid || !this.editingId) return;

    const val = this.galleryForm.value;
    this.http.put(`${this.apiUrl}/${this.editingId}`, val).subscribe({
      next: () => {
        Swal.fire('Updated', 'Gallery item updated successfully.', 'success');
        this.closeForm();
        this.load();
      },
      error: () => Swal.fire('Error', 'Failed to update gallery item.', 'error')
    });
  }

  deleteItem(item: any): void {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to unlink this media item from the project gallery?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel'
    }).then(res => {
      if (res.isConfirmed) {
        this.http.delete(`${this.apiUrl}/${item.id}`).subscribe({
          next: () => {
            Swal.fire('Deleted', 'Media item removed successfully.', 'success');
            this.load();
          },
          error: () => Swal.fire('Error', 'Failed to delete media item.', 'error')
        });
      }
    });
  }
}

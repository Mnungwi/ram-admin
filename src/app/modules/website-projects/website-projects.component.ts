import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectService, MediaService } from '../../core/services/domain.services';
import Swal from 'sweetalert2';
import { MediaLibraryModalComponent } from '../../shared/components/media-library-modal/media-library-modal.component';

@Component({
  selector: 'app-website-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, MediaLibraryModalComponent],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Website Projects</h1>
        <p class="page-subtitle">Manage visibility, cover images, and home page features for the public website</p>
      </div>
    </div>

    @if (loading()) {
      <div class="d-flex justify-content-center py-5">
        <div class="spinner-border text-primary"></div>
      </div>
    } @else {
      <!-- SEARCH & FILTERS TOOLBAR -->
      <div class="card p-3 border rounded shadow-sm mb-4 bg-light">
        <div class="row g-3 align-items-center">
          <div class="col-md-4">
            <div class="input-group">
              <span class="input-group-text"><i class="bi bi-search"></i></span>
              <input type="text" class="form-control" placeholder="Search project name, code, location..." [(ngModel)]="searchTerm" (input)="currentPage = 1">
            </div>
          </div>
          <div class="col-md-3">
            <select class="form-select" [(ngModel)]="visibilityFilter" (change)="currentPage = 1">
              <option value="">All Visibilities</option>
              <option value="public">Public Only</option>
              <option value="private">Private Only</option>
            </select>
          </div>
          <div class="col-md-3">
            <select class="form-select" [(ngModel)]="homeFilter" (change)="currentPage = 1">
              <option value="">All Homepage Statuses</option>
              <option value="true">Show on Home Page</option>
              <option value="false">Hide from Home Page</option>
            </select>
          </div>
          <div class="col-md-2">
            <button class="btn btn-outline-secondary w-100" (click)="resetFilters()">
              <i class="bi bi-x-circle me-1"></i> Clear
            </button>
          </div>
        </div>
      </div>

      <div class="table-card bg-white border rounded">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Project Code</th>
                <th>Project Name</th>
                <th>Location</th>
                <th>Cover Image Path</th>
                <th>Display Order</th>
                <th>Visibility</th>
                <th>Show on Home</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (p of pagedProjects; track p.id) {
                <tr>
                  <td><span class="badge bg-secondary text-white">{{ p.projectCode }}</span></td>
                  <td><strong class="text-dark">{{ p.name }}</strong></td>
                  <td>{{ p.location || '—' }}</td>
                  <td>
                    <div class="d-flex align-items-center gap-2">
                      <img *ngIf="p.image" [src]="p.image" alt="" style="width:32px;height:32px;object-fit:cover;border-radius:4px">
                      <button type="button" class="btn btn-outline-secondary btn-xs" (click)="openMediaPicker(p)">
                        <i class="bi bi-images"></i> {{ p.image ? 'Change' : 'Pick' }}
                      </button>
                    </div>
                  </td>
                  <td>
                    <input type="number" class="form-control form-control-sm" style="max-width:70px" [(ngModel)]="p.displayOrder">
                  </td>
                  <td>
                    <select class="form-control form-control-sm" style="max-width:100px" [(ngModel)]="p.visibility">
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </td>
                  <td>
                    <div class="form-check form-switch d-inline-block">
                      <input class="form-check-input" type="checkbox" [(ngModel)]="p.showOnHomePage">
                    </div>
                  </td>
                  <td>
                    <button class="btn btn-primary btn-xs" (click)="saveProject(p)">
                      <i class="bi bi-save"></i> Save
                    </button>
                  </td>
                </tr>
              }
              @if (filteredProjects.length === 0) {
                <tr>
                  <td colspan="8" class="text-center py-4 text-muted">
                    <i class="bi bi-folder-x fs-3"></i>
                    <p class="mt-2 mb-0">No website projects match the selected filters.</p>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- PAGINATION CONTROLS -->
        @if (filteredProjects.length > 0) {
          <div class="d-flex flex-column flex-md-row justify-content-between align-items-center p-3 border-top gap-3">
            <div class="text-secondary small">
              Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ min(currentPage * pageSize, filteredProjects.length) }} of {{ filteredProjects.length }} entries
            </div>
            <nav>
              <ul class="pagination pagination-sm mb-0">
                <li class="page-item" [class.disabled]="currentPage === 1">
                  <button class="page-link" (click)="goToPage(currentPage - 1)"><i class="bi bi-chevron-left"></i> Previous</button>
                </li>
                <li *ngFor="let page of getPagesArray()" class="page-item" [class.active]="currentPage === page">
                  <button class="page-link" (click)="goToPage(page)">{{ page }}</button>
                </li>
                <li class="page-item" [class.disabled]="currentPage === totalPages">
                  <button class="page-link" (click)="goToPage(currentPage + 1)">Next <i class="bi bi-chevron-right"></i></button>
                </li>
              </ul>
            </nav>
          </div>
        }
      </div>
    }

    <app-media-library-modal *ngIf="showMediaModal"
                              [multiSelect]="false"
                              (close)="showMediaModal = false"
                              (select)="onMediaSelected($event)">
    </app-media-library-modal>
  `
})
export class WebsiteProjectsComponent implements OnInit {
  projects = signal<any[]>([]);
  loading = signal(false);

  // Filters & Pagination State
  searchTerm = '';
  visibilityFilter = '';
  homeFilter = '';
  currentPage = 1;
  pageSize = 10;

  // Cover image picker
  showMediaModal = false;
  activeRowForPicker: any = null;

  constructor(private projectSvc: ProjectService, public mediaSvc: MediaService) {}

  openMediaPicker(p: any): void {
    this.activeRowForPicker = p;
    this.showMediaModal = true;
  }

  onMediaSelected(items: any[]): void {
    if (items && items.length && this.activeRowForPicker) {
      this.activeRowForPicker.image = this.mediaSvc.getMediaUrl(items[0].filename);
      this.saveProject(this.activeRowForPicker);
    }
    this.activeRowForPicker = null;
    this.showMediaModal = false;
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.projectSvc.getAll().subscribe({
      next: (res: any) => {
        const data = res.data?.rows || res.data || res || [];
        const mapped = data.map((p: any) => ({
          ...p,
          showOnHomePage: !!p.showOnHomePage
        }));
        this.projects.set(mapped);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        Swal.fire('Error', 'Failed to retrieve website projects.', 'error');
      }
    });
  }

  get filteredProjects() {
    let list = this.projects();
    const query = this.searchTerm.trim().toLowerCase();
    if (query) {
      list = list.filter(p =>
        (p.name?.toLowerCase().includes(query)) ||
        (p.projectCode?.toLowerCase().includes(query)) ||
        (p.location?.toLowerCase().includes(query))
      );
    }
    if (this.visibilityFilter) {
      list = list.filter(p => p.visibility === this.visibilityFilter);
    }
    if (this.homeFilter) {
      const wantHome = this.homeFilter === 'true';
      list = list.filter(p => !!p.showOnHomePage === wantHome);
    }
    return list;
  }

  get pagedProjects() {
    const list = this.filteredProjects;
    const start = (this.currentPage - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    const count = this.filteredProjects.length;
    return Math.ceil(count / this.pageSize) || 1;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPagesArray(): number[] {
    const total = this.totalPages;
    const arr = [];
    for (let i = 1; i <= total; i++) {
      arr.push(i);
    }
    return arr;
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }

  resetFilters() {
    this.searchTerm = '';
    this.visibilityFilter = '';
    this.homeFilter = '';
    this.currentPage = 1;
  }

  saveProject(p: any): void {
    const payload = {
      image: p.image,
      displayOrder: p.displayOrder,
      visibility: p.visibility,
      showOnHomePage: p.showOnHomePage ? 1 : 0
    };

    this.projectSvc.update(p.id, payload).subscribe({
      next: () => {
        Swal.fire('Saved', `Project "${p.name}" updated successfully.`, 'success');
        this.load();
      },
      error: () => {
        Swal.fire('Error', 'Failed to save project settings.', 'error');
      }
    });
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { StorekeeperService } from '../../core/services/domain.services';
import { AuthService } from '../../core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-storekeepers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './storekeepers.component.html',
  styleUrls: ['./storekeepers.component.css'],
})
export class StorekeepersComponent implements OnInit {
  all: any[] = [];
  filtered: any[] = [];
  loading = false;

  searchTerm = '';
  statusFilter = ''; // '', 'true', 'false'

  currentPage = 1;
  pageSize = 15;
  totalPages = 1;

  get paginated(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }
  get totalCount() {
    return this.all.length;
  }
  get activeCount() {
    return this.all.filter((a) => a.isActive).length;
  }
  get inactiveCount() {
    return this.all.filter((a) => !a.isActive).length;
  }
  get uniqueProjectCount() {
    return new Set(this.all.map((a) => a.projectId)).size;
  }

  constructor(
    private storekeeperSvc: StorekeeperService,
    public auth: AuthService,
  ) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.storekeeperSvc.getAll().subscribe({
      next: (res: any) => {
        this.all = res.data?.storekeepers || [];
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  applyFilters() {
    let list = [...this.all];
    if (this.statusFilter !== '') {
      const wantActive = this.statusFilter === 'true';
      list = list.filter((a) => a.isActive === wantActive);
    }
    if (this.searchTerm) {
      const s = this.searchTerm.toLowerCase();
      list = list.filter(
        (a) =>
          a.user?.firstName?.toLowerCase().includes(s) ||
          a.user?.lastName?.toLowerCase().includes(s) ||
          a.user?.email?.toLowerCase().includes(s) ||
          a.project?.name?.toLowerCase().includes(s) ||
          a.project?.projectCode?.toLowerCase().includes(s),
      );
    }
    this.filtered = list;
    this.totalPages = Math.ceil(this.filtered.length / this.pageSize) || 1;
    this.currentPage = 1;
  }

  toggleStatus(assignment: any) {
    const nextActive = !assignment.isActive;
    Swal.fire({
      title: nextActive ? 'Activate Storekeeper?' : 'Deactivate Storekeeper?',
      text: `${assignment.user?.firstName} ${assignment.user?.lastName} on ${assignment.project?.projectCode || assignment.project?.name}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: nextActive ? '#16a34a' : '#ef4444',
      confirmButtonText: nextActive ? 'Yes, Activate!' : 'Yes, Deactivate!',
    }).then((r) => {
      if (r.isConfirmed) {
        this.storekeeperSvc.setStatus(assignment.id, nextActive).subscribe({
          next: () => {
            assignment.isActive = nextActive;
            this.applyFilters();
            Swal.fire({
              icon: 'success',
              title: nextActive ? 'Activated!' : 'Deactivated!',
              timer: 1200,
              showConfirmButton: false,
            });
          },
          error: (err: any) =>
            Swal.fire('Error', err?.error?.message || 'Failed.', 'error'),
        });
      }
    });
  }

  changePage(p: number) {
    if (p >= 1 && p <= this.totalPages) this.currentPage = p;
  }
  getPages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
  get Math() {
    return Math;
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TechnicianService } from '../../../../core/services/domain.services';
import {
  SearchableSelectComponent,
  SelectOption,
} from '../../../../shared/components/searchable-select/searchable-select.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-project-technicians',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SearchableSelectComponent,
  ],
  templateUrl: './project-technicians.component.html',
  styleUrls: ['./project-technicians.component.css'],
})
export class ProjectTechniciansComponent implements OnInit {
  projectId = '';

  // Enrolled technicians
  enrolled: any[] = [];
  filteredEnrolled: any[] = [];
  loading = false;
  searchTerm = '';
  categoryFilter = '';

  // All technicians (for enrollment)
  allTechnicians: any[] = [];
  technicianOptions: SelectOption[] = [];
  categories: any[] = [];

  // Enroll modal
  showEnrollModal = false;
  enrollForm!: FormGroup;
  enrolling = false;

  // Edit modal
  showEditModal = false;
  selectedAssignment: any = null;
  editForm!: FormGroup;
  saving = false;

  // View Receipts modal
  showReceiptsModal = false;
  selectedTechForReceipts: any = null;
  technicianReceipts: any[] = [];
  loadingReceipts = false;

  currentPage = 1;
  pageSize = 15;
  totalPages = 1;

  get paginatedEnrolled(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredEnrolled.slice(start, start + this.pageSize);
  }
  get totalEnrolled() {
    return this.enrolled.length;
  }
  get activeEnrolled() {
    return this.enrolled.filter((e) => e.isActive).length;
  }

  constructor(
    private fb: FormBuilder,
    private techSvc: TechnicianService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.route.parent?.params.subscribe((params) => {
      this.projectId = params['id'];
      if (this.projectId) {
        this.loadCategories();
        this.loadEnrolled();
      }
    });
  }

  loadEnrolled() {
    this.loading = true;
    this.techSvc.getProjectTechnicians(this.projectId).subscribe({
      next: (res: any) => {
        this.enrolled = res.data?.technicians || [];
        this.applyFilters();
        this.loading = false;
        this.loadAllTechnicians(); // after enrolled loads
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  loadAllTechnicians() {
    this.techSvc.getAll().subscribe({
      next: (res: any) => {
        this.allTechnicians = res.data?.technicians || [];
        this.buildTechOptions();
      },
      error: (err: any) => console.error('loadAllTechnicians error:', err),
    });
  }

  buildTechOptions() {
    const enrolledIds = new Set(this.enrolled.map((e) => e.technicianId));
    this.technicianOptions = this.allTechnicians
      .filter((t) => t.isActive && !enrolledIds.has(t.id))
      .map((t) => ({
        value: t.id,
        label: t.name,
        sublabel:
          `${t.category?.name || ''} ${t.phone ? '• ' + t.phone : ''}`.trim(),
      }));
  }

  loadCategories() {
    this.techSvc.getCategories().subscribe({
      next: (res: any) => {
        this.categories = res.data?.categories || [];
      },
    });
  }

  applyFilters() {
    let list = [...this.enrolled];
    if (this.categoryFilter) {
      list = list.filter(
        (e) => e.technician?.categoryId === this.categoryFilter,
      );
    }
    if (this.searchTerm) {
      const s = this.searchTerm.toLowerCase();
      list = list.filter(
        (e) =>
          e.technician?.name?.toLowerCase().includes(s) ||
          e.technician?.phone?.toLowerCase().includes(s) ||
          e.role?.toLowerCase().includes(s),
      );
    }
    this.filteredEnrolled = list;
    this.totalPages =
      Math.ceil(this.filteredEnrolled.length / this.pageSize) || 1;
    this.currentPage = 1;
  }

  // ── Enroll ────────────────────────────────────────────────
  openEnrollModal() {
    this.buildTechOptions();
    this.enrollForm = this.fb.group({
      technicianId: ['', Validators.required],
      role: [''],
      notes: [''],
    });
    this.showEnrollModal = true;
  }

  closeEnrollModal() {
    this.showEnrollModal = false;
  }

  onEnroll() {
    if (this.enrollForm.invalid) {
      this.enrollForm.markAllAsTouched();
      return;
    }
    this.enrolling = true;
    this.techSvc
      .assignToProject(this.projectId, this.enrollForm.value)
      .subscribe({
        next: () => {
          this.enrolling = false;
          this.closeEnrollModal();
          this.loadEnrolled();
          Swal.fire({
            icon: 'success',
            title: 'Enrolled!',
            timer: 1500,
            showConfirmButton: false,
          });
        },
        error: (err: any) => {
          this.enrolling = false;
          Swal.fire('Error', err?.error?.message || 'Failed.', 'error');
        },
      });
  }

  // ── Bulk Enroll ───────────────────────────────────────────
  bulkEnroll() {
    Swal.fire({
      title: 'Bulk Enroll by Category',
      html: `
        <select id="swal-cat" class="swal2-select">
          <option value="">— Select Category —</option>
          ${this.categories.map((c) => `<option value="${c.id}">${c.name}</option>`).join('')}
        </select>
      `,
      showCancelButton: true,
      confirmButtonText: 'Enroll All',
      preConfirm: () => {
        const catId = (document.getElementById('swal-cat') as HTMLSelectElement)
          .value;
        if (!catId) {
          Swal.showValidationMessage('Please select a category');
        }
        return catId;
      },
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        const techsInCat = this.allTechnicians
          .filter((t) => t.categoryId === result.value)
          .filter((t) => !this.enrolled.find((e) => e.technicianId === t.id));

        if (!techsInCat.length) {
          Swal.fire(
            'Info',
            'All technicians in this category are already enrolled.',
            'info',
          );
          return;
        }

        let count = 0;
        for (const tech of techsInCat) {
          try {
            await this.techSvc
              .assignToProject(this.projectId, { technicianId: tech.id })
              .toPromise();
            count++;
          } catch {}
        }
        this.loadEnrolled();
        Swal.fire({
          icon: 'success',
          title: `${count} Technicians Enrolled!`,
          timer: 2000,
          showConfirmButton: false,
        });
      }
    });
  }

  // ── Edit ──────────────────────────────────────────────────
  openEditModal(assignment: any) {
    this.selectedAssignment = assignment;
    this.editForm = this.fb.group({
      role: [assignment.role || ''],
      notes: [assignment.notes || ''],
    });
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedAssignment = null;
  }

  onEdit() {
    this.saving = true;
    this.techSvc
      .updateAssignment(
        this.projectId,
        this.selectedAssignment.id,
        this.editForm.value,
      )
      .subscribe({
        next: () => {
          this.saving = false;
          this.closeEditModal();
          this.loadEnrolled();
          Swal.fire({
            icon: 'success',
            title: 'Updated!',
            timer: 1500,
            showConfirmButton: false,
          });
        },
        error: (err: any) => {
          this.saving = false;
          Swal.fire('Error', err?.error?.message || 'Failed.', 'error');
        },
      });
  }

  // ── Remove ────────────────────────────────────────────────
  removeFromProject(assignment: any) {
    Swal.fire({
      title: 'Remove Technician?',
      text: `Remove ${assignment.technician?.name} from this project?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, Remove!',
    }).then((r) => {
      if (r.isConfirmed) {
        this.techSvc
          .removeFromProject(this.projectId, assignment.id)
          .subscribe({
            next: () => {
              this.loadEnrolled();
              Swal.fire({
                icon: 'success',
                title: 'Removed!',
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

  // ── View Receipts ─────────────────────────────────────────
  openReceiptsModal(assignment: any) {
    this.selectedTechForReceipts = assignment.technician;
    this.showReceiptsModal = true;
    this.loadingReceipts = true;
    const techId = assignment.technicianId || assignment.technician?.id;
    this.techSvc.getReceipts(techId, { projectId: this.projectId }).subscribe({
      next: (res: any) => {
        this.technicianReceipts = Array.isArray(res.data) ? res.data : res.data?.rows || [];
        this.loadingReceipts = false;
      },
      error: () => {
        this.loadingReceipts = false;
      },
    });
  }

  closeReceiptsModal() {
    this.showReceiptsModal = false;
    this.selectedTechForReceipts = null;
    this.technicianReceipts = [];
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

  getCategoryName(catId: string): string {
    return this.categories.find((c) => c.id === catId)?.name || '—';
  }
}

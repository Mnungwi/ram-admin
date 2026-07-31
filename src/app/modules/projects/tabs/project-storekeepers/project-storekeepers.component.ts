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
import {
  StorekeeperService,
  UserService,
} from '../../../../core/services/domain.services';
import {
  SearchableSelectComponent,
  SelectOption,
} from '../../../../shared/components/searchable-select/searchable-select.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-project-storekeepers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SearchableSelectComponent,
  ],
  templateUrl: './project-storekeepers.component.html',
  styleUrls: ['./project-storekeepers.component.css'],
})
export class ProjectStorekeepersComponent implements OnInit {
  projectId = '';

  // Enrolled storekeepers
  enrolled: any[] = [];
  filteredEnrolled: any[] = [];
  loading = false;
  searchTerm = '';

  // All users (for enrollment)
  allUsers: any[] = [];
  userOptions: SelectOption[] = [];

  // Enroll modal
  showEnrollModal = false;
  enrollForm!: FormGroup;
  enrolling = false;

  // Edit modal
  showEditModal = false;
  selectedAssignment: any = null;
  editForm!: FormGroup;
  saving = false;

  get totalEnrolled() {
    return this.enrolled.length;
  }
  get activeEnrolled() {
    return this.enrolled.filter((e) => e.isActive).length;
  }

  constructor(
    private fb: FormBuilder,
    private storekeeperSvc: StorekeeperService,
    private userSvc: UserService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.route.parent?.params.subscribe((params) => {
      this.projectId = params['id'];
      if (this.projectId) {
        this.loadEnrolled();
      }
    });
  }

  loadEnrolled() {
    this.loading = true;
    this.storekeeperSvc.getProjectStorekeepers(this.projectId).subscribe({
      next: (res: any) => {
        this.enrolled = res.data?.storekeepers || [];
        this.applyFilters();
        this.loading = false;
        this.loadAllUsers(); // after enrolled loads
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  loadAllUsers() {
    this.userSvc.getAll({ isActive: 'true' }).subscribe({
      next: (res: any) => {
        this.allUsers = res.data || [];
        this.buildUserOptions();
      },
      error: (err: any) => console.error('loadAllUsers error:', err),
    });
  }

  buildUserOptions() {
    const enrolledIds = new Set(this.enrolled.map((e) => e.userId));
    this.userOptions = this.allUsers
      .filter((u) => u.isActive && !enrolledIds.has(u.id))
      .map((u) => ({
        value: u.id,
        label: `${u.firstName} ${u.lastName}`,
        sublabel: `${u.jobTitle || ''} ${u.email ? '• ' + u.email : ''}`.trim(),
      }));
  }

  applyFilters() {
    let list = [...this.enrolled];
    if (this.searchTerm) {
      const s = this.searchTerm.toLowerCase();
      list = list.filter(
        (e) =>
          e.user?.firstName?.toLowerCase().includes(s) ||
          e.user?.lastName?.toLowerCase().includes(s) ||
          e.user?.email?.toLowerCase().includes(s),
      );
    }
    this.filteredEnrolled = list;
  }

  // ── Enroll ────────────────────────────────────────────────
  openEnrollModal() {
    this.buildUserOptions();
    this.enrollForm = this.fb.group({
      userId: ['', Validators.required],
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
    this.storekeeperSvc
      .assignToProject(this.projectId, this.enrollForm.value)
      .subscribe({
        next: () => {
          this.enrolling = false;
          this.closeEnrollModal();
          this.loadEnrolled();
          Swal.fire({
            icon: 'success',
            title: 'Storekeeper Assigned!',
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

  // ── Edit ──────────────────────────────────────────────────
  openEditModal(assignment: any) {
    this.selectedAssignment = assignment;
    this.editForm = this.fb.group({
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
    this.storekeeperSvc
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
      title: 'Remove Storekeeper?',
      text: `Remove ${assignment.user?.firstName} ${assignment.user?.lastName} as storekeeper from this project?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, Remove!',
    }).then((r) => {
      if (r.isConfirmed) {
        this.storekeeperSvc
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
}

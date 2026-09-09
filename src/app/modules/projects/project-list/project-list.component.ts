import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  UserService,
  ProjectService,
  MediaService,
} from '../../../core/services/domain.services';
import { ClientService } from '../../../core/services/client.service';
import { Project } from '../../../core/models/index';
import Swal from 'sweetalert2';
import {
  SearchableSelectComponent,
  SelectOption,
} from '../../../shared/components/searchable-select/searchable-select.component';
import { CurrencyShortPipe } from 'src/app/theme/pipes/currency-short.pipe';
import { MediaLibraryModalComponent } from '../../../shared/components/media-library-modal/media-library-modal.component';
import { CKEditorModule } from 'ng2-ckeditor';
import { CKEDITOR_CONFIG } from '../../../shared/utils/ckeditor-config';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    CurrencyShortPipe,
    SearchableSelectComponent,
    MediaLibraryModalComponent,
    CKEditorModule,
  ],
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.css'],
})
export class ProjectListComponent implements OnInit {
  ckeditorConfig = CKEDITOR_CONFIG;
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  searchTerm = '';
  statusFilter = '';

  // Server-side pagination (backend already supports page/limit/search/status
  // via GET /api/projects — see backend/src/controllers/projectController.js)
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 1;
  loading = false;
  private searchDebounce: any = null;

  showModal = false;
  editMode = false;
  selectedProject: Project | null = null;
  form!: FormGroup;
  clientOptions: SelectOption[] = [];
  userOptions: SelectOption[] = [];

  // Cover image picker
  showMediaModal = false;

  constructor(
    private fb: FormBuilder,

    private clientSvc: ClientService,
    private userSvc: UserService,
    private projectSvs: ProjectService,
    public mediaSvc: MediaService,
  ) {}

  ngOnInit() {
    // Load clients
    this.clientSvc.getClients({ limit: 100 }).subscribe((res) => {
      this.clientOptions = (res.data || []).map((c: any) => ({
        value: c.id,
        label: c.name,
        sublabel: c.company || c.contactPerson || '',
        color: '#1a56db',
      }));
    });

    // Load users (project managers)
    this.userSvc
      .getAll({ limit: 100, isActive: true })
      .subscribe((res: any) => {
        const users = res.data || [];
        this.userOptions = users.map((u: any) => ({
          value: u.id,
          label: `${u.firstName} ${u.lastName}`,
          sublabel: u.jobTitle || u.department || '',
          color: this.getAvatarColor(u.firstName, u.lastName),
        }));
      });

    this.initForm();
    this.loadProjects();
  }
  loadProjects() {
    this.loading = true;
    const params: any = {
      page: this.currentPage,
      limit: this.pageSize,
    };
    if (this.searchTerm) params.search = this.searchTerm;
    if (this.statusFilter) params.status = this.statusFilter;

    this.projectSvs.getAll(params).subscribe({
      next: (res: any) => {
        this.projects = res.data || [];
        this.filteredProjects = this.projects;
        this.totalItems = res.pagination?.total ?? this.projects.length;
        this.totalPages = res.pagination?.totalPages || 1;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onSearchChange(): void {
    // Debounce so we don't fire a request on every keystroke
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.currentPage = 1;
      this.loadProjects();
    }, 350);
  }

  onStatusFilterChange(): void {
    this.currentPage = 1;
    this.loadProjects();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.currentPage = page;
    this.loadProjects();
  }

  getPagesArray(): number[] {
    const arr = [];
    for (let i = 1; i <= this.totalPages; i++) arr.push(i);
    return arr;
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }
  initForm(project?: Project) {
    this.form = this.fb.group({
      name: [
        project?.name || '',
        [Validators.required, Validators.minLength(3)],
      ],
      projectCode: [project?.projectCode || '', Validators.required],
      clientId: [project?.clientId || '', Validators.required],
      status: [project?.status || 'active', Validators.required],
      startDate: [project?.startDate || '', Validators.required],
      endDate: [project?.endDate || '', Validators.required],
      totalBudget: [
        project?.totalBudget || '',
        [Validators.required, Validators.min(0)],
      ],
      currency: [project?.currency || 'TZS', Validators.required],
      description: [project?.description || ''],
      location: [project?.location || ''],
      projectManagerId: [project?.projectManager || ''],
      image: [project?.image || ''],
      name_sw: [project?.name_sw || ''],
      description_sw: [project?.description_sw || ''],
    });
  }

  openMediaPicker(): void {
    this.showMediaModal = true;
  }

  onMediaSelected(items: any[]): void {
    if (items && items.length) {
      this.form.patchValue({ image: this.mediaSvc.getMediaUrl(items[0].filename) });
    }
    this.showMediaModal = false;
  }

  clearImage(): void {
    this.form.patchValue({ image: '' });
  }

  openAddModal() {
    this.editMode = false;
    this.selectedProject = null;
    this.initForm();
    this.showModal = true;
  }

  openEditModal(p: Project) {
    this.editMode = true;
    this.selectedProject = p;
    this.initForm(p);
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const val = this.form.value;

    if (this.editMode && this.selectedProject) {
      this.projectSvs.update(this.selectedProject.id, val).subscribe({
        next: () => {
          this.closeModal();
          this.loadProjects(); // reload list kutoka DB
          Swal.fire({
            icon: 'success',
            title: 'Updated!',
            text: 'Project updated successfully.',
            timer: 1800,
            showConfirmButton: false,
          });
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err?.error?.message || 'Failed to update project.',
          });
        },
      });
    } else {
      this.projectSvs.create(val).subscribe({
        next: () => {
          this.closeModal();
          this.loadProjects(); // reload list kutoka DB
          Swal.fire({
            icon: 'success',
            title: 'Created!',
            text: 'Project created successfully.',
            timer: 1800,
            showConfirmButton: false,
          });
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err?.error?.message || 'Failed to create project.',
          });
        },
      });
    }
  }

  deleteProject(p: Project) {
    Swal.fire({
      title: 'Delete Project?',
      text: `Are you sure you want to delete "${p.name}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.projectSvs.deleteProject(p.id).subscribe({
          next: () => {
            if (this.projects.length === 1 && this.currentPage > 1) {
              this.currentPage--;
            }
            this.loadProjects();
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: 'Project has been deleted.',
              timer: 1500,
              showConfirmButton: false,
            });
          },
          error: (err) => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: err?.error?.message || 'Failed to delete project.',
            });
          },
        });
      }
    });
  }

  // getStatusClass(s: string): string {
  //   const m: any = {
  //     Active: 'status-active',
  //     'On Hold': 'status-on-hold',
  //     Completed: 'status-completed',
  //     Cancelled: 'status-overdue',
  //   };
  //   return m[s] || 'status-pending';
  // }

  // formatCurrency(amount: number): string {
  //   return CurrencyShortPipe(amount);
  // }
  get f() {
    return this.form.controls;
  }
  getAvatarColor(first: string, last: string): string {
    const colors = [
      '#3b82f6',
      '#22c55e',
      '#f59e0b',
      '#a855f7',
      '#ef4444',
      '#0ea5e9',
    ];
    return colors[(first.charCodeAt(0) + last.charCodeAt(0)) % colors.length];
  }
  getClientName(project: any): string {
    return project?.clientInfo?.name || project?.client?.name || '—';
  }

  getProjectManager(project: any): string {
    if (!project?.projectManager) return '—';

    return `${project.projectManager.firstName || ''} ${project.projectManager.lastName || ''}`.trim();
  }

  getStatusClass(status: string): string {
    switch ((status || '').toLowerCase()) {
      case 'active':
        return 'status-active';

      case 'on_hold':
      case 'on hold':
        return 'status-on-hold';

      case 'completed':
        return 'status-completed';

      case 'cancelled':
        return 'status-overdue';

      default:
        return 'status-pending';
    }
  }
}

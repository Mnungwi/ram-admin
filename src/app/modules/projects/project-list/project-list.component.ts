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
} from '../../../core/services/domain.services';
import { ClientService } from '../../../core/services/client.service';
import { Project } from '../../../core/models/index';
import Swal from 'sweetalert2';
import {
  SearchableSelectComponent,
  SelectOption,
} from '../../../shared/components/searchable-select/searchable-select.component';
import { CurrencyShortPipe } from 'src/app/theme/pipes/currency-short.pipe';

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
  ],
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.css'],
})
export class ProjectListComponent implements OnInit {
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  searchTerm = '';
  statusFilter = '';
  showModal = false;
  editMode = false;
  selectedProject: Project | null = null;
  form!: FormGroup;
  clientOptions: SelectOption[] = [];
  userOptions: SelectOption[] = [];

  constructor(
    private fb: FormBuilder,

    private clientSvc: ClientService,
    private userSvc: UserService,
    private projectSvs: ProjectService,
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
    this.projectSvs.getAll().subscribe((res: any) => {
      this.projects = res.data;
      console.log('Projects', this.projects);
      this.applyFilters();
    });
  }
  initForm(project?: Project) {
    this.form = this.fb.group({
      name: [
        project?.name || '',
        [Validators.required, Validators.minLength(3)],
      ],
      projectCode: [project?.projectCode || '', Validators.required],
      clientId: [project?.clientId || '', Validators.required],
      status: [project?.status || 'Active', Validators.required],
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
    });
  }

  applyFilters() {
    this.filteredProjects = this.projects.filter((p) => {
      const matchSearch =
        !this.searchTerm ||
        p.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        p.projectCode.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchStatus = !this.statusFilter || p.status === this.statusFilter;
      return matchSearch && matchStatus;
    });
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
        this.projectSvs.deleteProject(p.id);
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Project has been deleted.',
          timer: 1500,
          showConfirmButton: false,
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

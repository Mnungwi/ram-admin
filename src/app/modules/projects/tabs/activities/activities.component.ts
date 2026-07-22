import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule, ReactiveFormsModule,
  FormBuilder, FormGroup, Validators, AbstractControl,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  ProjectService, PhaseService, ActivityTypeService,
} from '../../../../core/services/domain.services';
import {
  SearchableSelectComponent, SelectOption,
} from '../../../../shared/components/searchable-select/searchable-select.component';
import { DateRangePickerComponent } from '../../../../shared/components/date-range-picker/date-range-picker.component';
import { Activity } from '../../../../core/models/index';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-activities',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    SearchableSelectComponent, DateRangePickerComponent,
  ],
  templateUrl: './activities.component.html',
  styleUrls: ['./activities.component.css'],
})
export class ActivitiesComponent implements OnInit {
  projectId = '';
  activities: Activity[] = [];
  filteredActivities: Activity[] = [];
  searchTerm = '';
  statusFilter = '';
  phaseFilter = '';
  showModal = false;
  editMode = false;
  selectedActivity: Activity | null = null;
  form!: FormGroup;
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  // From DB
  phases: any[] = [];
  activityTypes: any[] = [];

  // SelectOptions
  phaseOptions: SelectOption[] = [];
  typeOptions: SelectOption[] = [];
  phaseFilterOptions: SelectOption[] = [];

  get totalActivities()  { return this.activities.length; }
  get completedCount()   { return this.activities.filter(a => a.status === 'Completed').length; }
  get inProgressCount()  { return this.activities.filter(a => a.status === 'In Progress').length; }
  get pendingCount()     { return this.activities.filter(a => a.status === 'Pending').length; }
  get overdueCount()     { return this.activities.filter(a => a.status === 'Overdue').length; }

  get paginatedActivities(): Activity[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredActivities.slice(start, start + this.pageSize);
  }

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private projectSvc: ProjectService,
    private phaseSvc: PhaseService,
    private actTypeSvc: ActivityTypeService,
  ) {}

  ngOnInit() {
    this.route.parent?.params.subscribe(params => {
      this.projectId = params['id'];
      this.loadPhases();
      this.loadActivityTypes();
      this.loadActivities();
    });
    this.initForm();
  }

  loadPhases() {
    this.phaseSvc.getAll().subscribe({
      next: (res: any) => {
        this.phases = res.data?.phases || [];
        this.phaseOptions = this.phases.map(p => ({
          value: p.id, label: p.name, sublabel: `Order: ${p.order}`,
        }));
        this.phaseFilterOptions = [...this.phaseOptions];
      },
      error: () => { this.phases = []; }
    });
  }

  loadActivityTypes() {
    this.actTypeSvc.getAll().subscribe({
      next: (res: any) => {
        this.activityTypes = res.data?.types || [];
        this.typeOptions = this.activityTypes.map(t => ({
          value: t.name, label: t.name, color: t.color, icon: t.icon,
        }));
      },
      error: () => { this.activityTypes = []; }
    });
  }

  loadActivities() {
    this.projectSvc.getActivities(this.projectId).subscribe({
      next: (res: any) => {
        this.activities = res.data ?? res.rows ?? res;
        this.applyFilters();
      },
      error: err => console.error(err),
    });
  }

  // ── Date range validator ────────────────────────────────
  dateRangeValidator(group: AbstractControl) {
    const start = group.get('startDate')?.value;
    const end   = group.get('dueDate')?.value;
    if (start && end && new Date(start) > new Date(end)) {
      return { dateRange: true };
    }
    return null;
  }

  initForm(a?: Activity) {
    this.form = this.fb.group({
      name:        [a?.name        || '', [Validators.required, Validators.minLength(3)]],
      type:        [(a as any)?.type    || ''],
      phaseId:     [(a as any)?.phaseId || null],
      status:      [a?.status      || 'Pending',  Validators.required],
      priority:    [(a as any)?.priority || 'Medium', Validators.required],
      progress:    [a?.progress    ?? 0, [Validators.required, Validators.min(0), Validators.max(100)]],
      startDate:   [a?.startDate   || '', Validators.required],
      dueDate:     [a?.dueDate     || '', Validators.required],
      assignedTo:  [(a as any)?.assignedTo  || ''],
      description: [a?.description || ''],
    }, { validators: this.dateRangeValidator });
  }

  onPhaseFilterChange(val: string) {
    this.phaseFilter = val || '';
    this.applyFilters();
  }

  applyFilters() {
    this.filteredActivities = this.activities.filter(a => {
      const s = this.searchTerm.toLowerCase();
      const matchSearch = !s ||
        a.name.toLowerCase().includes(s) ||
        ((a as any).type || '').toLowerCase().includes(s) ||
        ((a as any).assignedTo || '').toLowerCase().includes(s);
      const matchStatus = !this.statusFilter || a.status === this.statusFilter;
      const matchPhase  = !this.phaseFilter  || (a as any).phaseId === this.phaseFilter;
      return matchSearch && matchStatus && matchPhase;
    });
    this.totalPages = Math.ceil(this.filteredActivities.length / this.pageSize);
    this.currentPage = 1;
  }

  openAddModal() {
    this.editMode = false;
    this.selectedActivity = null;
    this.initForm();
    this.showModal = true;
  }

  openEditModal(a: Activity) {
    this.editMode = true;
    this.selectedActivity = a;
    this.initForm(a);
    this.showModal = true;
  }

  closeModal() { this.showModal = false; }

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const val = { ...this.form.value };
    if (!val.phaseId || val.phaseId === '') val.phaseId = null;

    if (this.editMode && this.selectedActivity) {
      this.projectSvc.updateActivity(this.projectId, this.selectedActivity.id, val).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Updated!', timer: 1500, showConfirmButton: false });
          this.loadActivities(); this.closeModal();
        },
        error: err => Swal.fire('Error', err?.error?.message || 'Failed to update.', 'error'),
      });
    } else {
      this.projectSvc.createActivity(this.projectId, val).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Added!', timer: 1500, showConfirmButton: false });
          this.loadActivities(); this.closeModal();
        },
        error: err => Swal.fire('Error', err?.error?.message || 'Failed to create.', 'error'),
      });
    }
  }

  deleteActivity(a: Activity) {
    Swal.fire({
      title: 'Delete Activity?', text: `Delete "${a.name}"?`, icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Yes, delete!'
    }).then(result => {
      if (result.isConfirmed) {
        this.projectSvc.deleteActivity(this.projectId, a.id).subscribe({
          next: () => {
            this.loadActivities();
            Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1200, showConfirmButton: false });
          },
          error: err => Swal.fire('Error', err?.error?.message || 'Failed.', 'error'),
        });
      }
    });
  }

  getStatusClass(s: string): string {
    const m: any = {
      'Completed': 'status-completed', 'In Progress': 'status-in-progress',
      'Pending': 'status-pending', 'Overdue': 'status-overdue',
    };
    return m[s] || 'status-pending';
  }

  getPriorityClass(p: string): string {
    const m: any = { High: 'badge-danger', Medium: 'badge-warning', Low: 'badge-info' };
    return m[p] || 'badge-info';
  }

  getPhaseName(id?: string): string {
    if (!id) return 'N/A';
    return this.phases.find(p => p.id === id)?.name || 'N/A';
  }

  getTypeColor(name?: string): string {
    return this.activityTypes.find(t => t.name === name)?.color || '#6b7280';
  }

  changePage(p: number) {
    if (p >= 1 && p <= this.totalPages) this.currentPage = p;
  }

  getPages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get f() { return this.form.controls; }
  get Math() { return Math; }
}

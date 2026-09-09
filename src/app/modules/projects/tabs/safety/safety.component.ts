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
import { SafetyService } from '../../../../core/services/domain.services';
import { AuthService } from '../../../../core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-safety',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './safety.component.html',
  styleUrls: ['./safety.component.css'],
})
export class SafetyComponent implements OnInit {
  projectId = '';

  records: any[] = [];
  loading = false;
  searchTerm = '';
  typeFilter = '';
  statusFilter = '';
  severityFilter = '';
  private searchDebounce: any = null;

  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 1;

  summary: any = null;

  types = [
    { value: 'incident', label: 'Incident' },
    { value: 'near_miss', label: 'Near Miss' },
    { value: 'inspection', label: 'Inspection' },
    { value: 'toolbox_talk', label: 'Toolbox Talk' },
    { value: 'drill', label: 'Drill' },
    { value: 'audit', label: 'Audit' },
    { value: 'other', label: 'Other' },
  ];

  // Add/Edit modal
  showModal = false;
  editMode = false;
  selected: any = null;
  form!: FormGroup;
  saving = false;

  // Documents modal (per record)
  showDocsModal = false;
  docsFor: any = null;
  uploadingDoc = false;
  docCategory = '';

  // General project safety documents (not tied to one record)
  projectDocs: any[] = [];
  showProjectDocsModal = false;
  uploadingProjectDoc = false;
  projectDocCategory = '';

  constructor(
    private fb: FormBuilder,
    private svc: SafetyService,
    private route: ActivatedRoute,
    public auth: AuthService,
  ) {}

  ngOnInit() {
    this.route.parent?.params.subscribe((params) => {
      this.projectId = params['id'];
      if (this.projectId) {
        this.load();
        this.loadSummary();
      }
    });
  }

  load() {
    this.loading = true;
    const params: any = { page: this.currentPage, limit: this.pageSize };
    if (this.searchTerm) params.search = this.searchTerm;
    if (this.typeFilter) params.type = this.typeFilter;
    if (this.statusFilter) params.status = this.statusFilter;
    if (this.severityFilter) params.severity = this.severityFilter;

    this.svc.getRecords(this.projectId, params).subscribe({
      next: (res: any) => {
        this.records = res.data || [];
        this.totalItems = res.pagination?.total ?? this.records.length;
        this.totalPages = res.pagination?.totalPages || 1;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  loadSummary() {
    this.svc.getSummary(this.projectId).subscribe({
      next: (res: any) => (this.summary = res.data),
      error: () => {},
    });
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.load();
  }

  onSearchChange(): void {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.currentPage = 1;
      this.load();
    }, 350);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.currentPage = page;
    this.load();
  }

  getPagesArray(): number[] {
    const arr = [];
    for (let i = 1; i <= this.totalPages; i++) arr.push(i);
    return arr;
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }

  typeLabel(v: string): string {
    return this.types.find((t) => t.value === v)?.label || v;
  }

  initForm(r?: any) {
    this.form = this.fb.group({
      type: [r?.type || 'inspection', Validators.required],
      title: [r?.title || '', Validators.required],
      description: [r?.description || ''],
      eventDate: [r?.eventDate ? r.eventDate.substring(0, 10) : new Date().toISOString().split('T')[0], Validators.required],
      severity: [r?.severity || ''],
      location: [r?.location || ''],
      actionTaken: [r?.actionTaken || ''],
      status: [r?.status || 'open'],
    });
  }

  openAddModal() {
    this.editMode = false;
    this.selected = null;
    this.initForm();
    this.showModal = true;
  }

  openEditModal(r: any) {
    this.editMode = true;
    this.selected = r;
    this.initForm(r);
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
    this.saving = true;
    const val = this.form.value;
    // Empty-string severity should be stored as null, not the literal string
    if (!val.severity) val.severity = null;

    const obs = this.editMode && this.selected
      ? this.svc.updateRecord(this.selected.id, val)
      : this.svc.createRecord(this.projectId, val);

    obs.subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.load();
        this.loadSummary();
        Swal.fire({
          icon: 'success',
          title: this.editMode ? 'Updated!' : 'Recorded!',
          timer: 1500,
          showConfirmButton: false,
        });
      },
      error: (err: any) => {
        this.saving = false;
        Swal.fire('Error', err?.error?.message || 'Failed to save.', 'error');
      },
    });
  }

  deleteRecord(r: any) {
    Swal.fire({
      title: 'Delete Safety Record?',
      text: `Remove "${r.title}" and its documents? This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it!',
    }).then((res) => {
      if (res.isConfirmed) {
        this.svc.deleteRecord(r.id).subscribe({
          next: () => {
            this.load();
            this.loadSummary();
            Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1200, showConfirmButton: false });
          },
          error: (err: any) => Swal.fire('Error', err?.error?.message || 'Failed.', 'error'),
        });
      }
    });
  }

  getStatusClass(status: string): string {
    switch ((status || '').toLowerCase()) {
      case 'open': return 'status-pending';
      case 'resolved': return 'status-active';
      case 'closed': return 'status-completed';
      default: return 'status-pending';
    }
  }

  getSeverityClass(sev: string): string {
    switch ((sev || '').toLowerCase()) {
      case 'critical': return 'status-overdue';
      case 'high': return 'status-overdue';
      case 'medium': return 'status-on-hold';
      case 'low': return 'status-active';
      default: return '';
    }
  }

  // ── Per-record documents ─────────────────────────────────────
  openDocsModal(r: any) {
    this.docsFor = r;
    this.docCategory = '';
    this.showDocsModal = true;
  }

  closeDocsModal() {
    this.showDocsModal = false;
    this.docsFor = null;
  }

  onFileSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file || !this.docsFor) return;

    this.uploadingDoc = true;
    this.svc.uploadDocument(this.projectId, file, { category: this.docCategory || undefined, safetyRecordId: this.docsFor.id }).subscribe({
      next: () => {
        this.uploadingDoc = false;
        input.value = '';
        this.reloadDocsFor();
      },
      error: (err: any) => {
        this.uploadingDoc = false;
        Swal.fire('Error', err?.error?.message || 'Upload failed.', 'error');
      },
    });
  }

  private reloadDocsFor(): void {
    if (!this.docsFor) return;
    this.svc.getRecord(this.docsFor.id).subscribe({
      next: (res: any) => {
        this.docsFor = res.data?.record;
        const idx = this.records.findIndex((r) => r.id === this.docsFor.id);
        if (idx >= 0) this.records[idx] = this.docsFor;
      },
    });
  }

  downloadUrl(docId: string): string {
    return this.svc.documentDownloadUrl(docId);
  }

  deleteDoc(docId: string) {
    Swal.fire({
      title: 'Delete Document?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it!',
    }).then((r) => {
      if (r.isConfirmed) {
        this.svc.deleteDocument(docId).subscribe({
          next: () => this.reloadDocsFor(),
          error: (err: any) => Swal.fire('Error', err?.error?.message || 'Failed.', 'error'),
        });
      }
    });
  }

  // ── General project safety documents ─────────────────────────
  openProjectDocsModal() {
    this.projectDocCategory = '';
    this.svc.getProjectDocuments(this.projectId).subscribe({
      next: (res: any) => (this.projectDocs = res.data || []),
    });
    this.showProjectDocsModal = true;
  }

  closeProjectDocsModal() {
    this.showProjectDocsModal = false;
  }

  onProjectFileSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) return;

    this.uploadingProjectDoc = true;
    this.svc.uploadDocument(this.projectId, file, { category: this.projectDocCategory || undefined }).subscribe({
      next: () => {
        this.uploadingProjectDoc = false;
        input.value = '';
        this.svc.getProjectDocuments(this.projectId).subscribe({ next: (res: any) => (this.projectDocs = res.data || []) });
      },
      error: (err: any) => {
        this.uploadingProjectDoc = false;
        Swal.fire('Error', err?.error?.message || 'Upload failed.', 'error');
      },
    });
  }

  deleteProjectDoc(docId: string) {
    Swal.fire({
      title: 'Delete Document?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it!',
    }).then((r) => {
      if (r.isConfirmed) {
        this.svc.deleteDocument(docId).subscribe({
          next: () => this.svc.getProjectDocuments(this.projectId).subscribe({ next: (res: any) => (this.projectDocs = res.data || []) }),
          error: (err: any) => Swal.fire('Error', err?.error?.message || 'Failed.', 'error'),
        });
      }
    });
  }
}

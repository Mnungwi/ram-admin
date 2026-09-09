import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CKEditorModule } from 'ng2-ckeditor';
import { CKEDITOR_CONFIG } from '../../../../shared/utils/ckeditor-config';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SubcontractorService } from '../../../../core/services/domain.services';
import { AuthService } from '../../../../core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-subcontractors',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CKEditorModule],
  templateUrl: './subcontractors.component.html',
  styleUrls: ['./subcontractors.component.css'],
})
export class SubcontractorsComponent implements OnInit {
  ckeditorConfig = CKEDITOR_CONFIG;
  projectId = '';

  subcontractors: any[] = [];
  loading = false;
  searchTerm = '';
  statusFilter = '';
  private searchDebounce: any = null;

  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 1;

  // Add/Edit modal
  showModal = false;
  editMode = false;
  selected: any = null;
  form!: FormGroup;
  saving = false;

  // Documents modal
  showDocsModal = false;
  docsFor: any = null;
  uploadingDoc = false;
  docCategory = '';

  constructor(
    private fb: FormBuilder,
    private svc: SubcontractorService,
    private route: ActivatedRoute,
    public auth: AuthService,
  ) {}

  ngOnInit() {
    this.route.parent?.params.subscribe((params) => {
      this.projectId = params['id'];
      if (this.projectId) this.load();
    });
  }

  load() {
    this.loading = true;
    const params: any = { page: this.currentPage, limit: this.pageSize };
    if (this.searchTerm) params.search = this.searchTerm;
    if (this.statusFilter) params.status = this.statusFilter;

    this.svc.getForProject(this.projectId, params).subscribe({
      next: (res: any) => {
        this.subcontractors = res.data || [];
        this.totalItems = res.pagination?.total ?? this.subcontractors.length;
        this.totalPages = res.pagination?.totalPages || 1;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onSearchChange(): void {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.currentPage = 1;
      this.load();
    }, 350);
  }

  onStatusFilterChange(): void {
    this.currentPage = 1;
    this.load();
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

  initForm(s?: any) {
    this.form = this.fb.group({
      companyName: [s?.companyName || '', Validators.required],
      contactPerson: [s?.contactPerson || ''],
      phone: [s?.phone || ''],
      email: [s?.email || '', Validators.email],
      address: [s?.address || ''],
      tradeScope: [s?.tradeScope || ''],
      contractValue: [s?.contractValue || ''],
      startDate: [s?.startDate ? s.startDate.substring(0, 10) : ''],
      endDate: [s?.endDate ? s.endDate.substring(0, 10) : ''],
      status: [s?.status || 'active'],
      notes: [s?.notes || ''],
    });
  }

  openAddModal() {
    this.editMode = false;
    this.selected = null;
    this.initForm();
    this.showModal = true;
  }

  openEditModal(s: any) {
    this.editMode = true;
    this.selected = s;
    this.initForm(s);
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

    const obs = this.editMode && this.selected
      ? this.svc.update(this.selected.id, val)
      : this.svc.create(this.projectId, val);

    obs.subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.load();
        Swal.fire({
          icon: 'success',
          title: this.editMode ? 'Updated!' : 'Added!',
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

  deleteSubcontractor(s: any) {
    Swal.fire({
      title: 'Delete Subcontractor?',
      text: `Remove "${s.companyName}" and all its documents? This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it!',
    }).then((r) => {
      if (r.isConfirmed) {
        this.svc.deleteSubcontractor(s.id).subscribe({
          next: () => {
            this.load();
            Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1200, showConfirmButton: false });
          },
          error: (err: any) => Swal.fire('Error', err?.error?.message || 'Failed.', 'error'),
        });
      }
    });
  }

  getStatusClass(status: string): string {
    switch ((status || '').toLowerCase()) {
      case 'active': return 'status-active';
      case 'completed': return 'status-completed';
      case 'terminated': return 'status-overdue';
      default: return 'status-pending';
    }
  }

  // ── Documents ──────────────────────────────────────────────
  openDocsModal(s: any) {
    this.docsFor = s;
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
    this.svc.uploadDocument(this.docsFor.id, file, this.docCategory || undefined).subscribe({
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
    this.svc.getOne(this.docsFor.id).subscribe({
      next: (res: any) => {
        this.docsFor = res.data?.subcontractor;
        // keep the list row in sync too
        const idx = this.subcontractors.findIndex((s) => s.id === this.docsFor.id);
        if (idx >= 0) this.subcontractors[idx] = this.docsFor;
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

  formatCurrency(v: any): string {
    const n = Number(v);
    if (!v || isNaN(n)) return '—';
    return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { DocumentService, PhaseService } from '../../../../core/services/domain.services';
import Swal from 'sweetalert2';

const CATEGORIES = [
  'Contract',
  'Drawing',
  'Report',
  'Specification',
  'Permit',
  'Correspondence',
];
const REPORT_TYPES = [
  'Progress',
  'Test',
  'RFI',
  'Inspection',
  'Completion',
  'Environmental',
];
const DRAWING_TYPES = [
  'Structural',
  'Architectural',
  'Services',
];

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './documents.component.html',
  styleUrls: ['./documents.component.css'],
})
export class DocumentsComponent implements OnInit {
  projectId = '';

  documents: any[] = [];
  filteredDocuments: any[] = [];
  phases: any[] = [];
  statuses = ['Completed', 'In Progress', 'Pending', 'Overdue'];
  loading = false;
  searchTerm = '';
  categoryFilter = '';

  editMode = false;
  editingDocumentId = '';

  categories = CATEGORIES;
  reportTypes = REPORT_TYPES;
  drawingTypes = DRAWING_TYPES;

  stats: any = {
    total: 0,
    Contract: 0,
    Drawing: 0,
    Report: 0,
    Specification: 0,
    Permit: 0,
    Correspondence: 0,
  };

  // Upload modal
  showUploadModal = false;
  uploadForm!: FormGroup;
  selectedFile: File | null = null;
  uploading = false;

  // Version history modal
  showVersionsModal = false;
  selectedDocument: any = null;
  versions: any[] = [];
  loadingVersions = false;
  newVersionFile: File | null = null;
  uploadingVersion = false;

  view: 'list' | 'grid' = 'list';

  constructor(
    private fb: FormBuilder,
    private docSvc: DocumentService,
    private phaseSvc: PhaseService,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
  ) {}

  get safePreviewUrl(): SafeResourceUrl {
    return this.previewUrl ? this.sanitizer.bypassSecurityTrustResourceUrl(this.previewUrl) : '';
  }

  ngOnInit(): void {
    const parent = this.route.parent;
    if (!parent) {
      console.error(
        'DocumentsComponent: hakuna parent route — hakiwezi kupata projectId',
      );
      return;
    }
    parent.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.projectId = id;
        this.load();
        this.loadStats();
        this.loadPhases();
      }
    });
  }

  loadPhases(): void {
    this.phaseSvc.getAll().subscribe({
      next: (res: any) => {
        this.phases = res?.data?.phases || res?.data || [];
      }
    });
  }

  load(): void {
    this.loading = true;
    this.docSvc.getAll(this.projectId).subscribe({
      next: (res: any) => {
        this.documents =
          res?.data?.rows || res?.data?.documents || res?.data || [];
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  loadStats(): void {
    this.docSvc.getStats(this.projectId).subscribe({
      next: (res: any) => {
        this.stats = res?.data?.stats || this.stats;
      },
    });
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredDocuments = this.documents.filter((d) => {
      const matchSearch =
        !term ||
        d.title?.toLowerCase().includes(term) ||
        d.description?.toLowerCase().includes(term);
      const matchCategory =
        !this.categoryFilter || d.category === this.categoryFilter;
      return matchSearch && matchCategory;
    });
  }

  setCategoryFilter(cat: string): void {
    this.categoryFilter = this.categoryFilter === cat ? '' : cat;
    this.applyFilters();
  }

  formatFileSize(bytes: number): string {
    if (!bytes) return '—';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let i = 0;
    while (size >= 1024 && i < units.length - 1) {
      size /= 1024;
      i++;
    }
    return `${size.toFixed(size < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
  }

  getCategoryIcon(category: string): string {
    const map: Record<string, string> = {
      Contract: 'fa-file-contract',
      Drawing: 'fa-drafting-compass',
      Report: 'fa-chart-line',
      Specification: 'fa-list-alt',
      Permit: 'fa-stamp',
      Correspondence: 'fa-envelope',
    };
    return map[category] || 'fa-file';
  }

  // ══════════════════════════════════════════════════════════
  // UPLOAD & EDIT
  // ══════════════════════════════════════════════════════════

  openUploadModal(): void {
    this.editMode = false;
    this.editingDocumentId = '';
    this.uploadForm = this.fb.group({
      category: ['', Validators.required],
      reportType: [''],
      drawingType: [''],
      title: ['', Validators.required],
      description: [''],
      phaseId: [''],
      status: ['Completed'],
      submittedBy: [''],
      submittedOn: [new Date().toISOString().split('T')[0]],
    });
    this.selectedFile = null;

    this.bindCategoryValidators();
    this.showUploadModal = true;
  }

  openEditModal(doc: any): void {
    this.editMode = true;
    this.editingDocumentId = doc.id;
    this.uploadForm = this.fb.group({
      category: [doc.category || '', Validators.required],
      reportType: [doc.reportType || ''],
      drawingType: [doc.drawingType || ''],
      title: [doc.title || '', Validators.required],
      description: [doc.description || ''],
      phaseId: [doc.phaseId || ''],
      status: [doc.status || 'Completed'],
      submittedBy: [doc.submittedBy || ''],
      submittedOn: [doc.submittedOn ? doc.submittedOn.split('T')[0] : new Date().toISOString().split('T')[0]],
    });
    this.selectedFile = null;

    this.bindCategoryValidators();
    this.showUploadModal = true;
  }

  bindCategoryValidators(): void {
    this.uploadForm.get('category')?.valueChanges.subscribe((cat) => {
      const reportTypeCtrl = this.uploadForm.get('reportType');
      const drawingTypeCtrl = this.uploadForm.get('drawingType');

      if (cat === 'Report') {
        reportTypeCtrl?.setValidators([Validators.required]);
      } else {
        reportTypeCtrl?.clearValidators();
        reportTypeCtrl?.setValue('');
      }
      reportTypeCtrl?.updateValueAndValidity();

      if (cat === 'Drawing') {
        drawingTypeCtrl?.setValidators([Validators.required]);
      } else {
        drawingTypeCtrl?.clearValidators();
        drawingTypeCtrl?.setValue('');
      }
      drawingTypeCtrl?.updateValueAndValidity();
    });
  }

  closeUploadModal(): void {
    this.showUploadModal = false;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] || null;
  }

  get uf() {
    return this.uploadForm.controls;
  }

  submitUpload(): void {
    if (this.uploadForm.invalid || (!this.editMode && !this.selectedFile)) {
      this.uploadForm.markAllAsTouched();
      if (!this.editMode && !this.selectedFile) {
        Swal.fire('Info', 'Please select a file to upload.', 'info');
      }
      return;
    }

    this.uploading = true;

    if (this.editMode) {
      const payload = { ...this.uploadForm.value };
      this.docSvc.update(this.projectId, this.editingDocumentId, payload).subscribe({
        next: () => {
          this.uploading = false;
          this.closeUploadModal();
          Swal.fire('Success', 'Document updated successfully', 'success');
          this.load();
        },
        error: (err: any) => {
          this.uploading = false;
          Swal.fire('Error', err?.error?.message || 'Failed to update document', 'error');
        }
      });
    } else {
      const fd = new FormData();
      fd.append('file', this.selectedFile!);
      fd.append('category', this.uploadForm.value.category);
      if (this.uploadForm.value.reportType)
        fd.append('reportType', this.uploadForm.value.reportType);
      if (this.uploadForm.value.drawingType)
        fd.append('drawingType', this.uploadForm.value.drawingType);
      fd.append('title', this.uploadForm.value.title);
      if (this.uploadForm.value.description)
        fd.append('description', this.uploadForm.value.description);
      if (this.uploadForm.value.phaseId)
        fd.append('phaseId', this.uploadForm.value.phaseId);
      if (this.uploadForm.value.status)
        fd.append('status', this.uploadForm.value.status);
      if (this.uploadForm.value.submittedBy)
        fd.append('submittedBy', this.uploadForm.value.submittedBy);
      if (this.uploadForm.value.submittedOn)
        fd.append('submittedOn', this.uploadForm.value.submittedOn);

      this.docSvc.uploadDocument(this.projectId, fd).subscribe({
        next: () => {
          this.uploading = false;
          this.closeUploadModal();
          Swal.fire('Success', 'Document uploaded successfully', 'success');
          this.load();
          this.loadStats();
        },
        error: (err: any) => {
          this.uploading = false;
          Swal.fire('Error', err?.error?.message || 'Upload failed', 'error');
        },
      });
    }
  }

  // ══════════════════════════════════════════════════════════
  // DOWNLOAD / DELETE
  // ══════════════════════════════════════════════════════════

  // Document Preview Modal
  showPreviewModal = false;
  previewUrl = '';
  previewTitle = '';

  openPreview(doc: any, versionId?: string): void {
    const docId = doc.id || this.selectedDocument?.id;
    this.previewTitle = doc.title || doc.fileName || 'Document Preview';
    this.previewUrl = this.docSvc.getPreviewUrl(this.projectId, docId, versionId);
    this.showPreviewModal = true;
  }

  closePreviewModal(): void {
    this.showPreviewModal = false;
    this.previewUrl = '';
  }

  download(doc: any): void {
    window.open(this.docSvc.getDownloadUrl(this.projectId, doc.id), '_blank');
  }

  downloadVersion(ver: any): void {
    if (!this.selectedDocument) return;
    window.open(this.docSvc.getDownloadUrl(this.projectId, this.selectedDocument.id, ver.id), '_blank');
  }

  previewVersion(ver: any): void {
    if (!this.selectedDocument) return;
    this.openPreview(ver, ver.id);
  }

  deleteDoc(doc: any): void {
    Swal.fire({
      title: 'Delete Document?',
      text: `Delete "${doc.title}"? This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete!',
    }).then((r) => {
      if (!r.isConfirmed) return;
      this.docSvc.delete(this.projectId, doc.id).subscribe({
        next: () => {
          this.load();
          this.loadStats();
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            timer: 1200,
            showConfirmButton: false,
          });
        },
        error: (err: any) =>
          Swal.fire('Error', err?.error?.message || 'Failed.', 'error'),
      });
    });
  }

  // ══════════════════════════════════════════════════════════
  // VERSION HISTORY
  // ══════════════════════════════════════════════════════════

  openVersionsModal(doc: any): void {
    this.selectedDocument = doc;
    this.newVersionFile = null;
    this.loadingVersions = true;
    this.showVersionsModal = true;
    this.docSvc.getVersions(this.projectId, doc.id).subscribe({
      next: (res: any) => {
        this.versions = res?.data?.versions || [];
        this.loadingVersions = false;
      },
      error: () => {
        this.loadingVersions = false;
      },
    });
  }

  closeVersionsModal(): void {
    this.showVersionsModal = false;
    this.selectedDocument = null;
    this.versions = [];
  }

  onNewVersionFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.newVersionFile = input.files?.[0] || null;
  }

  uploadNewVersion(): void {
    if (!this.newVersionFile) {
      Swal.fire('Info', 'Select a file first.', 'info');
      return;
    }
    this.uploadingVersion = true;
    const fd = new FormData();
    fd.append('file', this.newVersionFile);
    this.docSvc
      .uploadNewVersion(this.projectId, this.selectedDocument.id, fd)
      .subscribe({
        next: (res: any) => {
          this.uploadingVersion = false;
          this.load();
          this.closeVersionsModal();
          Swal.fire({
            icon: 'success',
            title: res?.message || 'New version uploaded!',
            timer: 1800,
            showConfirmButton: false,
          });
        },
        error: (err: any) => {
          this.uploadingVersion = false;
          Swal.fire(
            'Error',
            err?.error?.message || 'Failed to upload new version.',
            'error',
          );
        },
      });
  }
}

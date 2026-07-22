import { Component, OnInit, OnChanges, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
} from '@angular/forms';
import {
  ProjectService,
  ProductService,
  UnitService,
} from '../../../../core/services/domain.services';
import {
  SearchableSelectComponent,
  SelectOption,
} from '../../../../shared/components/searchable-select/searchable-select.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-requisitions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SearchableSelectComponent,
  ],
  templateUrl: './requisitions.component.html',
  styleUrls: ['./requisitions.component.css'],
})
export class RequisitionsComponent implements OnInit, OnChanges {
  @Input() projectId = '';

  requisitions: any[] = [];
  filteredRequisitions: any[] = [];
  loading = false;
  searchTerm = '';
  statusFilter = '';
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  view: 'list' | 'detail' | 'form' = 'list';
  selectedRN: any = null;
  editMode = false;
  form!: FormGroup;
  saving = false;

  // Products & Units
  products: any[] = [];
  units: any[] = [];
  productOptions: SelectOption[] = [];
  unitOptions: SelectOption[] = [];

  // Comments
  commentText = '';
  isInternalComment = false;
  addingComment = false;

  // Issue modal
  showIssueModal = false;
  issueItems: any[] = [];
  issuingComment = '';
  issuing = false;

  // Reject modal
  showRejectModal = false;
  rejectReason = '';
  rejecting = false;

  actionLoading = false;

  get paginatedRequisitions(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredRequisitions.slice(start, start + this.pageSize);
  }
  get totalCount() {
    return this.requisitions.length;
  }
  get draftCount() {
    return this.requisitions.filter((r) => r.status === 'draft').length;
  }
  get pendingCount() {
    return this.requisitions.filter((r) =>
      ['submitted', 'reviewed'].includes(r.status),
    ).length;
  }
  get approvedCount() {
    return this.requisitions.filter((r) => r.status === 'approved').length;
  }
  get issuedCount() {
    return this.requisitions.filter((r) => r.status === 'issued').length;
  }

  constructor(
    private fb: FormBuilder,
    private projectSvc: ProjectService,
    private productSvc: ProductService,
    private unitSvc: UnitService,
  ) {}

  ngOnInit() {
    console.log('=== RequisitionsComponent ngOnInit ===', this.projectId);
    if (this.projectId) {
      this.loadAll();
    }
  }

  ngOnChanges() {
    console.log('=== RequisitionsComponent ngOnChanges ===', this.projectId);
    if (this.projectId) {
      this.loadAll();
    }
  }

  loadAll() {
    this.loadRequisitions();
    this.loadProducts();
    this.loadUnits();
  }

  loadProducts() {
    console.log('=== loadProducts called ===');
    this.productSvc.getAll().subscribe({
      next: (res: any) => {
        console.log('=== products response ===', res);
        this.products = res.data?.products || [];
        this.productOptions = this.products.map((p) => ({
          value: p.id,
          label: p.name,
          sublabel: `${p.code || ''} ${p.uom ? '— ' + p.uom.name : ''}`.trim(),
        }));
        console.log('=== productOptions ===', this.productOptions.length);
      },
      error: (err: any) => console.error('=== products error ===', err),
    });
  }

  loadUnits() {
    this.unitSvc.getAll().subscribe({
      next: (res: any) => {
        this.units = res.data?.units || [];
        this.unitOptions = this.units.map((u) => ({
          value: u.name,
          label: u.name,
          sublabel: u.abbreviation || '',
        }));
      },
      error: (err: any) => console.error('Units error:', err),
    });
  }

  loadRequisitions() {
    this.loading = true;
    this.projectSvc.getRequisitions(this.projectId).subscribe({
      next: (res: any) => {
        this.requisitions = Array.isArray(res.data)
          ? res.data
          : res.data?.rows || res.data?.requisitions || res.data || [];
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  loadDetail(id: string) {
    this.projectSvc.getRequisition(this.projectId, id).subscribe({
      next: (res: any) => {
        this.selectedRN = res.data?.requisition || res.data;
        this.view = 'detail';
        this.issueItems = (this.selectedRN.items || []).map((item: any) => ({
          ...item,
          quantityIssued: item.quantityIssued || item.quantityOrdered,
        }));
      },
      error: () => Swal.fire('Error', 'Failed to load requisition.', 'error'),
    });
  }

  applyFilters() {
    if (!this.requisitions?.length) {
      this.filteredRequisitions = [];
      this.totalPages = 1;
      this.currentPage = 1;
      return;
    }
    this.filteredRequisitions = this.requisitions.filter((r) => {
      const s = this.searchTerm.toLowerCase();
      const matchSearch =
        !s ||
        r.requisitionNo?.toLowerCase().includes(s) ||
        r.siteLocation?.toLowerCase().includes(s);
      const matchStatus = !this.statusFilter || r.status === this.statusFilter;
      return matchSearch && matchStatus;
    });
    this.totalPages = Math.ceil(
      this.filteredRequisitions.length / this.pageSize,
    );
    this.currentPage = 1;
  }

  initForm(rn?: any) {
    this.form = this.fb.group({
      siteLocation: [rn?.siteLocation || ''],
      date: [
        rn?.date || new Date().toISOString().split('T')[0],
        Validators.required,
      ],
      designation: [rn?.designation || ''],
      notes: [rn?.notes || ''],
      items: this.fb.array(
        rn?.items?.length
          ? rn.items.map((item: any) => this.createItemGroup(item))
          : [this.createItemGroup()],
      ),
    });
  }

  createItemGroup(item?: any) {
    const group = this.fb.group({
      productId: [item?.productId || null],
      description: [item?.description || '', Validators.required],
      unit: [item?.unit || ''],
      quantityOrdered: [
        item?.quantityOrdered || '',
        [Validators.required, Validators.min(0.01)],
      ],
      unitPrice: [item?.unitPrice || ''],
      notes: [item?.notes || ''],
    });

    // Auto-fill from product
    group.get('productId')?.valueChanges.subscribe((productId) => {
      if (!productId) return;
      const product = this.products.find((p) => p.id === productId);
      if (product) {
        group.get('description')?.setValue(product.name, { emitEvent: false });
        group
          .get('unit')
          ?.setValue(product.uom?.name || '', { emitEvent: false });
        group
          .get('unitPrice')
          ?.setValue(product.unitPrice || '', { emitEvent: false });
      }
    });

    return group;
  }

  get itemsArray(): FormArray {
    return this.form.get('items') as FormArray;
  }
  addItem() {
    this.itemsArray.push(this.createItemGroup());
  }
  removeItem(i: number) {
    if (this.itemsArray.length > 1) this.itemsArray.removeAt(i);
  }

  openAddForm() {
    this.editMode = false;
    this.selectedRN = null;
    this.initForm();
    this.view = 'form';
  }
  openEditForm(rn: any) {
    this.editMode = true;
    this.selectedRN = rn;
    this.initForm(rn);
    this.view = 'form';
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const val = this.form.value;
    if (this.editMode && this.selectedRN) {
      this.projectSvc
        .updateRequisition(this.projectId, this.selectedRN.id, val)
        .subscribe({
          next: () => {
            this.saving = false;
            this.loadRequisitions();
            this.view = 'list';
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
    } else {
      this.projectSvc.createRequisition(this.projectId, val).subscribe({
        next: (res: any) => {
          this.saving = false;
          this.loadRequisitions();
          this.loadDetail(res.data?.requisition?.id || res.data?.id);
          Swal.fire({
            icon: 'success',
            title: 'Requisition Created!',
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
  }

  submitRN(rn: any) {
    Swal.fire({
      title: 'Submit Requisition?',
      text: `Submit ${rn.requisitionNo}?`,
      input: 'textarea',
      inputPlaceholder: 'Optional comment...',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Submit!',
    }).then((r) => {
      if (r.isConfirmed) {
        this.actionLoading = true;
        this.projectSvc
          .submitRequisition(this.projectId, rn.id, { comment: r.value })
          .subscribe({
            next: () => {
              this.actionLoading = false;
              this.loadDetail(rn.id);
              this.loadRequisitions();
              Swal.fire({
                icon: 'success',
                title: 'Submitted!',
                timer: 1500,
                showConfirmButton: false,
              });
            },
            error: (err: any) => {
              this.actionLoading = false;
              Swal.fire('Error', err?.error?.message || 'Failed.', 'error');
            },
          });
      }
    });
  }

  reviewRN(rn: any) {
    Swal.fire({
      title: 'Review Requisition?',
      input: 'textarea',
      inputPlaceholder: 'Review comment...',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Review!',
    }).then((r) => {
      if (r.isConfirmed) {
        this.actionLoading = true;
        this.projectSvc
          .reviewRequisition(this.projectId, rn.id, { comment: r.value })
          .subscribe({
            next: () => {
              this.actionLoading = false;
              this.loadDetail(rn.id);
              this.loadRequisitions();
              Swal.fire({
                icon: 'success',
                title: 'Reviewed!',
                timer: 1500,
                showConfirmButton: false,
              });
            },
            error: (err: any) => {
              this.actionLoading = false;
              Swal.fire('Error', err?.error?.message || 'Failed.', 'error');
            },
          });
      }
    });
  }

  approveRN(rn: any) {
    Swal.fire({
      title: 'Approve Requisition?',
      input: 'textarea',
      inputPlaceholder: 'Approval comment...',
      icon: 'success',
      showCancelButton: true,
      confirmButtonText: 'Approve!',
      confirmButtonColor: '#16a34a',
    }).then((r) => {
      if (r.isConfirmed) {
        this.actionLoading = true;
        this.projectSvc
          .approveRequisition(this.projectId, rn.id, { comment: r.value })
          .subscribe({
            next: () => {
              this.actionLoading = false;
              this.loadDetail(rn.id);
              this.loadRequisitions();
              Swal.fire({
                icon: 'success',
                title: 'Approved!',
                timer: 1500,
                showConfirmButton: false,
              });
            },
            error: (err: any) => {
              this.actionLoading = false;
              Swal.fire('Error', err?.error?.message || 'Failed.', 'error');
            },
          });
      }
    });
  }

  openIssueModal() {
    this.showIssueModal = true;
  }
  closeIssueModal() {
    this.showIssueModal = false;
  }

  issueRN() {
    this.issuing = true;
    this.projectSvc
      .issueRequisition(this.projectId, this.selectedRN.id, {
        comment: this.issuingComment || 'Goods issued from store.',
        issuedItems: this.issueItems.map((i) => ({
          id: i.id,
          quantityIssued: i.quantityIssued,
        })),
      })
      .subscribe({
        next: () => {
          this.issuing = false;
          this.closeIssueModal();
          this.loadDetail(this.selectedRN.id);
          this.loadRequisitions();
          Swal.fire({
            icon: 'success',
            title: 'Issued!',
            timer: 2000,
            showConfirmButton: false,
          });
        },
        error: (err: any) => {
          this.issuing = false;
          Swal.fire('Error', err?.error?.message || 'Failed.', 'error');
        },
      });
  }

  openRejectModal() {
    this.rejectReason = '';
    this.showRejectModal = true;
  }
  closeRejectModal() {
    this.showRejectModal = false;
  }

  rejectRN() {
    if (!this.rejectReason.trim()) {
      Swal.fire('Error', 'Rejection reason is required.', 'error');
      return;
    }
    this.rejecting = true;
    this.projectSvc
      .rejectRequisition(this.projectId, this.selectedRN.id, {
        reason: this.rejectReason,
      })
      .subscribe({
        next: () => {
          this.rejecting = false;
          this.closeRejectModal();
          this.loadDetail(this.selectedRN.id);
          this.loadRequisitions();
          Swal.fire({
            icon: 'warning',
            title: 'Rejected',
            timer: 1500,
            showConfirmButton: false,
          });
        },
        error: (err: any) => {
          this.rejecting = false;
          Swal.fire('Error', err?.error?.message || 'Failed.', 'error');
        },
      });
  }

  cancelRN(rn: any) {
    Swal.fire({
      title: 'Cancel Requisition?',
      input: 'textarea',
      inputPlaceholder: 'Reason...',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Cancel!',
    }).then((r) => {
      if (r.isConfirmed)
        this.projectSvc
          .cancelRequisition(this.projectId, rn.id, { reason: r.value })
          .subscribe({
            next: () => {
              this.loadDetail(rn.id);
              this.loadRequisitions();
              Swal.fire({
                icon: 'success',
                title: 'Cancelled!',
                timer: 1500,
                showConfirmButton: false,
              });
            },
            error: (err: any) =>
              Swal.fire('Error', err?.error?.message || 'Failed.', 'error'),
          });
    });
  }

  deleteRN(rn: any) {
    Swal.fire({
      title: 'Delete?',
      text: `Delete ${rn.requisitionNo}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete!',
    }).then((r) => {
      if (r.isConfirmed)
        this.projectSvc.deleteRequisition(this.projectId, rn.id).subscribe({
          next: () => {
            this.view = 'list';
            this.loadRequisitions();
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

  addComment() {
    if (!this.commentText.trim()) return;
    this.addingComment = true;
    this.projectSvc
      .addRequisitionComment(this.projectId, this.selectedRN.id, {
        comment: this.commentText,
        isInternal: this.isInternalComment,
      })
      .subscribe({
        next: () => {
          this.addingComment = false;
          this.commentText = '';
          this.isInternalComment = false;
          this.loadDetail(this.selectedRN.id);
        },
        error: () => {
          this.addingComment = false;
        },
      });
  }

  getStatusClass(s: string): string {
    const m: any = {
      draft: 'status-draft',
      submitted: 'status-submitted',
      reviewed: 'status-reviewed',
      approved: 'status-approved',
      issued: 'status-issued',
      rejected: 'status-rejected',
      cancelled: 'status-cancelled',
    };
    return m[s] || 'status-draft';
  }
  getStatusIcon(s: string): string {
    const m: any = {
      draft: 'fa-edit',
      submitted: 'fa-paper-plane',
      reviewed: 'fa-search',
      approved: 'fa-check-circle',
      issued: 'fa-boxes',
      rejected: 'fa-times-circle',
      cancelled: 'fa-ban',
    };
    return m[s] || 'fa-edit';
  }
  getCommentStepClass(step: string): string {
    const m: any = {
      submitted: '#1a56db',
      reviewed: '#7c3aed',
      approved: '#16a34a',
      issued: '#059669',
      rejected: '#ef4444',
      cancelled: '#6b7280',
    };
    return m[step] || '#9ca3af';
  }
  canSubmit(rn: any) {
    return rn.status === 'draft';
  }
  canReview(rn: any) {
    return rn.status === 'submitted';
  }
  canApprove(rn: any) {
    return rn.status === 'reviewed';
  }
  canIssue(rn: any) {
    return rn.status === 'approved';
  }
  canReject(rn: any) {
    return !['issued', 'cancelled'].includes(rn.status);
  }
  canEdit(rn: any) {
    return ['draft', 'rejected'].includes(rn.status);
  }
  canDelete(rn: any) {
    return ['draft', 'rejected', 'cancelled'].includes(rn.status);
  }
  canCancel(rn: any) {
    return !['issued', 'cancelled'].includes(rn.status);
  }
  changePage(p: number) {
    if (p >= 1 && p <= this.totalPages) this.currentPage = p;
  }
  getPages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
  get f() {
    return this.form.controls;
  }
  get Math() {
    return Math;
  }
}

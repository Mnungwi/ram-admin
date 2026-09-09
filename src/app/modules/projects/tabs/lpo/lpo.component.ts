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
  SupplierService,
  ProductService,
  UnitService,
} from '../../../../core/services/domain.services';
import {
  SearchableSelectComponent,
  SelectOption,
} from '../../../../shared/components/searchable-select/searchable-select.component';
import { AuthService } from '../../../../core/services/auth.service';
import { CKEditorModule } from 'ng2-ckeditor';
import { CKEDITOR_CONFIG } from '../../../../shared/utils/ckeditor-config';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-lpo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SearchableSelectComponent,
    CKEditorModule,
  ],
  templateUrl: './lpo.component.html',
  styleUrls: ['./lpo.component.css'],
})
export class LpoComponent implements OnInit, OnChanges {
  ckeditorConfig = CKEDITOR_CONFIG;
  @Input() projectId = '';

  lpos: any[] = [];
  filteredLpos: any[] = [];
  loading = false;
  searchTerm = '';
  statusFilter = '';
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  view: 'list' | 'detail' | 'form' | 'from-rn' = 'list';
  selectedLPO: any = null;
  editMode = false;

  suppliers: any[] = [];
  supplierOptions: SelectOption[] = [];
  activityOptions: SelectOption[] = [];
  requisitions: any[] = [];
  requisitionOptions: SelectOption[] = [];
  selectedRN: any = null;

  // Products & Units from DB
  products: any[] = [];
  units: any[] = [];
  productOptions: SelectOption[] = [];
  unitOptions: SelectOption[] = [];

  form!: FormGroup;
  rnForm!: FormGroup;
  saving = false;

  commentText = '';
  isInternalComment = false;
  addingComment = false;

  showReceiveModal = false;
  receiveItems: any[] = [];
  receivingComment = '';
  receiving = false;

  actionLoading = false;
  taxRate = 18;

  get paginatedLpos(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredLpos.slice(start, start + this.pageSize);
  }
  get totalCount() {
    return this.lpos.length;
  }
  get totalLPOAmount(): number {
    return this.lpos.reduce((s, l) => s + parseFloat(l.total || l.subtotal || 0), 0);
  }
  get draftCount() {
    return this.lpos.filter((l) => l.status === 'draft').length;
  }
  get pendingCount() {
    return this.lpos.filter((l) => l.status === 'submitted').length;
  }
  get approvedCount() {
    return this.lpos.filter((l) => l.status === 'approved').length;
  }
  get sentCount() {
    return this.lpos.filter((l) => l.status === 'sent').length;
  }
  get receivedCount() {
    return this.lpos.filter((l) => ['received', 'partial'].includes(l.status))
      .length;
  }
  formatUnitPriceInput(event: any, index: number): void {
    let inputVal = event.target.value || '';
    const cleanVal = inputVal.replace(/[^0-9.]/g, '');
    if (!cleanVal) {
      event.target.value = '';
      this.itemsArray.at(index).get('unitPrice')?.setValue(null, { emitEvent: false });
      return;
    }

    const parts = cleanVal.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const formatted = parts.join('.');

    event.target.value = formatted;

    const numeric = parseFloat(cleanVal) || 0;
  }

  get formSubtotal(): number {
    return (
      (this.form?.get('items') as FormArray)?.controls.reduce(
        (sum, c) =>
          sum +
          parseFloat(c.get('quantity')?.value || 0) *
            parseFloat(c.get('unitPrice')?.value || 0),
        0,
      ) || 0
    );
  }
  get formTax(): number {
    return (this.formSubtotal * this.taxRate) / 100;
  }
  get formTotal(): number {
    return this.formSubtotal + this.formTax;
  }

  constructor(
    private fb: FormBuilder,
    private projectSvc: ProjectService,
    private supplierSvc: SupplierService,
    private productSvc: ProductService,
    private unitSvc: UnitService,
    public auth: AuthService,
  ) {}

  ngOnInit() {
    if (this.projectId) this.loadAll();
  }

  ngOnChanges() {
    if (this.projectId) this.loadAll();
  }

  loadAll() {
    this.loadLpos();
    this.loadSuppliers();
    this.loadRequisitions();
    this.loadProducts();
    this.loadUnits();
    this.loadActivities();
  }

  loadProducts() {
    this.productSvc.getAll().subscribe({
      next: (res: any) => {
        this.products = res.data?.products || [];
        this.productOptions = this.products.map((p) => ({
          value: p.id,
          label: p.name,
          sublabel: `${p.code || ''} ${p.uom ? '— ' + p.uom.name : ''}`.trim(),
        }));
      },
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
    });
  }

  loadLpos() {
    this.loading = true;
    this.projectSvc.getLpos(this.projectId).subscribe({
      next: (res: any) => {
        this.lpos = Array.isArray(res.data)
          ? res.data
          : res.data?.rows || res.data?.lpos || res.data || [];
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  loadSuppliers() {
    this.supplierSvc.getAll().subscribe({
      next: (res: any) => {
        this.suppliers =
          res.data?.suppliers || res.data?.rows || res.data || [];
        this.supplierOptions = this.suppliers.map((s) => ({
          value: s.id,
          label: s.name,
          sublabel: s.category || '',
        }));
      },
    });
  }

  loadRequisitions() {
    this.projectSvc.getRequisitions(this.projectId).subscribe({
      next: (res: any) => {
        const all = Array.isArray(res.data)
          ? res.data
          : res.data?.rows || res.data?.requisitions || res.data || [];
        // Show all requisitions
        this.requisitions = all;
        this.requisitionOptions = all.map((r: any) => ({
          value: r.id,
          label: r.requisitionNo,
          sublabel: `${r.siteLocation || ''} — ${r.status}`,
        }));
      },
    });
  }

  loadActivities(): void {
    this.projectSvc.getActivities(this.projectId).subscribe({
      next: (res: any) => {
        const activities =
          res?.data?.activities || res?.data?.rows || res?.data || [];
        this.activityOptions = activities
          .map((a: any) => ({
            value: a.id,
            label: (a.name || '').toString().trim(),
          }))
          .filter((o: any) => o.value && o.label);
      },
    });
  }

  loadDetail(id: string) {
    this.projectSvc.getLpo(this.projectId, id).subscribe({
      next: (res: any) => {
        this.selectedLPO = res.data?.lpo || res.data;
        this.view = 'detail';
        this.receiveItems = (this.selectedLPO.items || []).map((i: any) => ({
          ...i,
          quantityReceived: i.quantityReceived || i.quantity,
        }));
      },
      error: () => Swal.fire('Error', 'Failed to load LPO.', 'error'),
    });
  }

  applyFilters() {
    this.filteredLpos = this.lpos.filter((l) => {
      const s = this.searchTerm.toLowerCase();
      const matchSearch =
        !s ||
        l.lpoNo?.toLowerCase().includes(s) ||
        (l.supplier?.name || '').toLowerCase().includes(s);
      const matchStatus = !this.statusFilter || l.status === this.statusFilter;
      return matchSearch && matchStatus;
    });
    this.totalPages = Math.ceil(this.filteredLpos.length / this.pageSize);
    this.currentPage = 1;
  }

  initForm(lpo?: any) {
    this.taxRate = lpo?.taxRate || 18;
    this.form = this.fb.group({
      supplierId: [
        lpo?.supplierId || lpo?.supplier?.id || '',
        Validators.required,
      ],
      activityId: [
        lpo?.activityId || lpo?.activity?.id || '',
        Validators.required,
      ],
      requisitionId: [lpo?.requisitionId || lpo?.requisition?.id || null],
      date: [
        lpo?.date || new Date().toISOString().split('T')[0],
        Validators.required,
      ],
      deliveryDate: [lpo?.deliveryDate || ''],
      deliveryAddress: [lpo?.deliveryAddress || ''],
      currency: [lpo?.currency || 'TZS'],
      taxRate: [lpo?.taxRate || 18],
      paymentTerms: [lpo?.paymentTerms || ''],
      notes: [lpo?.notes || ''],
      items: this.fb.array(
        lpo?.items?.length
          ? lpo.items.map((i: any) => this.createItemGroup(i))
          : [this.createItemGroup()],
      ),
    });

    // ── When RN is selected, auto-populate items from RN ──
    this.form.get('requisitionId')?.valueChanges.subscribe((rnId) => {
      if (!rnId) {
        // Clear items back to one empty row when RN is cleared
        while (this.itemsArray.length) this.itemsArray.removeAt(0);
        this.itemsArray.push(this.createItemGroup());
        return;
      }
      // Fetch full RN with items
      this.projectSvc.getRequisition(this.projectId, rnId).subscribe({
        next: (res: any) => {
          const rn = res.data?.requisition || res.data;
          if (rn?.items?.length) {
            // Clear existing items and populate from RN
            while (this.itemsArray.length) this.itemsArray.removeAt(0);
            rn.items.forEach((item: any) => {
              // Find product by name to get productId
              const product = this.products.find(
                (p) => p.name === item.description,
              );
              this.itemsArray.push(
                this.fb.group({
                  productId: [item.productId || product?.id || null],
                  description: [item.description, Validators.required],
                  unit: [item.unit || ''],
                  quantity: [
                    item.quantityOrdered,
                    [Validators.required, Validators.min(0.01)],
                  ],
                  unitPrice: [
                    item.unitPrice || '',
                    [Validators.required, Validators.min(0)],
                  ],
                  requisitionItemId: [item.id],
                  notes: [item.notes || ''],
                }),
              );
            });
            // Set delivery address from RN site location
            if (rn.siteLocation && !this.form.get('deliveryAddress')?.value) {
              this.form.get('deliveryAddress')?.setValue(rn.siteLocation);
            }
          }
        },
      });
    });

    this.form.get('taxRate')?.valueChanges.subscribe((v) => {
      this.taxRate = parseFloat(v) || 18;
    });
  }

  createItemGroup(item?: any) {
    const group = this.fb.group({
      productId: [item?.productId || null],
      description: [item?.description || '', Validators.required],
      unit: [item?.unit || ''],
      quantity: [
        item?.quantity || '',
        [Validators.required, Validators.min(0.01)],
      ],
      unitPrice: [
        item?.unitPrice || '',
        [Validators.required, Validators.min(0)],
      ],
      requisitionItemId: [item?.requisitionItemId || null],
      notes: [item?.notes || ''],
    });

    // When product selected — auto-fill description, unit, unitPrice
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
  getItemAmount(i: number): number {
    const c = this.itemsArray.at(i);
    return (
      parseFloat(c.get('quantity')?.value || 0) *
      parseFloat(c.get('unitPrice')?.value || 0)
    );
  }

  openAddForm() {
    this.editMode = false;
    this.selectedLPO = null;
    this.initForm();
    this.view = 'form';
  }
  openEditForm(lpo: any) {
    this.editMode = true;
    this.selectedLPO = lpo;
    this.initForm(lpo);
    this.view = 'form';
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const val = { ...this.form.value, taxRate: this.taxRate };
    const call =
      this.editMode && this.selectedLPO
        ? this.projectSvc.updateLpo(this.projectId, this.selectedLPO.id, val)
        : this.projectSvc.createLpo(this.projectId, val);
    call.subscribe({
      next: (res: any) => {
        this.saving = false;
        this.loadLpos();
        const id = this.editMode
          ? this.selectedLPO.id
          : res.data?.lpo?.id || res.data?.id;
        if (id) this.loadDetail(id);
        Swal.fire({
          icon: 'success',
          title: this.editMode ? 'LPO Updated!' : 'LPO Created!',
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

  openFromRNView() {
    this.selectedRN = null;
    this.rnForm = this.fb.group({
      requisitionId: ['', Validators.required],
      supplierId: ['', Validators.required],
      activityId: ['', Validators.required],
      deliveryDate: [''],
      taxRate: [18],
      paymentTerms: [''],
      notes: [''],
    });

    // Listen for RN selection
    this.rnForm.get('requisitionId')?.valueChanges.subscribe((rnId) => {
      if (rnId) {
        this.onRNSelect(rnId);
      } else {
        // Clear selected RN
        this.selectedRN = null;
      }
    });

    this.view = 'from-rn';
  }

  onRNSelect(rnId: string) {
    // Fetch full RN with items
    this.projectSvc.getRequisition(this.projectId, rnId).subscribe({
      next: (res: any) => {
        this.selectedRN = res.data?.requisition || res.data;
      },
    });
  }

  onSubmitFromRN() {
    if (this.rnForm.invalid) {
      this.rnForm.markAllAsTouched();
      return;
    }
    this.saving = true;
    const val = this.rnForm.value;
    const unitPrices: any = {};
    (this.selectedRN?.items || []).forEach((i: any) => {
      unitPrices[i.id] = i.unitPrice || 0;
    });
    this.projectSvc
      .createLpoFromRequisition(this.projectId, val.requisitionId, {
        supplierId: val.supplierId,
        activityId: val.activityId,
        deliveryDate: val.deliveryDate,
        taxRate: val.taxRate,
        paymentTerms: val.paymentTerms,
        notes: val.notes,
        unitPrices,
      })
      .subscribe({
        next: (res: any) => {
          this.saving = false;
          this.loadLpos();
          this.loadDetail(res.data?.lpo?.id);
          Swal.fire({
            icon: 'success',
            title: 'LPO Created from RN!',
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

  submitLpo(lpo: any) {
    Swal.fire({
      title: 'Submit LPO?',
      text: `Submit ${lpo.lpoNo}?`,
      input: 'textarea',
      inputPlaceholder: 'Optional comment...',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Submit!',
    }).then((r) => {
      if (r.isConfirmed) {
        this.actionLoading = true;
        this.projectSvc
          .submitLpo(this.projectId, lpo.id, { comment: r.value })
          .subscribe({
            next: () => {
              this.actionLoading = false;
              this.loadDetail(lpo.id);
              this.loadLpos();
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

  approveLpo(lpo: any) {
    Swal.fire({
      title: 'Approve LPO?',
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
          .approveLpo(this.projectId, lpo.id, { comment: r.value })
          .subscribe({
            next: () => {
              this.actionLoading = false;
              this.loadDetail(lpo.id);
              this.loadLpos();
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

  sendLpo(lpo: any) {
    Swal.fire({
      title: 'Send to Supplier?',
      input: 'textarea',
      inputPlaceholder: 'e.g. Sent via email...',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Mark as Sent!',
    }).then((r) => {
      if (r.isConfirmed) {
        this.actionLoading = true;
        this.projectSvc
          .sendLpo(this.projectId, lpo.id, { comment: r.value })
          .subscribe({
            next: () => {
              this.actionLoading = false;
              this.loadDetail(lpo.id);
              this.loadLpos();
              Swal.fire({
                icon: 'success',
                title: 'Sent!',
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

  openReceiveModal() {
    this.showReceiveModal = true;
  }
  closeReceiveModal() {
    this.showReceiveModal = false;
  }

  receiveLpo() {
    this.receiving = true;
    this.projectSvc
      .receiveLpo(this.projectId, this.selectedLPO.id, {
        comment: this.receivingComment || 'Goods received.',
        receivedItems: this.receiveItems.map((i) => ({
          id: i.id,
          quantityReceived: i.quantityReceived,
        })),
      })
      .subscribe({
        next: (res: any) => {
          this.receiving = false;
          this.closeReceiveModal();
          this.loadDetail(this.selectedLPO.id);
          this.loadLpos();
          Swal.fire({
            icon: 'success',
            title:
              res.data?.status === 'received'
                ? 'All Items Received!'
                : 'Partial Delivery Recorded',
            timer: 2000,
            showConfirmButton: false,
          });
        },
        error: (err: any) => {
          this.receiving = false;
          Swal.fire('Error', err?.error?.message || 'Failed.', 'error');
        },
      });
  }

  cancelLpo(lpo: any) {
    Swal.fire({
      title: 'Cancel LPO?',
      input: 'textarea',
      inputPlaceholder: 'Reason...',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Cancel LPO',
    }).then((r) => {
      if (r.isConfirmed)
        this.projectSvc
          .cancelLpo(this.projectId, lpo.id, { reason: r.value })
          .subscribe({
            next: () => {
              this.loadDetail(lpo.id);
              this.loadLpos();
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

  deleteLpo(lpo: any) {
    Swal.fire({
      title: 'Delete LPO?',
      text: `Delete ${lpo.lpoNo}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete!',
    }).then((r) => {
      if (r.isConfirmed)
        this.projectSvc.deleteLpo(this.projectId, lpo.id).subscribe({
          next: () => {
            this.view = 'list';
            this.loadLpos();
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
      .addLpoComment(this.projectId, this.selectedLPO.id, {
        comment: this.commentText,
        isInternal: this.isInternalComment,
      })
      .subscribe({
        next: () => {
          this.addingComment = false;
          this.commentText = '';
          this.isInternalComment = false;
          this.loadDetail(this.selectedLPO.id);
        },
        error: () => {
          this.addingComment = false;
        },
      });
  }

  getStatusClass(s: string): string {
    const m: any = {
      draft: 'lpo-draft',
      submitted: 'lpo-submitted',
      approved: 'lpo-approved',
      sent: 'lpo-sent',
      partial: 'lpo-partial',
      received: 'lpo-received',
      invoiced: 'lpo-invoiced',
      paid: 'lpo-paid',
      cancelled: 'lpo-cancelled',
    };
    return m[s] || 'lpo-draft';
  }
  getStatusIcon(s: string): string {
    const m: any = {
      draft: 'fa-edit',
      submitted: 'fa-paper-plane',
      approved: 'fa-check-circle',
      sent: 'fa-truck',
      partial: 'fa-truck-loading',
      received: 'fa-check-double',
      invoiced: 'fa-file-invoice',
      paid: 'fa-money-check',
      cancelled: 'fa-ban',
    };
    return m[s] || 'fa-edit';
  }
  getCommentColor(step: string): string {
    const m: any = {
      submitted: '#1a56db',
      approved: '#16a34a',
      sent: '#0891b2',
      partial: '#ea580c',
      received: '#059669',
      cancelled: '#6b7280',
      created: '#7c3aed',
    };
    return m[step] || '#9ca3af';
  }
  formatCurrency(n: number): string {
    return new Intl.NumberFormat('sw-TZ', {
      style: 'currency',
      currency: 'TZS',
      maximumFractionDigits: 0,
    }).format(n || 0);
  }
  canSubmit(l: any) {
    return l.status === 'draft';
  }
  canApprove(l: any) {
    return l.status === 'submitted';
  }
  canSend(l: any) {
    return l.status === 'approved';
  }
  canReceive(l: any) {
    return ['sent', 'partial'].includes(l.status);
  }
  canEdit(l: any) {
    return l.status === 'draft';
  }
  canDelete(l: any) {
    return ['draft', 'cancelled'].includes(l.status);
  }
  canCancel(l: any) {
    return !['received', 'paid', 'cancelled'].includes(l.status);
  }
  changePage(p: number) {
    if (p >= 1 && p <= this.totalPages) this.currentPage = p;
  }
  getPages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
  get f() {
    return this.form?.controls;
  }
  get rf() {
    return this.rnForm?.controls;
  }
  get Math() {
    return Math;
  }
}

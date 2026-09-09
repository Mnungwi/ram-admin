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
  ProjectService,
  SupplierService,
  StoreService,
} from '../../../../core/services/domain.services';
import {
  SearchableSelectComponent,
  SelectOption,
} from '../../../../shared/components/searchable-select/searchable-select.component';

import Swal from 'sweetalert2';
import { RequisitionsComponent } from "../requisitions/requisitions.component";
import { LpoComponent } from "../lpo/lpo.component";
import { StoreComponent } from "../store/store.component";
import { CKEditorModule } from 'ng2-ckeditor';
import { CKEDITOR_CONFIG } from '../../../../shared/utils/ckeditor-config';

@Component({
  selector: 'app-procurement',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SearchableSelectComponent,
    RequisitionsComponent,
    LpoComponent,
    StoreComponent,
    CKEditorModule,
  ],
  templateUrl: './procurement.component.html',
  styleUrls: ['./procurement.component.css'],
})
export class ProcurementComponent implements OnInit {
  ckeditorConfig = CKEDITOR_CONFIG;
  projectId = '';
  activeTab = 'contracts';

  // Data
  contracts: any[] = [];
  purchaseOrders: any[] = [];
  allSuppliers: any[] = []; // global suppliers directory
  projectSuppliers: any[] = []; // suppliers linked to project
  issueItems: any[] = [];

  // Select options
  supplierOptions: SelectOption[] = [];
  availableSupplierOptions: SelectOption[] = []; // not yet added to project

  // Loading
  loadingContracts = false;
  loadingPOs = false;
  loadingSuppliers = false;
  loadingProjectSuppliers = false;

  // Contract/PO Modal
  showModal = false;
  editMode = false;
  selectedItem: any = null;
  form!: FormGroup;
  saving = false;

  // Supplier Modal
  showSupplierModal = false;
  editingPS: any = null;
  supplierForm!: FormGroup;
  savingSupplier = false;

  // Search
  searchTerm = '';

  // Legacy stats
  get totalReceived() {
    return this.purchaseOrders.filter(
      (p) => p.status === 'received' || p.status === 'Received',
    ).length;
  }
  get totalIssues() {
    return this.issueItems.length;
  }
  dbTotalPaid = 0;

  get totalSpent() {
    return this.dbTotalPaid > 0 ? this.dbTotalPaid : this.totalPOValue;
  }
  get totalContracts() {
    return this.contracts.length;
  }
  get totalPOs() {
    console.log('TOAL POS', this.purchaseOrders.length);
    return this.purchaseOrders.length;
  }
  get activeContracts() {
    return this.contracts.filter((c) => c.status === 'Active').length;
  }
  get totalContractValue() {
    return this.contracts.reduce(
      (s, c) => s + parseFloat(c.value || c.amount || 0),
      0,
    );
  }
  get totalPOValue() {
    return this.purchaseOrders.reduce(
      (s, p) => s + parseFloat(p.total || p.totalAmount || p.amount || 0),
      0,
    );
  }
  get topSuppliers() {
    return this.allSuppliers.slice(0, 5);
  }
  get filteredContracts() {
    if (!this.searchTerm) return this.contracts;
    const s = this.searchTerm.toLowerCase();
    return this.contracts.filter(
      (c) =>
        (c.contractNumber || c.contractNo || '').toLowerCase().includes(s) ||
        (c.title || c.contractor || '').toLowerCase().includes(s),
    );
  }
  get filteredPOs() {
    if (!this.searchTerm) return this.purchaseOrders;
    const s = this.searchTerm.toLowerCase();
    return this.purchaseOrders.filter(
      (p) =>
        (p.orderNumber || p.poNo || '').toLowerCase().includes(s) ||
        this.getSupplierName(p.supplierId).toLowerCase().includes(s),
    );
  }

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private projectSvc: ProjectService,
    private supplierSvc: SupplierService,
    private storeSvc: StoreService, // ← ongeza hii
  ) {}

  ngOnInit() {
    this.route.parent?.params.subscribe((params) => {
      this.projectId = params['id'];
      this.loadAllSuppliers();
      this.loadContracts();
      this.loadPurchaseOrders();
      this.loadProjectSuppliers();

      // Fetch dynamic budget overview payments/expenses
      this.projectSvc.getOverview(this.projectId).subscribe({
        next: (res: any) => {
          this.dbTotalPaid = Number(res.data?.stats?.materialSpent || 0);
        }
      });
    });
  }

  // ── Loaders ────────────────────────────────────────────
  loadContracts() {
    this.loadingContracts = true;
    this.projectSvc.getContracts(this.projectId).subscribe({
      next: (res: any) => {
        this.contracts = res.data?.contracts || [];
        this.loadingContracts = false;
      },
      error: () => {
        this.loadingContracts = false;
      },
    });
  }

  // loadPurchaseOrders() {
  //   this.loadingPOs = true;
  //   this.projectSvc.getLpos(this.projectId).subscribe({
  //     next: (res: any) => {
  //       this.purchaseOrders = res.data?.orders || [];
  //       this.loadingPOs = false;
  //     },
  //     error: () => {
  //       this.loadingPOs = false;
  //     },
  //   });
  // }

  loadPurchaseOrders() {
    this.loadingPOs = true;

    this.projectSvc.getLpos(this.projectId).subscribe({
      next: (res: any) => {
        console.log(res);

        this.purchaseOrders = Array.isArray(res.data)
          ? res.data
          : res.data?.orders || [];

        this.loadingPOs = false;
      },

      error: () => {
        this.loadingPOs = false;
      },
    });
  }

  loadAllSuppliers() {
    this.supplierSvc.getAll().subscribe({
      next: (res: any) => {
        // Handle all possible response structures
        this.allSuppliers =
          res.data?.suppliers || res.data?.rows || res.data || res.rows || [];
        this.supplierOptions = this.allSuppliers.map((s) => ({
          value: s.id,
          label: s.name,
          sublabel: s.category || s.email || '',
        }));
        this.buildAvailableOptions();
      },
    });
  }

  loadProjectSuppliers() {
    this.loadingProjectSuppliers = true;
    this.projectSvc.getProjectSuppliers(this.projectId).subscribe({
      next: (res: any) => {
        this.projectSuppliers = res.data?.suppliers || [];
        this.buildAvailableOptions();
        this.loadingProjectSuppliers = false;
      },
      error: () => {
        this.loadingProjectSuppliers = false;
      },
    });
  }

  buildAvailableOptions() {
    const addedIds = new Set(
      this.projectSuppliers.map((ps) => ps.supplierId || ps.supplier?.id),
    );
    this.availableSupplierOptions = this.allSuppliers
      .filter((s) => s.isActive && !addedIds.has(s.id))
      .map((s) => ({ value: s.id, label: s.name, sublabel: s.category || '' }));
  }

  // ── Tab ─────────────────────────────────────────────────
  setTab(t: string) {
    this.activeTab = t;
    this.closeModal();
    this.closeSupplierModal();
  }

  // ── CONTRACTS ────────────────────────────────────────────
  initContractForm(c?: any) {
    this.form = this.fb.group({
      contractNumber: [
        c?.contractNumber || c?.contractNo || '',
        Validators.required,
      ],
      title: [c?.title || c?.contractor || '', Validators.required],
      supplierId: [c?.supplierId || null],
      category: [c?.category || ''],
      value: [
        c?.value || c?.amount || '',
        [Validators.required, Validators.min(1)],
      ],
      currency: [c?.currency || 'TZS'],
      startDate: [c?.startDate || '', Validators.required],
      endDate: [c?.endDate || '', Validators.required],
      status: [c?.status || 'Pending'],
      description: [c?.description || ''],
    });
  }

  openAddContract() {
    this.editMode = false;
    this.selectedItem = null;
    this.initContractForm();
    this.showModal = true;
  }
  openEditContract(c: any) {
    this.editMode = true;
    this.selectedItem = c;
    this.initContractForm(c);
    this.showModal = true;
  }

  onSubmitContract() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const val = this.form.value;
    const call =
      this.editMode && this.selectedItem
        ? this.projectSvc.updateContract(
            this.projectId,
            this.selectedItem.id,
            val,
          )
        : this.projectSvc.createContract(this.projectId, val);
    call.subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.loadContracts();
        Swal.fire({
          icon: 'success',
          title: this.editMode ? 'Updated!' : 'Created!',
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

  deleteContract(c: any) {
    Swal.fire({
      title: 'Delete Contract?',
      text: `Delete "${c.contractNumber || c.contractNo}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete!',
    }).then((r) => {
      if (r.isConfirmed)
        this.projectSvc.deleteContract(this.projectId, c.id).subscribe({
          next: () => {
            this.loadContracts();
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

  // ── PURCHASE ORDERS ──────────────────────────────────────
  initPOForm(p?: any) {
    this.form = this.fb.group({
      orderNumber: [p?.orderNumber || p?.poNo || '', Validators.required],
      supplierId: [p?.supplierId || null, Validators.required],
      contractId: [p?.contractId || null],
      description: [p?.description || '', Validators.required],
      totalAmount: [
        p?.totalAmount || p?.amount || '',
        [Validators.required, Validators.min(1)],
      ],
      currency: [p?.currency || 'TZS'],
      orderDate: [p?.orderDate || p?.date || '', Validators.required],
      status: [p?.status || 'pending'],
      notes: [p?.notes || ''],
    });
  }

  openAddPO() {
    this.editMode = false;
    this.selectedItem = null;
    this.initPOForm();
    this.showModal = true;
  }
  openEditPO(p: any) {
    this.editMode = true;
    this.selectedItem = p;
    this.initPOForm(p);
    this.showModal = true;
  }

  onSubmitPO() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const val = this.form.value;
    const call =
      this.editMode && this.selectedItem
        ? this.projectSvc.updateLpo(this.projectId, this.selectedItem.id, val)
        : this.projectSvc.createLpo(this.projectId, val);
    call.subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.loadPurchaseOrders();
        Swal.fire({
          icon: 'success',
          title: this.editMode ? 'Updated!' : 'Created!',
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

  deletePO(p: any) {
    Swal.fire({
      title: 'Delete PO?',
      text: `Delete "${p.orderNumber || p.poNo}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete!',
    }).then((r) => {
      if (r.isConfirmed)
        this.projectSvc.deleteLpo(this.projectId, p.id).subscribe({
          next: () => {
            this.loadPurchaseOrders();
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

  // ── PROJECT SUPPLIERS ─────────────────────────────────────
  openAddSupplierModal() {
    this.editingPS = null;
    this.supplierForm = this.fb.group({
      supplierId: ['', Validators.required],
      role: [''],
      notes: [''],
    });
    this.showSupplierModal = true;
  }

  openEditSupplierModal(ps: any) {
    this.editingPS = ps;
    this.supplierForm = this.fb.group({
      supplierId: [ps.supplierId || ps.supplier?.id || ''],
      role: [ps.role || ''],
      notes: [ps.notes || ''],
    });
    this.showSupplierModal = true;
  }

  closeSupplierModal() {
    this.showSupplierModal = false;
    this.editingPS = null;
  }

  onSubmitSupplier() {
    if (this.supplierForm.invalid) {
      this.supplierForm.markAllAsTouched();
      return;
    }
    this.savingSupplier = true;
    const val = this.supplierForm.value;

    if (this.editingPS) {
      this.projectSvc
        .updateProjectSupplier(this.projectId, this.editingPS.id, val)
        .subscribe({
          next: () => {
            this.savingSupplier = false;
            this.closeSupplierModal();
            this.loadProjectSuppliers();
            Swal.fire({
              icon: 'success',
              title: 'Updated!',
              timer: 1500,
              showConfirmButton: false,
            });
          },
          error: (err: any) => {
            this.savingSupplier = false;
            Swal.fire('Error', err?.error?.message || 'Failed.', 'error');
          },
        });
    } else {
      this.projectSvc.addProjectSupplier(this.projectId, val).subscribe({
        next: () => {
          this.savingSupplier = false;
          this.closeSupplierModal();
          this.loadProjectSuppliers();
          this.buildAvailableOptions();
          Swal.fire({
            icon: 'success',
            title: 'Supplier Added!',
            timer: 1500,
            showConfirmButton: false,
          });
        },
        error: (err: any) => {
          this.savingSupplier = false;
          Swal.fire('Error', err?.error?.message || 'Failed.', 'error');
        },
      });
    }
  }

  removeProjectSupplier(ps: any) {
    Swal.fire({
      title: 'Remove Supplier?',
      text: `Remove "${ps.supplier?.name}" from this project?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, remove!',
    }).then((r) => {
      if (r.isConfirmed)
        this.projectSvc.removeProjectSupplier(this.projectId, ps.id).subscribe({
          next: () => {
            this.loadProjectSuppliers();
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
    });
  }

  // ── Helpers ──────────────────────────────────────────────
  closeModal() {
    this.showModal = false;
    this.selectedItem = null;
  }

  getStatusClass(s: string): string {
    const m: any = {
      active: 'status-active',
      Active: 'status-active',
      completed: 'status-completed',
      Completed: 'status-completed',
      pending: 'status-pending',
      Pending: 'status-pending',
      terminated: 'status-overdue',
      Terminated: 'status-overdue',
      open: 'status-in-progress',
      Open: 'status-in-progress',
      received: 'status-completed',
      Received: 'status-completed',
      partial: 'status-pending',
      Partial: 'status-pending',
      cancelled: 'status-overdue',
      Cancelled: 'status-overdue',
    };
    return m[s] || 'status-pending';
  }

  formatCurrency(n: number): string {
    return new Intl.NumberFormat('sw-TZ', {
      style: 'currency',
      currency: 'TZS',
      maximumFractionDigits: 0,
    }).format(n || 0);
  }

  getSupplierName(id: string): string {
    return this.allSuppliers.find((s) => s.id === id)?.name || '—';
  }

  getSupplierInitials(name: string): string {
    return (
      name
        ?.split(' ')
        .map((w: string) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || '?'
    );
  }

  getSupplierAvatarColor(name: string): string {
    const colors = [
      '#1a56db',
      '#7c3aed',
      '#059669',
      '#ea580c',
      '#dc2626',
      '#0891b2',
    ];
    return colors[(name?.charCodeAt(0) || 0) % colors.length];
  }

  get sf() {
    return this.supplierForm?.controls;
  }
  get f() {
    return this.form?.controls;
  }
}

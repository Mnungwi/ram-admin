import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
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
  StoreService,
  ProjectService,
  TechnicianService,
  ProductService,
  UnitService,
} from '../../../../core/services/domain.services'; // rekebisha idadi ya '../' kulingana na kina cha folder yako
import { SearchableSelectComponent } from '../../../../shared/components/searchable-select/searchable-select.component'; // BADILISHA path/jina kulingana na component yako halisi
import Swal from 'sweetalert2';

@Component({
  selector: 'app-store',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SearchableSelectComponent,
  ],
  templateUrl: './store.component.html',
  styleUrls: ['./store.component.css'],
})
export class StoreComponent implements OnChanges {
  @Input() projectId!: string;

  activeTab: 'project' | 'central' | 'transactions' = 'project';

  // ── Project Store ─────────────────────────────────────────
  projectItems: any[] = [];
  filteredProjectItems: any[] = [];
  projectSearch = '';
  loadingProject = false;

  // ── Central Store ─────────────────────────────────────────
  centralItems: any[] = [];
  filteredCentralItems: any[] = [];
  centralSearch = '';
  loadingCentral = false;

  // ── Transactions ──────────────────────────────────────────
  transactions: any[] = [];
  loadingTransactions = false;

  // ── Issue Modal (Distribute to Technician — dynamic FormArray) ──
  showIssueModal = false;
  issueForm!: FormGroup;
  availableIssueItems: any[] = []; // project store items with quantity > 0
  itemOptions: {
    value: string;
    label: string;
    available: number;
    unit: string;
    productId?: string | null;
  }[] = [];
  rowOptions: {
    value: string;
    label: string;
    available: number;
    unit: string;
    productId?: string | null;
  }[][] = []; // options kwa kila row, dedup dynamic
  technicianOptions: { value: string; label: string }[] = [];
  loadingTechniciansForIssue = false;
  issuing = false;

  // ── Transfer from Central Modal ──────────────────────────
  showTransferModal = false;
  transferItems: any[] = [];
  transferNotes = '';
  transferring = false;

  // ── Adjust Modal ──────────────────────────────────────────
  showAdjustModal = false;
  adjustForm!: FormGroup;
  adjusting = false;
  productOptions: { value: string; label: string; unit?: string }[] = [];
  unitOptions: { value: string; label: string }[] = [];
  loadingAdjustLookups = false;

  constructor(
    private fb: FormBuilder,
    private storeSvc: StoreService,
    private projectSvc: ProjectService,
    private techSvc: TechnicianService,
    private productSvc: ProductService,
    private unitSvc: UnitService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projectId'] && this.projectId) {
      this.loadAll();
    }
  }

  loadAll(): void {
    this.loadProjectStore();
    this.loadCentralStore();
    this.loadTransactions();
  }

  // ══════════════════════════════════════════════════════════
  // LOADERS
  // ══════════════════════════════════════════════════════════

  loadProjectStore(): void {
    this.loadingProject = true;
    this.storeSvc.getProjectStore(this.projectId).subscribe({
      next: (res: any) => {
        this.projectItems = res?.data?.items || [];
        this.applyProjectFilter();
        this.loadingProject = false;
      },
      error: () => {
        this.loadingProject = false;
      },
    });
  }

  loadCentralStore(): void {
    this.loadingCentral = true;
    this.storeSvc.getCentralStore().subscribe({
      next: (res: any) => {
        this.centralItems = res?.data?.items || [];
        this.applyCentralFilter();
        this.loadingCentral = false;
      },
      error: () => {
        this.loadingCentral = false;
      },
    });
  }

  loadTransactions(): void {
    this.loadingTransactions = true;
    this.storeSvc.getProjectTransactions(this.projectId).subscribe({
      next: (res: any) => {
        this.transactions = res?.data?.rows || res?.data || [];
        this.loadingTransactions = false;
      },
      error: () => {
        this.loadingTransactions = false;
      },
    });
  }

  applyProjectFilter(): void {
    const term = this.projectSearch.trim().toLowerCase();
    this.filteredProjectItems = !term
      ? this.projectItems
      : this.projectItems.filter((i) =>
          i.description?.toLowerCase().includes(term),
        );
  }

  applyCentralFilter(): void {
    const term = this.centralSearch.trim().toLowerCase();
    this.filteredCentralItems = !term
      ? this.centralItems
      : this.centralItems.filter((i) =>
          i.description?.toLowerCase().includes(term),
        );
  }

  // ══════════════════════════════════════════════════════════
  // STATS / HELPERS
  // ══════════════════════════════════════════════════════════

  get inStockCount(): number {
    return this.projectItems.filter((i) => +i.quantity >= 10).length;
  }

  get lowStockCount(): number {
    return this.projectItems.filter((i) => +i.quantity > 0 && +i.quantity < 10)
      .length;
  }

  getStockStatus(qty: number): string {
    const q = +qty;
    if (q <= 0) return 'out-of-stock';
    if (q < 10) return 'low-stock';
    return 'in-stock';
  }

  formatQty(qty: number): string {
    const n = +qty;
    return Number.isInteger(n) ? n.toString() : n.toFixed(2);
  }

  getTransactionTypeClass(type: string): string {
    const map: Record<string, string> = {
      lpo_receive: 'badge-success',
      rn_issue: 'badge-danger',
      transfer_in: 'badge-primary',
      transfer_out: 'badge-warning',
      adjustment_in: 'badge-info',
      adjustment_out: 'badge-secondary',
      worker_issue: 'badge-danger',
    };
    return map[type] || 'badge-secondary';
  }

  // ══════════════════════════════════════════════════════════
  // ISSUE FROM STORE → DISTRIBUTE TO TECHNICIAN (dynamic items)
  // ══════════════════════════════════════════════════════════

  openIssueModal(): void {
    this.availableIssueItems = this.projectItems.filter((i) => +i.quantity > 0);
    this.itemOptions = this.availableIssueItems
      .map((i) => ({
        value: i.id,
        label: `${(i.description || '').toString().trim()} (${this.formatQty(i.quantity)} ${i.unit || ''} available)`,
        available: +i.quantity,
        unit: i.unit,
        productId: i.productId || null,
      }))
      .filter((o) => o.value && o.label.trim());

    this.issueForm = this.fb.group({
      technicianId: ['', Validators.required],
      notes: [''],
      items: this.fb.array([]),
    });
    this.addIssueItem(); // row ya kwanza kiotomatiki

    this.loadTechniciansForIssue();
    this.showIssueModal = true;
  }

  closeIssueModal(): void {
    this.showIssueModal = false;
  }

  get issueItemsArray(): FormArray {
    return this.issueForm.get('items') as FormArray;
  }

  addIssueItem(): void {
    this.issueItemsArray.push(
      this.fb.group({
        storeItemId: ['', Validators.required],
        quantity: [null, [Validators.required, Validators.min(0.01)]],
      }),
    );
    this.refreshRowOptions();
  }

  removeIssueItem(i: number): void {
    this.issueItemsArray.removeAt(i);
    this.refreshRowOptions();
  }

  // Inasasisha options za kila row: hazionyeshi vifaa vilivyokwisha-chaguliwa
  // kwenye rows nyingine. Inaitwa tu baada ya add/remove/kuchagua — si kila
  // change-detection cycle — ili isivunje search ya app-searchable-select.
  refreshRowOptions(): void {
    const values = this.issueItemsArray.controls.map(
      (c) => c.get('storeItemId')?.value,
    );
    this.rowOptions = this.issueItemsArray.controls.map((_, i) => {
      const chosenElsewhere = values.filter((v, idx) => idx !== i && v);
      return this.itemOptions.filter((o) => !chosenElsewhere.includes(o.value));
    });
  }

  getIssueItemMax(i: number): number {
    const storeItemId = this.issueItemsArray.at(i).get('storeItemId')?.value;
    return (
      this.itemOptions.find((o) => o.value === storeItemId)?.available || 0
    );
  }

  getIssueItemUnit(i: number): string {
    const storeItemId = this.issueItemsArray.at(i).get('storeItemId')?.value;
    return this.itemOptions.find((o) => o.value === storeItemId)?.unit || '';
  }

  loadTechniciansForIssue(): void {
    this.loadingTechniciansForIssue = true;
    this.techSvc.getProjectTechnicians(this.projectId).subscribe({
      next: (res: any) => {
        const assignments =
          res?.data?.assignments || res?.data?.technicians || [];
        this.technicianOptions = assignments
          .map((a: any) => {
            const tech = a.technician || a;
            const parts = [(tech.name || '').toString().trim()].filter(Boolean);
            if (tech.category?.name) parts.push(tech.category.name);
            if (tech.phone) parts.push(tech.phone);
            return {
              value: tech.id,
              label: parts.join(' — '),
            };
          })
          .filter((o: any) => o.value && o.label);
        this.loadingTechniciansForIssue = false;
      },
      error: () => {
        this.loadingTechniciansForIssue = false;
      },
    });
  }

  canIssue(): boolean {
    if (this.issueForm.invalid) return false;
    if (this.issueItemsArray.length === 0) return false;
    const valid = this.issueItemsArray.controls.every((c) => {
      const qty = c.get('quantity')?.value || 0;
      const storeItemId = c.get('storeItemId')?.value;
      const max =
        this.itemOptions.find((o) => o.value === storeItemId)?.available || 0;
      return qty > 0 && qty <= max;
    });
    if (!valid) return false;

    // Hakuna kifaa kilekile kilichochaguliwa mara mbili
    const ids = this.issueItemsArray.controls.map(
      (c) => c.get('storeItemId')?.value,
    );
    return new Set(ids).size === ids.length;
  }

  onIssue(): void {
    const ids = this.issueItemsArray.controls.map(
      (c) => c.get('storeItemId')?.value,
    );
    if (new Set(ids).size !== ids.length) {
      Swal.fire(
        'Info',
        'Umechagua kifaa kilekile mara mbili — badilisha au futa row moja.',
        'info',
      );
      return;
    }
    if (!this.canIssue()) {
      this.issueForm.markAllAsTouched();
      return;
    }

    this.issuing = true;
    const val = this.issueForm.value;
    const payload = {
      notes: val.notes || undefined,
      distributions: [
        {
          technicianId: val.technicianId,
          items: val.items.map((it: any) => {
            const opt = this.itemOptions.find(
              (o) => o.value === it.storeItemId,
            );
            return {
              storeItemId: it.storeItemId,
              productId: opt?.productId || null,
              description: opt?.label?.split(' (')[0] || '',
              unit: opt?.unit || '',
              quantity: it.quantity,
            };
          }),
        },
      ],
    };

    this.techSvc.distribute(this.projectId, payload).subscribe({
      next: (res: any) => {
        this.issuing = false;
        this.showIssueModal = false;
        this.loadAll();
        Swal.fire({
          icon: 'success',
          title: res?.message || 'Vifaa vimetolewa!',
          timer: 1800,
          showConfirmButton: false,
        });
      },
      error: (err: any) => {
        this.issuing = false;
        Swal.fire(
          'Error',
          err?.error?.message || 'Imeshindikana kutoa vifaa.',
          'error',
        );
      },
    });
  }

  // ══════════════════════════════════════════════════════════
  // TRANSFER FROM CENTRAL
  // ══════════════════════════════════════════════════════════

  openTransferModal(): void {
    this.transferItems = this.centralItems
      .filter((i) => +i.quantity > 0)
      .map((i) => ({
        centralItemId: i.id,
        description: i.description,
        available: i.quantity,
        quantity: null,
      }));
    this.transferNotes = '';
    this.showTransferModal = true;
  }

  closeTransferModal(): void {
    this.showTransferModal = false;
  }

  onTransfer(): void {
    const items = this.transferItems
      .filter((i) => +i.quantity > 0)
      .map((i) => ({ centralItemId: i.centralItemId, quantity: i.quantity }));

    if (!items.length) {
      Swal.fire('Info', 'Enter quantity for at least one item.', 'info');
      return;
    }

    this.transferring = true;
    this.storeSvc
      .transferToProject(this.projectId, { items, notes: this.transferNotes })
      .subscribe({
        next: (res: any) => {
          this.transferring = false;
          this.showTransferModal = false;
          this.loadAll();
          Swal.fire({
            icon: 'success',
            title: res?.message || 'Items transferred!',
            timer: 1800,
            showConfirmButton: false,
          });
        },
        error: (err: any) => {
          this.transferring = false;
          Swal.fire(
            'Error',
            err?.error?.message || 'Failed to transfer items.',
            'error',
          );
        },
      });
  }

  // ══════════════════════════════════════════════════════════
  // MANUAL ADJUSTMENT
  // ══════════════════════════════════════════════════════════

  openAdjustModal(): void {
    this.adjustForm = this.fb.group({
      productId: ['', Validators.required],
      description: ['', Validators.required],
      unit: ['', Validators.required],
      type: ['in', Validators.required],
      quantity: [null, [Validators.required, Validators.min(0.01)]],
      notes: [''],
    });
    this.loadAdjustLookups();
    this.showAdjustModal = true;
  }

  closeAdjustModal(): void {
    this.showAdjustModal = false;
  }

  loadAdjustLookups(): void {
    this.loadingAdjustLookups = true;
    this.productSvc.getAll().subscribe({
      next: (res: any) => {
        const products =
          res?.data?.products || res?.data?.rows || res?.data || [];
        this.productOptions = products
          .map((p: any) => ({
            value: p.id,
            label: (p.name || p.description || '').toString().trim(),
            unit: p.unit || p.defaultUnit || '',
          }))
          .filter((o: any) => o.value && o.label); // ondoa zile zisizo na jina kabisa
        this.loadingAdjustLookups = false;
      },
      error: () => {
        this.loadingAdjustLookups = false;
      },
    });

    this.unitSvc.getAll().subscribe({
      next: (res: any) => {
        const units = res?.data?.units || res?.data?.rows || res?.data || [];
        this.unitOptions = units.map((u: any) => ({
          value: u.name,
          label: u.name,
        }));
      },
      error: () => {
        this.unitOptions = [];
      },
    });
  }

  // Ukichagua product, jaza description na unit kiotomatiki (bado unaweza kubadilisha)
  onAdjustProductChange(): void {
    const productId = this.adjustForm.get('productId')?.value;
    const product = this.productOptions.find((p) => p.value === productId);
    if (product) {
      this.adjustForm.patchValue({
        description: product.label,
        unit: product.unit || this.adjustForm.get('unit')?.value,
      });
    }
  }

  onAdjust(): void {
    if (this.adjustForm.invalid) {
      this.adjustForm.markAllAsTouched();
      return;
    }
    this.adjusting = true;
    this.storeSvc
      .adjustProject(this.projectId, this.adjustForm.value)
      .subscribe({
        next: (res: any) => {
          this.adjusting = false;
          this.showAdjustModal = false;
          this.loadAll();
          Swal.fire({
            icon: 'success',
            title: res?.message || 'Stock adjusted!',
            timer: 1800,
            showConfirmButton: false,
          });
        },
        error: (err: any) => {
          this.adjusting = false;
          Swal.fire(
            'Error',
            err?.error?.message || 'Failed to adjust stock.',
            'error',
          );
        },
      });
  }

  // ══════════════════════════════════════════════════════════
  // RETURN TO CENTRAL
  // ══════════════════════════════════════════════════════════

  transferToCentral(): void {
    Swal.fire({
      title: 'Return remaining stock to Central Store?',
      text: 'All remaining project store quantities will be moved to Central Store.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, return it',
    }).then((r) => {
      if (!r.isConfirmed) return;
      this.storeSvc.transferToCentral(this.projectId, {}).subscribe({
        next: (res: any) => {
          this.loadAll();
          Swal.fire({
            icon: 'success',
            title: res?.message || 'Returned to central store!',
            timer: 1800,
            showConfirmButton: false,
          });
        },
        error: (err: any) => {
          Swal.fire(
            'Error',
            err?.error?.message || 'Failed to return stock.',
            'error',
          );
        },
      });
    });
  }
}

// import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import {
//   FormsModule,
//   ReactiveFormsModule,
//   FormBuilder,
//   FormGroup,
//   FormArray,
//   Validators,
// } from '@angular/forms';
// import {
//   StoreService,
//   ProjectService,
//   TechnicianService,
// } from '../../../../core/services/domain.services'; // rekebisha idadi ya '../' kulingana na kina cha folder yako
// import { SearchableSelectComponent } from '../../../../shared/components/searchable-select/searchable-select.component'; // BADILISHA path/jina kulingana na component yako halisi
// import Swal from 'sweetalert2';

// @Component({
//   selector: 'app-store',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     ReactiveFormsModule,
//     SearchableSelectComponent,
//   ],
//   templateUrl: './store.component.html',
//   styleUrls: ['./store.component.css'],
// })
// export class StoreComponent implements OnChanges {
//   @Input() projectId!: string;

//   activeTab: 'project' | 'central' | 'transactions' = 'project';

//   // ── Project Store ─────────────────────────────────────────
//   projectItems: any[] = [];
//   filteredProjectItems: any[] = [];
//   projectSearch = '';
//   loadingProject = false;

//   // ── Central Store ─────────────────────────────────────────
//   centralItems: any[] = [];
//   filteredCentralItems: any[] = [];
//   centralSearch = '';
//   loadingCentral = false;

//   // ── Transactions ──────────────────────────────────────────
//   transactions: any[] = [];
//   loadingTransactions = false;

//   // ── Issue Modal (Distribute to Technician — dynamic FormArray) ──
//   showIssueModal = false;
//   issueForm!: FormGroup;
//   availableIssueItems: any[] = []; // project store items with quantity > 0
//   itemOptions: {
//     value: string;
//     label: string;
//     available: number;
//     unit: string;
//     productId?: string | null;
//   }[] = [];
//   rowOptions: {
//     value: string;
//     label: string;
//     available: number;
//     unit: string;
//     productId?: string | null;
//   }[][] = []; // options kwa kila row, dedup dynamic
//   technicianOptions: { value: string; label: string }[] = [];
//   loadingTechniciansForIssue = false;
//   issuing = false;

//   // ── Transfer from Central Modal ──────────────────────────
//   showTransferModal = false;
//   transferItems: any[] = [];
//   transferNotes = '';
//   transferring = false;

//   // ── Adjust Modal ──────────────────────────────────────────
//   showAdjustModal = false;
//   adjustForm!: FormGroup;
//   adjusting = false;

//   constructor(
//     private fb: FormBuilder,
//     private storeSvc: StoreService,
//     private projectSvc: ProjectService,
//     private techSvc: TechnicianService,
//   ) {}

//   ngOnChanges(changes: SimpleChanges): void {
//     if (changes['projectId'] && this.projectId) {
//       this.loadAll();
//     }
//   }

//   loadAll(): void {
//     this.loadProjectStore();
//     this.loadCentralStore();
//     this.loadTransactions();
//   }

//   // ══════════════════════════════════════════════════════════
//   // LOADERS
//   // ══════════════════════════════════════════════════════════

//   loadProjectStore(): void {
//     this.loadingProject = true;
//     this.storeSvc.getProjectStore(this.projectId).subscribe({
//       next: (res: any) => {
//         this.projectItems = res?.data?.items || [];
//         this.applyProjectFilter();
//         this.loadingProject = false;
//       },
//       error: () => {
//         this.loadingProject = false;
//       },
//     });
//   }

//   loadCentralStore(): void {
//     this.loadingCentral = true;
//     this.storeSvc.getCentralStore().subscribe({
//       next: (res: any) => {
//         this.centralItems = res?.data?.items || [];
//         this.applyCentralFilter();
//         this.loadingCentral = false;
//       },
//       error: () => {
//         this.loadingCentral = false;
//       },
//     });
//   }

//   loadTransactions(): void {
//     this.loadingTransactions = true;
//     this.storeSvc.getProjectTransactions(this.projectId).subscribe({
//       next: (res: any) => {
//         this.transactions = res?.data?.rows || res?.data || [];
//         this.loadingTransactions = false;
//       },
//       error: () => {
//         this.loadingTransactions = false;
//       },
//     });
//   }

//   applyProjectFilter(): void {
//     const term = this.projectSearch.trim().toLowerCase();
//     this.filteredProjectItems = !term
//       ? this.projectItems
//       : this.projectItems.filter((i) =>
//           i.description?.toLowerCase().includes(term),
//         );
//   }

//   applyCentralFilter(): void {
//     const term = this.centralSearch.trim().toLowerCase();
//     this.filteredCentralItems = !term
//       ? this.centralItems
//       : this.centralItems.filter((i) =>
//           i.description?.toLowerCase().includes(term),
//         );
//   }

//   // ══════════════════════════════════════════════════════════
//   // STATS / HELPERS
//   // ══════════════════════════════════════════════════════════

//   get inStockCount(): number {
//     return this.projectItems.filter((i) => +i.quantity >= 10).length;
//   }

//   get lowStockCount(): number {
//     return this.projectItems.filter((i) => +i.quantity > 0 && +i.quantity < 10)
//       .length;
//   }

//   getStockStatus(qty: number): string {
//     const q = +qty;
//     if (q <= 0) return 'out-of-stock';
//     if (q < 10) return 'low-stock';
//     return 'in-stock';
//   }

//   formatQty(qty: number): string {
//     const n = +qty;
//     return Number.isInteger(n) ? n.toString() : n.toFixed(2);
//   }

//   getTransactionTypeClass(type: string): string {
//     const map: Record<string, string> = {
//       lpo_receive: 'badge-success',
//       rn_issue: 'badge-danger',
//       transfer_in: 'badge-primary',
//       transfer_out: 'badge-warning',
//       adjustment_in: 'badge-info',
//       adjustment_out: 'badge-secondary',
//       worker_issue: 'badge-danger',
//     };
//     return map[type] || 'badge-secondary';
//   }

//   // ══════════════════════════════════════════════════════════
//   // ISSUE FROM STORE → DISTRIBUTE TO TECHNICIAN (dynamic items)
//   // ══════════════════════════════════════════════════════════

//   openIssueModal(): void {
//     this.availableIssueItems = this.projectItems.filter((i) => +i.quantity > 0);
//     this.itemOptions = this.availableIssueItems.map((i) => ({
//       value: i.id,
//       label: `${i.description} (${this.formatQty(i.quantity)} ${i.unit || ''} available)`,
//       available: +i.quantity,
//       unit: i.unit,
//       productId: i.productId || null,
//     }));

//     this.issueForm = this.fb.group({
//       technicianId: ['', Validators.required],
//       notes: [''],
//       items: this.fb.array([]),
//     });
//     this.addIssueItem(); // row ya kwanza kiotomatiki

//     this.loadTechniciansForIssue();
//     this.showIssueModal = true;
//   }

//   closeIssueModal(): void {
//     this.showIssueModal = false;
//   }

//   get issueItemsArray(): FormArray {
//     return this.issueForm.get('items') as FormArray;
//   }

//   addIssueItem(): void {
//     this.issueItemsArray.push(
//       this.fb.group({
//         storeItemId: ['', Validators.required],
//         quantity: [null, [Validators.required, Validators.min(0.01)]],
//       }),
//     );
//     this.refreshRowOptions();
//   }

//   removeIssueItem(i: number): void {
//     this.issueItemsArray.removeAt(i);
//     this.refreshRowOptions();
//   }

//   // Inasasisha options za kila row: hazionyeshi vifaa vilivyokwisha-chaguliwa
//   // kwenye rows nyingine. Inaitwa tu baada ya add/remove/kuchagua — si kila
//   // change-detection cycle — ili isivunje search ya app-searchable-select.
//   refreshRowOptions(): void {
//     const values = this.issueItemsArray.controls.map(
//       (c) => c.get('storeItemId')?.value,
//     );
//     this.rowOptions = this.issueItemsArray.controls.map((_, i) => {
//       const chosenElsewhere = values.filter((v, idx) => idx !== i && v);
//       return this.itemOptions.filter((o) => !chosenElsewhere.includes(o.value));
//     });
//   }

//   getIssueItemMax(i: number): number {
//     const storeItemId = this.issueItemsArray.at(i).get('storeItemId')?.value;
//     return (
//       this.itemOptions.find((o) => o.value === storeItemId)?.available || 0
//     );
//   }

//   getIssueItemUnit(i: number): string {
//     const storeItemId = this.issueItemsArray.at(i).get('storeItemId')?.value;
//     return this.itemOptions.find((o) => o.value === storeItemId)?.unit || '';
//   }

//   loadTechniciansForIssue(): void {
//     this.loadingTechniciansForIssue = true;
//     this.techSvc.getProjectTechnicians(this.projectId).subscribe({
//       next: (res: any) => {
//         const assignments =
//           res?.data?.assignments || res?.data?.technicians || [];
//         this.technicianOptions = assignments.map((a: any) => {
//           const tech = a.technician || a;
//           const parts = [tech.name];
//           if (tech.category?.name) parts.push(tech.category.name);
//           if (tech.phone) parts.push(tech.phone);
//           return {
//             value: tech.id,
//             label: parts.join(' — '),
//           };
//         });
//         this.loadingTechniciansForIssue = false;
//       },
//       error: () => {
//         this.loadingTechniciansForIssue = false;
//       },
//     });
//   }

//   canIssue(): boolean {
//     if (this.issueForm.invalid) return false;
//     if (this.issueItemsArray.length === 0) return false;
//     const valid = this.issueItemsArray.controls.every((c) => {
//       const qty = c.get('quantity')?.value || 0;
//       const storeItemId = c.get('storeItemId')?.value;
//       const max =
//         this.itemOptions.find((o) => o.value === storeItemId)?.available || 0;
//       return qty > 0 && qty <= max;
//     });
//     if (!valid) return false;

//     // Hakuna kifaa kilekile kilichochaguliwa mara mbili
//     const ids = this.issueItemsArray.controls.map(
//       (c) => c.get('storeItemId')?.value,
//     );
//     return new Set(ids).size === ids.length;
//   }

//   onIssue(): void {
//     const ids = this.issueItemsArray.controls.map(
//       (c) => c.get('storeItemId')?.value,
//     );
//     if (new Set(ids).size !== ids.length) {
//       Swal.fire(
//         'Info',
//         'Umechagua kifaa kilekile mara mbili — badilisha au futa row moja.',
//         'info',
//       );
//       return;
//     }
//     if (!this.canIssue()) {
//       this.issueForm.markAllAsTouched();
//       return;
//     }

//     this.issuing = true;
//     const val = this.issueForm.value;
//     const payload = {
//       notes: val.notes || undefined,
//       distributions: [
//         {
//           technicianId: val.technicianId,
//           items: val.items.map((it: any) => {
//             const opt = this.itemOptions.find(
//               (o) => o.value === it.storeItemId,
//             );
//             return {
//               productId: opt?.productId || null,
//               description: opt?.label?.split(' (')[0] || '',
//               unit: opt?.unit || '',
//               quantity: it.quantity,
//             };
//           }),
//         },
//       ],
//     };

//     this.techSvc.distribute(this.projectId, payload).subscribe({
//       next: (res: any) => {
//         this.issuing = false;
//         this.showIssueModal = false;
//         this.loadAll();
//         Swal.fire({
//           icon: 'success',
//           title: res?.message || 'Vifaa vimetolewa!',
//           timer: 1800,
//           showConfirmButton: false,
//         });
//       },
//       error: (err: any) => {
//         this.issuing = false;
//         Swal.fire(
//           'Error',
//           err?.error?.message || 'Imeshindikana kutoa vifaa.',
//           'error',
//         );
//       },
//     });
//   }

//   // ══════════════════════════════════════════════════════════
//   // TRANSFER FROM CENTRAL
//   // ══════════════════════════════════════════════════════════

//   openTransferModal(): void {
//     this.transferItems = this.centralItems
//       .filter((i) => +i.quantity > 0)
//       .map((i) => ({
//         centralItemId: i.id,
//         description: i.description,
//         available: i.quantity,
//         quantity: null,
//       }));
//     this.transferNotes = '';
//     this.showTransferModal = true;
//   }

//   closeTransferModal(): void {
//     this.showTransferModal = false;
//   }

//   onTransfer(): void {
//     const items = this.transferItems
//       .filter((i) => +i.quantity > 0)
//       .map((i) => ({ centralItemId: i.centralItemId, quantity: i.quantity }));

//     if (!items.length) {
//       Swal.fire('Info', 'Enter quantity for at least one item.', 'info');
//       return;
//     }

//     this.transferring = true;
//     this.storeSvc
//       .transferToProject(this.projectId, { items, notes: this.transferNotes })
//       .subscribe({
//         next: (res: any) => {
//           this.transferring = false;
//           this.showTransferModal = false;
//           this.loadAll();
//           Swal.fire({
//             icon: 'success',
//             title: res?.message || 'Items transferred!',
//             timer: 1800,
//             showConfirmButton: false,
//           });
//         },
//         error: (err: any) => {
//           this.transferring = false;
//           Swal.fire(
//             'Error',
//             err?.error?.message || 'Failed to transfer items.',
//             'error',
//           );
//         },
//       });
//   }

//   // ══════════════════════════════════════════════════════════
//   // MANUAL ADJUSTMENT
//   // ══════════════════════════════════════════════════════════

//   openAdjustModal(): void {
//     this.adjustForm = this.fb.group({
//       description: ['', Validators.required],
//       unit: [''],
//       type: ['in', Validators.required],
//       quantity: [null, [Validators.required, Validators.min(0.01)]],
//       notes: [''],
//     });
//     this.showAdjustModal = true;
//   }

//   closeAdjustModal(): void {
//     this.showAdjustModal = false;
//   }

//   onAdjust(): void {
//     if (this.adjustForm.invalid) {
//       this.adjustForm.markAllAsTouched();
//       return;
//     }
//     this.adjusting = true;
//     this.storeSvc
//       .adjustProject(this.projectId, this.adjustForm.value)
//       .subscribe({
//         next: (res: any) => {
//           this.adjusting = false;
//           this.showAdjustModal = false;
//           this.loadAll();
//           Swal.fire({
//             icon: 'success',
//             title: res?.message || 'Stock adjusted!',
//             timer: 1800,
//             showConfirmButton: false,
//           });
//         },
//         error: (err: any) => {
//           this.adjusting = false;
//           Swal.fire(
//             'Error',
//             err?.error?.message || 'Failed to adjust stock.',
//             'error',
//           );
//         },
//       });
//   }

//   // ══════════════════════════════════════════════════════════
//   // RETURN TO CENTRAL
//   // ══════════════════════════════════════════════════════════

//   transferToCentral(): void {
//     Swal.fire({
//       title: 'Return remaining stock to Central Store?',
//       text: 'All remaining project store quantities will be moved to Central Store.',
//       icon: 'warning',
//       showCancelButton: true,
//       confirmButtonColor: '#ef4444',
//       confirmButtonText: 'Yes, return it',
//     }).then((r) => {
//       if (!r.isConfirmed) return;
//       this.storeSvc.transferToCentral(this.projectId, {}).subscribe({
//         next: (res: any) => {
//           this.loadAll();
//           Swal.fire({
//             icon: 'success',
//             title: res?.message || 'Returned to central store!',
//             timer: 1800,
//             showConfirmButton: false,
//           });
//         },
//         error: (err: any) => {
//           Swal.fire(
//             'Error',
//             err?.error?.message || 'Failed to return stock.',
//             'error',
//           );
//         },
//       });
//     });
//   }
// }

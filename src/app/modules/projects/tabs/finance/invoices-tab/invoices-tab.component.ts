import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CKEditorModule } from 'ng2-ckeditor';
import { CKEDITOR_CONFIG } from '../../../../../shared/utils/ckeditor-config';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FinanceService, ProjectService, SupplierService } from '../../../../../core/services/domain.services'; // rekebisha idadi ya '../'
import { SearchableSelectComponent } from '../../../../../shared/components/searchable-select/searchable-select.component'; // BADILISHA path/jina
import { AuthService } from '../../../../../core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-invoices-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SearchableSelectComponent, CKEditorModule],
  templateUrl: './invoices-tab.component.html',
  styleUrls: ['./invoices-tab.component.css'],
})
export class InvoicesTabComponent implements OnChanges {
  ckeditorConfig = CKEDITOR_CONFIG;
  @Input() projectId!: string;

  invoices: any[] = [];
  loading = false;

  showModal = false;
  editMode = false;
  selectedInvoice: any = null;
  form!: FormGroup;
  saving = false;

  activityOptions: { value: string; label: string }[] = [];
  loadingActivities = false;

  supplierOptions: { value: string; label: string }[] = [];
  loadingSuppliers = false;

  lpoOptions: { value: string; label: string }[] = [];
  loadingLpos = false;
  lpos: any[] = []; // data kamili ya LPO (kwa ajili ya kuchukua supplierId/total)

  // Record Payment (sehemu-sehemu)
  showPaymentModal = false;
  paymentInvoice: any = null;
  paymentForm!: FormGroup;
  recordingPayment = false;
  paymentHistory: any[] = [];
  loadingHistory = false;

  editingPaymentId: string | null = null;
  editPaymentForm!: FormGroup;
  savingEditPayment = false;

  constructor(
    private fb: FormBuilder,
    private financeSvc: FinanceService,
    private projectSvc: ProjectService,
    private supplierSvc: SupplierService,
    public auth: AuthService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projectId'] && this.projectId) {
      this.load();
    }
  }

  get f() {
    return this.form.controls;
  }
  get pf() {
    return this.paymentForm.controls;
  }
  get editPf() {
    return this.editPaymentForm.controls;
  }

  get totalInvoicesAmount(): number {
    return this.invoices.reduce((s, i) => s + parseFloat(i.amount || 0), 0);
  }
  get totalInvoicesPaid(): number {
    return this.invoices.reduce((s, i) => s + parseFloat(i.paidAmount || 0), 0);
  }
  get totalInvoicesBalance(): number {
    return this.invoices.reduce((s, i) => s + parseFloat(i.balance || 0), 0);
  }

  formatAmountInput(event: any, controlName: string, targetForm: FormGroup = this.form): void {
    let inputVal = event.target.value || '';
    const cleanVal = inputVal.replace(/[^0-9.]/g, '');
    if (!cleanVal) {
      event.target.value = '';
      targetForm.get(controlName)?.setValue(null, { emitEvent: false });
      return;
    }

    const parts = cleanVal.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const formatted = parts.join('.');

    event.target.value = formatted;

    const numeric = parseFloat(cleanVal) || 0;
    targetForm.get(controlName)?.setValue(numeric, { emitEvent: false });
  }

  load(): void {
    this.loading = true;
    this.financeSvc.getInvoices(this.projectId).subscribe({
      next: (res: any) => {
        this.invoices = res?.data?.invoices || res?.data?.rows || res?.data || [];
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  loadActivities(): void {
    this.loadingActivities = true;
    this.projectSvc.getActivities(this.projectId).subscribe({
      next: (res: any) => {
        const activities = res?.data?.activities || res?.data?.rows || res?.data || [];
        this.activityOptions = activities
          .map((a: any) => ({ value: a.id, label: (a.name || '').toString().trim() }))
          .filter((o: any) => o.value && o.label);
        this.loadingActivities = false;
      },
      error: () => { this.loadingActivities = false; },
    });
  }

  loadSuppliers(): void {
    this.loadingSuppliers = true;
    this.supplierSvc.getAll().subscribe({
      next: (res: any) => {
        const suppliers = res?.data?.suppliers || res?.data?.rows || res?.data || [];
        this.supplierOptions = suppliers
          .map((s: any) => ({ value: s.id, label: (s.name || '').toString().trim() }))
          .filter((o: any) => o.value && o.label);
        this.loadingSuppliers = false;
      },
      error: () => { this.loadingSuppliers = false; },
    });
  }

  loadLpos(): void {
    this.loadingLpos = true;
    this.projectSvc.getLpos(this.projectId).subscribe({
      next: (res: any) => {
        const lpos = Array.isArray(res.data) ? res.data : (res.data?.rows || res.data?.lpos || res.data || []);
        this.lpos = lpos.filter((l: any) => l.status !== 'cancelled');
        this.lpoOptions = this.lpos.map((l: any) => ({
          value: l.id,
          label: `${l.lpoNo} — ${l.supplier?.name || 'No supplier'} (${(+l.total || 0).toLocaleString()} TZS) [${l.status}]`,
        }));
        this.loadingLpos = false;
      },
      error: () => { this.loadingLpos = false; },
    });
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'Paid': 'status-completed',
      'Partially Paid': 'status-pending',
      'Pending Approval': 'status-pending',
      'Approved': 'status-completed',
      'Overdue': 'status-overdue',
      'Open': 'status-pending',
    };
    return map[status] || 'status-pending';
  }

  formatCurrency(amount: number): string {
    return (+amount || 0).toLocaleString();
  }

  // ══════════════════════════════════════════════════════════
  // NEW / EDIT INVOICE MODAL
  // ══════════════════════════════════════════════════════════

  openAddModal(): void {
    this.editMode = false;
    this.selectedInvoice = null;
    this.form = this.fb.group({
      activityId: [''],
      supplierId: [''],
      lpoId: [''],
      invoiceNo: ['', Validators.required],
      description: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
      currency: ['TZS', Validators.required],
      date: [this.today(), Validators.required],
      dueDate: [''],
      notes: [''],
    });
    this.loadActivities();
    this.loadSuppliers();
    this.loadLpos();
    this.listenLpoChange();
    this.showModal = true;
  }

  openEditModal(inv: any): void {
    this.editMode = true;
    this.selectedInvoice = inv;
    this.form = this.fb.group({
      activityId: [inv.activityId || ''],
      supplierId: [inv.supplierId || inv.supplier?.id || ''],
      lpoId: [inv.lpoId || inv.lpo?.id || ''],
      invoiceNo: [inv.invoiceNo, Validators.required],
      description: [inv.description, Validators.required],
      amount: [inv.amount, [Validators.required, Validators.min(1)]],
      currency: [inv.currency || 'TZS', Validators.required],
      date: [inv.date, Validators.required],
      dueDate: [inv.dueDate || ''],
      notes: [inv.notes || ''],
    });
    this.loadActivities();
    this.loadSuppliers();
    this.loadLpos();
    this.listenLpoChange();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  // Ukichagua LPO, supplier inajazwa kiotomatiki kutoka kwa LPO hiyo
  // (kila LPO ina supplier wake maalum — Invoice haipaswi "kubuni" supplier
  // tofauti kwa LPO ile ile).
  private listenLpoChange(): void {
    // Kama tayari lpoId ipo (edit mode), lemaza supplier mara moja
    const initialLpoId = this.form.get('lpoId')?.value;
    if (initialLpoId) {
      this.form.get('supplierId')?.disable({ emitEvent: false });
    }

    this.form.get('lpoId')?.valueChanges.subscribe((lpoId: string) => {
      if (!lpoId) {
        this.form.get('supplierId')?.enable({ emitEvent: false });
        return;
      }
      const lpo = this.lpos.find((l) => l.id === lpoId);
      if (lpo?.supplierId || lpo?.supplier?.id) {
        this.form.get('supplierId')?.setValue(lpo.supplierId || lpo.supplier.id, { emitEvent: false });
        this.form.get('supplierId')?.disable({ emitEvent: false });
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const val = this.form.getRawValue();

    const call = this.editMode && this.selectedInvoice
      ? this.financeSvc.updateInvoice(this.projectId, this.selectedInvoice.id, val)
      : this.financeSvc.createInvoice(this.projectId, val);

    call.subscribe({
      next: (res: any) => {
        this.saving = false;
        this.showModal = false;
        this.load();
        Swal.fire({
          icon: 'success',
          title: res?.message || (this.editMode ? 'Invoice updated!' : 'Invoice created!'),
          timer: 1800,
          showConfirmButton: false,
        });
      },
      error: (err: any) => {
        this.saving = false;
        Swal.fire('Error', err?.error?.message || 'Failed to save invoice.', 'error');
      },
    });
  }

  approve(inv: any): void {
    Swal.fire({
      title: 'Approve Invoice?',
      text: `Approve invoice "${inv.invoiceNo}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, approve',
    }).then((r) => {
      if (!r.isConfirmed) return;
      this.financeSvc.approveInvoice(this.projectId, inv.id).subscribe({
        next: () => {
          this.load();
          Swal.fire({ icon: 'success', title: 'Approved!', timer: 1200, showConfirmButton: false });
        },
        error: (err: any) => Swal.fire('Error', err?.error?.message || 'Failed.', 'error'),
      });
    });
  }

  deleteInvoice(inv: any): void {
    Swal.fire({
      title: 'Delete Invoice?',
      text: `Delete invoice "${inv.invoiceNo}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete!',
    }).then((r) => {
      if (!r.isConfirmed) return;
      this.financeSvc.deleteInvoice(this.projectId, inv.id).subscribe({
        next: () => {
          this.load();
          Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1200, showConfirmButton: false });
        },
        error: (err: any) => Swal.fire('Error', err?.error?.message || 'Failed.', 'error'),
      });
    });
  }

  // ══════════════════════════════════════════════════════════
  // RECORD PAYMENT (sehemu-sehemu) — inafunguka kwa Approved/Partially Paid
  // ══════════════════════════════════════════════════════════

  openPaymentModal(inv: any): void {
    this.paymentInvoice = inv;
    const balance = inv.balance ?? (inv.amount - (inv.paidAmount || 0));
    this.paymentForm = this.fb.group({
      amount: [balance, [Validators.required, Validators.min(0.01), Validators.max(balance)]],
      date: [this.today(), Validators.required],
      notes: [''],
    });
    this.loadPaymentHistory(inv.id);
    this.showPaymentModal = true;
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.paymentInvoice = null;
    this.paymentHistory = [];
  }

  loadPaymentHistory(invoiceId: string): void {
    this.loadingHistory = true;
    this.financeSvc.getInvoicePayments(this.projectId, invoiceId).subscribe({
      next: (res: any) => {
        this.paymentHistory = res?.data?.payments || [];
        this.loadingHistory = false;
      },
      error: () => { this.loadingHistory = false; },
    });
  }

  get remainingBalance(): number {
    if (!this.paymentInvoice) return 0;
    return this.paymentInvoice.balance ?? (this.paymentInvoice.amount - (this.paymentInvoice.paidAmount || 0));
  }

  submitPayment(): void {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }
    this.recordingPayment = true;
    this.financeSvc.recordInvoicePayment(this.projectId, this.paymentInvoice.id, this.paymentForm.value).subscribe({
      next: (res: any) => {
        this.recordingPayment = false;
        // Sasisha invoice iliyo modal ndani (bila kufunga modal) ili
        // uendelee kuona historia mpya papo hapo
        this.paymentInvoice = res?.data?.invoice || this.paymentInvoice;
        this.paymentForm.reset({ amount: this.remainingBalance, date: this.today(), notes: '' });
        this.loadPaymentHistory(this.paymentInvoice.id);
        this.load();
        Swal.fire({
          icon: 'success',
          title: res?.message || 'Payment recorded!',
          timer: 2500,
          showConfirmButton: false,
        });
      },
      error: (err: any) => {
        this.recordingPayment = false;
        Swal.fire('Error', err?.error?.message || 'Failed to record payment.', 'error');
      },
    });
  }

  // ══════════════════════════════════════════════════════════
  // EDIT / DELETE rekodi binafsi ya InvoicePayment (kwenye historia)
  // ══════════════════════════════════════════════════════════

  startEditPayment(p: any): void {
    this.editingPaymentId = p.id;
    this.editPaymentForm = this.fb.group({
      amount: [p.amount, [Validators.required, Validators.min(0.01)]],
      date: [p.date, Validators.required],
      notes: [p.notes || ''],
    });
  }

  cancelEditPayment(): void {
    this.editingPaymentId = null;
  }

  saveEditPayment(paymentId: string): void {
    if (this.editPaymentForm.invalid) {
      this.editPaymentForm.markAllAsTouched();
      return;
    }
    this.savingEditPayment = true;
    this.financeSvc
      .updateInvoicePayment(this.projectId, this.paymentInvoice.id, paymentId, this.editPaymentForm.value)
      .subscribe({
        next: (res: any) => {
          this.savingEditPayment = false;
          this.editingPaymentId = null;
          this.paymentInvoice = res?.data?.invoice || this.paymentInvoice;
          this.loadPaymentHistory(this.paymentInvoice.id);
          this.load();
          Swal.fire({ icon: 'success', title: 'Payment record updated!', timer: 1500, showConfirmButton: false });
        },
        error: (err: any) => {
          this.savingEditPayment = false;
          Swal.fire('Error', err?.error?.message || 'Failed to update payment record.', 'error');
        },
      });
  }

  deletePaymentRecord(p: any): void {
    Swal.fire({
      title: 'Delete Payment Record?',
      text: `Remove this payment of ${this.formatCurrency(p.amount)} TZS from the history? The invoice balance will increase accordingly.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete!',
    }).then((r) => {
      if (!r.isConfirmed) return;
      this.financeSvc.deleteInvoicePayment(this.projectId, this.paymentInvoice.id, p.id).subscribe({
        next: (res: any) => {
          this.paymentInvoice = res?.data?.invoice || this.paymentInvoice;
          this.loadPaymentHistory(this.paymentInvoice.id);
          this.load();
          Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1200, showConfirmButton: false });
        },
        error: (err: any) => Swal.fire('Error', err?.error?.message || 'Failed.', 'error'),
      });
    });
  }
}

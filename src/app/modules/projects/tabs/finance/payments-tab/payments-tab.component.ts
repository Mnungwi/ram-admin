import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FinanceService, ProjectService, TechnicianService } from '../../../../../core/services/domain.services'; // rekebisha idadi ya '../'
import { SearchableSelectComponent } from '../../../../../shared/components/searchable-select/searchable-select.component'; // BADILISHA path/jina
import Swal from 'sweetalert2';

@Component({
  selector: 'app-payments-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SearchableSelectComponent],
  templateUrl: './payments-tab.component.html',
  styleUrls: ['./payments-tab.component.css'],
})
export class PaymentsTabComponent implements OnChanges {
  @Input() projectId!: string;

  payments: any[] = [];
  loading = false;

  showModal = false;
  editMode = false;
  selectedPayment: any = null;
  form!: FormGroup;
  saving = false;

  activityOptions: { value: string; label: string }[] = [];
  loadingActivities = false;

  technicianOptions: { value: string; label: string }[] = [];
  loadingTechnicians = false;

  constructor(
    private fb: FormBuilder,
    private financeSvc: FinanceService,
    private projectSvc: ProjectService,
    private techSvc: TechnicianService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projectId'] && this.projectId) {
      this.loadPayments();
    }
  }

  get f() {
    return this.form.controls;
  }

  get totalPaymentsAmount(): number {
    return this.payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  }

  formatAmountInput(event: any, controlName: string): void {
    let inputVal = event.target.value || '';
    const cleanVal = inputVal.replace(/[^0-9.]/g, '');
    if (!cleanVal) {
      event.target.value = '';
      this.form.get(controlName)?.setValue(null, { emitEvent: false });
      return;
    }

    const parts = cleanVal.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const formatted = parts.join('.');

    event.target.value = formatted;

    const numeric = parseFloat(cleanVal) || 0;
    this.form.get(controlName)?.setValue(numeric, { emitEvent: false });
  }

  loadPayments(): void {
    this.loading = true;
    this.financeSvc.getPayments(this.projectId).subscribe({
      next: (res: any) => {
        this.payments = res?.data?.payments || res?.data?.rows || res?.data || [];
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

  loadTechnicians(): void {
    this.loadingTechnicians = true;
    this.techSvc.getProjectTechnicians(this.projectId).subscribe({
      next: (res: any) => {
        const assignments = res?.data?.assignments || res?.data?.technicians || [];
        this.technicianOptions = assignments
          .map((a: any) => {
            const tech = a.technician || a;
            const parts = [(tech.name || '').toString().trim()].filter(Boolean);
            if (tech.phone) parts.push(tech.phone);
            return { value: tech.id, label: parts.join(' — ') };
          })
          .filter((o: any) => o.value && o.label);
        this.loadingTechnicians = false;
      },
      error: () => { this.loadingTechnicians = false; },
    });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'Paid': 'status-completed',
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

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  // ══════════════════════════════════════════════════════════
  // MODAL
  // ══════════════════════════════════════════════════════════

  openAddModal(): void {
    this.editMode = false;
    this.selectedPayment = null;
    this.form = this.fb.group({
      activityId: ['', Validators.required],
      paidTo: ['', Validators.required],
      description: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
      currency: ['TZS', Validators.required],
      date: [this.today(), Validators.required],
      dueDate: [''],
      status: ['Open', Validators.required],
    });
    this.loadActivities();
    this.loadTechnicians();
    this.showModal = true;
  }

  openEditModal(p: any): void {
    this.editMode = true;
    this.selectedPayment = p;
    this.form = this.fb.group({
      activityId: [p.activityId || '', Validators.required],
      paidTo: [p.paidTo?.id || p.paidTo || '', Validators.required],
      description: [p.description, Validators.required],
      amount: [p.amount, [Validators.required, Validators.min(1)]],
      currency: [p.currency || 'TZS', Validators.required],
      date: [p.date, Validators.required],
      dueDate: [p.dueDate || ''],
      status: [p.status || 'Open', Validators.required],
    });
    this.loadActivities();
    this.loadTechnicians();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const val = this.form.value;

    const call = this.editMode && this.selectedPayment
      ? this.financeSvc.updatePayment(this.projectId, this.selectedPayment.id, val)
      : this.financeSvc.createPayment(this.projectId, val);

    call.subscribe({
      next: (res: any) => {
        this.saving = false;
        this.showModal = false;
        this.loadPayments();
        Swal.fire({
          icon: 'success',
          title: res?.message || (this.editMode ? 'Payment updated!' : 'Payment recorded!'),
          timer: 1800,
          showConfirmButton: false,
        });
      },
      error: (err: any) => {
        this.saving = false;
        Swal.fire('Error', err?.error?.message || 'Failed to save payment.', 'error');
      },
    });
  }

  deletePayment(p: any): void {
    Swal.fire({
      title: 'Delete Payment?',
      text: `Delete this payment of ${this.formatCurrency(p.amount)} TZS?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete!',
    }).then((r) => {
      if (!r.isConfirmed) return;
      this.financeSvc.deletePayment(this.projectId, p.id).subscribe({
        next: () => {
          this.loadPayments();
          Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1200, showConfirmButton: false });
        },
        error: (err: any) => Swal.fire('Error', err?.error?.message || 'Failed.', 'error'),
      });
    });
  }

  markAsPaid(p: any): void {
    Swal.fire({
      title: 'Mark as Paid?',
      text: `Confirm that ${this.formatCurrency(p.amount)} TZS has been paid to ${p.paidTo?.name || 'the technician'}.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      confirmButtonText: 'Yes, mark as paid',
    }).then((r) => {
      if (!r.isConfirmed) return;
      this.financeSvc.updatePayment(this.projectId, p.id, { status: 'Paid' }).subscribe({
        next: () => {
          this.loadPayments();
          Swal.fire({ icon: 'success', title: 'Marked as Paid!', timer: 1500, showConfirmButton: false });
        },
        error: (err: any) => Swal.fire('Error', err?.error?.message || 'Failed.', 'error'),
      });
    });
  }
}

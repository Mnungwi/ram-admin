import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FinanceService, ProjectService } from '../../../../../core/services/domain.services'; // rekebisha idadi ya '../'
import { SearchableSelectComponent } from '../../../../../shared/components/searchable-select/searchable-select.component'; // BADILISHA path/jina
import Swal from 'sweetalert2';

@Component({
  selector: 'app-expenses-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SearchableSelectComponent],
  templateUrl: './expenses-tab.component.html',
  styleUrls: ['./expenses-tab.component.css'],
})
export class ExpensesTabComponent implements OnChanges {
  @Input() projectId!: string;

  expenses: any[] = [];
  loading = false;

  showModal = false;
  editMode = false;
  selectedExpense: any = null;
  form!: FormGroup;
  saving = false;

  activityOptions: { value: string; label: string }[] = [];
  loadingActivities = false;

  categoryOptions: { value: string; label: string }[] = [];
  loadingCategories = false;

  // Quick-add category
  showCategoryModal = false;
  newCategoryName = '';
  savingCategory = false;

  constructor(
    private fb: FormBuilder,
    private financeSvc: FinanceService,
    private projectSvc: ProjectService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projectId'] && this.projectId) {
      this.load();
    }
  }

  get f() {
    return this.form.controls;
  }

  get totalExpensesAmount(): number {
    return this.expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
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

  load(): void {
    this.loading = true;
    this.financeSvc.getExpenses(this.projectId).subscribe({
      next: (res: any) => {
        this.expenses = res?.data?.expenses || res?.data?.rows || res?.data || [];
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

  loadCategories(): void {
    this.loadingCategories = true;
    this.financeSvc.getExpenseCategories().subscribe({
      next: (res: any) => {
        const categories = res?.data?.categories || res?.data?.rows || res?.data || [];
        this.categoryOptions = categories
          .map((c: any) => ({ value: c.id, label: (c.name || '').toString().trim() }))
          .filter((o: any) => o.value && o.label);
        this.loadingCategories = false;
      },
      error: () => { this.loadingCategories = false; },
    });
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  openAddModal(): void {
    this.editMode = false;
    this.selectedExpense = null;
    this.form = this.fb.group({
      activityId: [''],
      categoryId: ['', Validators.required],
      description: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
      date: [this.today(), Validators.required],
      notes: [''],
    });
    this.loadActivities();
    this.loadCategories();
    this.showModal = true;
  }

  openEditModal(exp: any): void {
    this.editMode = true;
    this.selectedExpense = exp;
    this.form = this.fb.group({
      activityId: [exp.activityId || ''],
      categoryId: [exp.categoryId || '', Validators.required],
      description: [exp.description, Validators.required],
      amount: [exp.amount, [Validators.required, Validators.min(1)]],
      date: [exp.date, Validators.required],
      notes: [exp.notes || ''],
    });
    this.loadActivities();
    this.loadCategories();
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

    const call = this.editMode && this.selectedExpense
      ? this.financeSvc.updateExpense(this.projectId, this.selectedExpense.id, val)
      : this.financeSvc.createExpense(this.projectId, val);

    call.subscribe({
      next: (res: any) => {
        this.saving = false;
        this.showModal = false;
        this.load();
        Swal.fire({
          icon: 'success',
          title: res?.message || (this.editMode ? 'Expense updated!' : 'Expense recorded!'),
          timer: 1800,
          showConfirmButton: false,
        });
      },
      error: (err: any) => {
        this.saving = false;
        Swal.fire('Error', err?.error?.message || 'Failed to save expense.', 'error');
      },
    });
  }

  deleteExpense(exp: any): void {
    Swal.fire({
      title: 'Delete Expense?',
      text: `Delete "${exp.description}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete!',
    }).then((r) => {
      if (!r.isConfirmed) return;
      this.financeSvc.deleteExpense(this.projectId, exp.id).subscribe({
        next: () => {
          this.load();
          Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1200, showConfirmButton: false });
        },
        error: (err: any) => Swal.fire('Error', err?.error?.message || 'Failed.', 'error'),
      });
    });
  }

  // ══════════════════════════════════════════════════════════
  // QUICK-ADD CATEGORY (bila kutoka kwenye "New Expense" modal)
  // ══════════════════════════════════════════════════════════

  openCategoryModal(): void {
    this.newCategoryName = '';
    this.showCategoryModal = true;
  }

  closeCategoryModal(): void {
    this.showCategoryModal = false;
  }

  saveNewCategory(): void {
    if (!this.newCategoryName.trim()) return;
    this.savingCategory = true;
    this.financeSvc.createExpenseCategory({ name: this.newCategoryName.trim() }).subscribe({
      next: (res: any) => {
        this.savingCategory = false;
        this.showCategoryModal = false;
        this.loadCategories();
        const newCat = res?.data?.category;
        if (newCat) {
          this.form.patchValue({ categoryId: newCat.id });
        }
        Swal.fire({ icon: 'success', title: 'Category added!', timer: 1200, showConfirmButton: false });
      },
      error: (err: any) => {
        this.savingCategory = false;
        Swal.fire('Error', err?.error?.message || 'Failed to add category.', 'error');
      },
    });
  }
}

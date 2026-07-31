import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FinanceService } from '../../core/services/domain.services'; // rekebisha idadi ya '../' kulingana na kina cha folder yako
import { AuthService } from '../../core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-expense-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './expense-categories.component.html',
  styleUrls: ['./expense-categories.component.css'],
})
export class ExpenseCategoriesComponent implements OnInit {
  categories: any[] = [];
  filteredCategories: any[] = [];
  searchTerm = '';
  loading = false;

  showModal = false;
  editMode = false;
  selectedCategory: any = null;
  form!: FormGroup;
  saving = false;

  // Pagination
  currentPage = 1;
  pageSize = 15;
  totalPages = 1;

  get paginatedCategories(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredCategories.slice(start, start + this.pageSize);
  }

  get totalCount()  { return this.categories.length; }
  get activeCount() { return this.categories.filter(c => c.isActive).length; }

  constructor(
    private fb: FormBuilder,
    private financeSvc: FinanceService,
    public auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.financeSvc.getExpenseCategories().subscribe({
      next: (res: any) => {
        this.categories = res?.data?.categories || res?.data?.rows || res?.data || [];
        this.applyFilter();
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredCategories = !term
      ? [...this.categories]
      : this.categories.filter((c) => c.name?.toLowerCase().includes(term));
    this.totalPages = Math.ceil(this.filteredCategories.length / this.pageSize) || 1;
    this.currentPage = 1;
  }

  get f() {
    return this.form.controls;
  }

  // ══════════════════════════════════════════════════════════
  // MODAL
  // ══════════════════════════════════════════════════════════

  openAddModal(): void {
    this.editMode = false;
    this.selectedCategory = null;
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
    });
    this.showModal = true;
  }

  openEditModal(cat: any): void {
    this.editMode = true;
    this.selectedCategory = cat;
    this.form = this.fb.group({
      name: [cat.name, [Validators.required, Validators.maxLength(100)]],
    });
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
    const call = this.editMode && this.selectedCategory
      ? this.financeSvc.updateExpenseCategory(this.selectedCategory.id, this.form.value)
      : this.financeSvc.createExpenseCategory(this.form.value);

    call.subscribe({
      next: (res: any) => {
        this.saving = false;
        this.closeModal();
        this.load();
        Swal.fire({
          icon: 'success',
          title: res?.message || (this.editMode ? 'Updated!' : 'Created!'),
          timer: 1500,
          showConfirmButton: false,
        });
      },
      error: (err: any) => {
        this.saving = false;
        Swal.fire('Error', err?.error?.message || 'Failed to save category.', 'error');
      },
    });
  }

  deleteCategory(cat: any): void {
    Swal.fire({
      title: 'Delete Category?',
      text: `Delete "${cat.name}"? This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete!',
    }).then((r) => {
      if (!r.isConfirmed) return;
      this.financeSvc.deleteExpenseCategory(cat.id).subscribe({
        next: () => {
          this.load();
          Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1200, showConfirmButton: false });
        },
        error: (err: any) => {
          // Backend inazuia delete kama kuna expenses zinazoitumia category hii
          Swal.fire('Error', err?.error?.message || 'Failed to delete category.', 'error');
        },
      });
    });
  }

  // ══════════════════════════════════════════════════════════
  // Helpers
  // ══════════════════════════════════════════════════════════

  changePage(p: number) { if (p >= 1 && p <= this.totalPages) this.currentPage = p; }
  getPages(): number[]  { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SupplierService } from '../../core/services/domain.services';
import { AuthService } from '../../core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './suppliers.component.html',
  styleUrls: ['./suppliers.component.css'],
})
export class SuppliersComponent implements OnInit {
  suppliers: any[] = [];
  filteredSuppliers: any[] = [];
  categories: string[] = [];
  loading = false;
  searchTerm = '';
  categoryFilter = '';
  showModal = false;
  editMode = false;
  selectedSupplier: any = null;
  form!: FormGroup;
  saving = false;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  get paginatedSuppliers(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredSuppliers.slice(start, start + this.pageSize);
  }

  get activeCount()   { return this.suppliers.filter(s => s.isActive).length; }
  get inactiveCount() { return this.suppliers.filter(s => !s.isActive).length; }

  constructor(
    private fb: FormBuilder,
    private supplierSvc: SupplierService,
    public auth: AuthService,
  ) {}

  ngOnInit() {
    this.loadSuppliers();
  }

  loadSuppliers() {
    this.loading = true;
    this.supplierSvc.getAll().subscribe({
      next: (res: any) => {
        this.suppliers = res.data?.suppliers || res.data || [];
        // Extract unique categories
        this.categories = [...new Set(
          this.suppliers.map(s => s.category).filter(Boolean)
        )].sort() as string[];
        this.applyFilters();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  applyFilters() {
    this.filteredSuppliers = this.suppliers.filter(s => {
      const term = this.searchTerm.toLowerCase();
      const matchSearch = !term ||
        s.name?.toLowerCase().includes(term) ||
        s.email?.toLowerCase().includes(term) ||
        s.phone?.toLowerCase().includes(term) ||
        s.category?.toLowerCase().includes(term) ||
        s.taxNumber?.toLowerCase().includes(term);
      const matchCat = !this.categoryFilter || s.category === this.categoryFilter;
      return matchSearch && matchCat;
    });
    this.totalPages = Math.ceil(this.filteredSuppliers.length / this.pageSize);
    this.currentPage = 1;
  }

  initForm(s?: any) {
    this.form = this.fb.group({
      name:        [s?.name        || '', [Validators.required, Validators.minLength(2)]],
      email:       [s?.email       || '', [Validators.email]],
      phone:       [s?.phone       || ''],
      address:     [s?.address     || ''],
      category:    [s?.category    || ''],
      taxNumber:   [s?.taxNumber   || ''],
      bankDetails: [s?.bankDetails || ''],
      notes:       [s?.notes       || ''],
      isActive:    [s?.isActive    ?? true],
    });
  }

  openAddModal() {
    this.editMode = false;
    this.selectedSupplier = null;
    this.initForm();
    this.showModal = true;
  }

  openEditModal(s: any) {
    this.editMode = true;
    this.selectedSupplier = s;
    this.initForm(s);
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedSupplier = null;
  }

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const val = this.form.value;

    if (this.editMode && this.selectedSupplier) {
      this.supplierSvc.update(this.selectedSupplier.id, val).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.loadSuppliers();
          Swal.fire({ icon: 'success', title: 'Supplier Updated!', timer: 1500, showConfirmButton: false });
        },
        error: (err: any) => {
          this.saving = false;
          Swal.fire({ icon: 'error', title: 'Error', text: err?.error?.message || 'Failed to update.' });
        }
      });
    } else {
      this.supplierSvc.create(val).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.loadSuppliers();
          Swal.fire({ icon: 'success', title: 'Supplier Added!', timer: 1500, showConfirmButton: false });
        },
        error: (err: any) => {
          this.saving = false;
          Swal.fire({ icon: 'error', title: 'Error', text: err?.error?.message || 'Failed to add.' });
        }
      });
    }
  }

  deleteSupplier(s: any) {
    Swal.fire({
      title: 'Delete Supplier?',
      text: `Delete "${s.name}"? This will deactivate the supplier.`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444', confirmButtonText: 'Yes, delete!'
    }).then(r => {
      if (r.isConfirmed) {
        this.supplierSvc.delete(s.id).subscribe({
          next: () => {
            this.loadSuppliers();
            Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1200, showConfirmButton: false });
          },
          error: (err: any) => {
            Swal.fire({ icon: 'error', title: 'Cannot Delete', text: err?.error?.message || 'Failed.' });
          }
        });
      }
    });
  }

  getInitials(name: string): string {
    return name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  }

  getAvatarColor(name: string): string {
    const colors = ['#1a56db','#7c3aed','#059669','#ea580c','#dc2626','#0891b2','#ca8a04'];
    const idx = (name?.charCodeAt(0) || 0) % colors.length;
    return colors[idx];
  }

  changePage(p: number) {
    if (p >= 1 && p <= this.totalPages) this.currentPage = p;
  }

  getPages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get f() { return this.form.controls; }
  get Math() { return Math; }
}

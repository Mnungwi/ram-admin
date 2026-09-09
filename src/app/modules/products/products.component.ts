import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CKEditorModule } from 'ng2-ckeditor';
import { CKEDITOR_CONFIG } from '../../shared/utils/ckeditor-config';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  ProductService,
  UnitService,
} from '../../core/services/domain.services';
import { AuthService } from '../../core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CKEditorModule],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css'],
})
export class ProductsComponent implements OnInit {
  ckeditorConfig = CKEDITOR_CONFIG;
  // ── Categories ───────────────────────────────────────────
  categories: any[] = [];
  selectedCategory: any = null;
  loadingCats = false;
  showCatModal = false;
  editCatMode = false;
  selectedCatEdit: any = null;
  catForm!: FormGroup;
  savingCat = false;

  // ── Units ────────────────────────────────────────────────
  units: any[] = [];
  filteredUnits: any[] = [];
  unitCategories: string[] = [];
  selectedUnitCategory = '';
  loadingUnits = false;
  showUnitModal = false;
  editUnitMode = false;
  selectedUnitEdit: any = null;
  unitForm!: FormGroup;
  savingUnit = false;

  // ── Products ─────────────────────────────────────────────
  products: any[] = [];
  filteredProducts: any[] = [];
  searchTerm = '';
  loadingProducts = false;
  showProductModal = false;
  editProductMode = false;
  selectedProductEdit: any = null;
  productForm!: FormGroup;
  savingProduct = false;

  // Pagination
  currentPage = 1;
  pageSize = 15;
  totalPages = 1;

  get paginatedProducts(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredProducts.slice(start, start + this.pageSize);
  }

  get activeProducts() {
    return this.products.filter((p) => p.isActive).length;
  }
  get inactiveProducts() {
    return this.products.filter((p) => !p.isActive).length;
  }
  get categoryCount() {
    return this.categories.length;
  }
  get unitCount() {
    return this.units.length;
  }

  constructor(
    private fb: FormBuilder,
    private productSvc: ProductService,
    private unitSvc: UnitService,
    public auth: AuthService,
  ) {}

  ngOnInit() {
    this.loadCategories();
    this.loadUnits();
    this.loadProducts();
  }

  // ── CATEGORIES ────────────────────────────────────────────
  loadCategories() {
    this.loadingCats = true;
    this.productSvc.getCategories().subscribe({
      next: (res: any) => {
        this.categories = res.data?.categories || [];
        this.loadingCats = false;
      },
      error: () => {
        this.loadingCats = false;
      },
    });
  }

  selectCategory(cat: any) {
    this.selectedCategory = this.selectedCategory?.id === cat.id ? null : cat;
    this.applyFilters();
  }

  initCatForm(c?: any) {
    this.catForm = this.fb.group({
      name: [c?.name || '', Validators.required],
      description: [c?.description || ''],
    });
  }

  openAddCat() {
    this.editCatMode = false;
    this.selectedCatEdit = null;
    this.initCatForm();
    this.showCatModal = true;
  }
  openEditCat(c: any) {
    this.editCatMode = true;
    this.selectedCatEdit = c;
    this.initCatForm(c);
    this.showCatModal = true;
  }
  closeCatModal() {
    this.showCatModal = false;
    this.selectedCatEdit = null;
  }

  onSubmitCat() {
    if (this.catForm.invalid) {
      this.catForm.markAllAsTouched();
      return;
    }
    this.savingCat = true;
    const val = this.catForm.value;
    const call =
      this.editCatMode && this.selectedCatEdit
        ? this.productSvc.updateCategory(this.selectedCatEdit.id, val)
        : this.productSvc.createCategory(val);
    call.subscribe({
      next: () => {
        this.savingCat = false;
        this.closeCatModal();
        this.loadCategories();
        Swal.fire({
          icon: 'success',
          title: this.editCatMode ? 'Updated!' : 'Created!',
          timer: 1500,
          showConfirmButton: false,
        });
      },
      error: (err: any) => {
        this.savingCat = false;
        Swal.fire('Error', err?.error?.message || 'Failed.', 'error');
      },
    });
  }

  deleteCat(c: any) {
    Swal.fire({
      title: 'Delete Category?',
      text: `Delete "${c.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete!',
    }).then((r) => {
      if (r.isConfirmed)
        this.productSvc.deleteCategory(c.id).subscribe({
          next: () => {
            this.loadCategories();
            if (this.selectedCategory?.id === c.id) {
              this.selectedCategory = null;
              this.applyFilters();
            }
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

  getCategoryProductCount(catId: string): number {
    return this.products.filter((p) => p.categoryId === catId).length;
  }

  // ── UNITS ─────────────────────────────────────────────────
  loadUnits() {
    this.loadingUnits = true;
    this.unitSvc.getAll().subscribe({
      next: (res: any) => {
        this.units = res.data?.units || [];
        // Extract unique categories from DB
        this.unitCategories = [
          ...new Set(this.units.map((u: any) => u.category).filter(Boolean)),
        ].sort() as string[];
        this.filterUnits();
        this.loadingUnits = false;
      },
      error: () => {
        this.loadingUnits = false;
      },
    });
  }

  filterUnits() {
    this.filteredUnits = this.selectedUnitCategory
      ? this.units.filter((u) => u.category === this.selectedUnitCategory)
      : this.units;
  }

  initUnitForm(u?: any) {
    this.unitForm = this.fb.group({
      name: [u?.name || '', Validators.required],
      abbreviation: [u?.abbreviation || ''],
      category: [u?.category || 'count', Validators.required],
      description: [u?.description || ''],
    });
  }

  openAddUnit() {
    this.editUnitMode = false;
    this.selectedUnitEdit = null;
    this.initUnitForm();
    this.showUnitModal = true;
  }
  openEditUnit(u: any) {
    this.editUnitMode = true;
    this.selectedUnitEdit = u;
    this.initUnitForm(u);
    this.showUnitModal = true;
  }
  closeUnitModal() {
    this.showUnitModal = false;
    this.selectedUnitEdit = null;
  }

  onSubmitUnit() {
    if (this.unitForm.invalid) {
      this.unitForm.markAllAsTouched();
      return;
    }
    this.savingUnit = true;
    const val = this.unitForm.value;
    const call =
      this.editUnitMode && this.selectedUnitEdit
        ? this.unitSvc.update(this.selectedUnitEdit.id, val)
        : this.unitSvc.create(val);
    call.subscribe({
      next: () => {
        this.savingUnit = false;
        this.closeUnitModal();
        this.loadUnits();
        Swal.fire({
          icon: 'success',
          title: this.editUnitMode ? 'Updated!' : 'Created!',
          timer: 1500,
          showConfirmButton: false,
        });
      },
      error: (err: any) => {
        this.savingUnit = false;
        Swal.fire('Error', err?.error?.message || 'Failed.', 'error');
      },
    });
  }

  deleteUnit(u: any) {
    Swal.fire({
      title: 'Delete Unit?',
      text: `Delete "${u.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete!',
    }).then((r) => {
      if (r.isConfirmed)
        this.unitSvc.delete(u.id).subscribe({
          next: () => {
            this.loadUnits();
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

  getUnitCategoryColor(cat: string): string {
    const m: any = {
      volume: '#0891b2',
      weight: '#7c3aed',
      length: '#ea580c',
      area: '#16a34a',
      count: '#1a56db',
      time: '#ca8a04',
      other: '#6b7280',
    };
    return m[cat] || '#6b7280';
  }

  // ── PRODUCTS ──────────────────────────────────────────────
  loadProducts() {
    this.loadingProducts = true;
    this.productSvc.getAll().subscribe({
      next: (res: any) => {
        this.products = res.data?.products || [];
        this.applyFilters();
        this.loadingProducts = false;
      },
      error: () => {
        this.loadingProducts = false;
      },
    });
  }

  applyFilters() {
    let list = [...this.products];
    if (this.selectedCategory)
      list = list.filter((p) => p.categoryId === this.selectedCategory.id);
    if (this.searchTerm) {
      const s = this.searchTerm.toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(s) ||
          p.code?.toLowerCase().includes(s) ||
          p.description?.toLowerCase().includes(s),
      );
    }
    this.filteredProducts = list;
    this.totalPages =
      Math.ceil(this.filteredProducts.length / this.pageSize) || 1;
    this.currentPage = 1;
  }

  initProductForm(p?: any) {
    this.productForm = this.fb.group({
      name: [p?.name || '', Validators.required],
      code: [p?.code || ''],
      description: [p?.description || ''],
      categoryId: [p?.categoryId || ''],
      unitId: [p?.unitId || p?.uom?.id || ''],
      purchaseUnit: [p?.purchaseUnit || ''],
      issueUnit: [p?.issueUnit || 'Pcs'],
      conversionFactor: [p?.conversionFactor || 1],
      unitPrice: [p?.unitPrice || ''],
      isActive: [p?.isActive ?? true],
    });
  }

  openAddProduct() {
    this.editProductMode = false;
    this.selectedProductEdit = null;
    this.initProductForm();
    this.showProductModal = true;
  }
  openEditProduct(p: any) {
    this.editProductMode = true;
    this.selectedProductEdit = p;
    this.initProductForm(p);
    this.showProductModal = true;
  }
  closeProductModal() {
    this.showProductModal = false;
    this.selectedProductEdit = null;
  }

  onSubmitProduct() {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }
    this.savingProduct = true;
    const val = this.productForm.value;
    const call =
      this.editProductMode && this.selectedProductEdit
        ? this.productSvc.update(this.selectedProductEdit.id, val)
        : this.productSvc.create(val);
    call.subscribe({
      next: () => {
        this.savingProduct = false;
        this.closeProductModal();
        this.loadProducts();
        Swal.fire({
          icon: 'success',
          title: this.editProductMode ? 'Product Updated!' : 'Product Created!',
          timer: 1500,
          showConfirmButton: false,
        });
      },
      error: (err: any) => {
        this.savingProduct = false;
        Swal.fire('Error', err?.error?.message || 'Failed.', 'error');
      },
    });
  }

  deleteProduct(p: any) {
    Swal.fire({
      title: 'Delete Product?',
      text: `Delete "${p.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete!',
    }).then((r) => {
      if (r.isConfirmed)
        this.productSvc.delete(p.id).subscribe({
          next: () => {
            this.loadProducts();
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

  getUnitName(unitId: string): string {
    const u = this.units.find((u) => u.id === unitId);
    return u ? `${u.name} (${u.abbreviation || u.name})` : '—';
  }

  formatCurrency(n: number): string {
    return new Intl.NumberFormat('sw-TZ', {
      style: 'currency',
      currency: 'TZS',
      maximumFractionDigits: 0,
    }).format(n || 0);
  }

  changePage(p: number) {
    if (p >= 1 && p <= this.totalPages) this.currentPage = p;
  }
  getPages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get cf() {
    return this.catForm?.controls;
  }
  get uf() {
    return this.unitForm?.controls;
  }
  get pf() {
    return this.productForm?.controls;
  }
  get Math() {
    return Math;
  }
}

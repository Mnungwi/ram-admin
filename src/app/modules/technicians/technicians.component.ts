import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TechnicianService } from '../../core/services/domain.services';
import { AuthService } from '../../core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-technicians',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './technicians.component.html',
  styleUrls: ['./technicians.component.css'],
})
export class TechniciansComponent implements OnInit {

  // ── Categories ────────────────────────────────────────────
  categories: any[] = [];
  selectedCategory: any = null;
  loadingCats = false;
  showCatModal = false;
  editCatMode = false;
  selectedCatEdit: any = null;
  catForm!: FormGroup;
  savingCat = false;

  // ── Technicians ───────────────────────────────────────────
  technicians: any[] = [];
  filteredTechnicians: any[] = [];
  searchTerm = '';
  loadingTech = false;
  showTechModal = false;
  editTechMode = false;
  selectedTechEdit: any = null;
  techForm!: FormGroup;
  savingTech = false;

  // ── Detail View ───────────────────────────────────────────
  selectedTech: any = null;
  receipts: any[] = [];
  loadingReceipts = false;
  view: 'list' | 'detail' = 'list';

  // Pagination
  currentPage = 1;
  pageSize = 15;
  totalPages = 1;

  idTypes = ['NIDA', 'Passport', 'Driving License', 'Voter ID', 'Other'];

  get paginatedTechnicians(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredTechnicians.slice(start, start + this.pageSize);
  }

  get totalCount()  { return this.technicians.length; }
  get activeCount() { return this.technicians.filter(t => t.isActive).length; }
  get catCount()    { return this.categories.length; }

  constructor(
    private fb: FormBuilder,
    private techSvc: TechnicianService,
    public auth: AuthService,
  ) {}

  ngOnInit() {
    this.loadCategories();
    this.loadTechnicians();
  }

  // ── CATEGORIES ────────────────────────────────────────────
  loadCategories() {
    this.loadingCats = true;
    this.techSvc.getCategories().subscribe({
      next: (res: any) => {
        this.categories = res.data?.categories || [];
        this.loadingCats = false;
      },
      error: () => { this.loadingCats = false; }
    });
  }

  selectCategory(cat: any) {
    this.selectedCategory = this.selectedCategory?.id === cat.id ? null : cat;
    this.applyFilters();
  }

  initCatForm(c?: any) {
    this.catForm = this.fb.group({ name: [c?.name || '', Validators.required] });
  }

  openAddCat()        { this.editCatMode = false; this.selectedCatEdit = null; this.initCatForm(); this.showCatModal = true; }
  openEditCat(c: any) { this.editCatMode = true; this.selectedCatEdit = c; this.initCatForm(c); this.showCatModal = true; }
  closeCatModal()     { this.showCatModal = false; this.selectedCatEdit = null; }

  onSubmitCat() {
    if (this.catForm.invalid) { this.catForm.markAllAsTouched(); return; }
    this.savingCat = true;
    const call = this.editCatMode && this.selectedCatEdit
      ? this.techSvc.updateCategory(this.selectedCatEdit.id, this.catForm.value)
      : this.techSvc.createCategory(this.catForm.value);
    call.subscribe({
      next: () => { this.savingCat = false; this.closeCatModal(); this.loadCategories(); Swal.fire({ icon: 'success', title: this.editCatMode ? 'Updated!' : 'Created!', timer: 1500, showConfirmButton: false }); },
      error: (err: any) => { this.savingCat = false; Swal.fire('Error', err?.error?.message || 'Failed.', 'error'); }
    });
  }

  deleteCat(c: any) {
    Swal.fire({ title: 'Delete Category?', text: `Delete "${c.name}"?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Yes, delete!' })
      .then(r => { if (r.isConfirmed) this.techSvc.deleteCategory(c.id).subscribe({
        next: () => { this.loadCategories(); if (this.selectedCategory?.id === c.id) { this.selectedCategory = null; this.applyFilters(); } Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1200, showConfirmButton: false }); },
        error: (err: any) => Swal.fire('Error', err?.error?.message || 'Failed.', 'error')
      }); });
  }

  getCategoryCount(catId: string): number {
    return this.technicians.filter(t => t.categoryId === catId).length;
  }

  // ── TECHNICIANS ───────────────────────────────────────────
  loadTechnicians() {
    this.loadingTech = true;
    this.techSvc.getAll().subscribe({
      next: (res: any) => {
        this.technicians = res.data?.technicians || [];
        this.applyFilters();
        this.loadingTech = false;
      },
      error: () => { this.loadingTech = false; }
    });
  }

  applyFilters() {
    let list = [...this.technicians];
    if (this.selectedCategory) list = list.filter(t => t.categoryId === this.selectedCategory.id);
    if (this.searchTerm) {
      const s = this.searchTerm.toLowerCase();
      list = list.filter(t =>
        t.name?.toLowerCase().includes(s) ||
        t.phone?.toLowerCase().includes(s) ||
        t.idNumber?.toLowerCase().includes(s)
      );
    }
    this.filteredTechnicians = list;
    this.totalPages = Math.ceil(this.filteredTechnicians.length / this.pageSize) || 1;
    this.currentPage = 1;
  }

  initTechForm(t?: any) {
    this.techForm = this.fb.group({
      name:       [t?.name       || '', Validators.required],
      categoryId: [t?.categoryId || ''],
      phone:      [t?.phone      || ''],
      idType:     [t?.idType     || ''],
      idNumber:   [t?.idNumber   || ''],
    });
  }

  openAddTech()        { this.editTechMode = false; this.selectedTechEdit = null; this.initTechForm(); this.showTechModal = true; }
  openEditTech(t: any) { this.editTechMode = true; this.selectedTechEdit = t; this.initTechForm(t); this.showTechModal = true; }
  closeTechModal()     { this.showTechModal = false; this.selectedTechEdit = null; }

  onSubmitTech() {
    if (this.techForm.invalid) { this.techForm.markAllAsTouched(); return; }
    this.savingTech = true;
    const val = this.techForm.value;
    const call = this.editTechMode && this.selectedTechEdit
      ? this.techSvc.update(this.selectedTechEdit.id, val)
      : this.techSvc.create(val);
    call.subscribe({
      next: () => { this.savingTech = false; this.closeTechModal(); this.loadTechnicians(); Swal.fire({ icon: 'success', title: this.editTechMode ? 'Updated!' : 'Created!', timer: 1500, showConfirmButton: false }); },
      error: (err: any) => { this.savingTech = false; Swal.fire('Error', err?.error?.message || 'Failed.', 'error'); }
    });
  }

  deleteTech(t: any) {
    Swal.fire({ title: 'Delete Technician?', text: `Delete "${t.name}"?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Yes, delete!' })
      .then(r => { if (r.isConfirmed) this.techSvc.delete(t.id).subscribe({
        next: () => { this.loadTechnicians(); Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1200, showConfirmButton: false }); },
        error: (err: any) => Swal.fire('Error', err?.error?.message || 'Failed.', 'error')
      }); });
  }

  // ── DETAIL VIEW ───────────────────────────────────────────
  openDetail(t: any) {
    this.selectedTech = t;
    this.view = 'detail';
    this.loadReceipts(t.id);
  }

  loadReceipts(technicianId: string) {
    this.loadingReceipts = true;
    this.techSvc.getReceipts(technicianId).subscribe({
      next: (res: any) => {
        this.receipts = Array.isArray(res.data) ? res.data : res.data?.rows || [];
        this.loadingReceipts = false;
      },
      error: () => { this.loadingReceipts = false; }
    });
  }

  // ── Receipt Tracker ───────────────────────────────────────
  showReceiptTrackerModal = false;
  allReceipts: any[] = [];
  loadingAllReceipts = false;
  receiptSearch = '';

  get filteredAllReceipts(): any[] {
    if (!this.receiptSearch) return this.allReceipts;
    const s = this.receiptSearch.toLowerCase();
    return this.allReceipts.filter(r =>
      r.receiptNo?.toLowerCase().includes(s) ||
      r.description?.toLowerCase().includes(s) ||
      r.technician?.name?.toLowerCase().includes(s) ||
      r.project?.name?.toLowerCase().includes(s) ||
      r.project?.projectCode?.toLowerCase().includes(s)
    );
  }

  openReceiptTracker() {
    this.showReceiptTrackerModal = true;
    this.loadingAllReceipts = true;
    this.techSvc.getReceipts('all').subscribe({
      next: (res: any) => {
        this.allReceipts = Array.isArray(res.data) ? res.data : res.data?.rows || [];
        this.loadingAllReceipts = false;
      },
      error: () => { this.loadingAllReceipts = false; }
    });
  }

  closeReceiptTracker() {
    this.showReceiptTrackerModal = false;
  }

  // ── Helpers ───────────────────────────────────────────────
  getCategoryName(catId: string): string {
    return this.categories.find(c => c.id === catId)?.name || '—';
  }

  changePage(p: number) { if (p >= 1 && p <= this.totalPages) this.currentPage = p; }
  getPages(): number[]  { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }
  get cf()   { return this.catForm?.controls; }
  get tf()   { return this.techForm?.controls; }
  get Math() { return Math; }
}

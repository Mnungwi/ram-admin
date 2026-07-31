import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  StoreService,
  TechnicianService,
} from '../../../../../core/services/domain.services'; // rekebisha idadi ya '../' kulingana na kina cha folder yako
import { SearchableSelectComponent } from '../../../../../shared/components/searchable-select/searchable-select.component'; // BADILISHA path na jina la class kulingana na component yako halisi
import { AuthService } from '../../../../../core/services/auth.service';
import Swal from 'sweetalert2';

interface ProjectStoreItem {
  id: string;
  description: string;
  unit: string;
  quantity: number;
  selected?: boolean;
  quantityToIssue?: number | null;
}

interface TechnicianOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-distribute-to-technician',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SearchableSelectComponent,
  ],
  templateUrl: './distribute-to-technician.component.html',
})
export class DistributeToTechnicianComponent implements OnInit {
  @Input() projectId!: string;
  @Output() distributed = new EventEmitter<void>();

  showModal = false;

  loadingItems = false;
  loadingTechnicians = false;
  submitting = false;

  storeItems: ProjectStoreItem[] = [];
  searchTerm = '';
  technicianOptions: TechnicianOption[] = [];

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private storeService: StoreService,
    private technicianService: TechnicianService,
    public auth: AuthService,
  ) {
    this.form = this.fb.group({
      technicianId: [null, Validators.required],
      notes: [''],
    });
  }

  ngOnInit(): void {}

  get f() {
    return this.form.controls;
  }

  get filteredItems(): ProjectStoreItem[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.storeItems;
    return this.storeItems.filter((i) =>
      i.description.toLowerCase().includes(term),
    );
  }

  get selectedItems(): ProjectStoreItem[] {
    return this.storeItems.filter(
      (i) => i.selected && (i.quantityToIssue || 0) > 0,
    );
  }

  openModal(): void {
    this.showModal = true;
    this.form.reset();
    this.searchTerm = '';
    this.loadStoreItems();
    this.loadTechnicians();
  }

  closeModal(): void {
    this.showModal = false;
  }

  loadStoreItems(): void {
    this.loadingItems = true;
    this.storeService.getProjectStore(this.projectId).subscribe({
      next: (res: any) => {
        const items: ProjectStoreItem[] = res?.data?.items || [];
        this.storeItems = items
          .filter((i) => Number(i.quantity) > 0)
          .map((i) => ({ ...i, selected: false, quantityToIssue: null }));
        this.loadingItems = false;
      },
      error: () => {
        this.loadingItems = false;
      },
    });
  }

  loadTechnicians(): void {
    this.loadingTechnicians = true;
    this.technicianService.getProjectTechnicians(this.projectId).subscribe({
      next: (res: any) => {
        const assignments =
          res?.data?.assignments || res?.data?.technicians || [];
        this.technicianOptions = assignments.map((a: any) => {
          const tech = a.technician || a;
          return {
            value: tech.id,
            label: tech.category?.name
              ? `${tech.name} — ${tech.category.name}`
              : tech.name,
          };
        });
        this.loadingTechnicians = false;
      },
      error: () => {
        this.loadingTechnicians = false;
      },
    });
  }

  onToggleItem(item: ProjectStoreItem): void {
    item.selected = !item.selected;
    if (item.selected && !item.quantityToIssue) {
      item.quantityToIssue = 1;
    }
  }

  canSubmit(): boolean {
    if (this.form.invalid) return false;
    if (this.selectedItems.length === 0) return false;
    return this.selectedItems.every(
      (i) =>
        (i.quantityToIssue || 0) > 0 && (i.quantityToIssue || 0) <= i.quantity,
    );
  }

  submit(): void {
    if (!this.canSubmit() || this.submitting) return;

    this.submitting = true;
    const payload = {
      technicianId: this.form.value.technicianId,
      notes: this.form.value.notes || undefined,
      items: this.selectedItems.map((i) => ({
        storeItemId: i.id,
        quantity: i.quantityToIssue,
      })),
    };

    this.technicianService.distribute(this.projectId, payload).subscribe({
      next: (res: any) => {
        this.submitting = false;
        this.showModal = false;
        Swal.fire({
          icon: 'success',
          title: res?.message || 'Vifaa vimetolewa!',
          timer: 1500,
          showConfirmButton: false,
        });
        this.distributed.emit();
      },
      error: (err: any) => {
        this.submitting = false;
        Swal.fire(
          'Error',
          err?.error?.message || 'Imeshindikana kutoa vifaa',
          'error',
        );
      },
    });
  }
}

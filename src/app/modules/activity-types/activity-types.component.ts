import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule, ReactiveFormsModule,
  FormBuilder, FormGroup, Validators,
} from '@angular/forms';
import { ActivityTypeService } from '../../core/services/domain.services';
import { AuthService } from '../../core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-activity-types',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './activity-types.component.html',
  styleUrls: ['./activity-types.component.css'],
})
export class ActivityTypesComponent implements OnInit {
  types: any[] = [];
  loading = false;
  showModal = false;
  editMode = false;
  selectedType: any = null;
  form!: FormGroup;
  saving = false;

  // Predefined colors for picker
  colors = [
    '#1a56db', '#0891b2', '#7c3aed', '#ca8a04', '#ea580c',
    '#dc2626', '#f59e0b', '#0ea5e9', '#06b6d4', '#10b981',
    '#16a34a', '#8b5cf6', '#ec4899', '#6366f1', '#6b7280',
    '#059669', '#9ca3af',
  ];

  // Predefined icons
  icons = [
    'fa-truck', 'fa-map', 'fa-drafting-compass', 'fa-shopping-cart',
    'fa-hard-hat', 'fa-building', 'fa-bolt', 'fa-water', 'fa-wind',
    'fa-paint-roller', 'fa-leaf', 'fa-vials', 'fa-clipboard-check',
    'fa-file-alt', 'fa-briefcase', 'fa-handshake', 'fa-ellipsis-h',
    'fa-tools', 'fa-cog', 'fa-chart-bar', 'fa-users', 'fa-star',
  ];

  constructor(
    private fb: FormBuilder,
    private actTypeSvc: ActivityTypeService,
    public auth: AuthService,
  ) {}

  ngOnInit() {
    this.loadTypes();
  }

  loadTypes() {
    this.loading = true;
    this.actTypeSvc.getAll().subscribe({
      next: (res: any) => {
        this.types = res.data?.types || [];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  initForm(t?: any) {
    this.form = this.fb.group({
      name:        [t?.name        || '', [Validators.required, Validators.minLength(2)]],
      description: [t?.description || ''],
      color:       [t?.color       || '#6b7280', Validators.required],
      icon:        [t?.icon        || 'fa-ellipsis-h'],
      order:       [t?.order       ?? (this.types.length + 1)],
      isActive:    [t?.isActive    ?? true],
    });
  }

  openAddModal() {
    this.editMode = false;
    this.selectedType = null;
    this.initForm();
    this.showModal = true;
  }

  openEditModal(t: any) {
    this.editMode = true;
    this.selectedType = t;
    this.initForm(t);
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedType = null;
  }

  selectColor(c: string) {
    this.form.patchValue({ color: c });
  }

  selectIcon(i: string) {
    this.form.patchValue({ icon: i });
  }

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const val = this.form.value;

    if (this.editMode && this.selectedType) {
      this.actTypeSvc.update(this.selectedType.id, val).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.loadTypes();
          Swal.fire({ icon: 'success', title: 'Updated!', timer: 1500, showConfirmButton: false });
        },
        error: (err: any) => {
          this.saving = false;
          Swal.fire({ icon: 'error', title: 'Error', text: err?.error?.message || 'Failed to update.' });
        }
      });
    } else {
      this.actTypeSvc.create(val).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.loadTypes();
          Swal.fire({ icon: 'success', title: 'Created!', timer: 1500, showConfirmButton: false });
        },
        error: (err: any) => {
          this.saving = false;
          Swal.fire({ icon: 'error', title: 'Error', text: err?.error?.message || 'Failed to create.' });
        }
      });
    }
  }

  deleteType(t: any) {
    Swal.fire({
      title: 'Deactivate Type?',
      text: `"${t.name}" will be deactivated and hidden from activity forms.`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#ef4444', confirmButtonText: 'Yes, deactivate!'
    }).then(r => {
      if (r.isConfirmed) {
        this.actTypeSvc.delete(t.id).subscribe({
          next: () => {
            this.loadTypes();
            Swal.fire({ icon: 'success', title: 'Deactivated!', timer: 1200, showConfirmButton: false });
          },
          error: (err: any) => {
            Swal.fire({ icon: 'error', title: 'Error', text: err?.error?.message || 'Failed.' });
          }
        });
      }
    });
  }

  get f() { return this.form.controls; }
  get selectedColor() { return this.form?.get('color')?.value || '#6b7280'; }
  get selectedIcon()  { return this.form?.get('icon')?.value  || 'fa-ellipsis-h'; }
}

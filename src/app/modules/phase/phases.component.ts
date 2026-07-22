import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { PhaseService } from '../../core/services/domain.services';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-phases',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './phases.component.html',
  styleUrls: ['./phases.component.css'],
})
export class PhasesComponent implements OnInit {
  phases: any[] = [];
  loading = false;
  showModal = false;
  editMode = false;
  selectedPhase: any = null;
  form!: FormGroup;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private phaseSvc: PhaseService,
  ) {}

  ngOnInit() {
    this.loadPhases();
  }

  loadPhases() {
    this.loading = true;
    this.phaseSvc.getAll().subscribe({
      next: (res: any) => {
        this.phases = res.data?.phases || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  initForm(ph?: any) {
    this.form = this.fb.group({
      name: [ph?.name || '', [Validators.required, Validators.minLength(3)]],
      description: [ph?.description || ''],
      order: [
        ph?.order || this.phases.length + 1,
        [Validators.required, Validators.min(1)],
      ],
    });
  }

  openAddModal() {
    this.editMode = false;
    this.selectedPhase = null;
    this.initForm();
    this.showModal = true;
  }

  openEditModal(ph: any) {
    this.editMode = true;
    this.selectedPhase = ph;
    this.initForm(ph);
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedPhase = null;
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const val = this.form.value;

    if (this.editMode && this.selectedPhase) {
      this.phaseSvc.update(this.selectedPhase.id, val).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.loadPhases();
          Swal.fire({
            icon: 'success',
            title: 'Phase Updated!',
            timer: 1500,
            showConfirmButton: false,
          });
        },
        error: (err: any) => {
          this.saving = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err?.error?.message || 'Failed to update.',
          });
        },
      });
    } else {
      this.phaseSvc.create(val).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.loadPhases();
          Swal.fire({
            icon: 'success',
            title: 'Phase Added!',
            timer: 1500,
            showConfirmButton: false,
          });
        },
        error: (err: any) => {
          this.saving = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err?.error?.message || 'Failed to add.',
          });
        },
      });
    }
  }

  deletePhase(ph: any) {
    Swal.fire({
      title: 'Delete Phase?',
      text: `Delete "${ph.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete!',
    }).then((r) => {
      if (r.isConfirmed) {
        this.phaseSvc.delete(ph.id).subscribe({
          next: () => {
            this.loadPhases();
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              timer: 1200,
              showConfirmButton: false,
            });
          },
          error: (err: any) => {
            Swal.fire({
              icon: 'error',
              title: 'Cannot Delete',
              text: err?.error?.message || 'Failed.',
            });
          },
        });
      }
    });
  }

  get f() {
    return this.form.controls;
  }
}

import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CKEditorModule } from 'ng2-ckeditor';
import { CKEDITOR_CONFIG } from '../../../../../shared/utils/ckeditor-config';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FinanceService } from '../../../../../core/services/domain.services'; // rekebisha idadi ya '../'
import { AuthService } from '../../../../../core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-funding-sources-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CKEditorModule],
  templateUrl: './funding-sources-tab.component.html',
  styleUrls: ['./funding-sources-tab.component.css'],
})
export class FundingSourcesTabComponent implements OnChanges {
  ckeditorConfig = CKEDITOR_CONFIG;
  @Input() projectId!: string;

  fundingSources: any[] = [];
  loading = false;

  showModal = false;
  editMode = false;
  selectedSource: any = null;
  form!: FormGroup;
  saving = false;

  constructor(private fb: FormBuilder, private financeSvc: FinanceService, public auth: AuthService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projectId'] && this.projectId) {
      this.load();
    }
  }

  get f() {
    return this.form.controls;
  }

  load(): void {
    this.loading = true;
    this.financeSvc.getFundingSources(this.projectId).subscribe({
      next: (res: any) => {
        this.fundingSources = res?.data?.sources || res?.data?.rows || res?.data || [];
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  openAddModal(): void {
    this.editMode = false;
    this.selectedSource = null;
    this.form = this.fb.group({
      name: ['', Validators.required],
      type: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
      status: ['Active', Validators.required],
      notes: [''],
    });
    this.showModal = true;
  }

  openEditModal(s: any): void {
    this.editMode = true;
    this.selectedSource = s;
    this.form = this.fb.group({
      name: [s.name, Validators.required],
      type: [s.type, Validators.required],
      amount: [s.amount, [Validators.required, Validators.min(1)]],
      status: [s.status || 'Active', Validators.required],
      notes: [s.notes || ''],
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
    const val = this.form.value;

    const call = this.editMode && this.selectedSource
      ? this.financeSvc.updateFundingSource(this.projectId, this.selectedSource.id, val)
      : this.financeSvc.createFundingSource(this.projectId, val);

    call.subscribe({
      next: (res: any) => {
        this.saving = false;
        this.showModal = false;
        this.load();
        Swal.fire({
          icon: 'success',
          title: res?.message || (this.editMode ? 'Updated!' : 'Funding source added!'),
          timer: 1800,
          showConfirmButton: false,
        });
      },
      error: (err: any) => {
        this.saving = false;
        Swal.fire('Error', err?.error?.message || 'Failed to save funding source.', 'error');
      },
    });
  }

  deleteSource(s: any): void {
    Swal.fire({
      title: 'Delete Funding Source?',
      text: `Delete "${s.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete!',
    }).then((r) => {
      if (!r.isConfirmed) return;
      this.financeSvc.deleteFundingSource(this.projectId, s.id).subscribe({
        next: () => {
          this.load();
          Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1200, showConfirmButton: false });
        },
        error: (err: any) => Swal.fire('Error', err?.error?.message || 'Failed.', 'error'),
      });
    });
  }
}

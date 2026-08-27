import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ProjectService,
  MediaService,
} from '../../../../core/services/domain.services';
import { ClientService } from '../../../../core/services/client.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Project } from '../../../../core/models/index';
import {
  SearchableSelectComponent,
  SelectOption,
} from '../../../../shared/components/searchable-select/searchable-select.component';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import Swal from 'sweetalert2';
import { MediaLibraryModalComponent } from '../../../../shared/components/media-library-modal/media-library-modal.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SearchableSelectComponent,
    MediaLibraryModalComponent,
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
})
export class SettingsComponent implements OnInit {
  projectId = '';
  project: Project | null = null;
  activeSection = 'general';
  form!: FormGroup;
  saving = false;
  clientOptions: SelectOption[] = [];
  showMediaModal = false;

  // ── Stakeholders ─────────────────────────────────────────────────────────
  projectStakeholders: any[] = [];
  stakeholderTypes: any[] = [];
  allStakeholders: any[] = [];
  stakeholderOptions: SelectOption[] = [];
  typeOptions: SelectOption[] = [];
  showStakeholderModal = false;
  editingPS: any = null;
  stakeholderForm!: FormGroup;
  savingStakeholder = false;

  sections = [
    { id: 'general', label: 'General', icon: 'fa-cog' },
    { id: 'stakeholders', label: 'Stakeholders', icon: 'fa-users' },
    { id: 'notifications', label: 'Notifications', icon: 'fa-bell' },
    { id: 'permissions', label: 'Permissions', icon: 'fa-lock' },
    { id: 'budget', label: 'Budget Settings', icon: 'fa-credit-card' },
    { id: 'integrations', label: 'Integrations', icon: 'fa-plug' },
    { id: 'danger', label: 'Danger Zone', icon: 'fa-exclamation-triangle' },
  ];

  notifications = {
    emailOnActivity: true,
    emailOnPayment: true,
    emailOnReport: false,
    smsOnOverdue: true,
    weeklyDigest: true,
    budgetAlerts: true,
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectSvc: ProjectService,
    private clientSvc: ClientService,
    private fb: FormBuilder,
    private http: HttpClient,
    public auth: AuthService,
    public mediaSvc: MediaService,
  ) {}

  ngOnInit() {
    this.clientSvc.getClients({ limit: 100 }).subscribe((res) => {
      this.clientOptions = (res.data || []).map((c: any) => ({
        value: c.id,
        label: c.name,
        sublabel: c.company || '',
        color: '#1a56db',
      }));
    });

    this.route.parent?.params.subscribe((params) => {
      this.projectId = params['id'];
      this.loadProject();
      this.loadStakeholderData();
    });
  }

  loadProject() {
    this.projectSvc.getOne(this.projectId).subscribe({
      next: (res: any) => {
        this.project = res.data?.project || res.data;
        if (this.project) this.initForm(this.project);
      },
    });
  }

  // ── Stakeholder Data ──────────────────────────────────────────────────────
  loadStakeholderData() {
    const api = environment.apiUrl;
    const headers = {
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    };

    // Load project stakeholders
    this.http
      .get<any>(`${api}/projects/${this.projectId}/stakeholders`, { headers })
      .subscribe({
        next: (res) => {
          this.projectStakeholders = res.data?.stakeholders || [];
        },
      });

    // Load stakeholder types
    this.http.get<any>(`${api}/stakeholder-types`, { headers }).subscribe({
      next: (res) => {
        this.stakeholderTypes = res.data?.types || [];
        this.typeOptions = this.stakeholderTypes.map((t: any) => ({
          value: t.id,
          label: t.name,
          color: t.color || '#6b7280',
        }));
      },
    });

    // Load global stakeholder directory
    this.http.get<any>(`${api}/stakeholders?limit=100`, { headers }).subscribe({
      next: (res) => {
        this.allStakeholders = res.data || [];
        this.stakeholderOptions = this.allStakeholders.map((s: any) => ({
          value: s.id,
          label: s.name,
          sublabel: s.organization || s.jobTitle || '',
          color: '#7c3aed',
        }));
      },
    });
  }

  initStakeholderForm(ps?: any) {
    this.stakeholderForm = this.fb.group({
      stakeholderId: [
        ps?.stakeholderId || ps?.stakeholder?.id || '',
        Validators.required,
      ],
      stakeholderTypeId: [ps?.stakeholderTypeId || ps?.type?.id || ''],
      role: [ps?.role || ''],
      isSignatory: [ps?.isSignatory ?? false],
      isPrimary: [ps?.isPrimary ?? false],
      signatureOrder: [ps?.signatureOrder || null],
      notes: [ps?.notes || ''],
    });
  }

  openAddStakeholder() {
    this.editingPS = null;
    this.initStakeholderForm();
    this.showStakeholderModal = true;
  }

  openEditStakeholder(ps: any) {
    this.editingPS = ps;
    this.initStakeholderForm(ps);
    this.showStakeholderModal = true;
  }

  closeStakeholderModal() {
    this.showStakeholderModal = false;
    this.editingPS = null;
  }

  onSubmitStakeholder() {
    if (this.stakeholderForm.invalid) {
      this.stakeholderForm.markAllAsTouched();
      return;
    }
    this.savingStakeholder = true;
    const api = environment.apiUrl;
    const headers = {
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    };
    const val = this.stakeholderForm.value;

    if (this.editingPS) {
      this.http
        .put<any>(
          `${api}/projects/${this.projectId}/stakeholders/${this.editingPS.id}`,
          val,
          { headers },
        )
        .subscribe({
          next: () => {
            this.savingStakeholder = false;
            this.closeStakeholderModal();
            this.loadStakeholderData();
            Swal.fire({
              icon: 'success',
              title: 'Updated!',
              timer: 1500,
              showConfirmButton: false,
            });
          },
          error: (err) => {
            this.savingStakeholder = false;
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: err?.error?.message || 'Failed to update.',
            });
          },
        });
    } else {
      this.http
        .post<any>(`${api}/projects/${this.projectId}/stakeholders`, val, {
          headers,
        })
        .subscribe({
          next: () => {
            this.savingStakeholder = false;
            this.closeStakeholderModal();
            this.loadStakeholderData();
            Swal.fire({
              icon: 'success',
              title: 'Added!',
              timer: 1500,
              showConfirmButton: false,
            });
          },
          error: (err) => {
            this.savingStakeholder = false;
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: err?.error?.message || 'Failed to add.',
            });
          },
        });
    }
  }

  removeStakeholder(ps: any) {
    Swal.fire({
      title: 'Remove Stakeholder?',
      text: `Remove "${ps.stakeholder?.name}" from this project?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, remove!',
    }).then((r) => {
      if (r.isConfirmed) {
        const api = environment.apiUrl;
        const headers = {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        };
        this.http
          .delete<any>(
            `${api}/projects/${this.projectId}/stakeholders/${ps.id}`,
            { headers },
          )
          .subscribe({
            next: () => {
              this.loadStakeholderData();
              Swal.fire({
                icon: 'success',
                title: 'Removed!',
                timer: 1200,
                showConfirmButton: false,
              });
            },
            error: (err) => {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err?.error?.message || 'Failed to remove.',
              });
            },
          });
      }
    });
  }

  getStakeholderName(ps: any): string {
    return ps.stakeholder?.name || '—';
  }

  getTypeName(ps: any): string {
    return ps.type?.name || '—';
  }

  getTypeColor(ps: any): string {
    return ps.type?.color || '#6b7280';
  }

  get signatories() {
    return this.projectStakeholders.filter((ps) => ps.isSignatory);
  }

  get nonSignatories() {
    return this.projectStakeholders.filter((ps) => !ps.isSignatory);
  }

  // ── General Form ──────────────────────────────────────────────────────────
  initForm(p: Project) {
    this.form = this.fb.group({
      name: [p.name, Validators.required],
      projectCode: [p.projectCode],
      clientId: [p.clientId || ''],
      status: [p.status, Validators.required],
      startDate: [p.startDate, Validators.required],
      endDate: [p.endDate, Validators.required],
      totalBudget: [
        p.totalBudget || (p as any).budget || 0,
        [Validators.required, Validators.min(0)],
      ],
      currency: [p.currency || 'TZS', Validators.required],
      description: [p.description || ''],
      location: [p.location || ''],
      progress: [p.progress || 0],
      image: [p.image || ''],
      name_sw: [p.name_sw || ''],
      description_sw: [p.description_sw || ''],
      approachQuality: [p.approachQuality || ''],
      approachQuality_sw: [p.approachQuality_sw || ''],
      approachDelivery: [p.approachDelivery || ''],
      approachDelivery_sw: [p.approachDelivery_sw || ''],
      contractValue: [p.contractValue || ''],
      contractDuration: [p.contractDuration || ''],
      contractDuration_sw: [p.contractDuration_sw || ''],
    });
  }

  openMediaPicker(): void {
    this.showMediaModal = true;
  }

  onMediaSelected(items: any[]): void {
    if (items && items.length) {
      this.form.patchValue({ image: this.mediaSvc.getMediaUrl(items[0].filename) });
    }
    this.showMediaModal = false;
  }

  clearImage(): void {
    this.form.patchValue({ image: '' });
  }

  setSection(s: string) {
    this.activeSection = s;
    if (s === 'stakeholders') this.loadStakeholderData();
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.projectSvc.update(this.projectId, this.form.value).subscribe({
      next: () => {
        this.saving = false;
        Swal.fire({
          icon: 'success',
          title: 'Saved!',
          timer: 1800,
          showConfirmButton: false,
        });
        this.loadProject();
      },
      error: (err) => {
        this.saving = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err?.error?.message || 'Failed to save.',
        });
      },
    });
  }

  archiveProject() {
    Swal.fire({
      title: 'Archive Project?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      confirmButtonText: 'Yes, archive!',
    }).then((r) => {
      if (r.isConfirmed) {
        this.projectSvc
          .update(this.projectId, { status: 'on_hold' })
          .subscribe({
            next: () =>
              Swal.fire({
                icon: 'success',
                title: 'Archived!',
                timer: 1500,
                showConfirmButton: false,
              }),
          });
      }
    });
  }

  deleteProject() {
    Swal.fire({
      title: 'Delete Project?',
      text: 'This action is IRREVERSIBLE.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete!',
      input: 'text',
      inputPlaceholder: `Type "${this.project?.name}" to confirm`,
      preConfirm: (val) => {
        if (val !== this.project?.name) {
          Swal.showValidationMessage('Name does not match!');
          return false;
        }
        return true;
      },
    }).then((r) => {
      if (r.isConfirmed) {
        this.projectSvc.deleteProject(this.projectId).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              timer: 2000,
              showConfirmButton: false,
            }).then(() => this.router.navigate(['/projects']));
          },
        });
      }
    });
  }

  get f() {
    return this.form.controls;
  }
  get sf() {
    return this.stakeholderForm?.controls;
  }
}

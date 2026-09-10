import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { UserService, RoleService } from '../../core/services/domain.services';
import { AuthService } from '../../core/services/auth.service';
import { User, Role } from '../../core/models';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="page-header">
      <div><h1 class="page-title">User Management</h1><p class="page-subtitle">Manage users, roles and permissions</p></div>
      @if (auth.hasPermission('user:create')) {
        <button class="btn btn-primary btn-sm" (click)="showCreateForm.set(true)">
          <i class="bi bi-person-plus"></i> New User
        </button>
      }
    </div>

    <!-- Filters -->
    <div class="filters-bar mb-3">
      <div class="input-group" style="max-width:260px">
        <div class="input-group-prepend"><span class="input-group-text"><i class="bi bi-search"></i></span></div>
        <input class="form-control" placeholder="Search users..." [(ngModel)]="search" (ngModelChange)="load()">
      </div>
      <select class="form-control" style="max-width:140px" [(ngModel)]="statusFilter" (ngModelChange)="load()">
        <option value="">All Users</option>
        <option value="true">Active</option>
        <option value="false">Inactive</option>
      </select>
    </div>

    @if (loading()) {
      <div class="loading-overlay"><div class="spinner-border"></div></div>
    } @else {
      <div class="table-card">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr><th>User</th><th>Email</th><th>Job Title</th><th>Roles</th><th>Status</th><th>Last Login</th><th>Actions</th></tr>
            </thead>
            <tbody>
              @for (u of users(); track u.id) {
                <tr>
                  <td>
                    <div class="d-flex align-items-center gap-2">
                      <div class="user-list-avatar">{{ u.firstName[0] }}{{ u.lastName[0] }}</div>
                      <div>
                        <div class="fw-600 text-medium">{{ u.firstName }} {{ u.lastName }}</div>
                        <div class="text-muted text-small">{{ u.department }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="text-small">{{ u.email }}</td>
                  <td class="text-small text-muted">{{ u.jobTitle || '—' }}</td>
                  <td>
                    @for (r of (u.roles || []); track r.id) {
                      <span class="role-badge" [style.background]="r.color + '22'" [style.color]="r.color">
                        {{ r.name }}
                      </span>
                    }
                    @if (!(u.roles || []).length) {
                      <span class="text-muted text-small">No roles</span>
                    }
                  </td>
                  <td>
                    <span class="badge" [class.badge-active]="u.isActive" [class.badge-cancelled]="!u.isActive">
                      {{ u.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="text-small text-muted">{{ u.lastLoginAt ? (u.lastLoginAt | date:'dd MMM yy, HH:mm') : 'Never' }}</td>
                  <td>
                    <div class="d-flex gap-1">
                      @if (auth.hasPermission('user:assign_role')) {
                        <button class="action-btn" title="Assign Roles" (click)="openRoleModal(u)">
                          <i class="bi bi-shield-check"></i>
                        </button>
                      }
                      @if (auth.hasPermission('user:update')) {
                        <button class="action-btn" title="Edit" (click)="editUser(u)">
                          <i class="bi bi-pencil"></i>
                        </button>
                      }
                      @if (auth.hasPermission('user:reset_password')) {
                        <button class="action-btn" title="Reset Password" (click)="resetPassword(u)">
                          <i class="bi bi-key"></i>
                        </button>
                      }
                      @if (u.isActive && auth.hasPermission('user:delete') && u.id !== auth.currentUser()?.id) {
                        <button class="action-btn danger" title="Deactivate" (click)="deactivate(u)">
                          <i class="bi bi-person-x"></i>
                        </button>
                      }
                      @if (!u.isActive && auth.hasPermission('user:activate')) {
                        <button class="action-btn success" title="Activate" (click)="activate(u)">
                          <i class="bi bi-person-check"></i>
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
              @if (users().length === 0) {
                <tr><td colspan="7" class="text-center text-muted py-4">No users found</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }

    <!-- Create/Edit User Modal -->
    @if (showCreateForm()) {
      <div class="modal-backdrop-custom" (click)="showCreateForm.set(false)"></div>
      <div class="modal-custom">
        <div class="modal-content" style="max-width:520px">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingUser() ? 'Edit User' : 'New User' }}</h5>
            <button class="close" (click)="showCreateForm.set(false)"><span>&times;</span></button>
          </div>
          <div class="modal-body">
            @if (formError()) { <div class="alert alert-danger text-small">{{ formError() }}</div> }
            <form [formGroup]="userForm">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">First Name *</label>
                  <input class="form-control" formControlName="firstName">
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Last Name *</label>
                  <input class="form-control" formControlName="lastName">
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">Email *</label>
                <input type="email" class="form-control" formControlName="email" [attr.readonly]="editingUser() ? true : null">
              </div>
              @if (!editingUser()) {
                <div class="mb-3">
                  <label class="form-label">Password *</label>
                  <input type="password" class="form-control" formControlName="password">
                </div>
              }
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Job Title</label>
                  <input class="form-control" formControlName="jobTitle">
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Department</label>
                  <input class="form-control" formControlName="department">
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">Phone</label>
                <input class="form-control" formControlName="phone">
              </div>
              <div class="mb-3">
                <label class="form-label font-weight-bold">Select Roles (Multi-Select)</label>
                <ng-container *ngTemplateOutlet="rolePicker"></ng-container>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline-secondary" (click)="showCreateForm.set(false)">Cancel</button>
            <button class="btn btn-primary" (click)="saveUser()" [disabled]="saving()">
              @if (saving()) { <span class="spinner-border spinner-border-sm mr-2"></span> }
              {{ editingUser() ? 'Update' : 'Create User' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Assign Roles Modal -->
    @if (roleModalUser()) {
      <div class="modal-backdrop-custom" (click)="roleModalUser.set(null)"></div>
      <div class="modal-custom">
        <div class="modal-content" style="max-width:480px">
          <div class="modal-header">
            <h5 class="modal-title">Assign Roles — {{ roleModalUser()!.firstName }} {{ roleModalUser()!.lastName }}</h5>
            <button class="close" (click)="roleModalUser.set(null)"><span>&times;</span></button>
          </div>
          <div class="modal-body">
            <p class="text-muted text-small mb-3">Tick every role this user should have.</p>
            <div class="mb-3">
              <label class="form-label font-weight-bold">Assigned Roles</label>
              <ng-container *ngTemplateOutlet="rolePicker"></ng-container>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline-secondary" (click)="roleModalUser.set(null)">Cancel</button>
            <button class="btn btn-primary" (click)="saveRoles()" [disabled]="saving()">
              @if (saving()) { <span class="spinner-border spinner-border-sm mr-2"></span> }
              Save Roles
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Shared role picker — an always-visible checklist (no dropdown to get
         clipped or left closed). Used by both the New/Edit User form and the
         Assign Roles modal. -->
    <ng-template #rolePicker>
      @if (rolesError()) {
        <div class="alert alert-warning text-small py-2 mb-1">
          {{ rolesError() }}
          <button type="button" class="btn btn-link btn-sm p-0 ml-1" (click)="loadRoles()">Retry</button>
        </div>
      } @else if (allRoles().length === 0) {
        <div class="text-muted small p-2 border rounded text-center">Loading roles…</div>
      } @else {
        <div class="border rounded" style="max-height:260px; overflow-y:auto;">
          @for (r of allRoles(); track r.id) {
            <label class="role-pick d-flex align-items-center justify-content-between px-3 py-2 mb-0"
                   [class.picked]="selectedRoles.has(r.id)">
              <span class="d-flex align-items-center" style="gap:10px; min-width:0;">
                <input type="checkbox" [checked]="selectedRoles.has(r.id)" (change)="toggleRole(r.id)"
                       style="width:16px; height:16px; cursor:pointer; flex-shrink:0;">
                <span class="role-badge m-0" [style.background]="(r.color || '#6b7280') + '22'"
                      [style.color]="r.color || '#374151'" style="padding:3px 10px; border-radius:12px; font-size:12px;">{{ r.name }}</span>
              </span>
              <span class="text-muted text-truncate ml-2" style="font-size:11px;">{{ r.description }}</span>
            </label>
          }
        </div>
        <div class="text-muted small mt-1">{{ selectedRoles.size }} of {{ allRoles().length }} selected</div>
      }
    </ng-template>
  `,
  styles: [`
    .user-list-avatar {
      width:36px;height:36px;border-radius:50%;background:#1e3a5f;color:#fff;
      display:flex;align-items:center;justify-content:center;font-weight:600;font-size:13px;flex-shrink:0;
    }
    .role-badge {
      display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:500;margin-right:4px;margin-bottom:2px;
    }
    .role-pick {
      cursor:pointer; gap:10px; border-bottom:1px solid #f0f0f0; transition:background .12s;
    }
    .role-pick:last-child { border-bottom:0; }
    .role-pick:hover { background:#f9fafb; }
    .role-pick.picked { background:#eff6ff; }
    .modal-backdrop-custom{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1040;}
    .modal-custom{position:fixed;inset:0;z-index:1050;display:flex;align-items:center;justify-content:center;padding:16px;}
    /* Cap the dialog and let ONLY the body scroll, so a long form (or the
       expanded Select Roles list) never pushes the footer or the lower
       role options off-screen where they can't be seen or clicked. */
    .modal-custom .modal-content{width:100%;max-height:92vh;display:flex;flex-direction:column;overflow:hidden;}
    .modal-custom .modal-header,.modal-custom .modal-footer{flex-shrink:0;}
    .modal-custom .modal-body{overflow-y:auto;flex:1 1 auto;min-height:0;}
  `]
})
export class UsersListComponent implements OnInit {
  users = signal<User[]>([]);
  allRoles = signal<Role[]>([]);
  rolesError = signal('');
  loading = signal(true);
  saving = signal(false);
  showCreateForm = signal(false);
  editingUser = signal<User | null>(null);
  roleModalUser = signal<User | null>(null);
  formError = signal('');
  search = '';
  statusFilter = '';
  selectedRoles = new Set<string>();

  userForm = this.fb.group({
    firstName:  ['', Validators.required],
    lastName:   ['', Validators.required],
    email:      ['', [Validators.required, Validators.email]],
    password:   [''],
    jobTitle:   [''],
    department: [''],
    phone:      ['']
  });

  constructor(
    private userSvc: UserService,
    private roleSvc: RoleService,
    public auth: AuthService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.load();
    this.loadRoles();
  }

  loadRoles(): void {
    this.rolesError.set('');
    this.roleSvc.getAll().subscribe({
      next: (r: any) => {
        const list = r?.data?.roles || r?.data?.rows || r?.data || r || [];
        const arr = Array.isArray(list) ? list : [];
        this.allRoles.set(arr);
        if (arr.length === 0) {
          this.rolesError.set('No roles were returned by the server.');
        }
      },
      error: (err) => {
        this.allRoles.set([]);
        this.rolesError.set(
          err?.status === 403
            ? 'You do not have permission to view roles (role:view), so they cannot be listed here.'
            : (err?.error?.message || 'Could not load roles. Check your connection and retry.'),
        );
      },
    });
  }

  load(): void {
    this.loading.set(true);
    this.userSvc.getAll({ search: this.search, isActive: this.statusFilter }).subscribe({
      next: (r: any) => { this.users.set(r.data || []); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  editUser(u: User): void {
    this.editingUser.set(u);
    this.userForm.patchValue(u);
    this.userForm.get('password')?.clearValidators();
    this.selectedRoles.clear();
    (u.roles || []).forEach(r => this.selectedRoles.add(r.id));
    this.showCreateForm.set(true);
  }

  toggleRole(id: string): void {
    this.selectedRoles.has(id) ? this.selectedRoles.delete(id) : this.selectedRoles.add(id);
  }

  saveUser(): void {
    if (this.userForm.invalid) return;
    this.saving.set(true);
    this.formError.set('');
    const data: any = { ...this.userForm.value };
    if (this.selectedRoles.size) data.roleIds = [...this.selectedRoles];

    const obs = this.editingUser()
      ? this.userSvc.update(this.editingUser()!.id, data)
      : this.userSvc.create(data);

    obs.subscribe({
      next: () => { this.saving.set(false); this.showCreateForm.set(false); this.editingUser.set(null); this.load(); },
      error: err => { this.saving.set(false); this.formError.set(err.error?.message || 'Failed to save user'); }
    });
  }

  openRoleModal(u: User): void {
    this.roleModalUser.set(u);
    this.selectedRoles.clear();
    (u.roles || []).forEach(r => this.selectedRoles.add(r.id));
  }

  saveRoles(): void {
    if (!this.roleModalUser()) return;
    this.saving.set(true);
    this.userSvc.assignRoles(this.roleModalUser()!.id, { roleIds: [...this.selectedRoles], projectId: null }).subscribe({
      next: () => { this.saving.set(false); this.roleModalUser.set(null); this.load(); },
      error: () => this.saving.set(false)
    });
  }

  deactivate(u: User): void {
    Swal.fire({
      title: 'Deactivate User?',
      text: `${u.firstName} ${u.lastName} will no longer be able to log in.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, deactivate!'
    }).then(r => {
      if (r.isConfirmed) {
        this.userSvc.deleteUser(u.id).subscribe({
          next: () => {
            this.load();
            Swal.fire({ icon: 'success', title: 'Deactivated!', timer: 1200, showConfirmButton: false });
          },
          error: (err: any) => Swal.fire('Error', err?.error?.message || 'Failed to deactivate user.', 'error')
        });
      }
    });
  }

  activate(u: User): void {
    Swal.fire({
      title: 'Activate User?',
      text: `${u.firstName} ${u.lastName} will be able to log in again.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      confirmButtonText: 'Yes, activate!'
    }).then(r => {
      if (r.isConfirmed) {
        this.userSvc.activate(u.id).subscribe({
          next: () => {
            this.load();
            Swal.fire({ icon: 'success', title: 'Activated!', timer: 1200, showConfirmButton: false });
          },
          error: (err: any) => Swal.fire('Error', err?.error?.message || 'Failed to activate user.', 'error')
        });
      }
    });
  }

  resetPassword(u: User): void {
    Swal.fire({
      title: 'Reset Password?',
      html: `A temporary password will be generated for <b>${u.firstName} ${u.lastName}</b> and emailed to them. They will be required to change it on next login.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      confirmButtonText: 'Yes, reset it!'
    }).then(r => {
      if (!r.isConfirmed) return;
      this.userSvc.resetPassword(u.id).subscribe({
        next: (res: any) => {
          const { emailSent, tempPassword } = res.data || {};
          if (emailSent) {
            Swal.fire({ icon: 'success', title: 'Password Reset!', text: 'A temporary password has been emailed to the user.', timer: 2500, showConfirmButton: false });
          } else {
            Swal.fire({
              icon: 'warning',
              title: 'Password Reset — Email Failed',
              html: `Email delivery failed. Share this temporary password with the user manually:<br><br><code style="font-size:16px">${tempPassword}</code>`,
            });
          }
        },
        error: (err: any) => Swal.fire('Error', err?.error?.message || 'Failed to reset password.', 'error')
      });
    });
  }
}

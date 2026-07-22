import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { UserService, RoleService } from '../../core/services/domain.services';
import { AuthService } from '../../core/services/auth.service';
import { User, Role } from '../../core/models';

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
                      @if (auth.hasPermission('user:delete') && u.id !== auth.currentUser()?.id) {
                        <button class="action-btn danger" title="Deactivate" (click)="deactivate(u)">
                          <i class="bi bi-person-x"></i>
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
              <div class="mb-3 position-relative">
                <label class="form-label font-weight-bold">Select Roles (Multi-Select)</label>
                <div class="dropdown position-relative">
                  <div class="form-control d-flex align-items-center justify-content-between bg-white border cursor-pointer"
                       (click)="toggleRoleDropdown($event)" style="min-height: 44px; height: auto; border-radius: 8px; cursor: pointer;">
                    <div class="d-flex flex-wrap align-items-center" style="gap: 6px;">
                      @if (selectedRoles.size === 0) {
                        <span class="text-muted small">-- Click to Select Roles --</span>
                      }
                      @for (r of allRoles(); track r.id) {
                        @if (selectedRoles.has(r.id)) {
                          <span class="role-badge m-0 d-inline-flex align-items-center" [style.background]="r.color + '22'" [style.color]="r.color" style="padding: 3px 8px; border-radius: 12px; font-size: 11px;">
                            {{ r.name }}
                            <i class="bi bi-x-circle-fill ml-1 text-danger cursor-pointer" style="font-size:12px;" (click)="removeRole($event, r.id)"></i>
                          </span>
                        }
                      }
                    </div>
                    <i class="bi bi-chevron-down text-muted ml-2"></i>
                  </div>

                  <!-- Dropdown Popover Menu -->
                  <div *ngIf="roleDropdownOpen()" 
                       class="shadow-lg w-100 p-2 bg-white border rounded mt-1" 
                       (click)="$event.stopPropagation()" 
                       style="position: absolute; top: 100%; left: 0; right: 0; max-height: 240px; overflow-y: auto; z-index: 1070; display: block !important;">
                    @if (allRoles().length === 0) {
                      <div class="text-muted small p-2 text-center">No roles loaded yet</div>
                    }
                    @for (r of allRoles(); track r.id) {
                      <div class="dropdown-item d-flex align-items-center justify-content-between p-2 rounded mb-1" 
                           style="cursor:pointer; transition: background 0.15s;" 
                           [style.background-color]="selectedRoles.has(r.id) ? '#eff6ff' : 'transparent'"
                           (click)="toggleRole(r.id)">
                        <div class="d-flex align-items-center" style="gap: 8px;">
                          <input type="checkbox" [checked]="selectedRoles.has(r.id)" (click)="$event.stopPropagation(); toggleRole(r.id)" style="cursor:pointer; width:16px; height:16px;">
                          <span class="role-badge m-0" [style.background]="r.color + '22'" [style.color]="r.color" style="padding: 2px 8px; border-radius: 10px;">{{ r.name }}</span>
                        </div>
                        <span class="text-muted text-small ml-2" style="font-size:11px">{{ r.description }}</span>
                      </div>
                    }
                  </div>
                </div>
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
            <p class="text-muted text-small mb-3">Select roles for this user from the multi-select dropdown below.</p>
            
            <div class="mb-3 position-relative">
              <label class="form-label font-weight-bold">Assigned Roles</label>
              <div class="dropdown position-relative">
                <div class="form-control d-flex align-items-center justify-content-between bg-white border cursor-pointer"
                     (click)="toggleRoleDropdown($event)" style="min-height: 44px; height: auto; border-radius: 8px; cursor: pointer;">
                  <div class="d-flex flex-wrap align-items-center" style="gap: 6px;">
                    @if (selectedRoles.size === 0) {
                      <span class="text-muted small">-- Click to Select Roles --</span>
                    }
                    @for (r of allRoles(); track r.id) {
                      @if (selectedRoles.has(r.id)) {
                        <span class="role-badge m-0 d-inline-flex align-items-center" [style.background]="r.color + '22'" [style.color]="r.color" style="padding: 3px 8px; border-radius: 12px; font-size: 11px;">
                          {{ r.name }}
                          <i class="bi bi-x-circle-fill ml-1 text-danger cursor-pointer" style="font-size:12px;" (click)="removeRole($event, r.id)"></i>
                        </span>
                      }
                    }
                  </div>
                  <i class="bi bi-chevron-down text-muted ml-2"></i>
                </div>

                <!-- Dropdown Popover Menu -->
                <div *ngIf="roleDropdownOpen()" 
                     class="shadow-lg w-100 p-2 bg-white border rounded mt-1" 
                     (click)="$event.stopPropagation()" 
                     style="position: absolute; top: 100%; left: 0; right: 0; max-height: 240px; overflow-y: auto; z-index: 1070; display: block !important;">
                  @if (allRoles().length === 0) {
                    <div class="text-muted small p-2 text-center">No roles loaded yet</div>
                  }
                  @for (r of allRoles(); track r.id) {
                    <div class="dropdown-item d-flex align-items-center justify-content-between p-2 rounded mb-1" 
                         style="cursor:pointer; transition: background 0.15s;" 
                         [style.background-color]="selectedRoles.has(r.id) ? '#eff6ff' : 'transparent'"
                         (click)="toggleRole(r.id)">
                      <div class="d-flex align-items-center" style="gap: 8px;">
                        <input type="checkbox" [checked]="selectedRoles.has(r.id)" (click)="$event.stopPropagation(); toggleRole(r.id)" style="cursor:pointer; width:16px; height:16px;">
                        <span class="role-badge m-0" [style.background]="r.color + '22'" [style.color]="r.color" style="padding: 2px 8px; border-radius: 10px;">{{ r.name }}</span>
                      </div>
                      <span class="text-muted text-small ml-2" style="font-size:11px">{{ r.description }}</span>
                    </div>
                  }
                </div>
              </div>
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
  `,
  styles: [`
    .user-list-avatar {
      width:36px;height:36px;border-radius:50%;background:#1e3a5f;color:#fff;
      display:flex;align-items:center;justify-content:center;font-weight:600;font-size:13px;flex-shrink:0;
    }
    .role-badge {
      display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:500;margin-right:4px;margin-bottom:2px;
    }
    .role-checkboxes { display:flex;flex-direction:column;gap:10px; }
    .role-check-item {
      display:flex;align-items:center;gap:8px;cursor:pointer;padding:8px;
      border:1px solid #e5e7eb;border-radius:8px;transition:background .15s;
      &:hover{background:#f9fafb;}
      input[type="checkbox"]{width:16px;height:16px;cursor:pointer;}
    }
    .modal-backdrop-custom{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:1040;}
    .modal-custom{position:fixed;inset:0;z-index:1050;display:flex;align-items:center;justify-content:center;padding:16px;}
    .modal-content{width:100%;}
  `]
})
export class UsersListComponent implements OnInit {
  users = signal<User[]>([]);
  allRoles = signal<Role[]>([]);
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
    this.roleSvc.getAll().subscribe({
      next: (r: any) => {
        const list = r.data?.roles || r.data?.rows || r.data || r || [];
        this.allRoles.set(Array.isArray(list) ? list : []);
      }
    });
  }

  load(): void {
    this.loading.set(true);
    this.userSvc.getAll({ search: this.search, isActive: this.statusFilter }).subscribe({
      next: (r: any) => { this.users.set(r.data || []); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  roleDropdownOpen = signal(false);

  toggleRoleDropdown(e?: Event): void {
    if (e) e.stopPropagation();
    this.roleDropdownOpen.update(v => !v);
  }

  removeRole(e: Event, id: string): void {
    e.stopPropagation();
    this.selectedRoles.delete(id);
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
    if (!confirm(`Deactivate ${u.firstName} ${u.lastName}?`)) return;
    this.userSvc.deleteUser(u.id).subscribe({ next: () => this.load() });
  }
}

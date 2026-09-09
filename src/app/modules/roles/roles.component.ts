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
import { RoleService } from '../../core/services/domain.services';
import { AuthService } from '../../core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CKEditorModule],
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.css'],
})
export class RolesComponent implements OnInit {
  ckeditorConfig = CKEDITOR_CONFIG;
  roles: any[] = [];
  permissionGroups: { group: string; permissions: any[] }[] = [];
  selectedRole: any = null;
  selectedPermIds: Set<string> = new Set();
  loadingRoles = false;
  loadingPerms = false;
  savingPerms = false;

  // Role modal
  showRoleModal = false;
  editRoleMode = false;
  selectedRoleEdit: any = null;
  roleForm!: FormGroup;
  savingRole = false;

  // Permission modal
  showPermModal = false;
  editPermMode = false;
  selectedPermEdit: any = null;
  permForm!: FormGroup;
  savingPerm = false;
  groups: string[] = [];

  constructor(
    private fb: FormBuilder,
    private roleSvc: RoleService,
    public auth: AuthService,
  ) {}

  ngOnInit() {
    this.loadRoles();
    this.loadAllPermissions();
  }

  loadRoles() {
    this.loadingRoles = true;
    this.roleSvc.getAll().subscribe({
      next: (res: any) => {
        this.roles = res.data?.roles || res.data || [];
        this.loadingRoles = false;
        if (this.roles.length > 0 && !this.selectedRole) {
          this.selectRole(this.roles[0]);
        }
      },
      error: () => {
        this.loadingRoles = false;
      },
    });
  }

  loadAllPermissions() {
    this.roleSvc.getAllPermissions().subscribe({
      next: (res: any) => {
        const grouped = res.data?.grouped || {};
        this.permissionGroups = Object.entries(grouped).map(
          ([group, permissions]) => ({
            group,
            permissions: permissions as any[],
          }),
        );
        this.groups = Object.keys(grouped);
      },
    });
  }

  selectRole(role: any) {
    this.selectedRole = role;
    this.selectedPermIds = new Set(
      (role.permissions || []).map((p: any) => p.id),
    );
    this.loadingPerms = true;
    this.roleSvc.getOne(role.id).subscribe({
      next: (res: any) => {
        const r = res.data?.role || res.data;
        this.selectedRole = r;
        this.selectedPermIds = new Set(
          (r.permissions || []).map((p: any) => p.id),
        );
        this.loadingPerms = false;
      },
      error: () => {
        this.loadingPerms = false;
      },
    });
  }

  togglePermission(permId: string) {
    if (this.selectedPermIds.has(permId)) this.selectedPermIds.delete(permId);
    else this.selectedPermIds.add(permId);
    this.selectedPermIds = new Set(this.selectedPermIds);
  }

  toggleGroup(group: { group: string; permissions: any[] }) {
    const allSelected = group.permissions.every((p) =>
      this.selectedPermIds.has(p.id),
    );
    if (allSelected)
      group.permissions.forEach((p) => this.selectedPermIds.delete(p.id));
    else group.permissions.forEach((p) => this.selectedPermIds.add(p.id));
    this.selectedPermIds = new Set(this.selectedPermIds);
  }

  isGroupSelected(group: { permissions: any[] }): boolean {
    return (
      group.permissions.length > 0 &&
      group.permissions.every((p) => this.selectedPermIds.has(p.id))
    );
  }

  isGroupPartial(group: { permissions: any[] }): boolean {
    return (
      group.permissions.some((p) => this.selectedPermIds.has(p.id)) &&
      !group.permissions.every((p) => this.selectedPermIds.has(p.id))
    );
  }

  savePermissions() {
    if (!this.selectedRole) return;
    this.savingPerms = true;
    this.roleSvc
      .syncPermissions(this.selectedRole.id, Array.from(this.selectedPermIds))
      .subscribe({
        next: () => {
          this.savingPerms = false;
          Swal.fire({
            icon: 'success',
            title: 'Permissions Saved!',
            timer: 1500,
            showConfirmButton: false,
          });
        },
        error: (err: any) => {
          this.savingPerms = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err?.error?.message || 'Failed to save.',
          });
        },
      });
  }

  // ── Permission CRUD ────────────────────────────────────
  initPermForm(p?: any) {
    this.permForm = this.fb.group({
      resource: [p?.resource || '', Validators.required],
      action: [p?.action || '', Validators.required],
      group: [p?.group || 'Other', Validators.required],
      description: [p?.description || ''],
    });
  }

  openAddPerm() {
    this.editPermMode = false;
    this.selectedPermEdit = null;
    this.initPermForm();
    this.showPermModal = true;
  }

  openEditPerm(p: any) {
    this.editPermMode = true;
    this.selectedPermEdit = p;
    this.initPermForm(p);
    this.showPermModal = true;
  }

  closePermModal() {
    this.showPermModal = false;
    this.selectedPermEdit = null;
  }

  onSubmitPerm() {
    if (this.permForm.invalid) {
      this.permForm.markAllAsTouched();
      return;
    }
    this.savingPerm = true;
    const val = this.permForm.value;
    const name = `${val.resource}:${val.action}`;
    const payload = {
      name,
      resource: val.resource,
      action: val.action,
      group: val.group,
      description: val.description || `${val.action} on ${val.resource}`,
    };

    if (this.editPermMode && this.selectedPermEdit) {
      this.roleSvc
        .updatePermission(this.selectedPermEdit.id, payload)
        .subscribe({
          next: () => {
            this.savingPerm = false;
            this.closePermModal();
            this.loadAllPermissions();
            Swal.fire({
              icon: 'success',
              title: 'Permission Updated!',
              timer: 1500,
              showConfirmButton: false,
            });
          },
          error: (err: any) => {
            this.savingPerm = false;
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: err?.error?.message || 'Failed to update.',
            });
          },
        });
    } else {
      this.roleSvc.createPermission(payload).subscribe({
        next: () => {
          this.savingPerm = false;
          this.closePermModal();
          this.loadAllPermissions();
          Swal.fire({
            icon: 'success',
            title: 'Permission Created!',
            text: `${name} imeongezwa.`,
            timer: 2000,
            showConfirmButton: false,
          });
        },
        error: (err: any) => {
          this.savingPerm = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err?.error?.message || 'Failed to create.',
          });
        },
      });
    }
  }

  deletePerm(p: any) {
    Swal.fire({
      title: 'Delete Permission?',
      text: `Delete "${p.name}"? Roles using this permission will lose it.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete!',
    }).then((res) => {
      if (res.isConfirmed) {
        this.roleSvc.deletePermission(p.id).subscribe({
          next: () => {
            this.loadAllPermissions();
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              timer: 1200,
              showConfirmButton: false,
            });
          },
          error: (err: any) =>
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: err?.error?.message || 'Failed.',
            }),
        });
      }
    });
  }

  get permName() {
    const r = this.permForm?.get('resource')?.value || 'resource';
    const a = this.permForm?.get('action')?.value || 'action';
    return `${r}:${a}`;
  }

  // ── Role CRUD ──────────────────────────────────────────
  initRoleForm(r?: any) {
    this.roleForm = this.fb.group({
      name: [r?.name || '', [Validators.required, Validators.minLength(2)]],
      description: [r?.description || ''],
    });
  }

  openAddRole() {
    this.editRoleMode = false;
    this.selectedRoleEdit = null;
    this.initRoleForm();
    this.showRoleModal = true;
  }

  openEditRole(r: any) {
    this.editRoleMode = true;
    this.selectedRoleEdit = r;
    this.initRoleForm(r);
    this.showRoleModal = true;
  }

  closeRoleModal() {
    this.showRoleModal = false;
    this.selectedRoleEdit = null;
  }

  onSubmitRole() {
    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      return;
    }
    this.savingRole = true;
    const val = this.roleForm.value;
    const call =
      this.editRoleMode && this.selectedRoleEdit
        ? this.roleSvc.update(this.selectedRoleEdit.id, val)
        : this.roleSvc.create(val);
    call.subscribe({
      next: () => {
        this.savingRole = false;
        this.closeRoleModal();
        this.loadRoles();
        Swal.fire({
          icon: 'success',
          title: this.editRoleMode ? 'Role Updated!' : 'Role Created!',
          timer: 1500,
          showConfirmButton: false,
        });
      },
      error: (err: any) => {
        this.savingRole = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err?.error?.message || 'Failed.',
        });
      },
    });
  }

  deleteRole(r: any) {
    Swal.fire({
      title: 'Delete Role?',
      text: `Delete "${r.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete!',
    }).then((res) => {
      if (res.isConfirmed) {
        this.roleSvc.delete(r.id).subscribe({
          next: () => {
            if (this.selectedRole?.id === r.id) this.selectedRole = null;
            this.loadRoles();
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              timer: 1200,
              showConfirmButton: false,
            });
          },
          error: (err: any) =>
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: err?.error?.message || 'Failed.',
            }),
        });
      }
    });
  }

  get permCount() {
    return this.selectedPermIds.size;
  }
  get rf() {
    return this.roleForm?.controls;
  }
  get pf() {
    return this.permForm?.controls;
  }
}

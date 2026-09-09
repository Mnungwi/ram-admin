import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CKEditorModule } from 'ng2-ckeditor';
import { CKEDITOR_CONFIG } from '../../../../shared/utils/ckeditor-config';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ProjectService, UserService, StorekeeperService, RoleService } from '../../../../core/services/domain.services';
import { AuthService } from '../../../../core/services/auth.service';
import { TeamMember } from '../../../../core/models/index';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CKEditorModule],
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.css']
})
export class TeamComponent implements OnInit {
  ckeditorConfig = CKEDITOR_CONFIG;
  projectId = '';
  members: TeamMember[] = [];
  filteredMembers: TeamMember[] = [];
  users: any[] = []; // Real users database
  showModal = false;
  editMode = false;
  selectedMember: TeamMember | null = null;
  form!: FormGroup;
  searchTerm = '';
  filterRole = 'All';
  viewMode: 'grid' | 'list' = 'grid';

  roles: any[] = []; // Loaded from database (Roles module)

  constructor(
    private route: ActivatedRoute,
    private projectSvc: ProjectService,
    private userSvc: UserService,
    private storekeeperSvc: StorekeeperService,
    private roleSvc: RoleService,
    private fb: FormBuilder,
    public auth: AuthService
  ) {}

  ngOnInit() {
    this.route.parent?.params.subscribe(params => {
      this.projectId = params['id'];
      if (this.projectId) {
        this.loadTeam();
        this.loadUsers();
      }
    });
    this.loadRoles();
    this.initForm();
  }

  loadRoles() {
    this.roleSvc.getAll().subscribe({
      next: (res: any) => {
        this.roles = res.data?.roles || res.data || [];
      },
      error: (err: any) => console.error('Error loading roles:', err)
    });
  }

  loadTeam() {
    this.projectSvc.getTeam(this.projectId).subscribe({
      next: (res: any) => {
        const backendTeam = res.data?.team || res.data || [];
        this.members = backendTeam.map((m: any) => ({
          id: m.id,
          name: m.user ? `${m.user.firstName} ${m.user.lastName}` : 'Unknown User',
          role: m.role || 'Member',
          email: m.user?.email || '—',
          phone: m.user?.phone || '—',
          company: m.user?.company || 'RAM Solutions',
          status: m.isActive ? 'Active' : 'Inactive',
          startDate: m.createdAt ? new Date(m.createdAt).toISOString().split('T')[0] : '—',
          avatar: m.user?.avatar || '',
          userId: m.userId
        }));
        this.applyFilters();
      },
      error: (err: any) => console.error('Error loading project team:', err)
    });
  }

  loadUsers() {
    this.userSvc.getAll().subscribe({
      next: (res: any) => {
        this.users = res.data?.users || res.data?.rows || res.data || [];
      },
      error: (err: any) => console.error('Error loading users:', err)
    });
  }

  applyFilters() {
    let m = [...this.members];
    if (this.searchTerm) {
      const s = this.searchTerm.toLowerCase();
      m = m.filter(x => x.name.toLowerCase().includes(s) || x.role.toLowerCase().includes(s));
    }
    if (this.filterRole !== 'All') {
      m = m.filter(x => x.role === this.filterRole);
    }
    this.filteredMembers = m;
  }

  initForm(m?: any) {
    this.form = this.fb.group({
      userId: [m?.userId || '', Validators.required],
      name: [m?.name || '', Validators.required],
      role: [m?.role || 'Site Engineer', Validators.required],
      email: [m?.email || '', [Validators.required, Validators.email]],
      phone: [m?.phone || '—'],
      company: [m?.company || 'RAM Solutions'],
      status: [m?.status || 'Active', Validators.required],
      startDate: [m?.startDate || new Date().toISOString().split('T')[0], Validators.required],
      expertise: ['']
    });
  }

  onUserSelect(event: any) {
    const userId = event.target.value;
    const selected = this.users.find(u => u.id === userId);
    if (selected) {
      this.form.patchValue({
        name: `${selected.firstName} ${selected.lastName}`,
        email: selected.email,
        phone: selected.phone || '—',
        company: selected.company || 'RAM Solutions'
      });
    }
  }

  openAddModal() {
    this.editMode = false;
    this.selectedMember = null;
    this.initForm();
    this.showModal = true;
  }

  openEditModal(m: TeamMember) {
    this.editMode = true;
    this.selectedMember = m;
    this.initForm(m);
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const val = this.form.value;
    if (this.editMode && this.selectedMember) {
      // Edit mode: team members in sequelize are updated or not needed
      Swal.fire({
        icon: 'info',
        title: 'Updating role...',
        timer: 1000,
        showConfirmButton: false
      });
      this.closeModal();
    } else {
      this.projectSvc.addTeamMember(this.projectId, {
        userId: val.userId,
        role: val.role
      }).subscribe({
        next: () => {
          this.loadTeam();
          this.closeModal();
          if (val.role === 'Storekeeper') {
            this.assignAsStorekeeper(val.userId);
          } else {
            Swal.fire({
              icon: 'success',
              title: 'Member Assigned!',
              timer: 1500,
              showConfirmButton: false
            });
          }
        },
        error: (err: any) => {
          Swal.fire('Error', err?.error?.message || 'Failed to assign team member.', 'error');
        }
      });
    }
  }

  // When a team member is added with the "Storekeeper" role, also register
  // them in the project's Storekeepers list so they get store access.
  private assignAsStorekeeper(userId: string) {
    this.storekeeperSvc.assignToProject(this.projectId, { userId }).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Member Assigned as Storekeeper!',
          text: 'They now appear in this project\'s Storekeepers list.',
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (err: any) => {
        // Member is already saved on the team even if this secondary step fails
        // (e.g. already assigned as storekeeper on this project).
        Swal.fire({
          icon: 'success',
          title: 'Member Assigned!',
          text: err?.error?.message || 'Storekeeper sync skipped.',
          timer: 2000,
          showConfirmButton: false
        });
      }
    });
  }

  deleteMember(m: TeamMember) {
    Swal.fire({
      title: 'Remove Team Member?',
      text: `Remove "${m.name}" from the project team?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, remove!'
    }).then(r => {
      if (r.isConfirmed) {
        this.projectSvc.removeTeamMember(this.projectId, m.id).subscribe({
          next: () => {
            this.loadTeam();
            Swal.fire({
              icon: 'success',
              title: 'Removed!',
              timer: 1200,
              showConfirmButton: false
            });
            if (m.role === 'Storekeeper' && m.userId) {
              this.deactivateStorekeeper(m.userId);
            }
          },
          error: (err: any) => {
            Swal.fire('Error', err?.error?.message || 'Failed to remove member.', 'error');
          }
        });
      }
    });
  }

  // Keep the project's Storekeepers list in sync when a Storekeeper is removed from the team.
  private deactivateStorekeeper(userId: string) {
    this.storekeeperSvc.getProjectStorekeepers(this.projectId).subscribe({
      next: (res: any) => {
        const list = res.data?.storekeepers || [];
        const match = list.find((s: any) => s.userId === userId && s.isActive);
        if (match) {
          this.storekeeperSvc.removeFromProject(this.projectId, match.id).subscribe();
        }
      }
    });
  }

  getStatusClass(s: string) {
    const m: any = { 'Active': 'status-completed', 'Inactive': 'status-overdue', 'On Leave': 'status-pending' };
    return m[s] || 'status-pending';
  }

  getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }

  getAvatarColor(name: string) {
    const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#0ea5e9', '#ec4899'];
    const idx = name.charCodeAt(0) % colors.length;
    return colors[idx];
  }

  get f() { return this.form.controls; }
  get activeMembers() { return this.members.filter(m => m.status === 'Active').length; }
  getUniqueCompanies() { return new Set(this.members.map(m => m.company)).size; }
  getUniqueRoles() { return new Set(this.members.map(m => m.role)).size; }
}

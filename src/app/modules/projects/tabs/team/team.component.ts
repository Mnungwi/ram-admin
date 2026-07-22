import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DataService } from '../../../../core/services/data.service';
import { TeamMember } from '../../../../core/models/index';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.css']
})
export class TeamComponent implements OnInit {
  projectId = '';
  members: TeamMember[] = [];
  filteredMembers: TeamMember[] = [];
  showModal = false;
  editMode = false;
  selectedMember: TeamMember | null = null;
  form!: FormGroup;
  searchTerm = '';
  filterRole = 'All';
  viewMode: 'grid' | 'list' = 'grid';

  roles = ['Project Manager', 'Site Engineer', 'Quantity Surveyor', 'Safety Officer', 'Architect', 'Electrical Engineer', 'Mechanical Engineer', 'Finance Officer', 'Procurement Officer', 'Quality Control'];

  constructor(private route: ActivatedRoute, private data: DataService, private fb: FormBuilder) {}

  ngOnInit() {
    this.route.parent?.params.subscribe(params => {
      this.projectId = params['id'];
      this.data.getTeamMembers(this.projectId).subscribe(m => {
        this.members = m;
        this.applyFilters();
      });
    });
    this.initForm();
  }

  applyFilters() {
    let m = [...this.members];
    if (this.searchTerm) m = m.filter(x => x.name.toLowerCase().includes(this.searchTerm.toLowerCase()) || x.role.toLowerCase().includes(this.searchTerm.toLowerCase()));
    if (this.filterRole !== 'All') m = m.filter(x => x.role === this.filterRole);
    this.filteredMembers = m;
  }

  initForm(m?: TeamMember) {
    this.form = this.fb.group({
      name: [m?.name || '', Validators.required],
      role: [m?.role || 'Site Engineer', Validators.required],
      email: [m?.email || '', [Validators.required, Validators.email]],
      phone: [m?.phone || '', Validators.required],
      company: [m?.company || '', Validators.required],
      status: [m?.status || 'Active', Validators.required],
      startDate: [m?.startDate || '', Validators.required],
      expertise: [m?.expertise || '']
    });
  }

  openAddModal() { this.editMode = false; this.selectedMember = null; this.initForm(); this.showModal = true; }
  openEditModal(m: TeamMember) { this.editMode = true; this.selectedMember = m; this.initForm(m); this.showModal = true; }
  closeModal() { this.showModal = false; }

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const val = this.form.value;
    if (this.editMode && this.selectedMember) {
      this.data.updateTeamMember({ ...this.selectedMember, ...val });
      Swal.fire({ icon: 'success', title: 'Member Updated!', timer: 1500, showConfirmButton: false });
    } else {
      this.data.addTeamMember({ id: this.data.generateId('TM'), projectId: this.projectId, avatar: '', ...val });
      Swal.fire({ icon: 'success', title: 'Member Added!', timer: 1500, showConfirmButton: false });
    }
    this.closeModal();
  }

  deleteMember(m: TeamMember) {
    Swal.fire({ title: 'Remove Team Member?', text: `Remove "${m.name}" from the team?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Yes, remove!' })
      .then(r => { if (r.isConfirmed) { this.data.deleteTeamMember(m.id); Swal.fire({ icon: 'success', title: 'Removed!', timer: 1200, showConfirmButton: false }); } });
  }

  getStatusClass(s: string) {
    const m: any = { 'Active': 'status-completed', 'Inactive': 'status-overdue', 'On Leave': 'status-pending' };
    return m[s] || 'status-pending';
  }

  getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
  }

  getAvatarColor(name: string) {
    const colors = ['#3b82f6','#22c55e','#f59e0b','#a855f7','#ef4444','#0ea5e9','#ec4899'];
    const idx = name.charCodeAt(0) % colors.length;
    return colors[idx];
  }

  get f() { return this.form.controls; }
  get activeMembers() { return this.members.filter(m => m.status === 'Active').length; }
  getUniqueCompanies() { return new Set(this.members.map(m => m.company)).size; }
  getUniqueRoles() { return new Set(this.members.map(m => m.role)).size; }
}

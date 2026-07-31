import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ClientService } from '../../core/services/client.service';
import { AuthService } from '../../core/services/auth.service';
import { Client, ClientRequest } from '../../core/models';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.css']
})
export class ClientsComponent implements OnInit {
  clients: Client[] = [];
  filteredClients: Client[] = [];
  loading = false;
  searchTerm = '';
  showModal = false;
  editMode = false;
  selectedClient: Client | null = null;
  form!: FormGroup;
  saving = false;
  total = 0;
  currentPage = 1;
  pageSize = 20;

  constructor(private clientService: ClientService, private fb: FormBuilder, public auth: AuthService) {}

  ngOnInit() {
    this.initForm();
    this.loadClients();
  }

  loadClients() {
    this.loading = true;
    this.clientService.getClients({
      search: this.searchTerm || undefined,
      page: this.currentPage,
      limit: this.pageSize
    }).subscribe({
      next: res => {
        this.clients = res.data;
        this.filteredClients = res.data;
        this.total = res.pagination.total;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  onSearch() {
    this.currentPage = 1;
    this.loadClients();
  }

  initForm(c?: Client) {
    this.form = this.fb.group({
      name:          [c?.name || '',          Validators.required],
      contactPerson: [c?.contactPerson || ''],
      email:         [c?.email || '',         Validators.email],
      phone:         [c?.phone || ''],
      company:       [c?.company || ''],
      address:       [c?.address || ''],
      city:          [c?.city || ''],
      country:       [c?.country || 'Tanzania'],
      taxNumber:     [c?.taxNumber || ''],
      notes:         [c?.notes || ''],
      isActive:      [c?.isActive ?? true]
    });
  }

  openAddModal() {
    this.editMode = false;
    this.selectedClient = null;
    this.initForm();
    this.showModal = true;
  }

  openEditModal(c: Client) {
    this.editMode = true;
    this.selectedClient = c;
    this.initForm(c);
    this.showModal = true;
  }

  closeModal() { this.showModal = false; }

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const val: ClientRequest = this.form.value;

    if (this.editMode && this.selectedClient) {
      this.clientService.updateClient(this.selectedClient.id, val).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.loadClients();
          Swal.fire({ icon: 'success', title: 'Client Updated!', timer: 1500, showConfirmButton: false });
        },
        error: (err) => {
          this.saving = false;
          Swal.fire({ icon: 'error', title: 'Error', text: err?.error?.message || 'Failed to update client' });
        }
      });
    } else {
      this.clientService.createClient(val).subscribe({
        next: () => {
          this.saving = false;
          this.closeModal();
          this.loadClients();
          Swal.fire({ icon: 'success', title: 'Client Added!', timer: 1500, showConfirmButton: false });
        },
        error: (err) => {
          this.saving = false;
          Swal.fire({ icon: 'error', title: 'Error', text: err?.error?.message || 'Failed to create client' });
        }
      });
    }
  }

  deleteClient(c: Client) {
    Swal.fire({
      title: 'Delete Client?',
      text: `Delete "${c.name}"? This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete!'
    }).then(r => {
      if (r.isConfirmed) {
        this.clientService.deleteClient(c.id).subscribe({
          next: () => {
            this.loadClients();
            Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1200, showConfirmButton: false });
          },
          error: (err) => {
            Swal.fire({ icon: 'error', title: 'Cannot Delete', text: err?.error?.message || 'Failed to delete client' });
          }
        });
      }
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }

  getAvatarColor(name: string): string {
    const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#0ea5e9', '#ec4899'];
    return colors[name.charCodeAt(0) % colors.length];
  }

  get activeCount() { return this.clients.filter(c => c.isActive).length; }
  get f() { return this.form.controls; }
  get totalPages() { return Math.ceil(this.total / this.pageSize); }
  get pages() { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }
  getUniqueCountries() { return new Set(this.clients.map(c => c.country).filter(Boolean)).size; }
  get Math() { return Math; }
}

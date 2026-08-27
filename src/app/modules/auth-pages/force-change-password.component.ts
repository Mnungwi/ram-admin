import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-force-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="d-flex justify-content-center align-items-center w-100 h-100 login-container">
      <div class="col-xl-4 col-md-6 col-10">
        <div class="card border-0 box-shadow">
          <div class="card-body text-center pb-1">
            <div class="login-brand-wrapper">
              <img src="assets/img/logo.png" alt="RAM Projects" class="login-brand-logo">
              <h3 class="login-brand-title">RAM PROJECTS</h3>
              <p class="login-brand-subtitle">Elite Infrastructure Solutions</p>
            </div>
            <h2>Set a New Password</h2>
            <p class="text-muted small">
              For your security, you must set a new password before continuing.
            </p>

            <form (ngSubmit)="submit()" class="text-left mt-4">
              <div class="form-group">
                <input [(ngModel)]="currentPassword" name="currentPassword" type="password" required
                       class="form-control" placeholder="Current / temporary password">
              </div>
              <div class="form-group">
                <input [(ngModel)]="newPassword" name="newPassword" type="password" required minlength="8"
                       class="form-control" placeholder="New password (min 8 characters)">
              </div>
              <div class="form-group">
                <input [(ngModel)]="confirmPassword" name="confirmPassword" type="password" required
                       class="form-control" placeholder="Confirm new password">
                <small class="text-danger" *ngIf="confirmPassword && confirmPassword !== newPassword">
                  Passwords do not match
                </small>
              </div>
              <div class="form-group">
                <button type="submit" [disabled]="loading || !canSubmit()" class="btn btn-primary btn-block">
                  <span *ngIf="loading" class="spinner-border spinner-border-sm mr-1"></span>
                  {{ loading ? 'Saving...' : 'Set New Password' }}
                </button>
              </div>
              <div class="form-group mb-0 text-center">
                <a href="javascript:void(0)" (click)="logout()" class="transition text-muted small">
                  Not you? Sign out
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ForceChangePasswordComponent {
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  loading = false;

  constructor(
    private router: Router,
    private auth: AuthService,
  ) {}

  canSubmit(): boolean {
    return (
      !!this.currentPassword &&
      this.newPassword.length >= 8 &&
      this.newPassword === this.confirmPassword
    );
  }

  submit(): void {
    if (!this.canSubmit()) return;
    this.loading = true;
    this.auth.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.loading = false;
        this.auth.clearMustChangePassword();
        Swal.fire({
          icon: 'success',
          title: 'Password Updated!',
          timer: 1500,
          showConfirmButton: false,
        }).then(() => this.router.navigate(['/dashboard']));
      },
      error: (err) => {
        this.loading = false;
        Swal.fire('Error', err?.error?.message || 'Failed to update password.', 'error');
      },
    });
  }

  logout(): void {
    this.auth.logout();
  }
}

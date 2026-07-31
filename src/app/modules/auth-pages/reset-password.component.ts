import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="d-flex justify-content-center align-items-center w-100 h-100 login-container">
      <div class="col-xl-4 col-md-6 col-10">
        <div class="card border-0 box-shadow rounded-0">
          <div class="card-header d-flex justify-content-center align-items-center border-0 box-shadow">
            <i class="fa fa-lock" aria-hidden="true"></i>
          </div>
          <div class="card-body text-center pb-1">
            <h2>Reset Password</h2>

            @if (!email || !token) {
              <div class="alert alert-danger mt-3 text-left py-2">
                <i class="fa fa-exclamation-circle mr-2"></i>
                This reset link is invalid or incomplete.
              </div>
              <a routerLink="/forgot-password" class="btn btn-outline-secondary btn-block mt-3">Request a New Link</a>
            } @else {
              <p class="text-muted small">Set a new password for <b>{{ email }}</b></p>
              <form (ngSubmit)="submit()" class="text-left mt-4">
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
                    {{ loading ? 'Resetting...' : 'Reset Password' }}
                  </button>
                </div>
              </form>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ResetPasswordComponent implements OnInit {
  email = '';
  token = '';
  newPassword = '';
  confirmPassword = '';
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.email = params['email'] || '';
      this.token = params['token'] || '';
    });
  }

  canSubmit(): boolean {
    return this.newPassword.length >= 8 && this.newPassword === this.confirmPassword;
  }

  submit(): void {
    if (!this.canSubmit()) return;
    this.loading = true;
    this.auth.resetPassword(this.email, this.token, this.newPassword).subscribe({
      next: () => {
        this.loading = false;
        Swal.fire({
          icon: 'success',
          title: 'Password Reset!',
          text: 'You can now log in with your new password.',
          confirmButtonText: 'Go to Login',
        }).then(() => this.router.navigate(['/login']));
      },
      error: (err) => {
        this.loading = false;
        Swal.fire('Error', err?.error?.message || 'Invalid or expired reset link.', 'error');
      },
    });
  }
}

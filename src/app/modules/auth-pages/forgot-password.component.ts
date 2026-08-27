import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
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
            <h2>Forgot Password</h2>
            <p class="text-muted small">Enter your account email and we'll send you a reset link.</p>

            @if (sent) {
              <div class="alert alert-success mt-3 text-left py-2">
                <i class="fa fa-check-circle mr-2"></i>
                If that email is registered, a reset link has been sent. Check your inbox.
              </div>
              <a routerLink="/login" class="btn btn-outline-secondary btn-block mt-3">Back to Login</a>
            } @else {
              <form (ngSubmit)="submit()" class="text-left mt-4">
                <div class="form-group">
                  <input [(ngModel)]="email" name="email" type="email" required
                         class="form-control" placeholder="Email">
                </div>
                <div class="form-group">
                  <button type="submit" [disabled]="loading || !email" class="btn btn-primary btn-block">
                    <span *ngIf="loading" class="spinner-border spinner-border-sm mr-1"></span>
                    {{ loading ? 'Sending...' : 'Send Reset Link' }}
                  </button>
                </div>
                <div class="text-center">
                  <a routerLink="/login" class="transition">Back to login</a>
                </div>
              </form>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ForgotPasswordComponent {
  email = '';
  loading = false;
  sent = false;

  constructor(private auth: AuthService) {}

  submit(): void {
    if (!this.email) return;
    this.loading = true;
    this.auth.forgotPassword(this.email).subscribe({
      next: () => {
        this.loading = false;
        this.sent = true;
      },
      error: (err) => {
        this.loading = false;
        Swal.fire('Error', err?.error?.message || 'Something went wrong. Please try again.', 'error');
      },
    });
  }
}

import { Component, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-left d-none d-lg-flex">
        <div class="auth-brand">
          <div class="auth-logo">🏗</div>
          <h1 class="auth-brand-name">Farida Projects</h1>
          <p class="auth-tagline">Construction Project Management System</p>
          <div class="auth-features">
            <div class="auth-feature"><i class="bi bi-check-circle-fill"></i> Project tracking & reporting</div>
            <div class="auth-feature"><i class="bi bi-check-circle-fill"></i> Finance & procurement management</div>
            <div class="auth-feature"><i class="bi bi-check-circle-fill"></i> Letter processing & approvals</div>
            <div class="auth-feature"><i class="bi bi-check-circle-fill"></i> Store & inventory control</div>
          </div>
        </div>
      </div>

      <div class="auth-right">
        <div class="auth-form-wrap">
          <div class="auth-form-header">
            <div class="auth-form-logo d-lg-none">🏗 Farida Projects</div>
            <h2 class="auth-form-title">Welcome back</h2>
            <p class="auth-form-sub">Sign in to your account to continue</p>
          </div>

          <div *ngIf="error()" class="alert alert-danger d-flex align-items-center gap-2 py-2" role="alert">
            <i class="bi bi-exclamation-circle-fill"></i>
            <span>{{ error() }}</span>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="form-group mb-3">
              <label class="form-label">Email address</label>
              <div class="input-group">
                <div class="input-group-prepend">
                  <span class="input-group-text"><i class="bi bi-envelope"></i></span>
                </div>
                <input type="email"
                       class="form-control"
                       formControlName="email"
                       placeholder="you@farida.co.tz"
                       [class.is-invalid]="f['email'].touched && f['email'].invalid">
              </div>
              <div *ngIf="f['email'].touched && f['email'].errors?.['required']"
                   class="invalid-feedback d-block">Email is required</div>
            </div>

            <div class="form-group mb-4">
              <label class="form-label d-flex justify-content-between">
                Password
                <a href="#" class="text-primary" style="font-size:12px">Forgot password?</a>
              </label>
              <div class="input-group">
                <div class="input-group-prepend">
                  <span class="input-group-text"><i class="bi bi-lock"></i></span>
                </div>
                <input [type]="showPassword() ? 'text' : 'password'"
                       class="form-control"
                       formControlName="password"
                       placeholder="Enter your password"
                       [class.is-invalid]="f['password'].touched && f['password'].invalid">
                <div class="input-group-append">
                  <button type="button"
                          class="input-group-text"
                          style="cursor:pointer; background:#fff"
                          (click)="togglePassword()">
                    <i class="bi" [class.bi-eye]="!showPassword()" [class.bi-eye-slash]="showPassword()"></i>
                  </button>
                </div>
              </div>
              <div *ngIf="f['password'].touched && f['password'].errors?.['required']"
                   class="invalid-feedback d-block">Password is required</div>
            </div>

            <button type="submit"
                    class="btn btn-primary btn-block btn-lg"
                    [disabled]="loading() || form.invalid">
              <span *ngIf="loading()" class="spinner-border spinner-border-sm mr-2"></span>
              <i *ngIf="!loading()" class="bi bi-box-arrow-in-right mr-2"></i>
              {{ loading() ? 'Signing in...' : 'Sign in' }}
            </button>
          </form>

          <div class="auth-demo mt-4 p-3" style="background:#f8fafc; border-radius:8px; border:1px solid #e5e7eb">
            <div style="font-size:12px; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:.5px; margin-bottom:8px">
              Demo accounts
            </div>
            <div *ngFor="let demo of demoAccounts"
                 class="demo-account"
                 (click)="fillDemo(demo)">
              <div class="demo-badge" [style.background]="demo.color">{{ demo.role[0] }}</div>
              <div>
                <div style="font-size:13px; font-weight:500; color:#374151">{{ demo.role }}</div>
                <div style="font-size:11px; color:#9ca3af">{{ demo.email }}</div>
              </div>
              <i class="bi bi-arrow-right ml-auto" style="color:#9ca3af; font-size:12px"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { display:flex; min-height:100vh; }
    .auth-left {
      flex: 1;
      background: linear-gradient(135deg, #0f1923 0%, #1e3a5f 60%, #2563eb 100%);
      display: flex; align-items: center; justify-content: center; overflow: hidden;
    }
    .auth-brand { position:relative; z-index:1; color:#fff; text-align:center; padding:40px; }
    .auth-logo { font-size:64px; margin-bottom:16px; }
    .auth-brand-name { font-size:28px; font-weight:700; margin-bottom:8px; }
    .auth-tagline { color:rgba(255,255,255,.6); font-size:15px; margin-bottom:40px; }
    .auth-features { text-align:left; }
    .auth-feature {
      display:flex; align-items:center; gap:10px;
      color:rgba(255,255,255,.8); font-size:14px; margin-bottom:12px;
    }
    .auth-feature i { color:#34d399; font-size:16px; }
    .auth-right {
      width:480px; display:flex; align-items:center;
      justify-content:center; padding:40px; background:#fff;
    }
    .auth-form-wrap { width:100%; max-width:380px; }
    .auth-form-logo { font-size:20px; font-weight:700; color:#1e3a5f; margin-bottom:24px; }
    .auth-form-title { font-size:26px; font-weight:700; color:#111827; margin-bottom:6px; }
    .auth-form-sub { color:#6b7280; font-size:14px; margin-bottom:28px; }
    .btn-block { width:100%; justify-content:center; }
    .btn-lg { font-size:15px; padding:11px 24px; }
    .demo-account {
      display:flex; align-items:center; gap:10px; padding:7px 8px;
      border-radius:6px; cursor:pointer; transition:background .15s;
    }
    .demo-account:hover { background:#f0f4ff; }
    .demo-badge {
      width:28px; height:28px; border-radius:6px;
      display:flex; align-items:center; justify-content:center;
      color:#fff; font-size:12px; font-weight:700; flex-shrink:0;
    }
    @media (max-width:991px) {
      .auth-right { width:100%; padding:24px; }
    }
  `]
})
export class LoginComponent {
  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  loading      = signal(false);
  error        = signal('');
  showPassword = signal(false);

  demoAccounts = [
    { role: 'Super Admin',     email: 'admin@farida.co.tz',  password: 'Admin@1234', color: '#dc2626' },
    { role: 'Site Engineer',   email: 'hassan@farida.co.tz', password: 'Demo@1234',  color: '#16a34a' },
    { role: 'Finance Officer', email: 'fatma@farida.co.tz',  password: 'Demo@1234',  color: '#0891b2' },
    { role: 'Qty Surveyor',    email: 'msaid@farida.co.tz',  password: 'Demo@1234',  color: '#d97706' },
  ];

  get f() { return this.form.controls; }

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {}

  // Arrow function in template (v => !v) breaks Angular template parser.
  // Use a named method instead.
  togglePassword(): void {
    this.showPassword.set(!this.showPassword());
  }

  fillDemo(demo: any): void {
    this.form.patchValue({ email: demo.email, password: demo.password });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');

    this.auth.login(this.form.value as any).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: err => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Login failed. Please check your credentials.');
      }
    });
  }
}

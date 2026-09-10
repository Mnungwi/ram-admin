import { Component, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import {
  UntypedFormGroup,
  UntypedFormBuilder,
  Validators,
  UntypedFormControl,
} from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class LoginComponent {
  public form: UntypedFormGroup;
  public email: UntypedFormControl;
  public password: UntypedFormControl;
  public loading = false;
  public errorMsg = '';

  // OTP verification step
  public otpStep = false;
  public otpEmail = '';
  public otp = '';
  public otpLoading = false;
  public otpError = '';
  public otpInfo = '';
  public resendCooldown = 0;
  private resendTimer: any;

  constructor(
    private router: Router,
    private fb: UntypedFormBuilder,
    private auth: AuthService,
    public themeSvc: ThemeService,
  ) {
    // Redirect if already logged in
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/']);
      return;
    }

    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
    this.email = this.form.controls['email'] as UntypedFormControl;
    this.password = this.form.controls['password'] as UntypedFormControl;
  }
  public demoAccounts = [
    {
      role: 'Super Admin',
      email: 'admin@ram.co.tz',
      password: 'Admin@1234',
      color: '#dc2626',
    },
    {
      role: 'Site Engineer',
      email: 'hassan@ram.co.tz',
      password: 'Demo@1234',
      color: '#16a34a',
    },
    {
      role: 'Finance Officer',
      email: 'fatma@ram.co.tz',
      password: 'Demo@1234',
      color: '#0891b2',
    },
    {
      role: 'Qty Surveyor',
      email: 'msaid@ram.co.tz',
      password: 'Demo@1234',
      color: '#d97706',
    },
  ];

  public fillDemo(d: any): void {
    this.form.patchValue({ email: d.email, password: d.password });
  }
  public onSubmit(values: any): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMsg = '';

    this.auth
      .login({ email: values.email, password: values.password })
      .subscribe({
        next: (res) => {
          this.loading = false;
          if (res.success && 'requiresOtp' in res.data) {
            this.otpStep = true;
            this.otpEmail = res.data.email;
            const emailSent = (res.data as any).emailSent;
            const smsSent = (res.data as any).smsSent;
            if (!emailSent && !smsSent) {
              this.otpError = 'The verification code could not be sent by email or SMS — contact an administrator.';
              this.otpInfo = '';
            } else {
              this.otpError = '';
              this.otpInfo = res.message || 'A verification code has been sent to you.';
            }
            this.startResendCooldown();
          } else if (res.success) {
            this.completeNavigation();
          }
        },
        error: (err) => {
          this.loading = false;
          this.errorMsg =
            err?.error?.message ||
            'Invalid email or password. Please try again.';
        },
      });
  }

  public onVerifyOtp(): void {
    if (!this.otp || this.otp.length < 6) return;
    this.otpLoading = true;
    this.otpError = '';

    this.auth.verifyOtp(this.otpEmail, this.otp).subscribe({
      next: (res) => {
        this.otpLoading = false;
        if (res.success) this.completeNavigation();
      },
      error: (err) => {
        this.otpLoading = false;
        this.otpError = err?.error?.message || 'Incorrect verification code.';
      },
    });
  }

  public resendOtp(): void {
    if (this.resendCooldown > 0) return;
    this.auth.resendOtp(this.otpEmail).subscribe({
      next: (res) => {
        this.otpInfo = res?.message || 'A new verification code has been sent.';
        this.startResendCooldown();
      },
    });
  }

  public backToLogin(): void {
    this.otpStep = false;
    this.otp = '';
    this.otpError = '';
    this.otpInfo = '';
    if (this.resendTimer) clearInterval(this.resendTimer);
  }

  private startResendCooldown(): void {
    this.resendCooldown = 60;
    if (this.resendTimer) clearInterval(this.resendTimer);
    this.resendTimer = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) clearInterval(this.resendTimer);
    }, 1000);
  }

  private completeNavigation(): void {
    const user = this.auth.currentUser();
    this.router.navigate([
      user?.mustChangePassword ? '/force-change-password' : '/dashboard',
    ]);
  }

  ngAfterViewInit() {
    const preloader = document.getElementById('preloader');
    if (preloader) preloader.classList.add('hide');
  }
}

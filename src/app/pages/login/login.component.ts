import { Component, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import {
  UntypedFormGroup,
  UntypedFormBuilder,
  Validators,
  UntypedFormControl,
} from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

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

  constructor(
    private router: Router,
    private fb: UntypedFormBuilder,
    private auth: AuthService,
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
      email: 'admin@farida.co.tz',
      password: 'Admin@1234',
      color: '#dc2626',
    },
    {
      role: 'Site Engineer',
      email: 'hassan@farida.co.tz',
      password: 'Demo@1234',
      color: '#16a34a',
    },
    {
      role: 'Finance Officer',
      email: 'fatma@farida.co.tz',
      password: 'Demo@1234',
      color: '#0891b2',
    },
    {
      role: 'Qty Surveyor',
      email: 'msaid@farida.co.tz',
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
          if (res.success) {
            this.router.navigate(['/dashboard']);
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

  ngAfterViewInit() {
    const preloader = document.getElementById('preloader');
    if (preloader) preloader.classList.add('hide');
  }
}

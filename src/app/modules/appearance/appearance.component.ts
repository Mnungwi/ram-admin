import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ThemeService, THEME_FIELDS, ThemeFieldDef } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';
import Swal from 'sweetalert2';

const prettyAlert = Swal.mixin({
  buttonsStyling: false,
  reverseButtons: true,
  customClass: {
    popup: 'rounded-4 shadow-lg',
    confirmButton: 'btn btn-primary rounded-pill px-4 me-2',
    cancelButton: 'btn btn-outline-secondary rounded-pill px-4',
  },
});

@Component({
  selector: 'app-appearance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Appearance</h1>
        <p class="page-subtitle">Colors, logo and branding — applied live across the whole admin panel (and the login screen)</p>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-secondary btn-sm" (click)="resetToDefaults()">
          <i class="bi bi-arrow-counterclockwise me-1"></i> Reset to Defaults
        </button>
        <button class="btn btn-primary btn-sm" [disabled]="saving" (click)="save()">
          <i class="bi bi-check-lg me-1"></i> {{ saving ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>
    </div>

    @if (loading) {
      <div class="d-flex justify-content-center py-5"><div class="spinner-border text-primary"></div></div>
    } @else {

      <!-- Logo -->
      <div class="card mb-3">
        <div class="card-header"><h6 class="fw-600 mb-0">Logo</h6></div>
        <div class="card-body d-flex align-items-center gap-4">
          <div class="logo-preview">
            <img [src]="values['theme_logo_url'] || 'assets/img/logo.png'" alt="Logo preview">
          </div>
          <div class="flex-grow-1">
            <input type="file" #logoInput accept="image/*" class="form-control form-control-sm" style="max-width:320px" (change)="onLogoSelected($event)">
            <p class="text-muted small mt-2 mb-0">PNG with transparent background recommended. Uploads immediately; click "Save Changes" to apply it as the active logo.</p>
            @if (uploadingLogo) { <span class="text-primary small">Uploading...</span> }
          </div>
        </div>
      </div>

      <!-- App name -->
      <div class="card mb-3">
        <div class="card-header"><h6 class="fw-600 mb-0">Branding</h6></div>
        <div class="card-body">
          <label class="form-label small">{{ appNameField.label }}</label>
          <input type="text" class="form-control" style="max-width:400px" [(ngModel)]="values[appNameField.key]">
        </div>
      </div>

      <!-- Color groups -->
      @for (group of groups; track group) {
        <div class="card mb-3">
          <div class="card-header"><h6 class="fw-600 mb-0">{{ group }}</h6></div>
          <div class="card-body">
            <div class="row g-3">
              @for (f of fieldsByGroup(group); track f.key) {
                <div class="col-md-4">
                  <label class="form-label small">{{ f.label }}</label>
                  @if (f.type === 'color') {
                    <div class="d-flex align-items-center gap-2">
                      <input type="color" class="theme-color-swatch" [ngModel]="asHex(values[f.key])" (ngModelChange)="values[f.key] = $event">
                      <input type="text" class="form-control form-control-sm" [(ngModel)]="values[f.key]">
                    </div>
                  } @else if (f.type === 'select') {
                    <select class="form-control form-control-sm" [(ngModel)]="values[f.key]">
                      @for (o of f.options; track o.value) {
                        <option [value]="o.value">{{ o.label }}</option>
                      }
                    </select>
                  } @else if (f.type === 'checkbox') {
                    <div class="form-check mt-1">
                      <input type="checkbox" class="form-check-input" [id]="f.key"
                             [ngModel]="values[f.key] === 'true'"
                             (ngModelChange)="values[f.key] = $event ? 'true' : 'false'">
                      <label class="form-check-label small" [for]="f.key">Enabled</label>
                    </div>
                  } @else {
                    <input type="text" class="form-control form-control-sm" [(ngModel)]="values[f.key]">
                  }
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Live preview -->
      <div class="card mb-3">
        <div class="card-header"><h6 class="fw-600 mb-0">Live Preview</h6></div>
        <div class="card-body">
          <p class="text-muted small">Changes below apply instantly as you edit — save when you're happy with them.</p>
          <div class="d-flex gap-2 flex-wrap">
            <button class="btn btn-primary btn-sm">Primary Button</button>
            <button class="btn btn-outline-primary btn-sm">Outline Button</button>
            <span class="badge" style="background:var(--success-green)">Success</span>
            <span class="badge" style="background:var(--warning)">Warning</span>
            <span class="badge" style="background:var(--danger)">Danger</span>
            <button class="btn btn-sm btn-outline-secondary" (click)="previewAlert()">Preview Alert</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .logo-preview {
      width: 96px; height: 96px; border-radius: 12px; border: 1px solid var(--border);
      display: flex; align-items: center; justify-content: center; background: #f8fafc; overflow: hidden; flex-shrink: 0;
      img { max-width: 100%; max-height: 100%; object-fit: contain; }
    }
    .theme-color-swatch {
      width: 38px; height: 38px; padding: 2px; border: 1px solid var(--border); border-radius: 8px; flex-shrink: 0; cursor: pointer;
    }
  `],
})
export class AppearanceComponent implements OnInit {
  loading = true;
  saving = false;
  uploadingLogo = false;
  values: Record<string, string> = {};

  colorFields = THEME_FIELDS.filter((f) => f.key !== 'theme_app_name');
  appNameField = THEME_FIELDS.find((f) => f.key === 'theme_app_name')!;
  groups = Array.from(new Set(this.colorFields.map((f) => f.group)));

  constructor(
    private http: HttpClient,
    private themeSvc: ThemeService,
    public auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  fieldsByGroup(group: string): ThemeFieldDef[] {
    return this.colorFields.filter((f) => f.group === group);
  }

  asHex(v: string): string {
    // <input type="color"> needs a strict #rrggbb — fall back to a neutral swatch for rgba()/named values.
    return v && /^#[0-9a-fA-F]{6}$/.test(v) ? v : '#000000';
  }

  load(): void {
    this.loading = true;
    this.themeSvc.getTheme().subscribe({
      next: (res: any) => {
        this.values = { ...(res?.data || {}) };
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploadingLogo = true;
    const formData = new FormData();
    formData.append('file', file);
    this.http.post<any>(`${environment.apiUrl}/media`, formData).subscribe({
      next: (res: any) => {
        const filename = res?.data?.media?.filename;
        if (filename) {
          this.values['theme_logo_url'] = environment.apiUrl.replace('/api', '') + '/uploads/media/' + filename;
        }
        this.uploadingLogo = false;
      },
      error: () => {
        this.uploadingLogo = false;
        prettyAlert.fire({ title: 'Upload failed', text: 'Could not upload the logo. Please try again.', icon: 'error' });
      },
    });
  }

  save(): void {
    this.saving = true;
    this.themeSvc.updateTheme(this.values).subscribe({
      next: () => {
        this.saving = false;
        this.themeSvc.apply(this.values);
        prettyAlert.fire({ title: 'Saved!', text: 'Appearance updated across the whole app.', icon: 'success', timer: 1800, showConfirmButton: false });
      },
      error: (err: any) => {
        this.saving = false;
        prettyAlert.fire({ title: 'Error', text: err?.error?.message || 'Failed to save appearance.', icon: 'error' });
      },
    });
  }

  resetToDefaults(): void {
    prettyAlert.fire({
      title: 'Reset appearance?',
      text: 'This clears every customisation and restores the default colors and logo.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, reset',
    }).then((r) => {
      if (!r.isConfirmed) return;
      this.themeSvc.resetTheme().subscribe({
        next: (res: any) => {
          this.values = { ...(res?.data || {}) };
          this.themeSvc.apply(this.values);
          prettyAlert.fire({ title: 'Reset!', icon: 'success', timer: 1500, showConfirmButton: false });
        },
      });
    });
  }

  previewAlert(): void {
    prettyAlert.fire({ title: 'This is a themed alert', text: 'Buttons above use your live Primary color.', icon: 'info' });
  }
}

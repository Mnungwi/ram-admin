import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { MediaLibraryModalComponent } from '../../shared/components/media-library-modal/media-library-modal.component';
import { SERVER_ORIGIN } from '../../core/utils/avatar.util';
import Swal from 'sweetalert2';

// One page that owns EVERY visual knob for official letters — identity
// (logo/name/address/phone/email), accent color, font, sign-off phrase,
// footer line and watermark — with a live preview matching the actual
// letterhead the backend renders (buildLetterHtml / downloadLetterPdf in
// backend/src/controllers/letter.controller.js read these exact same
// website_settings keys). Deploying this app for a different client is
// then just: open this page, change the values, save — no code changes.
@Component({
  selector: 'app-letter-template',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MediaLibraryModalComponent],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Letter Template</h1>
        <p class="page-subtitle">How every official letter looks — preview and PDF — for this client. Applied instantly, no code changes.</p>
      </div>
      <a routerLink="/letters" class="btn btn-outline-secondary btn-sm">
        <i class="bi bi-envelope"></i> View Letters
      </a>
    </div>

    @if (loading()) {
      <div class="d-flex justify-content-center py-5"><div class="spinner-border text-primary"></div></div>
    } @else {
      <div class="row">
        <!-- FORM -->
        <div class="col-lg-7">

          <div class="card mb-3">
            <div class="card-header"><h6 class="fw-600 mb-0">Company Identity</h6></div>
            <div class="card-body">
              <p class="text-muted small">Shared with the public website (same fields as Website Content &gt; Branding &amp; Contact Info).</p>
              <div class="d-flex align-items-center gap-3 mb-3">
                <div class="logo-preview">
                  <img [src]="settings.siteLogo ? resolveImage(settings.siteLogo) : 'assets/img/logo.png'" alt="Logo">
                </div>
                <button class="btn btn-outline-secondary btn-sm" type="button" (click)="showMediaModal.set(true)">
                  <i class="bi bi-images"></i> Change Logo
                </button>
              </div>
              <div class="mb-3">
                <label class="form-label small fw-bold">Company Name</label>
                <input type="text" class="form-control" [(ngModel)]="settings.siteTitle">
              </div>
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label small fw-bold">Phone</label>
                  <input type="text" class="form-control" [(ngModel)]="settings.contactPhone">
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label small fw-bold">Email</label>
                  <input type="text" class="form-control" [(ngModel)]="settings.contactEmail">
                </div>
              </div>
              <div class="mb-1">
                <label class="form-label small fw-bold">Address</label>
                <input type="text" class="form-control" [(ngModel)]="settings.contactAddress">
              </div>
            </div>
          </div>

          <div class="card mb-3">
            <div class="card-header"><h6 class="fw-600 mb-0">Format</h6></div>
            <div class="card-body">
              <div class="row align-items-end">
                <div class="col-md-4 mb-3">
                  <label class="form-label small fw-bold">Accent Color</label>
                  <input type="color" class="form-control form-control-color w-100" [(ngModel)]="settings.accentColor">
                </div>
                <div class="col-md-8 mb-3">
                  <label class="form-label small fw-bold">Font</label>
                  <select class="form-select" [(ngModel)]="settings.fontFamily">
                    <option value="serif">Times New Roman (Serif — traditional)</option>
                    <option value="sans">Helvetica (Sans-serif — modern)</option>
                  </select>
                </div>
              </div>
              <div class="mb-1">
                <label class="form-label small fw-bold">Sign-off Phrase</label>
                <input type="text" class="form-control" [(ngModel)]="settings.signOffText" placeholder="Yours faithfully,">
              </div>
            </div>
          </div>

          <div class="card mb-3">
            <div class="card-header"><h6 class="fw-600 mb-0">Footer</h6></div>
            <div class="card-body">
              <label class="form-label small fw-bold">Footer Line</label>
              <input type="text" class="form-control" [(ngModel)]="settings.footerText"
                     placeholder="e.g. Company Name — P.O. Box 123, Zanzibar | info@company.com | www.company.com">
              <small class="text-muted">Shown centered under every letter. Left blank, it defaults to "{{ settings.siteTitle || 'Company Name' }} — Official Document".</small>
            </div>
          </div>

          <div class="card mb-3">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h6 class="fw-600 mb-0">Watermark</h6>
              <div class="form-check form-switch mb-0">
                <input class="form-check-input" type="checkbox" id="wmEnabled" [(ngModel)]="settings.watermarkEnabled">
                <label class="form-check-label small" for="wmEnabled">{{ settings.watermarkEnabled ? 'On' : 'Off' }}</label>
              </div>
            </div>
            <div class="card-body" [class.opacity-50]="!settings.watermarkEnabled">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label small fw-bold">Text</label>
                  <input type="text" class="form-control" [(ngModel)]="settings.watermarkText"
                         [placeholder]="settings.siteTitle || 'COMPANY NAME'" [disabled]="!settings.watermarkEnabled">
                </div>
                <div class="col-md-3 mb-3">
                  <label class="form-label small fw-bold">Color</label>
                  <input type="color" class="form-control form-control-color w-100" [(ngModel)]="settings.watermarkColor" [disabled]="!settings.watermarkEnabled">
                </div>
                <div class="col-md-3 mb-3">
                  <label class="form-label small fw-bold">Font Size</label>
                  <input type="number" class="form-control" min="20" max="140" [(ngModel)]="settings.watermarkFontSize" [disabled]="!settings.watermarkEnabled">
                </div>
              </div>
              <div class="row">
                <div class="col-md-6 mb-1">
                  <label class="form-label small fw-bold">Opacity ({{ settings.watermarkOpacity }})</label>
                  <input type="range" class="form-range" min="0.02" max="0.3" step="0.01" [(ngModel)]="settings.watermarkOpacity" [disabled]="!settings.watermarkEnabled">
                </div>
                <div class="col-md-6 mb-1">
                  <label class="form-label small fw-bold">Rotation ({{ settings.watermarkRotation }}°)</label>
                  <input type="range" class="form-range" min="-90" max="90" step="5" [(ngModel)]="settings.watermarkRotation" [disabled]="!settings.watermarkEnabled">
                </div>
              </div>
            </div>
          </div>

          <button class="btn btn-primary" [disabled]="saving()" (click)="save()">
            @if (saving()) { <span class="spinner-border spinner-border-sm me-1"></span> }
            <i class="bi bi-save" *ngIf="!saving()"></i> Save Letter Template
          </button>
          <p class="text-muted small mt-2">
            The PDF export (<code>Download PDF</code> on any letter) uses this exact color, font, sign-off, footer and watermark too —
            open any letter to confirm after saving.
          </p>
        </div>

        <!-- LIVE PREVIEW — mirrors buildLetterHtml() in letter.controller.js -->
        <div class="col-lg-5">
          <div style="position:sticky; top:16px;">
            <h6 class="fw-600 text-muted mb-2"><i class="bi bi-eye me-1"></i> Live Preview</h6>
            <div style="position:relative; overflow:hidden; font-family:{{ fontCss }}; padding:26px; border:1px solid #e5e7eb; background:#fff; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1); color:#111827; font-size:12px; border-radius:6px;">
              @if (settings.watermarkEnabled && settings.watermarkText) {
                <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; pointer-events:none; overflow:hidden; z-index:0;">
                  <span [style.transform]="'rotate(' + settings.watermarkRotation + 'deg)'"
                        [style.color]="settings.watermarkColor"
                        [style.opacity]="settings.watermarkOpacity"
                        [style.fontSize.px]="settings.watermarkFontSize / 2"
                        style="font-weight:800; white-space:nowrap; font-family:Helvetica, Arial, sans-serif;">{{ settings.watermarkText }}</span>
                </div>
              }
              <div style="position:relative; z-index:1;">
                <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:10px; margin-bottom:16px;"
                     [style.borderBottom]="'2px solid ' + settings.accentColor">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <img [src]="settings.siteLogo ? resolveImage(settings.siteLogo) : 'assets/img/logo.png'" style="height:26px; width:auto; object-fit:contain;" alt="">
                    <div [style.color]="settings.accentColor" style="font-size:13px; font-weight:800; letter-spacing:0.3px;">{{ settings.siteTitle || 'Company Name' }}</div>
                  </div>
                  <div style="text-align:right; font-size:8px; color:#4b5563; line-height:1.4;">
                    <div>{{ settings.contactAddress }}</div>
                    <div>Tel: {{ settings.contactPhone }} | {{ settings.contactEmail }}</div>
                  </div>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:9px; color:#4b5563; margin-bottom:14px;">
                  <div>Ref No: <strong style="color:#111827;">SAMPLE/LTR/001</strong></div>
                  <div>Date: <strong style="color:#111827;">{{ todayLabel() }}</strong></div>
                </div>
                <div style="margin-bottom:12px;">
                  <div style="font-size:8px; color:#6b7280; text-transform:uppercase;">To:</div>
                  <div style="font-weight:bold;">Sample Recipient, Project Manager</div>
                  <div style="color:#6b7280; font-size:8px;">recipient&#64;example.com</div>
                </div>
                <div style="margin-bottom:14px;">
                  <div style="font-size:10px; font-weight:bold; text-decoration:underline; text-transform:uppercase;">
                    SUBJECT: Sample Letter — Template Preview
                  </div>
                </div>
                <div style="line-height:1.5; margin-bottom:22px;">
                  This is a preview paragraph showing the body text, font and layout your letters will use. Change any
                  setting on the left and this preview updates immediately.
                </div>
                <div style="margin-top:20px;">
                  <div style="margin-bottom:22px;">{{ settings.signOffText || 'Yours faithfully,' }}</div>
                  <div style="font-weight:bold; text-decoration:underline;">Sample Sender</div>
                  <div style="color:#4b5563; font-size:8px;">Job Title</div>
                  <div style="color:#4b5563; font-size:8px;">{{ settings.siteTitle || 'Company Name' }}</div>
                </div>
                @if (settings.footerText || settings.siteTitle) {
                  <div style="margin-top:22px; padding-top:8px; border-top:1px solid #e5e7eb; font-size:7.5px; color:#9ca3af; text-align:center;">
                    {{ settings.footerText || ((settings.siteTitle || 'Company Name') + ' — Official Document') }}
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- Media Library Picker Modal -->
    <app-media-library-modal *ngIf="showMediaModal()"
                              [multiSelect]="false"
                              (close)="showMediaModal.set(false)"
                              (select)="onLogoSelected($event)">
    </app-media-library-modal>
  `,
  styles: [`
    .logo-preview {
      width: 64px; height: 64px; border-radius: 8px; border: 1px solid var(--border, #e2e8f0);
      display: flex; align-items: center; justify-content: center; background: #f8fafc; overflow: hidden; flex-shrink: 0;
      img { max-width: 100%; max-height: 100%; object-fit: contain; }
    }
  `]
})
export class LetterTemplateComponent implements OnInit {
  private adminApiUrl = `${environment.apiUrl}/admin-website`;

  loading = signal(true);
  saving = signal(false);
  showMediaModal = signal(false);

  settings = {
    siteTitle: '',
    siteLogo: '',
    contactAddress: '',
    contactPhone: '',
    contactEmail: '',
    accentColor: '#1a56db',
    fontFamily: 'serif' as 'serif' | 'sans',
    signOffText: 'Yours faithfully,',
    footerText: '',
    watermarkEnabled: false,
    watermarkText: '',
    watermarkColor: '#1a56db',
    watermarkOpacity: 0.08,
    watermarkRotation: -45,
    watermarkFontSize: 60,
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.load();
  }

  get fontCss(): string {
    return this.settings.fontFamily === 'sans' ? 'Helvetica, Arial, sans-serif' : "'Times New Roman', Times, serif";
  }

  todayLabel(): string {
    return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  load(): void {
    this.loading.set(true);
    this.http.get<any>(`${this.adminApiUrl}/settings`).subscribe({
      next: (res: any) => {
        const d = res?.data || {};
        this.settings.siteTitle = d.site_title || '';
        this.settings.siteLogo = d.site_logo || '';
        this.settings.contactAddress = d.contact_address || '';
        this.settings.contactPhone = d.contact_phone || '';
        this.settings.contactEmail = d.contact_email || '';
        this.settings.accentColor = d.letter_accent_color || '#1a56db';
        this.settings.fontFamily = d.letter_font_family === 'sans' ? 'sans' : 'serif';
        this.settings.signOffText = d.letter_signoff_text || 'Yours faithfully,';
        this.settings.footerText = d.letter_footer_text || '';
        this.settings.watermarkEnabled = d.letter_watermark_enabled === 'true';
        this.settings.watermarkText = d.letter_watermark_text || '';
        this.settings.watermarkColor = d.letter_watermark_color || '#1a56db';
        this.settings.watermarkOpacity = d.letter_watermark_opacity ? Number(d.letter_watermark_opacity) : 0.08;
        this.settings.watermarkRotation = d.letter_watermark_rotation !== undefined && d.letter_watermark_rotation !== null && d.letter_watermark_rotation !== ''
          ? Number(d.letter_watermark_rotation) : -45;
        this.settings.watermarkFontSize = d.letter_watermark_font_size ? Number(d.letter_watermark_font_size) : 60;
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  save(): void {
    this.saving.set(true);
    const payload = {
      site_title: this.settings.siteTitle,
      site_logo: this.settings.siteLogo,
      contact_address: this.settings.contactAddress,
      contact_phone: this.settings.contactPhone,
      contact_email: this.settings.contactEmail,
      letter_accent_color: this.settings.accentColor,
      letter_font_family: this.settings.fontFamily,
      letter_signoff_text: this.settings.signOffText,
      letter_footer_text: this.settings.footerText,
      letter_watermark_enabled: String(this.settings.watermarkEnabled),
      letter_watermark_text: this.settings.watermarkText,
      letter_watermark_color: this.settings.watermarkColor,
      letter_watermark_opacity: String(this.settings.watermarkOpacity),
      letter_watermark_rotation: String(this.settings.watermarkRotation),
      letter_watermark_font_size: String(this.settings.watermarkFontSize),
    };
    this.http.put(`${this.adminApiUrl}/settings`, payload).subscribe({
      next: () => {
        this.saving.set(false);
        Swal.fire({ icon: 'success', title: 'Saved', text: 'Letter template updated.', timer: 1600, showConfirmButton: false });
      },
      error: () => {
        this.saving.set(false);
        Swal.fire('Error', 'Failed to save the letter template.', 'error');
      },
    });
  }

  onLogoSelected(mediaItems: any[]): void {
    if (mediaItems.length) {
      this.settings.siteLogo = SERVER_ORIGIN + '/uploads/media/' + mediaItems[0].filename;
    }
    this.showMediaModal.set(false);
  }

  resolveImage(imagePath: string): string {
    if (!imagePath) return 'assets/img/logo.png';
    if (/^https?:\/\//i.test(imagePath)) return imagePath;
    return SERVER_ORIGIN + (imagePath.startsWith('/') ? imagePath : '/' + imagePath);
  }
}

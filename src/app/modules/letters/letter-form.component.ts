import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormArray, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { LetterService, ProjectService, DocumentService, UserService } from '../../core/services/domain.services';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { SearchableSelectComponent, SelectOption } from '../../shared/components/searchable-select/searchable-select.component';
import { resolveAvatarUrl } from '../../core/utils/avatar.util';
import { CKEditorModule } from 'ng2-ckeditor';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-letter-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, CKEditorModule, SearchableSelectComponent],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ isEdit ? 'Edit Letter' : 'Compose Letter' }}</h1>
        <p class="page-subtitle">{{ isEdit ? 'Update letter details' : 'Create a new letter or correspondence' }}</p>
      </div>
      <a routerLink="/letters" class="btn btn-outline-secondary btn-sm">
        <i class="bi bi-arrow-left"></i> Back
      </a>
    </div>

    <div class="row">
      <!-- Form -->
      <div class="col-lg-8">
        <form [formGroup]="form" (ngSubmit)="onSave('draft')">
          @if (error()) {
            <div class="alert alert-danger mb-3">{{ error() }}</div>
          }

          <!-- Header Info -->
          <div class="card mb-3">
            <div class="card-header"><h5 class="card-title">Letter Details</h5></div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-3 mb-3">
                  <label class="form-label">Type <span class="text-danger">*</span></label>
                  <select class="form-control" formControlName="type">
                    <option value="outgoing">Outgoing</option>
                    <option value="incoming">Incoming</option>
                    <option value="internal">Internal</option>
                    <option value="memo">Memo</option>
                  </select>
                </div>
                <div class="col-md-3 mb-3">
                  <label class="form-label">Priority</label>
                  <select class="form-control" formControlName="priority">
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">🔴 Urgent</option>
                  </select>
                </div>
                <div class="col-md-3 mb-3">
                  <label class="form-label">Letter Date <span class="text-danger">*</span></label>
                  <input type="date" class="form-control" formControlName="letterDate">
                </div>
                <div class="col-md-3 mb-3">
                  <label class="form-label">Project</label>
                  <app-searchable-select
                    [options]="projectOptions"
                    formControlName="projectId"
                    placeholder="General (No Project)"
                    searchPlaceholder="Search by code or name..."
                    [clearable]="true">
                  </app-searchable-select>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label">Subject <span class="text-danger">*</span></label>
                <input class="form-control" formControlName="subject"
                       placeholder="e.g. Re: Site Inspection Schedule – June 2026"
                       [class.is-invalid]="f['subject'].touched && f['subject'].invalid">
                @if (f['subject'].touched && f['subject'].invalid) {
                  <div class="invalid-feedback">Subject is required</div>
                }
              </div>

              <div class="mb-3">
                <label class="form-label">Reference No.</label>
                @if (form.get('type')?.value === 'outgoing' && !writtenExternally()) {
                  @if (form.get('referenceNo')?.value) {
                    <div class="form-control-plaintext fw-bold" style="padding: 6px 12px; background: #eff6ff; border-radius: 6px; border: 1px solid #bfdbfe; color:#1e3a8a">
                      <i class="bi bi-hash mr-2"></i>{{ form.get('referenceNo')?.value }}
                    </div>
                  } @else {
                    <div class="form-control-plaintext font-weight-bold text-muted" style="padding: 6px 12px; background: #f3f4f6; border-radius: 6px; border: 1px solid #e5e7eb">
                      <i class="bi bi-cpu mr-2"></i>[Auto-generated by System based on Project Sequence]
                    </div>
                  }
                } @else {
                  <div class="d-flex gap-2">
                    <input class="form-control" formControlName="referenceNo" placeholder="e.g. ZAE-2026-001">
                    @if (writtenExternally()) {
                      <button type="button" class="btn btn-outline-secondary text-nowrap" [disabled]="peekingRef()" (click)="peekNextReference()">
                        <i class="bi bi-magic"></i> Suggest next
                      </button>
                    }
                  </div>
                  @if (writtenExternally()) {
                    <div class="text-muted text-small mt-1">
                      Type the reference number already written on the letter. Not sure which one is free? Click "Suggest next" — the system checks uniqueness when you save either way.
                    </div>
                  }
                }
              </div>

              <div class="form-check mb-1">
                <input class="form-check-input" type="checkbox" id="writtenExternally"
                       [checked]="writtenExternally()" (change)="onWrittenExternallyChange($event)">
                <label class="form-check-label" for="writtenExternally">
                  This letter was already written outside the system (e.g. in Word) — I'm just uploading &amp; registering it
                </label>
              </div>
              @if (writtenExternally()) {
                <div class="alert alert-info py-2 px-3 text-small mb-0">
                  <i class="bi bi-info-circle me-1"></i> Letter Body below is optional — attach the actual file instead. It will still go through the normal Draft → Submit → Approve → Send workflow.
                </div>
              }
            </div>
          </div>

          <!-- From -->
          <div class="card mb-3">
            <div class="card-header"><h5 class="card-title">From (Sender)</h5></div>
            <div class="card-body">
              <div class="mb-3">
                <label class="form-label">Signing As <span class="text-muted fw-normal">(optional — preparing this letter on behalf of someone else?)</span></label>
                <app-searchable-select
                  [options]="signerOptions"
                  [ngModel]="form.get('senderId')?.value"
                  [ngModelOptions]="{standalone: true}"
                  (valueChange)="onSignerSelected($event)"
                  placeholder="Sign as myself"
                  searchPlaceholder="Search staff..."
                  [clearable]="true">
                </app-searchable-select>
                <div class="text-muted text-small mt-1">
                  Pick a colleague to fill in their Name/Title/Organisation below and stamp their saved digital signature (Profile &gt; Digital Signature) on this letter — for a secretary preparing correspondence on behalf of a director, for example. Leave blank to sign as yourself.
                </div>
              </div>
              <div class="row">
                <div class="col-md-4 mb-3">
                  <label class="form-label">Name</label>
                  <input class="form-control" formControlName="fromName" placeholder="Full name">
                </div>
                <div class="col-md-4 mb-3">
                  <label class="form-label">Title / Position</label>
                  <input class="form-control" formControlName="fromTitle" placeholder="e.g. Project Manager">
                </div>
                <div class="col-md-4 mb-3">
                  <label class="form-label">Organisation</label>
                  <input class="form-control" formControlName="fromOrg" placeholder="e.g. RAM Projects Ltd">
                </div>
              </div>
            </div>
          </div>

          <!-- To -->
          <div class="card mb-3">
            <div class="card-header"><h5 class="card-title">To (Primary Recipient) <span class="text-danger">*</span></h5></div>
            <div class="card-body">
              <!-- Stakeholder Dropdown (only visible if project is selected) -->
              @if (form.get('projectId')?.value) {
                <div class="mb-3">
                  <label class="form-label">Choose from Project Stakeholders</label>
                  <select class="form-control" formControlName="recipientId" (change)="onRecipientStakeholderChange($event)">
                    <option value="">-- Choose Stakeholder --</option>
                    @for (s of projectStakeholders(); track s.id) {
                      <option [value]="s.stakeholder?.id || s.stakeholderId">
                        {{ s.stakeholder?.name || s.name }} ({{ s.role || s.type?.name || 'Stakeholder' }})
                      </option>
                    }
                  </select>
                </div>
              }

              @if (!form.get('projectId')?.value || form.get('recipientId')?.value) {
                <div class="row">
                  <div class="col-md-4 mb-3">
                    <label class="form-label">Name <span class="text-danger">*</span></label>
                    <input class="form-control" formControlName="toName" placeholder="Recipient name"
                           [class.is-invalid]="f['toName'].touched && f['toName'].invalid"
                           [readonly]="form.get('recipientId')?.value">
                  </div>
                  <div class="col-md-4 mb-3">
                    <label class="form-label">Title / Position</label>
                    <input class="form-control" formControlName="toTitle" placeholder="e.g. Site Engineer"
                           [readonly]="form.get('recipientId')?.value">
                  </div>
                  <div class="col-md-4 mb-3">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-control" formControlName="toEmail" placeholder="recipient@example.com"
                           [readonly]="form.get('recipientId')?.value">
                  </div>
                </div>
                <div class="mb-2">
                  <label class="form-label">Organisation</label>
                  <input class="form-control" formControlName="toOrg" placeholder="Organisation name"
                         [readonly]="form.get('recipientId')?.value">
                </div>
              }
            </div>
          </div>

          <!-- CC Recipients -->
          <div class="card mb-3">
            <div class="card-header">
              <h5 class="card-title">CC Recipients</h5>
              <button type="button" class="btn btn-outline-primary btn-sm" (click)="addCc()">
                <i class="bi bi-plus-lg"></i> Add CC
              </button>
            </div>
            <div class="card-body">
              @if (ccArray.length === 0) {
                <div class="text-muted text-small text-center py-2">No CC recipients added</div>
              }
              @for (cc of ccArray.controls; track $index) {
                <div class="cc-row" [formGroup]="getCcGroup($index)" style="display:flex; flex-direction:column; gap:8px">
                  <div class="d-flex align-items-center justify-content-between w-100">
                    <span class="badge badge-secondary">CC Recipient #{{ $index + 1 }}</span>
                    <button type="button" class="btn btn-link text-danger p-0" (click)="removeCc($index)">
                      <i class="bi bi-trash"></i> Remove
                    </button>
                  </div>
                  
                  @if (form.get('projectId')?.value) {
                    <div class="mb-2">
                      <select class="form-control form-control-sm" formControlName="id" (change)="onCcStakeholderChange($index, $event)">
                        <option value="">-- Choose CC from Project Stakeholders --</option>
                        @for (s of getCcOptions($index); track s.id) {
                          <option [value]="s.stakeholder?.id || s.stakeholderId">
                            {{ s.stakeholder?.name || s.name }} ({{ s.role || s.type?.name || 'Stakeholder' }})
                          </option>
                        }
                      </select>
                    </div>
                  }

                  @if (!form.get('projectId')?.value || getCcGroup($index).get('id')?.value) {
                    <div class="row w-100 m-0">
                      <div class="col-md-4 mb-2 pl-0">
                        <input class="form-control form-control-sm" formControlName="name" placeholder="Full name"
                               [readonly]="getCcGroup($index).get('id')?.value">
                      </div>
                      <div class="col-md-4 mb-2">
                        <input class="form-control form-control-sm" formControlName="title" placeholder="Title / Position"
                               [readonly]="getCcGroup($index).get('id')?.value">
                      </div>
                      <div class="col-md-4 mb-2 pr-0">
                        <input class="form-control form-control-sm" formControlName="email" placeholder="Email address"
                               [readonly]="getCcGroup($index).get('id')?.value">
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Body -->
          <div class="card mb-3">
            <div class="card-header"><h5 class="card-title">Letter Body <span class="text-danger" *ngIf="!writtenExternally()">*</span> <span class="text-muted text-small fw-normal" *ngIf="writtenExternally()">(optional — file attached instead)</span></h5></div>
            <div class="card-body">
              <ckeditor
                formControlName="body"
                [config]="ckeditorConfig"
                debounce="500">
              </ckeditor>
              @if (f['body'].touched && f['body'].invalid) {
                <div class="invalid-feedback d-block">Letter body is required</div>
              }
              <div class="text-muted text-small mt-1">
                {{ form.get('body')?.value?.length || 0 }} characters
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div class="card mb-3">
            <div class="card-header"><h5 class="card-title">Internal Notes</h5></div>
            <div class="card-body">
              <textarea class="form-control" formControlName="notes" rows="2"
                        placeholder="Notes visible only to staff (not printed on letter)"></textarea>
            </div>
          </div>

          <!-- Attachments -->
          <div class="card mb-3">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="card-title mb-0">Letter Attachments ({{ selectedAttachments.length }})</h5>
              <button type="button" class="btn btn-outline-primary btn-sm" (click)="openMediaModal()">
                <i class="bi bi-images me-1"></i> Choose from Gallery
              </button>
            </div>
            <div class="card-body">
              <div *ngIf="selectedAttachments.length > 0" class="mb-3">
                <div *ngFor="let att of selectedAttachments; let idx = index" 
                     class="alert alert-success d-flex align-items-center justify-content-between py-2 px-3 mb-2">
                  <div class="d-flex align-items-center">
                    <i class="bi bi-paperclip text-success me-2 fs-5"></i>
                    <div>
                      <strong class="d-block text-dark" style="font-size:13px">{{ att.fileName || att.title }}</strong>
                      <span class="badge bg-secondary" style="font-size:10px" *ngIf="att.category">{{ att.category }}</span>
                    </div>
                  </div>
                  <button type="button" class="btn-close" (click)="removeAttachment(idx)"><span aria-hidden="true">&times;</span></button>
                </div>
              </div>

              <div>
                <input type="file" class="form-control" (change)="onFileChange($event)"
                       accept=".pdf,image/*,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" multiple>
                <div class="text-muted text-small mt-1">Upload file(s) from computer (PDF, image, or Word) or choose existing files from Document Gallery</div>
                @if (writtenExternally() && selectedAttachments.length === 0) {
                  <div class="text-danger text-small mt-1"><i class="bi bi-exclamation-circle"></i> Attach the letter file — required when registering a letter written outside the system</div>
                }
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="d-flex gap-2 justify-content-end">
            <a routerLink="/letters" class="btn btn-outline-secondary">Cancel</a>
            <button type="button" class="btn btn-outline-primary" [disabled]="saving()" (click)="onSave('draft')">
              <i class="bi bi-save"></i> Save as Draft
            </button>
            @if (auth.hasPermission('letter:send')) {
              <button type="button" class="btn btn-warning" [disabled]="saving()" (click)="onSave('submit')">
                <i class="bi bi-send"></i> Save & Submit
              </button>
            }
          </div>
        </form>
      </div>

      <!-- Sidebar -->
      <div class="col-lg-4">
        <!-- Live Preview Card -->
        <div class="card mb-3" style="position: sticky; top: 80px">
          <div class="card-header">
            <h5 class="card-title"><i class="bi bi-eye mr-2"></i>Preview</h5>
            @if (savedId()) {
              <button type="button" class="btn btn-outline-primary btn-sm" (click)="openPreviewModal()">
                <i class="bi bi-eye"></i> Full Preview
              </button>
            }
          </div>
          <div class="card-body" style="font-family: 'Times New Roman', serif; font-size: 12px; line-height: 1.6; color:#222">
            <!-- Mini letterhead preview — real company branding + only what's
                 actually been entered so far (no fake sample content). The
                 exact final render (real letterhead, real reference number)
                 is the "Full Preview" button above, once the letter is saved. -->
            <div style="border-bottom: 2px solid #1e3a5f; padding-bottom: 8px; margin-bottom: 12px; display:flex; align-items:center; gap:8px">
              <img [src]="themeSvc.logoUrl()" alt="Logo" style="height:28px; width:auto; object-fit:contain" *ngIf="themeSvc.logoUrl()">
              <div style="font-size:14px; font-weight:700; color:#1e3a5f">{{ themeSvc.appName() }}</div>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:10px">
              <div style="font-size:10px; color:#666">
                Ref:
                @if (f['referenceNo'].value) {
                  <strong>{{ f['referenceNo'].value }}</strong>
                } @else {
                  <em class="text-muted">assigned automatically when saved</em>
                }
              </div>
              <div class="priority-preview priority-{{ f['priority'].value }}">
                {{ (f['priority'].value || 'normal').toUpperCase() }}
              </div>
            </div>
            <div style="margin-bottom:10px">
              <div style="font-size:10px; color:#888">TO</div>
              @if (f['toName'].value) {
                <div style="font-weight:600">{{ f['toName'].value }}</div>
                <div style="color:#666">{{ f['toTitle'].value }}</div>
                <div style="color:#666">{{ f['toOrg'].value }}</div>
              } @else {
                <div class="text-muted"><em>Not entered yet</em></div>
              }
            </div>
            <div style="margin-bottom:10px">
              <div style="font-size:10px; color:#888">SUBJECT</div>
              @if (f['subject'].value) {
                <div style="font-weight:600; text-decoration:underline">{{ f['subject'].value }}</div>
              } @else {
                <div class="text-muted"><em>Not entered yet</em></div>
              }
            </div>
            @if (f['body'].value) {
              <div style="white-space:pre-wrap; max-height:200px; overflow:hidden; color:#444; font-size:11px">{{ f['body'].value | slice:0:400 }}{{ f['body'].value.length > 400 ? '...' : '' }}</div>
            } @else {
              <div class="text-muted" style="font-size:11px"><em>Letter body not entered yet</em></div>
            }
            <!-- Sign-off — your own stored signature shows immediately
                 (you're signing by writing it); a delegated "Signing As"
                 shows a placeholder instead, since it only gets stamped
                 once THEY approve it (see Full Preview after that happens). -->
            <div style="margin-top:14px; border-top:1px solid #eee; padding-top:10px">
              @if (!f['senderId'].value && mySignatureUrl()) {
                <img [src]="mySignatureUrl()" alt="Your signature" style="height:34px; object-fit:contain; margin-bottom:4px">
              } @else if (f['senderId'].value) {
                <div class="text-muted text-small"><em>Awaiting {{ getChosenSignerName() }}'s signature</em></div>
              }
              <div style="font-weight:600; font-size:11px">{{ f['fromName'].value || '' }}</div>
            </div>
            @if (ccArray.length > 0) {
              <div style="margin-top:12px; border-top:1px solid #eee; padding-top:8px; font-size:10px; color:#888">
                <strong>CC:</strong>
                @for (cc of ccArray.controls; track $index) {
                  <div style="margin-left:8px">{{ getCcGroup($index).get('name')?.value }}</div>
                }
              </div>
            }
          </div>
        </div>

        <!-- Tips -->
        <div class="card">
          <div class="card-header"><h5 class="card-title">Writing Tips</h5></div>
          <div class="card-body">
            @for (tip of tips; track tip) {
              <div class="d-flex gap-2 mb-2">
                <i class="bi bi-check-circle-fill text-success" style="font-size:14px; flex-shrink:0; margin-top:2px"></i>
                <span style="font-size:12.5px; color:#6b7280">{{ tip }}</span>
              </div>
            }
          </div>
        </div>
      </div>
    </div>

    <!-- WORDPRESS STYLE MEDIA / DOCUMENT LIBRARY MODAL -->
    <div class="modal-overlay sub-overlay" *ngIf="showMediaModal" (click)="closeMediaModal()" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:1085"></div>
    <div class="modal-dialog modal-lg sub-modal" *ngIf="showMediaModal" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:1090;width:90%;max-width:850px">
      <div class="modal-content shadow-lg border-0" style="border-radius:12px;background:#fff">
        <div class="modal-header bg-dark text-white py-3 px-4 d-flex justify-content-between align-items-center">
          <h6 class="modal-title mb-0 fw-bold"><i class="bi bi-images me-2 text-warning"></i>Media & Document Gallery</h6>
          <button type="button" class="btn-close btn-close-white" (click)="closeMediaModal()"></button>
        </div>
        <div class="modal-body p-4" style="max-height:500px;overflow-y:auto">
          <!-- Toolbar search & filter -->
          <div class="row g-2 mb-3">
            <div class="col-md-7">
              <input type="text" class="form-control" placeholder="Search gallery documents..." [(ngModel)]="mediaSearchTerm" (input)="applyMediaFilters()">
            </div>
            <div class="col-md-5">
              <select class="form-select" [(ngModel)]="mediaCategoryFilter" (change)="applyMediaFilters()">
                <option value="">All Categories</option>
                <option value="Report">Reports</option>
                <option value="Drawing">Drawings</option>
                <option value="Contract">Contracts</option>
                <option value="Specification">Specifications</option>
                <option value="Permit">Permits</option>
              </select>
            </div>
          </div>

          <div *ngIf="loadingMedia" class="text-center py-5">
            <div class="spinner-border text-primary"></div>
            <div class="small text-muted mt-2">Loading document gallery...</div>
          </div>

          <!-- Media Grid -->
          <div class="row g-3" *ngIf="!loadingMedia">
            <div class="col-md-3 col-sm-4 col-6 mb-3" *ngFor="let doc of filteredMediaDocuments">
              <div class="border rounded p-3 text-center position-relative h-100 shadow-sm"
                   [style.border-color]="isGalleryDocumentSelected(doc) ? '#2563eb' : '#e5e7eb'"
                   [style.background-color]="isGalleryDocumentSelected(doc) ? '#eff6ff' : '#ffffff'"
                   (click)="toggleGalleryDocument(doc)" style="cursor:pointer; transition:all 0.2s; border-width: 2px !important;">
                
                <!-- Tick Badge in Top-Right Corner -->
                <div *ngIf="isGalleryDocumentSelected(doc)" 
                     class="position-absolute shadow-sm"
                     style="top: 8px; right: 8px; width: 26px; height: 26px; border-radius: 50%; background: #2563eb; color: #fff; display: flex; align-items: center; justify-content: center; z-index: 10;">
                  <i class="bi bi-check-lg" style="font-size: 16px; font-weight: bold;"></i>
                </div>

                <div class="py-2 text-secondary" style="font-size:36px">
                  <i class="bi" [ngClass]="{
                    'bi-file-earmark-pdf text-danger': doc.mimeType?.includes('pdf') || doc.fileName?.endsWith('.pdf'),
                    'bi-file-earmark-image text-success': doc.mimeType?.includes('image'),
                    'bi-file-earmark-text text-primary': true
                  }"></i>
                </div>
                
                <div class="fw-semibold text-truncate small title-text" [title]="doc.title || doc.fileName">
                  {{ doc.title || doc.fileName }}
                </div>
                <div class="badge bg-light text-dark mt-1" style="font-size:10px">{{ doc.category }}</div>
              </div>
            </div>

            <div class="col-12 text-center py-4 text-muted" *ngIf="filteredMediaDocuments.length === 0">
              <i class="bi bi-folder2-open fa-2x mb-2 text-muted" style="font-size:32px"></i>
              <div>No documents found in gallery.</div>
            </div>
          </div>
        </div>
        <div class="modal-footer bg-light py-2 px-4 d-flex justify-content-between align-items-center">
          <span class="small text-muted">
            Selected ({{ selectedGalleryDocuments.length }} documents)
          </span>
          <div>
            <button type="button" class="btn btn-secondary btn-sm me-2" (click)="closeMediaModal()">Cancel</button>
            <button type="button" class="btn btn-primary btn-sm" [disabled]="selectedGalleryDocuments.length === 0" (click)="confirmDocumentSelection()">
              <i class="bi bi-paperclip me-1"></i> Attach Selected
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- FULL PREVIEW MODAL (inline iframe, no new tab) -->
    @if (showPreviewModal() && previewSafeUrl()) {
      <div class="modal-backdrop-custom" (click)="closePreviewModal()" style="position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:1050;backdrop-filter:blur(3px)"></div>
      <div class="modal-custom" style="position:fixed;inset:0;z-index:1055;display:flex;align-items:center;justify-content:center;padding:20px">
        <div class="modal-content shadow-lg border-0" style="max-width:920px;width:100%;height:90vh;border-radius:12px;background:#fff;display:flex;flex-direction:column;overflow:hidden">
          <div class="modal-header bg-dark text-white py-3 px-4 d-flex justify-content-between align-items-center" style="border-top-left-radius:12px;border-top-right-radius:12px">
            <div class="d-flex align-items-center gap-2">
              <i class="bi bi-file-earmark-text text-warning fs-4"></i>
              <h6 class="modal-title mb-0 fw-bold text-white">Letter Preview</h6>
            </div>
            <div class="d-flex align-items-center gap-2">
              <a [href]="previewUrl()" target="_blank" class="btn btn-sm btn-outline-light">
                <i class="bi bi-box-arrow-up-right me-1"></i> Open in New Tab
              </a>
              <button type="button" class="close text-white ml-2" (click)="closePreviewModal()"><span style="font-size:24px">&times;</span></button>
            </div>
          </div>
          <div class="modal-body p-0 flex-grow-1" style="background:#f3f4f6">
            <iframe [src]="previewSafeUrl()!" style="width:100%;height:100%;border:none"></iframe>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .cc-row {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 10px; background: #f9fafb; border-radius: 8px;
      border: 1px solid #e5e7eb; margin-bottom: 8px;
    }
    .cc-index {
      width: 24px; height: 24px; background: #e5e7eb; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 600; color: #6b7280; flex-shrink: 0; margin-top: 4px;
    }
    .priority-preview {
      padding: 2px 8px; border-radius: 10px; font-size: 9px; font-weight: 700;
      &.priority-urgent { background: #fee2e2; color: #991b1b; }
      &.priority-high   { background: #fff7ed; color: #9a3412; }
      &.priority-normal { background: #eff6ff; color: #1e40af; }
      &.priority-low    { background: #f3f4f6; color: #6b7280; }
    }
  `]
})
export class LetterFormComponent implements OnInit {
  // Kept deliberately light — this is an official-letter body, not a page builder.
  ckeditorConfig = {
    uiColor: '#F0F3F4',
    height: '350',
    extraPlugins: 'divarea',
    versionCheck: false,
    removePlugins: 'elementspath',
    resize_enabled: false,
    toolbarGroups: [
      { name: 'basicstyles', groups: ['basicstyles'] },
      { name: 'paragraph', groups: ['list', 'indent', 'align'] },
      { name: 'links' },
      { name: 'clipboard', groups: ['undo'] },
    ],
    removeButtons: 'Strike,Subscript,Superscript,Anchor,CopyFormatting,BlockQuote,Language,BidiLtr,BidiRtl'
  };

  form = this.fb.group({
    projectId:   [''],
    recipientId: [''],
    type:        ['outgoing'],
    priority:    ['normal'],
    letterDate:  [new Date().toISOString().split('T')[0], Validators.required],
    subject:     ['', Validators.required],
    referenceNo: [''],
    senderId:    [''],
    fromName:    [''],
    fromTitle:   [''],
    fromOrg:     ['RAM Projects Ltd'],
    toName:      ['', Validators.required],
    toTitle:     [''],
    toOrg:       [''],
    toEmail:     ['', Validators.email],
    body:        ['', Validators.required],
    notes:       [''],
    ccRecipients: this.fb.array([])
  });

  saving = signal(false);
  error = signal('');
  // "Written outside the system" (e.g. drafted in Word before being
  // uploaded here) — relaxes the body-required rule (content lives in the
  // attachment instead) and unlocks the Reference No. field for outgoing
  // letters too (normally auto-generated only), since it needs to carry
  // whatever number was already handwritten/typed on the original document.
  writtenExternally = signal(false);
  peekingRef = signal(false);
  projectsList = signal<any[]>([]);
  projectOptions: SelectOption[] = [];
  allUsers: any[] = [];
  signerOptions: SelectOption[] = [];
  projectStakeholders = signal<any[]>([]);
  selectedFile: File | null = null;
  isEdit = false;
  savedId = signal('');
  letterId = '';
  currentYear = new Date().getFullYear();

  tips = [
    'Start with a clear reference to the subject',
    'Keep paragraphs short and focused',
    'Use formal language: "We write to inform..." not "I wanted to say..."',
    'Always include the letter date and reference number',
    'Add CC recipients for stakeholders who need to be informed',
  ];

  get f() { return this.form.controls; }
  get ccArray() { return this.form.get('ccRecipients') as FormArray; }

  getCcGroup(index: number): FormGroup {
    return this.ccArray.at(index) as FormGroup;
  }

  previewUrl(): string {
    return this.savedId() ? `${environment.apiUrl}/letters/${this.savedId()}/preview` : '';
  }

  showPreviewModal = signal(false);
  previewSafeUrl = signal<SafeResourceUrl | null>(null);

  openPreviewModal(): void {
    if (!this.savedId()) return;
    const tsUrl = `${this.previewUrl()}?t=${Date.now()}`;
    this.previewSafeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(tsUrl));
    this.showPreviewModal.set(true);
  }

  closePreviewModal(): void {
    this.showPreviewModal.set(false);
    this.previewSafeUrl.set(null);
  }

  // Media Gallery Modal state
  showMediaModal = false;
  mediaDocuments: any[] = [];
  filteredMediaDocuments: any[] = [];
  loadingMedia = false;
  mediaSearchTerm = '';
  mediaCategoryFilter = '';
  selectedGalleryDocuments: any[] = [];
  selectedAttachments: any[] = [];

  openMediaModal(): void {
    this.showMediaModal = true;
    this.loadingMedia = true;
    const pid = this.form.get('projectId')?.value || '';
    this.docSvc.getAll(pid).subscribe({
      next: (res: any) => {
        this.mediaDocuments = res?.data?.documents || res?.data?.rows || res?.data || [];
        this.applyMediaFilters();
        this.selectedGalleryDocuments = this.mediaDocuments.filter(doc =>
          this.selectedAttachments.some(a =>
            (a.documentId && a.documentId === doc.id) ||
            (a.id && a.id === doc.id) ||
            (a.filePath && doc.filePath && (a.filePath === doc.filePath || a.filePath.endsWith(doc.fileName || '___'))) ||
            (a.fileName && doc.fileName && a.fileName.trim().toLowerCase() === doc.fileName.trim().toLowerCase()) ||
            (a.title && doc.title && a.title.trim().toLowerCase() === doc.title.trim().toLowerCase())
          )
        );
        this.loadingMedia = false;
      },
      error: () => {
        this.loadingMedia = false;
      }
    });
  }

  closeMediaModal(): void {
    this.showMediaModal = false;
  }

  applyMediaFilters(): void {
    let docs = [...this.mediaDocuments];
    if (this.mediaCategoryFilter) {
      docs = docs.filter(d => d.category === this.mediaCategoryFilter);
    }
    if (this.mediaSearchTerm) {
      const term = this.mediaSearchTerm.toLowerCase();
      docs = docs.filter(d => (d.title || '').toLowerCase().includes(term) || (d.fileName || '').toLowerCase().includes(term));
    }
    this.filteredMediaDocuments = docs;
  }

  toggleGalleryDocument(doc: any): void {
    const isSelected = this.isGalleryDocumentSelected(doc);
    if (isSelected) {
      this.selectedGalleryDocuments = this.selectedGalleryDocuments.filter(d =>
        d.id !== doc.id && !(d.fileName && doc.fileName && d.fileName === doc.fileName)
      );
      this.selectedAttachments = this.selectedAttachments.filter(a =>
        !(
          (a.documentId && a.documentId === doc.id) ||
          (a.id && a.id === doc.id) ||
          (a.fileName && doc.fileName && a.fileName.trim().toLowerCase() === doc.fileName.trim().toLowerCase()) ||
          (a.title && doc.title && a.title.trim().toLowerCase() === doc.title.trim().toLowerCase())
        )
      );
    } else {
      if (!this.selectedGalleryDocuments.some(d => d.id === doc.id)) {
        this.selectedGalleryDocuments.push(doc);
      }
      if (!this.selectedAttachments.some(a => (a.documentId && a.documentId === doc.id) || (a.fileName && doc.fileName && a.fileName.trim().toLowerCase() === doc.fileName.trim().toLowerCase()))) {
        this.selectedAttachments.push({
          documentId: doc.id,
          fileName: doc.fileName || doc.title,
          filePath: doc.filePath,
          category: doc.category || 'Gallery'
        });
      }
    }
  }

  isGalleryDocumentSelected(doc: any): boolean {
    if (!doc) return false;
    const inGallery = this.selectedGalleryDocuments.some(d =>
      d.id === doc.id || (d.fileName && doc.fileName && d.fileName.trim().toLowerCase() === doc.fileName.trim().toLowerCase())
    );
    if (inGallery) return true;

    return this.selectedAttachments.some(a =>
      (a.documentId && a.documentId === doc.id) ||
      (a.id && a.id === doc.id) ||
      (a.filePath && doc.filePath && (a.filePath === doc.filePath || a.filePath.endsWith(doc.fileName || '___'))) ||
      (a.fileName && doc.fileName && a.fileName.trim().toLowerCase() === doc.fileName.trim().toLowerCase()) ||
      (a.title && doc.title && a.title.trim().toLowerCase() === doc.title.trim().toLowerCase())
    );
  }

  confirmDocumentSelection(): void {
    const uploadedFiles = this.selectedAttachments.filter(a => !!a.file);
    const galleryAtts = this.selectedGalleryDocuments.map(doc => ({
      documentId: doc.id,
      fileName: doc.fileName || doc.title,
      filePath: doc.filePath,
      category: doc.category || 'Gallery'
    }));

    const combined = [...uploadedFiles];
    galleryAtts.forEach(g => {
      if (!combined.some(c => (c.documentId && c.documentId === g.documentId) || c.filePath === g.filePath || c.fileName === g.fileName)) {
        combined.push(g);
      }
    });

    this.selectedAttachments = combined;
    this.showMediaModal = false;
  }

  removeAttachment(index: number): void {
    const removed = this.selectedAttachments[index];
    if (removed && removed.documentId) {
      this.selectedGalleryDocuments = this.selectedGalleryDocuments.filter(d => d.id !== removed.documentId);
    }
    this.selectedAttachments.splice(index, 1);
  }

  constructor(
    private fb: FormBuilder,
    private svc: LetterService,
    private router: Router,
    private route: ActivatedRoute,
    public auth: AuthService,
    public themeSvc: ThemeService,
    private projectSvc: ProjectService,
    private docSvc: DocumentService,
    private userSvc: UserService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.letterId = this.route.snapshot.paramMap.get('id') || '';
    this.isEdit = !!this.letterId && this.route.snapshot.url.some(s => s.path === 'edit');

    // Auto-fill from current user
    const user = this.auth.currentUser();
    if (user) {
      this.form.patchValue({
        fromName:  `${user.firstName} ${user.lastName}`,
        fromTitle: user.jobTitle || '',
        fromOrg:   'RAM Projects Ltd'
      });
    }

    this.projectSvc.getAll().subscribe({
      next: (res: any) => {
        const projects = res?.data?.rows || res?.data || [];
        this.projectsList.set(projects);
        this.projectOptions = projects.map((p: any) => ({
          value: p.id,
          label: p.projectCode && p.name ? `${p.projectCode} — ${p.name}` : (p.name || p.projectCode),
        }));
      }
    });

    this.userSvc.getAll({ limit: 200, isActive: true }).subscribe({
      next: (res: any) => {
        this.allUsers = res?.data || [];
        this.signerOptions = this.allUsers
          .filter((u: any) => u.id !== user?.id) // no point "signing as yourself" via this picker — that's the default
          .map((u: any) => ({
            value: u.id,
            label: `${u.firstName} ${u.lastName}`,
            sublabel: u.jobTitle || u.department || '',
          }));
      },
      error: () => {},
    });

    this.form.get('projectId')?.valueChanges.subscribe(pid => {
      this.form.patchValue({ recipientId: '' });
      this.ccArray.clear();
      if (pid) {
        this.projectSvc.getStakeholders(pid).subscribe({
          next: (res: any) => {
            this.projectStakeholders.set(res?.data?.stakeholders || res?.data || res?.stakeholders || []);
          }
        });
      } else {
        this.projectStakeholders.set([]);
      }
    });

    if (this.isEdit && this.letterId) {
      this.svc.getOne(this.letterId).subscribe({
        next: (res: any) => {
          const l = res.data?.letter || res.data;
          this.form.patchValue({ ...l, referenceNo: l.letterNo || l.referenceNo || '' });
          this.savedId.set(this.letterId);
          
          if (Array.isArray(l.attachments) && l.attachments.length > 0) {
            this.selectedAttachments = l.attachments.map((a: any) => ({
              documentId: a.documentId || a.id,
              fileName: a.fileName || a.title,
              filePath: a.filePath,
              category: a.category || 'Attachment'
            }));
          } else if (l.attachmentFileName || l.attachmentFilePath) {
            this.selectedAttachments = [{
              fileName: l.attachmentFileName,
              filePath: l.attachmentFilePath || l.attachmentFileName,
              category: 'Attachment'
            }];
          }

          if (l.projectId) {
            this.projectSvc.getStakeholders(l.projectId).subscribe({
              next: (sRes: any) => {
                this.projectStakeholders.set(sRes?.data?.stakeholders || sRes?.data || sRes?.stakeholders || []);
              }
            });
          }

          // Rebuild CC
          this.ccArray.clear();
          (l.ccRecipients || []).forEach((cc: any) => {
            const ccObj = typeof cc === 'string' ? { id: cc } : cc;
            this.ccArray.push(this.fb.group({
              id:    [ccObj.id || ''],
              name:  [ccObj.name || ccObj.stakeholder?.name || ''],
              title: [ccObj.title || ccObj.stakeholder?.jobTitle || ''],
              email: [ccObj.email || ccObj.stakeholder?.email || '']
            }));
          });
        }
      });
    }
  }

  onRecipientStakeholderChange(event: any): void {
    const val = event.target.value;
    if (val) {
      const ps = this.projectStakeholders().find(s => s.stakeholder?.id === val || s.stakeholderId === val);
      if (ps && ps.stakeholder) {
        this.form.patchValue({
          recipientId: ps.stakeholder.id,
          toName:      ps.stakeholder.name,
          toTitle:     ps.stakeholder.jobTitle || '',
          toOrg:       ps.stakeholder.organization || '',
          toEmail:     ps.stakeholder.email || ''
        });
        
        // Auto-remove stakeholder from CC if they were previously in CC list
        for (let i = this.ccArray.length - 1; i >= 0; i--) {
          if (this.getCcGroup(i).get('id')?.value === ps.stakeholder.id) {
            this.removeCc(i);
          }
        }
      }
    } else {
      this.form.patchValue({
        recipientId: '',
        toName:      '',
        toTitle:     '',
        toOrg:       '',
        toEmail:     ''
      });
    }
  }

  onCcStakeholderChange(index: number, event: any): void {
    const val = event.target.value;
    const group = this.getCcGroup(index);
    if (val) {
      const ps = this.projectStakeholders().find(s => s.stakeholder?.id === val || s.stakeholderId === val);
      if (ps && ps.stakeholder) {
        group.patchValue({
          id:    ps.stakeholder.id,
          name:  ps.stakeholder.name,
          title: ps.stakeholder.jobTitle || '',
          email: ps.stakeholder.email || ''
        });
      }
    } else {
      group.patchValue({
        id:    '',
        name:  '',
        title: '',
        email: ''
      });
    }
  }

  getCcOptions(index: number): any[] {
    const recipientId = this.form.get('recipientId')?.value;
    const selectedCcIds = this.ccArray.controls
      .map((ctrl, i) => i !== index ? ctrl.get('id')?.value : null)
      .filter(val => !!val);
      
    return this.projectStakeholders().filter(s => {
      const sId = s.stakeholder?.id || s.stakeholderId;
      return sId !== recipientId && !selectedCcIds.includes(sId);
    });
  }

  onFileChange(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        this.selectedAttachments.push({
          file: file,
          fileName: file.name,
          filePath: file.name,
          category: 'Uploaded'
        });
      }
    }
    event.target.value = '';
  }

  addCc(): void {
    this.ccArray.push(this.fb.group({ id: [''], name: [''], title: [''], email: [''] }));
  }

  removeCc(i: number): void {
    this.ccArray.removeAt(i);
  }

  // Toggling this checkbox relaxes/restores the Letter Body validator —
  // required for a normally-composed letter, optional when the real
  // content lives in an uploaded file instead.
  onWrittenExternallyChange(ev: Event): void {
    const checked = (ev.target as HTMLInputElement).checked;
    this.writtenExternally.set(checked);
    const bodyCtrl = this.form.get('body');
    if (checked) {
      bodyCtrl?.clearValidators();
    } else {
      bodyCtrl?.setValidators(Validators.required);
    }
    bodyCtrl?.updateValueAndValidity();
  }

  // "Signing As" picker — auto-fills From (Sender) from the chosen
  // colleague's own profile (still editable afterwards) and records
  // senderId so the backend can stamp their stored signature image
  // (Profile > Digital Signature) onto the letter. Clearing it reverts to
  // signing as the currently logged-in user.
  mySignatureUrl(): string | null {
    const sig = this.auth.currentUser()?.signatureImage;
    return sig ? resolveAvatarUrl(sig) : null;
  }

  getChosenSignerName(): string {
    const id = this.form.get('senderId')?.value;
    const u = id ? this.allUsers.find((x) => x.id === id) : null;
    return u ? `${u.firstName} ${u.lastName}` : '';
  }

  onSignerSelected(userId: string | null): void {
    this.form.get('senderId')?.setValue(userId || '');
    const chosen = userId ? this.allUsers.find((u) => u.id === userId) : null;
    const me = this.auth.currentUser();
    const person = chosen || me;
    if (person) {
      this.form.patchValue({
        fromName: `${person.firstName} ${person.lastName}`,
        fromTitle: person.jobTitle || '',
        fromOrg: chosen ? (this.form.get('fromOrg')?.value || 'RAM Projects Ltd') : 'RAM Projects Ltd',
      });
    }
  }

  peekNextReference(): void {
    this.peekingRef.set(true);
    const projectId = this.form.get('projectId')?.value || undefined;
    this.svc.peekNextReference(projectId).subscribe({
      next: (res: any) => {
        this.peekingRef.set(false);
        const suggested = res.data?.letterNo;
        if (suggested && !this.form.get('referenceNo')?.value) {
          this.form.get('referenceNo')?.setValue(suggested);
        } else if (suggested) {
          this.error.set(`Suggested next reference: ${suggested} (your current field already has a value — clear it to use the suggestion)`);
        }
      },
      error: () => this.peekingRef.set(false),
    });
  }

  onSave(action: 'draft' | 'submit'): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (this.writtenExternally() && this.selectedAttachments.length === 0) {
      this.error.set('Please attach the letter file — it was marked as written outside the system');
      return;
    }
    this.saving.set(true);
    this.error.set('');

    const data = { ...this.form.value };
    data.ccRecipients = (data.ccRecipients || []).map((cc: any) => {
      return cc.id ? cc.id : { name: cc.name, title: cc.title, email: cc.email };
    });

    const fd = new FormData();
    Object.keys(data).forEach(key => {
      if (key === 'ccRecipients') {
        fd.append(key, JSON.stringify(data[key] || []));
      } else {
        fd.append(key, (data as any)[key] || '');
      }
    });
    fd.append('writtenExternally', String(this.writtenExternally()));

    const galleryAndExisting = this.selectedAttachments
      .filter(a => !a.file)
      .map(a => ({
        documentId: a.documentId || a.id,
        fileName: a.fileName || a.title,
        filePath: a.filePath,
        category: a.category
      }));

    fd.append('attachments', JSON.stringify(galleryAndExisting));

    this.selectedAttachments.forEach(a => {
      if (a.file) {
        fd.append('attachment', a.file, a.fileName);
      }
    });

    if (this.selectedAttachments.length > 0) {
      fd.append('attachmentFileName', this.selectedAttachments[0].fileName || '');
      fd.append('attachmentFilePath', this.selectedAttachments[0].filePath || '');
    }

    const obs = this.isEdit
      ? this.svc.update(this.letterId, fd)
      : this.svc.create(fd);

    obs.subscribe({
      next: (res: any) => {
        const id = res.data?.letter?.id || this.letterId;
        this.savedId.set(id);
        this.handleSuccess(id, action);
      },
      error: err => {
        this.saving.set(false);
        this.error.set(err.error?.message || 'Failed to save letter');
      }
    });
  }

  handleSuccess(id: string, action: 'draft' | 'submit'): void {
    const signerId = this.form.get('senderId')?.value;

    // "Signing As" someone else -> send it straight to them for their own
    // approval/signature (the existing forward-for-signature workflow) —
    // this REPLACES the normal self-submit-for-approval step, since the
    // whole point of choosing a signer is to get THEM to sign, not to
    // submit it for someone else's separate approval on top of that.
    // Their stored signature only ever gets stamped on the letter once
    // THEY actually approve it, never just because it was addressed to them.
    if (signerId) {
      this.svc.forward(id, signerId, 'Prepared for your signature.').subscribe({
        next: () => this.router.navigate(['/letters', id]),
        error: () => this.router.navigate(['/letters', id]), // forwarding failing shouldn't block the letter having been saved
      });
      return;
    }

    if (action === 'submit') {
      this.svc.submit(id).subscribe({
        next: () => this.router.navigate(['/letters', id]),
        error: () => this.router.navigate(['/letters', id])
      });
    } else {
      this.saving.set(false);
      this.router.navigate(['/letters', id]);
    }
  }
}

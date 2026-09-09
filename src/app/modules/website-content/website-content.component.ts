import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { MediaLibraryModalComponent } from '../../shared/components/media-library-modal/media-library-modal.component';
import { CKEditorModule } from 'ng2-ckeditor';
import { CKEDITOR_CONFIG } from '../../shared/utils/ckeditor-config';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-website-content',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MediaLibraryModalComponent, CKEditorModule],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Website Content Management System (CMS)</h1>
        <p class="page-subtitle">Manage hero slides, branding settings, page banners, company profile, FAQs, and vacancy announcements</p>
      </div>
    </div>

    <!-- Tab Buttons -->
    <div class="d-flex border-bottom mb-4" style="overflow-x: auto; white-space: nowrap;">
      <button *ngFor="let tab of tabs" 
              class="btn px-4 py-2 border-0 rounded-0"
              [class.btn-primary]="activeTab() === tab.id"
              [class.btn-outline-secondary]="activeTab() !== tab.id"
              (click)="activeTab.set(tab.id)">
        {{ tab.label }}
      </button>
    </div>

    @if (loading()) {
      <div class="d-flex justify-content-center py-5">
        <div class="spinner-border text-primary"></div>
      </div>
    } @else {
      <!-- 1. HERO SLIDER TAB -->
      <div *ngIf="activeTab() === 'hero'">
        <div class="row">
          <div *ngFor="let slide of heroSlides; let i = index" class="col-md-4 mb-4">
            <div class="card p-3 border rounded h-100">
              <div class="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                <h5 class="fw-bold mb-0 text-dark">Slide #{{ i + 1 }}</h5>
                <button class="btn btn-outline-danger btn-xs py-0 px-2" type="button" (click)="removeSlide(i)">
                  <i class="bi bi-trash"></i> Delete
                </button>
              </div>
              <div class="mb-3 text-center bg-light border rounded d-flex align-items-center justify-content-center overflow-hidden" style="height: 120px;">
                <img *ngIf="slide.image" [src]="resolveImage(slide.image)" class="w-100 h-100" style="object-fit: cover;">
                <span *ngIf="!slide.image" class="text-muted small">No slide background</span>
              </div>
              <div class="mb-2">
                <label class="form-label text-small">Slide Title</label>
                <input type="text" class="form-control" [(ngModel)]="slide.title">
              </div>
              <div class="mb-3">
                <label class="form-label small text-muted">🇹🇿 Kiswahili (auto-tafsiri ikiachwa wazi)</label>
                <input type="text" class="form-control" [(ngModel)]="slide.title_sw">
              </div>
              <div class="mb-2">
                <label class="form-label text-small">Slide Subtitle</label>
                <ckeditor [(ngModel)]="slide.subtitle" [ngModelOptions]="{standalone: true}" [config]="ckeditorConfig" debounce="500"></ckeditor>
              </div>
              <div class="mb-3">
                <label class="form-label small text-muted">🇹🇿 Kiswahili (auto-tafsiri ikiachwa wazi)</label>
                <ckeditor [(ngModel)]="slide.subtitle_sw" [ngModelOptions]="{standalone: true}" [config]="ckeditorConfig" debounce="500"></ckeditor>
              </div>
              <div class="mb-3">
                <label class="form-label text-small">Cover Image Path</label>
                <div class="input-group">
                  <input type="text" class="form-control" [(ngModel)]="slide.image" placeholder="Image path...">
                  <button class="btn btn-outline-secondary btn-sm px-3" type="button" (click)="openMediaPicker(i)">
                    <i class="bi bi-images"></i> Pick
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="d-flex gap-2 mt-3">
          <button class="btn btn-outline-primary btn-sm" (click)="addSlide()">
            <i class="bi bi-plus-lg"></i> Add New Slide
          </button>
          <button class="btn btn-primary btn-sm" (click)="saveHeroSlides()">
            <i class="bi bi-save"></i> Save Hero Slideshow
          </button>
        </div>
      </div>

      <!-- 2. ABOUT TAB -->
      <div *ngIf="activeTab() === 'about'" class="card p-4 border rounded">
        <h5 class="fw-bold mb-3 border-bottom pb-2 text-primary">About Text & Statements</h5>
        <div class="mb-2">
          <label class="form-label fw-bold">Company Name (heading)</label>
          <input type="text" class="form-control" [(ngModel)]="aboutData.companyName">
        </div>
        <div class="mb-3">
          <label class="form-label small text-muted">🇹🇿 Kiswahili — Company Name (auto-tafsiri ikiachwa wazi)</label>
          <input type="text" class="form-control" [(ngModel)]="aboutData.companyName_sw">
        </div>
        <div class="mb-2">
          <label class="form-label fw-bold">Who We Are</label>
          <ckeditor [(ngModel)]="aboutData.whoWeAre" [ngModelOptions]="{standalone: true}" [config]="ckeditorConfig" debounce="500"></ckeditor>
        </div>
        <div class="mb-3">
          <label class="form-label small text-muted">🇹🇿 Kiswahili — Who We Are (auto-tafsiri ikiachwa wazi)</label>
          <ckeditor [(ngModel)]="aboutData.whoWeAre_sw" [ngModelOptions]="{standalone: true}" [config]="ckeditorConfig" debounce="500"></ckeditor>
        </div>
        <div class="mb-2">
          <label class="form-label fw-bold">Vision Statement</label>
          <ckeditor [(ngModel)]="aboutData.vision" [ngModelOptions]="{standalone: true}" [config]="ckeditorConfig" debounce="500"></ckeditor>
        </div>
        <div class="mb-3">
          <label class="form-label small text-muted">🇹🇿 Kiswahili — Vision (auto-tafsiri ikiachwa wazi)</label>
          <ckeditor [(ngModel)]="aboutData.vision_sw" [ngModelOptions]="{standalone: true}" [config]="ckeditorConfig" debounce="500"></ckeditor>
        </div>
        <div class="mb-2">
          <label class="form-label fw-bold">Mission Statement</label>
          <ckeditor [(ngModel)]="aboutData.mission" [ngModelOptions]="{standalone: true}" [config]="ckeditorConfig" debounce="500"></ckeditor>
        </div>
        <div class="mb-3">
          <label class="form-label small text-muted">🇹🇿 Kiswahili — Mission (auto-tafsiri ikiachwa wazi)</label>
          <ckeditor [(ngModel)]="aboutData.mission_sw" [ngModelOptions]="{standalone: true}" [config]="ckeditorConfig" debounce="500"></ckeditor>
        </div>
        <div class="mb-3">
          <label class="form-label fw-bold">Core Values (Comma separated)</label>
          <input type="text" class="form-control" [(ngModel)]="aboutData.coreValues">
        </div>

        <h5 class="fw-bold mt-4 mb-3 border-bottom pb-2 text-primary">Managing Director's Message</h5>
        <div class="row">
          <div class="col-md-6 mb-3">
            <label class="form-label fw-bold">MD Name</label>
            <input type="text" class="form-control" [(ngModel)]="aboutData.mdName">
          </div>
          <div class="col-md-6 mb-3">
            <label class="form-label fw-bold">MD Phone</label>
            <input type="text" class="form-control" [(ngModel)]="aboutData.mdPhone">
          </div>
          <div class="col-md-6 mb-3">
            <label class="form-label fw-bold">MD Email</label>
            <input type="text" class="form-control" [(ngModel)]="aboutData.mdEmail">
          </div>
          <div class="col-md-6 mb-3">
            <label class="form-label fw-bold">MD Photo</label>
            <div class="input-group">
              <input type="text" class="form-control" [(ngModel)]="aboutData.mdPhoto" readonly>
              <button class="btn btn-outline-secondary" type="button" (click)="openMdPhotoPicker()"><i class="bi bi-images"></i> Pick</button>
            </div>
            <div class="mt-2" *ngIf="aboutData.mdPhoto">
              <img [src]="aboutData.mdPhoto" class="rounded border" style="height: 60px; object-fit: cover;">
            </div>
          </div>
          <div class="col-md-12 mb-3">
            <label class="form-label fw-bold">MD Message / Quote</label>
            <ckeditor [(ngModel)]="aboutData.mdQuote" [ngModelOptions]="{standalone: true}" [config]="ckeditorConfig" debounce="500"></ckeditor>
          </div>
        </div>

        <!-- Board of Directors -->
        <h5 class="fw-bold mt-4 mb-3 border-bottom pb-2 d-flex justify-content-between align-items-center text-primary">
          <span>Board of Directors</span>
          <button class="btn btn-primary btn-xs" type="button" (click)="addDirector()"><i class="bi bi-plus-lg"></i> Add Director</button>
        </h5>
        <div *ngFor="let item of boardDirectors; let i = index" class="border p-3 rounded mb-3 bg-light position-relative">
          <button (click)="removeDirector(i)" class="btn btn-danger btn-xs position-absolute" style="right: 15px; top: 15px; z-index: 10;" type="button"><i class="bi bi-trash"></i></button>
          <div class="row">
            <div class="col-md-4 mb-2">
              <label class="form-label small fw-bold">Director Name</label>
              <input type="text" class="form-control form-control-sm" [(ngModel)]="item.name">
            </div>
            <div class="col-md-3 mb-2">
              <label class="form-label small fw-bold">Role / Title</label>
              <input type="text" class="form-control form-control-sm" [(ngModel)]="item.role">
            </div>
            <div class="col-md-5 mb-2">
              <label class="form-label small fw-bold">Photo Image</label>
              <div class="input-group input-group-sm">
                <input type="text" class="form-control" [(ngModel)]="item.photo" readonly>
                <button class="btn btn-outline-secondary" type="button" (click)="openDirectorPicker(i)"><i class="bi bi-images"></i> Pick</button>
              </div>
              <div class="mt-1" *ngIf="item.photo">
                <img [src]="item.photo" class="rounded border" style="height: 40px; object-fit: cover;">
              </div>
            </div>
            <div class="col-md-4 mb-2">
              <label class="form-label small fw-bold">Phone Number</label>
              <input type="text" class="form-control form-control-sm" [(ngModel)]="item.phone">
            </div>
            <div class="col-md-4 mb-2">
              <label class="form-label small fw-bold">Email Address</label>
              <input type="text" class="form-control form-control-sm" [(ngModel)]="item.email">
            </div>
            <div class="col-md-4 mb-2">
              <label class="form-label small text-muted">🇹🇿 Kiswahili — Role (auto-tafsiri ikiachwa wazi)</label>
              <input type="text" class="form-control form-control-sm" [(ngModel)]="item.role_sw">
            </div>
          </div>
        </div>

        <!-- Key Management Team -->
        <h5 class="fw-bold mt-4 mb-3 border-bottom pb-2 d-flex justify-content-between align-items-center text-primary">
          <span>Key Management Team</span>
          <button class="btn btn-primary btn-xs" type="button" (click)="addManager()"><i class="bi bi-plus-lg"></i> Add Member</button>
        </h5>
        <div *ngFor="let item of managementTeam; let i = index" class="border p-3 rounded mb-3 bg-light position-relative">
          <button (click)="removeManager(i)" class="btn btn-danger btn-xs position-absolute" style="right: 15px; top: 15px; z-index: 10;" type="button"><i class="bi bi-trash"></i></button>
          <div class="row">
            <div class="col-md-4 mb-2">
              <label class="form-label small fw-bold">Member Name</label>
              <input type="text" class="form-control form-control-sm" [(ngModel)]="item.name">
            </div>
            <div class="col-md-3 mb-2">
              <label class="form-label small fw-bold">Role / Title</label>
              <input type="text" class="form-control form-control-sm" [(ngModel)]="item.role">
            </div>
            <div class="col-md-5 mb-2">
              <label class="form-label small fw-bold">Photo Image</label>
              <div class="input-group input-group-sm">
                <input type="text" class="form-control" [(ngModel)]="item.photo" readonly>
                <button class="btn btn-outline-secondary" type="button" (click)="openManagerPicker(i)"><i class="bi bi-images"></i> Pick</button>
              </div>
              <div class="mt-1" *ngIf="item.photo">
                <img [src]="item.photo" class="rounded border" style="height: 40px; object-fit: cover;">
              </div>
            </div>
            <div class="col-md-4 mb-2">
              <label class="form-label small fw-bold">Phone Number</label>
              <input type="text" class="form-control form-control-sm" [(ngModel)]="item.phone">
            </div>
            <div class="col-md-4 mb-2">
              <label class="form-label small fw-bold">Email Address</label>
              <input type="text" class="form-control form-control-sm" [(ngModel)]="item.email">
            </div>
            <div class="col-md-4 mb-2">
              <label class="form-label small text-muted">🇹🇿 Kiswahili — Role (auto-tafsiri ikiachwa wazi)</label>
              <input type="text" class="form-control form-control-sm" [(ngModel)]="item.role_sw">
            </div>
          </div>
        </div>

        <button class="btn btn-primary btn-md mt-4 w-100 py-2 fw-bold" (click)="saveAboutCompany()">
          <i class="bi bi-save me-1"></i> SAVE ALL LEADERSHIP & COMPANY DETAILS
        </button>
      </div>

      <!-- 3. STATS TAB -->
      <div *ngIf="activeTab() === 'stats'" class="card p-4 border rounded">
        <div class="row">
          <div class="col-md-3 mb-3">
            <label class="form-label fw-bold">Years Experience</label>
            <input type="number" class="form-control" [(ngModel)]="statsData.yearsExperience">
          </div>
          <div class="col-md-3 mb-3">
            <label class="form-label fw-bold">Completed Projects</label>
            <input type="number" class="form-control" [(ngModel)]="statsData.completedProjects">
          </div>
          <div class="col-md-3 mb-3">
            <label class="form-label fw-bold">Active Equipment</label>
            <input type="number" class="form-control" [(ngModel)]="statsData.activeEquipment">
          </div>
          <div class="col-md-3 mb-3">
            <label class="form-label fw-bold">Registered Engineers</label>
            <input type="number" class="form-control" [(ngModel)]="statsData.engineers">
          </div>
        </div>
        <button class="btn btn-primary btn-sm mt-2" (click)="saveStatsCounters()">
          <i class="bi bi-save"></i> Save Stats Data
        </button>
      </div>

      <!-- 4. FAQs TAB -->
      <div *ngIf="activeTab() === 'faqs'">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="fw-bold mb-0">Collapsible Frequently Asked Questions</h5>
          <button class="btn btn-primary btn-xs" (click)="openFaqModal()"><i class="bi bi-plus-lg"></i> Add FAQ</button>
        </div>
        <div class="table-card">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Display Order</th>
                  <th>Question</th>
                  <th>Answer</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let f of faqs">
                  <td>{{ f.displayOrder }}</td>
                  <td><strong>{{ f.question }}</strong></td>
                  <td class="text-muted small">{{ f.answer }}</td>
                  <td>
                    <button class="btn btn-xs btn-outline-secondary me-1" (click)="openFaqModal(f)"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-xs btn-outline-danger" (click)="deleteFaq(f)"><i class="bi bi-trash"></i></button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 5. SERVICES TAB -->
      <div *ngIf="activeTab() === 'services'">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="fw-bold mb-0">Managed Services Listings</h5>
          <button class="btn btn-primary btn-xs" (click)="openServiceModal()"><i class="bi bi-plus-lg"></i> Add Service</button>
        </div>
        <div class="table-card">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Icon Class</th>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let s of services">
                  <td><i class="bi {{ s.icon }} fs-4 text-primary"></i> <span class="ms-2 small text-muted">({{ s.icon }})</span></td>
                  <td><strong>{{ s.title }}</strong></td>
                  <td class="text-muted small">{{ s.description }}</td>
                  <td>
                    <button class="btn btn-xs btn-outline-secondary me-1" (click)="openServiceModal(s)"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-xs btn-outline-danger" (click)="deleteService(s)"><i class="bi bi-trash"></i></button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 5b. NEWS TAB -->
      <div *ngIf="activeTab() === 'news'">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="fw-bold mb-0">News & Announcements</h5>
          <button class="btn btn-primary btn-xs" (click)="openNewsModal()"><i class="bi bi-plus-lg"></i> Add Article</button>
        </div>
        <div class="table-card">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let n of news">
                  <td><img *ngIf="n.image" [src]="n.image" style="width:44px;height:44px;object-fit:cover;border-radius:4px"></td>
                  <td><strong>{{ n.title }}</strong></td>
                  <td><span class="badge bg-info text-white">{{ n.category }}</span></td>
                  <td class="small text-muted">{{ n.date | date:'mediumDate' }}</td>
                  <td>
                    <button class="btn btn-xs btn-outline-secondary me-1" (click)="openNewsModal(n)"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-xs btn-outline-danger" (click)="deleteNews(n)"><i class="bi bi-trash"></i></button>
                  </td>
                </tr>
                <tr *ngIf="news.length === 0">
                  <td colspan="5" class="text-center py-4 text-muted">No articles yet.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 6. CAREERS TAB -->
      <div *ngIf="activeTab() === 'careers'">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="fw-bold mb-0">Active Job Positions</h5>
          <button class="btn btn-primary btn-xs" (click)="openCareerModal()"><i class="bi bi-plus-lg"></i> Post Vacancy</button>
        </div>
        <div class="table-card">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Department</th>
                  <th>Location</th>
                  <th>Job Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let c of careers">
                  <td><strong>{{ c.title }}</strong></td>
                  <td>{{ c.department }}</td>
                  <td>{{ c.location }}</td>
                  <td><span class="badge bg-info text-white">{{ c.type }}</span></td>
                  <td><span class="badge" [class.bg-success]="c.status === 'active'" [class.bg-secondary]="c.status === 'closed'">{{ c.status }}</span></td>
                  <td>
                    <button class="btn btn-xs btn-outline-secondary me-1" (click)="openCareerModal(c)"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-xs btn-outline-danger" (click)="deleteCareer(c)"><i class="bi bi-trash"></i></button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- 7. BRANDING & SETTINGS TAB -->
      <div *ngIf="activeTab() === 'branding'" class="card p-4 border rounded">
        <div class="row">
          <div class="col-md-4 mb-3">
            <label class="form-label fw-bold">Site Title</label>
            <input type="text" class="form-control" [(ngModel)]="brandingData.siteTitle">
          </div>
          <div class="col-md-4 mb-3">
            <label class="form-label fw-bold">Site Logo Path</label>
            <div class="input-group mb-2">
              <input type="text" class="form-control" [(ngModel)]="brandingData.siteLogo">
              <button class="btn btn-outline-secondary btn-sm px-3" type="button" (click)="openBrandingPicker('site_logo')">
                <i class="bi bi-images"></i> Pick
              </button>
            </div>
            <div class="text-start bg-light p-2 border rounded d-inline-block" *ngIf="brandingData.siteLogo" style="min-width: 100px;">
              <img [src]="resolveImage(brandingData.siteLogo)" class="rounded" style="height: 40px; object-fit: contain; max-width: 150px;">
            </div>
          </div>
          <div class="col-md-4 mb-3">
            <label class="form-label fw-bold">Site Favicon Path</label>
            <div class="input-group mb-2">
              <input type="text" class="form-control" [(ngModel)]="brandingData.siteFavicon">
              <button class="btn btn-outline-secondary btn-sm px-3" type="button" (click)="openBrandingPicker('site_favicon')">
                <i class="bi bi-images"></i> Pick
              </button>
            </div>
            <div class="text-start bg-light p-2 border rounded d-inline-block" *ngIf="brandingData.siteFavicon">
              <img [src]="resolveImage(brandingData.siteFavicon)" class="rounded" style="height: 30px; object-fit: contain; max-width: 50px;">
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-md-4 mb-3">
            <label class="form-label fw-bold">Official Email</label>
            <input type="email" class="form-control" [(ngModel)]="brandingData.contactEmail">
          </div>
          <div class="col-md-4 mb-3">
            <label class="form-label fw-bold">Official Phone</label>
            <input type="text" class="form-control" [(ngModel)]="brandingData.contactPhone">
          </div>
          <div class="col-md-4 mb-3">
            <label class="form-label fw-bold">Head Office Address</label>
            <input type="text" class="form-control" [(ngModel)]="brandingData.contactAddress">
          </div>
        </div>
        <div class="row">
          <div class="col-md-3 mb-3">
            <label class="form-label fw-bold">Facebook Link</label>
            <input type="text" class="form-control" [(ngModel)]="brandingData.socialFacebook">
          </div>
          <div class="col-md-3 mb-3">
            <label class="form-label fw-bold">Twitter Link</label>
            <input type="text" class="form-control" [(ngModel)]="brandingData.socialTwitter">
          </div>
          <div class="col-md-3 mb-3">
            <label class="form-label fw-bold">Instagram Link</label>
            <input type="text" class="form-control" [(ngModel)]="brandingData.socialInstagram">
          </div>
          <div class="col-md-3 mb-3">
            <label class="form-label fw-bold">LinkedIn Link</label>
            <input type="text" class="form-control" [(ngModel)]="brandingData.socialLinkedin">
          </div>
        </div>
        <div class="mb-3">
          <label class="form-label fw-bold">Footer Copyright Notice</label>
          <input type="text" class="form-control" [(ngModel)]="brandingData.footerCopyright">
        </div>

        <h5 class="fw-bold mt-4 mb-3 border-bottom pb-2 text-primary">Footer Content</h5>
        <div class="mb-3">
          <label class="form-label fw-bold">Footer "About" Paragraph</label>
          <ckeditor [(ngModel)]="brandingData.footerAboutText" [ngModelOptions]="{standalone: true}" [config]="ckeditorConfig" debounce="500"></ckeditor>
        </div>
        <div class="row">
          <div class="col-md-6 mb-3">
            <label class="form-label fw-bold">Footer Services Shortlist (comma separated)</label>
            <input type="text" class="form-control" [(ngModel)]="brandingData.footerServices">
          </div>
          <div class="col-md-3 mb-3">
            <label class="form-label fw-bold">WhatsApp Number (digits only)</label>
            <input type="text" class="form-control" [(ngModel)]="brandingData.footerWhatsappNumber" placeholder="255777000000">
          </div>
          <div class="col-md-3 mb-3">
            <label class="form-label fw-bold">Staff Webmail URL</label>
            <input type="text" class="form-control" [(ngModel)]="brandingData.footerStaffMailUrl">
          </div>
        </div>

        <h5 class="fw-bold mt-4 mb-3 border-bottom pb-2 text-primary">Pemba Office</h5>
        <div class="row">
          <div class="col-md-4 mb-3">
            <label class="form-label fw-bold">Pemba Address</label>
            <input type="text" class="form-control" [(ngModel)]="brandingData.pembaAddress">
          </div>
          <div class="col-md-4 mb-3">
            <label class="form-label fw-bold">Pemba Phone</label>
            <input type="text" class="form-control" [(ngModel)]="brandingData.pembaPhone">
          </div>
          <div class="col-md-4 mb-3">
            <label class="form-label fw-bold">Pemba Email</label>
            <input type="text" class="form-control" [(ngModel)]="brandingData.pembaEmail">
          </div>
        </div>

        <button class="btn btn-primary btn-sm mt-2" (click)="saveBrandingSettings()">
          <i class="bi bi-save"></i> Save Branding Settings
        </button>
      </div>

      <!-- WEBSITE THEME TAB — self-contained, independent of the admin panel's
           own Appearance settings. This is what the public site's visitors see. -->
      <div *ngIf="activeTab() === 'theme'" class="card p-4 border rounded">
        <p class="text-muted small mb-4">
          Colors for <strong>unitedram.com itself</strong> (the public marketing site) — completely independent from the
          admin panel's own Appearance settings. Each client's database controls its own website look.
        </p>

        <div class="row">
          <div class="col-md-3 mb-4">
            <label class="form-label fw-bold small">Primary Color</label>
            <div class="d-flex align-items-center gap-2">
              <input type="color" class="form-control form-control-color" [(ngModel)]="brandingData.themePrimaryColor">
              <input type="text" class="form-control form-control-sm" [(ngModel)]="brandingData.themePrimaryColor">
            </div>
            <div class="text-muted small mt-1">Buttons, links, highlights</div>
          </div>
          <div class="col-md-3 mb-4">
            <label class="form-label fw-bold small">Secondary / Accent Color</label>
            <div class="d-flex align-items-center gap-2">
              <input type="color" class="form-control form-control-color" [(ngModel)]="brandingData.themeSecondaryColor">
              <input type="text" class="form-control form-control-sm" [(ngModel)]="brandingData.themeSecondaryColor">
            </div>
            <div class="text-muted small mt-1">Gold accents, badges, CTAs</div>
          </div>
          <div class="col-md-3 mb-4">
            <label class="form-label fw-bold small">Dark Background</label>
            <div class="d-flex align-items-center gap-2">
              <input type="color" class="form-control form-control-color" [(ngModel)]="brandingData.themeDarkColor">
              <input type="text" class="form-control form-control-sm" [(ngModel)]="brandingData.themeDarkColor">
            </div>
            <div class="text-muted small mt-1">Page background, navbar</div>
          </div>
          <div class="col-md-3 mb-4">
            <label class="form-label fw-bold small">Dark Accent (Cards)</label>
            <div class="d-flex align-items-center gap-2">
              <input type="color" class="form-control form-control-color" [(ngModel)]="brandingData.themeDarkAccent">
              <input type="text" class="form-control form-control-sm" [(ngModel)]="brandingData.themeDarkAccent">
            </div>
            <div class="text-muted small mt-1">Card panels, glass sections</div>
          </div>
        </div>

        <!-- Live Preview -->
        <div class="border rounded p-3 mb-4" [style.background]="brandingData.themeDarkColor">
          <div class="d-flex flex-wrap align-items-center gap-3">
            <span class="px-3 py-2 rounded text-white fw-bold" [style.background]="brandingData.themePrimaryColor">Primary Button</span>
            <span class="px-3 py-2 rounded text-white fw-bold" [style.background]="brandingData.themeSecondaryColor">Accent / CTA</span>
            <span class="px-3 py-3 rounded" [style.background]="brandingData.themeDarkAccent" style="color:#fff; flex:1; min-width:180px;">
              Card panel on dark background — this is roughly how a section of the homepage will look.
            </span>
          </div>
        </div>

        <button class="btn btn-primary btn-sm" (click)="saveThemeSettings()">
          <i class="bi bi-save"></i> Save Website Theme
        </button>
      </div>

      <!-- 8. PAGE BANNER IMAGES TAB -->
      <div *ngIf="activeTab() === 'banners'" class="card p-4 border rounded">
        <div class="row">
          <div *ngFor="let b of bannerKeys" class="col-md-4 mb-4">
            <div class="card p-3 border rounded h-100">
              <h6 class="fw-bold mb-2 text-dark text-capitalize">{{ b.label }} Banner</h6>
              <div class="mb-3 text-center bg-light border rounded d-flex align-items-center justify-content-center overflow-hidden" style="height: 100px;">
                <img *ngIf="bannersData[b.key]" [src]="resolveImage(bannersData[b.key])" class="w-100 h-100" style="object-fit: cover;">
                <span *ngIf="!bannersData[b.key]" class="text-muted small">No image selected</span>
              </div>
              <div class="input-group">
                <input type="text" class="form-control" [(ngModel)]="bannersData[b.key]" placeholder="Banner image path...">
                <button class="btn btn-outline-secondary btn-sm px-3" type="button" (click)="openBannerPicker(b.key)">
                  <i class="bi bi-images"></i> Pick
                </button>
              </div>
            </div>
          </div>
        </div>
        <button class="btn btn-primary btn-sm mt-3" (click)="saveBannersSettings()">
          <i class="bi bi-save"></i> Save Page Banners
        </button>
      </div>

      <!-- 9. HOMEPAGE SECTIONS & CTA TAB -->
      <div *ngIf="activeTab() === 'sections'" class="card p-4 border rounded">
        <!-- 9.0 Section Headings Config -->
        <h5 class="fw-bold text-primary border-bottom pb-2 mb-3">Homepage Section Headings & Titles</h5>
        <div class="row mb-4">
          <div class="col-md-6 mb-2">
            <label class="form-label fw-bold text-dark text-small">Landmark Works Section Subtitle</label>
            <input type="text" class="form-control" [(ngModel)]="homeShowcaseSubtitle" placeholder="e.g. Focus Showcase">
          </div>
          <div class="col-md-6 mb-3">
            <label class="form-label small text-muted">🇹🇿 Kiswahili (auto-tafsiri ikiachwa wazi)</label>
            <input type="text" class="form-control" [(ngModel)]="homeShowcaseSubtitleSw">
          </div>
          <div class="col-md-6 mb-2">
            <label class="form-label fw-bold text-dark text-small">Landmark Works Section Main Title</label>
            <input type="text" class="form-control" [(ngModel)]="homeShowcaseTitle" placeholder="e.g. Our Major Landmark Works">
          </div>
          <div class="col-md-6 mb-3">
            <label class="form-label small text-muted">🇹🇿 Kiswahili (auto-tafsiri ikiachwa wazi)</label>
            <input type="text" class="form-control" [(ngModel)]="homeShowcaseTitleSw">
          </div>
          <div class="col-md-6 mb-2">
            <label class="form-label fw-bold text-dark text-small">Services Section Subtitle</label>
            <input type="text" class="form-control" [(ngModel)]="homeServicesSubtitle" placeholder="e.g. What We Do">
          </div>
          <div class="col-md-6 mb-3">
            <label class="form-label small text-muted">🇹🇿 Kiswahili (auto-tafsiri ikiachwa wazi)</label>
            <input type="text" class="form-control" [(ngModel)]="homeServicesSubtitleSw">
          </div>
          <div class="col-md-6 mb-2">
            <label class="form-label fw-bold text-dark text-small">Services Section Main Title</label>
            <input type="text" class="form-control" [(ngModel)]="homeServicesTitle" placeholder="e.g. Our Engineering Expertise">
          </div>
          <div class="col-md-6 mb-3">
            <label class="form-label small text-muted">🇹🇿 Kiswahili (auto-tafsiri ikiachwa wazi)</label>
            <input type="text" class="form-control" [(ngModel)]="homeServicesTitleSw">
          </div>
          <div class="col-md-6 mb-2">
            <label class="form-label fw-bold text-dark text-small">Featured Projects Section Subtitle</label>
            <input type="text" class="form-control" [(ngModel)]="homeProjectsSubtitle" placeholder="e.g. Our Works">
          </div>
          <div class="col-md-6 mb-3">
            <label class="form-label small text-muted">🇹🇿 Kiswahili (auto-tafsiri ikiachwa wazi)</label>
            <input type="text" class="form-control" [(ngModel)]="homeProjectsSubtitleSw">
          </div>
          <div class="col-md-6 mb-2">
            <label class="form-label fw-bold text-dark text-small">Featured Projects Section Main Title</label>
            <input type="text" class="form-control" [(ngModel)]="homeProjectsTitle" placeholder="e.g. Featured Infrastructure">
          </div>
          <div class="col-md-6 mb-3">
            <label class="form-label small text-muted">🇹🇿 Kiswahili (auto-tafsiri ikiachwa wazi)</label>
            <input type="text" class="form-control" [(ngModel)]="homeProjectsTitleSw">
          </div>
        </div>

        <!-- 9.1 Accordion Projects -->
        <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3 mt-4">
          <h5 class="fw-bold text-dark mb-0">Landmark Works Showcase (Accordion Widget)</h5>
          <button class="btn btn-outline-primary btn-xs" (click)="addShowcaseItem()"><i class="bi bi-plus-lg"></i> Add Showcase Item</button>
        </div>
        <div class="row mb-4">
          <div *ngFor="let item of accordionItems; let idx = index" class="col-md-3 mb-3">
            <div class="card p-3 border rounded h-100 bg-light">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="fw-bold text-small text-dark">Showcase #{{ idx + 1 }}</span>
                <button class="btn btn-link text-danger p-0" (click)="removeShowcaseItem(idx)"><i class="bi bi-trash"></i></button>
              </div>
              <div class="mb-3 text-center bg-white border rounded d-flex align-items-center justify-content-center overflow-hidden" style="height: 100px;">
                <img *ngIf="item.image" [src]="resolveImage(item.image)" class="w-100 h-100" style="object-fit: cover;">
                <span *ngIf="!item.image" class="text-muted small">No image</span>
              </div>
              <div class="mb-1">
                <label class="form-label text-small fw-bold">Project Title</label>
                <input type="text" class="form-control form-control-sm" [(ngModel)]="item.title">
              </div>
              <div class="mb-2">
                <label class="form-label small text-muted">🇹🇿 Kiswahili</label>
                <input type="text" class="form-control form-control-sm" [(ngModel)]="item.title_sw">
              </div>
              <div class="mb-1">
                <label class="form-label text-small fw-bold">Sub-Label Description</label>
                <input type="text" class="form-control form-control-sm" [(ngModel)]="item.subtitle">
              </div>
              <div class="mb-2">
                <label class="form-label small text-muted">🇹🇿 Kiswahili</label>
                <input type="text" class="form-control form-control-sm" [(ngModel)]="item.subtitle_sw">
              </div>
              <div class="mb-1">
                <label class="form-label text-small fw-bold">Image Link</label>
                <div class="input-group">
                  <input type="text" class="form-control form-control-sm" [(ngModel)]="item.image" placeholder="/image.jpg">
                  <button class="btn btn-outline-secondary btn-xs" type="button" (click)="openAccordionPicker(idx)">
                    <i class="bi bi-images"></i> Pick
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 9.2 Client Partners -->
        <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
          <h5 class="fw-bold text-dark mb-0">Our Happy Clients & Partners</h5>
          <button class="btn btn-outline-primary btn-xs" (click)="addPartner()"><i class="bi bi-plus-lg"></i> Add Partner Logo</button>
        </div>
        <div class="row mb-4">
          <div *ngFor="let p of partnerItems; let idx = index" class="col-md-3 mb-3">
            <div class="card p-3 border rounded h-100 bg-light">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="fw-bold text-small text-dark">Partner #{{ idx + 1 }}</span>
                <button class="btn btn-link text-danger p-0" (click)="removePartner(idx)"><i class="bi bi-trash"></i></button>
              </div>
              <div class="mb-2 text-center bg-white border rounded d-flex align-items-center justify-content-center overflow-hidden" style="height: 60px;">
                <img *ngIf="p.image" [src]="resolveImage(p.image)" style="max-height: 50px; max-width: 90%; object-fit: contain;">
                <span *ngIf="!p.image" class="text-muted small">No logo</span>
              </div>
              <div class="mb-2">
                <label class="form-label text-small fw-bold">Client Name</label>
                <input type="text" class="form-control form-control-sm" [(ngModel)]="p.name">
              </div>
              <div class="mb-2">
                <label class="form-label text-small fw-bold">External Web Link</label>
                <input type="text" class="form-control form-control-sm" [(ngModel)]="p.link">
              </div>
              <div>
                <label class="form-label text-small fw-bold">Logo Path</label>
                <div class="input-group">
                  <input type="text" class="form-control form-control-sm" [(ngModel)]="p.image">
                  <button class="btn btn-outline-secondary btn-xs" type="button" (click)="openPartnerPicker(idx)">
                    <i class="bi bi-images"></i> Pick
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 9.3 Call To Action Block Text -->
        <h5 class="fw-bold text-dark border-bottom pb-2 mb-3">Call To Action Banner (CTA)</h5>
        <div class="row">
          <div class="col-md-6 mb-3">
            <label class="form-label fw-bold">CTA Big Title</label>
            <input type="text" class="form-control" [(ngModel)]="ctaTitle">
          </div>
          <div class="col-md-6 mb-3">
            <label class="form-label small text-muted">🇹🇿 Kiswahili — CTA Big Title</label>
            <input type="text" class="form-control" [(ngModel)]="ctaTitleSw">
          </div>
          <div class="col-md-6 mb-3">
            <label class="form-label fw-bold">CTA Subtitle Description</label>
            <input type="text" class="form-control" [(ngModel)]="ctaSubtitle">
          </div>
          <div class="col-md-6 mb-3">
            <label class="form-label small text-muted">🇹🇿 Kiswahili — CTA Subtitle</label>
            <input type="text" class="form-control" [(ngModel)]="ctaSubtitleSw">
          </div>
        </div>

        <button class="btn btn-primary btn-sm mt-3" (click)="saveHomepageSections()">
          <i class="bi bi-save"></i> Save Homepage Sections
        </button>
      </div>
    }

    <!-- Modal Form FAQ -->
    <div *ngIf="showFaqForm()" class="modal fade show d-block" style="background: rgba(0,0,0,0.5); z-index:1050;">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">{{ editingFaqId ? 'Edit FAQ' : 'New FAQ' }}</h5>
            <button type="button" class="btn-close" (click)="showFaqForm.set(false)"><span aria-hidden="true">&times;</span></button>
          </div>
          <form [formGroup]="faqForm" (ngSubmit)="saveFaq()">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Question</label>
                <input type="text" class="form-control" formControlName="question" required>
              </div>
              <div class="mb-2">
                <label class="form-label small text-muted">🇹🇿 Kiswahili — Question (auto-tafsiri ikiachwa wazi)</label>
                <input type="text" class="form-control" formControlName="question_sw">
              </div>
              <div class="mb-3">
                <label class="form-label">Answer</label>
                <ckeditor formControlName="answer" [config]="ckeditorConfig" debounce="500"></ckeditor>
              </div>
              <div class="mb-3">
                <label class="form-label small text-muted">🇹🇿 Kiswahili — Answer (auto-tafsiri ikiachwa wazi)</label>
                <ckeditor formControlName="answer_sw" [config]="ckeditorConfig" debounce="500"></ckeditor>
              </div>
              <div class="mb-3">
                <label class="form-label">Display Order</label>
                <input type="number" class="form-control" formControlName="displayOrder">
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary btn-sm" (click)="showFaqForm.set(false)">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm" [disabled]="faqForm.invalid">Save</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal Form Service -->
    <div *ngIf="showServiceForm()" class="modal fade show d-block" style="background: rgba(0,0,0,0.5); z-index:1050;">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">{{ editingServiceId ? 'Edit Service' : 'New Service' }}</h5>
            <button type="button" class="btn-close" (click)="showServiceForm.set(false)"><span aria-hidden="true">&times;</span></button>
          </div>
          <form [formGroup]="serviceForm" (ngSubmit)="saveService()">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Service Title</label>
                <input type="text" class="form-control" formControlName="title" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Icon Class (Bootstrap Icons)</label>
                <input type="text" class="form-control" formControlName="icon" placeholder="e.g. bi-buildings, bi-road-spikes" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Description (shown on Services list card)</label>
                <ckeditor formControlName="description" [config]="ckeditorConfig" debounce="500"></ckeditor>
              </div>
              <div class="mb-2">
                <label class="form-label small text-muted">🇹🇿 Kiswahili — Description (auto-tafsiri ikiachwa wazi)</label>
                <ckeditor formControlName="description_sw" [config]="ckeditorConfig" debounce="500"></ckeditor>
              </div>
              <div class="mb-3">
                <label class="form-label">Overview Text (shown on Service Detail page)</label>
                <ckeditor formControlName="overviewText" [config]="ckeditorConfig" debounce="500"></ckeditor>
              </div>
              <div class="mb-2">
                <label class="form-label small text-muted">🇹🇿 Kiswahili — Overview (auto-tafsiri ikiachwa wazi)</label>
                <ckeditor formControlName="overviewText_sw" [config]="ckeditorConfig" debounce="500"></ckeditor>
              </div>
              <div class="mb-3">
                <!-- Kept as a plain textarea deliberately — this one is parsed
                     line-by-line (split on \n) into a JSON array of separate
                     bullet strings on save (see admin-website.routes.js POST
                     /services). A rich-text editor would output HTML tags
                     instead of plain newlines and break that parsing. -->
                <label class="form-label">Key Benefits (one per line)</label>
                <textarea class="form-control" rows="3" formControlName="benefits" placeholder="Premium-grade concrete mixes&#10;ISO-certified raw materials&#10;Waste-reduced site workflows"></textarea>
              </div>
              <div class="mb-3">
                <label class="form-label small text-muted">🇹🇿 Kiswahili — Title (auto-tafsiri ikiachwa wazi)</label>
                <input type="text" class="form-control" formControlName="title_sw">
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary btn-sm" (click)="showServiceForm.set(false)">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm" [disabled]="serviceForm.invalid">Save</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal Form News -->
    <div *ngIf="showNewsForm()" class="modal fade show d-block" style="background: rgba(0,0,0,0.5); z-index:1050;">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">{{ editingNewsId ? 'Edit Article' : 'New Article' }}</h5>
            <button type="button" class="btn-close" (click)="showNewsForm.set(false)"><span aria-hidden="true">&times;</span></button>
          </div>
          <form [formGroup]="newsForm" (ngSubmit)="saveNews()">
            <div class="modal-body">
              <div class="row">
                <div class="col-md-8 mb-3">
                  <label class="form-label">Title</label>
                  <input type="text" class="form-control" formControlName="title" required>
                </div>
                <div class="col-md-4 mb-3">
                  <label class="form-label">Category</label>
                  <input type="text" class="form-control" formControlName="category" placeholder="Tenders, Innovation...">
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">Summary (card preview)</label>
                <ckeditor formControlName="summary" [config]="ckeditorConfig" debounce="500"></ckeditor>
              </div>
              <div class="mb-2">
                <label class="form-label small text-muted">🇹🇿 Kiswahili — Summary (auto-tafsiri ikiachwa wazi)</label>
                <ckeditor formControlName="summary_sw" [config]="ckeditorConfig" debounce="500"></ckeditor>
              </div>
              <div class="mb-3">
                <label class="form-label">Full Article Body</label>
                <ckeditor formControlName="content" [config]="ckeditorConfig" debounce="500"></ckeditor>
              </div>
              <div class="mb-3">
                <label class="form-label small text-muted">🇹🇿 Kiswahili — Full Article Body (auto-tafsiri ikiachwa wazi)</label>
                <ckeditor formControlName="content_sw" [config]="ckeditorConfig" debounce="500"></ckeditor>
              </div>
              <div class="mb-3">
                <label class="form-label small text-muted">🇹🇿 Kiswahili — Title (auto-tafsiri ikiachwa wazi)</label>
                <input type="text" class="form-control" formControlName="title_sw">
              </div>
              <div class="mb-3">
                <label class="form-label">Cover Image</label>
                <div class="input-group">
                  <input type="text" class="form-control" formControlName="image" readonly placeholder="No image selected">
                  <button class="btn btn-outline-secondary" type="button" (click)="openNewsImagePicker()"><i class="bi bi-images"></i> Pick</button>
                </div>
                <div class="mt-2" *ngIf="newsForm.value.image">
                  <img [src]="newsForm.value.image" class="rounded border" style="height: 60px; object-fit: cover;">
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary btn-sm" (click)="showNewsForm.set(false)">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm" [disabled]="newsForm.invalid">Save</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal Form Career -->
    <div *ngIf="showCareerForm()" class="modal fade show d-block" style="background: rgba(0,0,0,0.5); z-index:1050;">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title fw-bold">{{ editingCareerId ? 'Edit Job Posting' : 'New Job Posting' }}</h5>
            <button type="button" class="btn-close" (click)="showCareerForm.set(false)"><span aria-hidden="true">&times;</span></button>
          </div>
          <form [formGroup]="careerForm" (ngSubmit)="saveCareer()">
            <div class="modal-body">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Job Title</label>
                  <input type="text" class="form-control" formControlName="title" required>
                </div>
                <div class="col-md-6 mb-3">
                  <label class="form-label">Department</label>
                  <input type="text" class="form-control" formControlName="department" required>
                </div>
              </div>
              <div class="row">
                <div class="col-md-4 mb-3">
                  <label class="form-label">Location</label>
                  <input type="text" class="form-control" formControlName="location" required>
                </div>
                <div class="col-md-4 mb-3">
                  <label class="form-label">Job Type</label>
                  <select class="form-control" formControlName="type">
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
                <div class="col-md-4 mb-3">
                  <label class="form-label">Status</label>
                  <select class="form-control" formControlName="status">
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">Job Description / Requirements</label>
                <ckeditor formControlName="description" [config]="ckeditorConfig" debounce="500"></ckeditor>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary btn-sm" (click)="showCareerForm.set(false)">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm" [disabled]="careerForm.invalid">Save</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Media Library Picker Modal -->
    <app-media-library-modal *ngIf="showMediaModal()"
                             [multiSelect]="false"
                             (close)="showMediaModal.set(false)"
                             (select)="onMediaSelected($event)">
    </app-media-library-modal>
  `
})
export class WebsiteContentComponent implements OnInit {
  ckeditorConfig = CKEDITOR_CONFIG;
  tabs = [
    { id: 'hero', label: 'Homepage Hero Slideshow' },
    { id: 'about', label: 'About Company Info' },
    { id: 'stats', label: 'Stat Counters' },
    { id: 'faqs', label: 'Collapsible FAQs' },
    { id: 'services', label: 'Services Manager' },
    { id: 'news', label: 'News & Announcements' },
    { id: 'careers', label: 'Careers Vacancies' },
    { id: 'branding', label: 'Branding & Contact Info' },
    { id: 'theme', label: 'Website Theme' },
    { id: 'banners', label: 'Page Banners' },
    { id: 'sections', label: 'Homepage Showcase & CTA' }
  ];
  activeTab = signal('hero');
  loading = signal(false);

  // Settings models
  heroSlides: any[] = [];
  aboutData = {
    companyName: '',
    companyName_sw: '',
    whoWeAre: '',
    whoWeAre_sw: '',
    vision: '',
    vision_sw: '',
    mission: '',
    mission_sw: '',
    coreValues: '',
    mdName: '',
    mdQuote: '',
    mdPhoto: '',
    mdPhone: '',
    mdEmail: ''
  };
  boardDirectors: any[] = [];
  managementTeam: any[] = [];
  statsData = { yearsExperience: 0, completedProjects: 0, activeEquipment: 0, engineers: 0 };

  // New settings configurations
  brandingData = {
    siteTitle: '',
    siteLogo: '',
    siteFavicon: '',
    contactEmail: '',
    contactPhone: '',
    contactAddress: '',
    socialFacebook: '',
    socialTwitter: '',
    socialInstagram: '',
    socialLinkedin: '',
    footerCopyright: '',
    footerAboutText: '',
    footerServices: '',
    footerWhatsappNumber: '',
    footerStaffMailUrl: '',
    pembaAddress: '',
    pembaPhone: '',
    pembaEmail: '',
    // Theme colors — white-label: each client's database can set these
    // independently so the public site looks like a completely different
    // brand while running the exact same code.
    themePrimaryColor: '#3E50B4',
    themeSecondaryColor: '#D97706',
    themeDarkColor: '#0F172A',
    themeDarkAccent: '#1E293B'
  };

  bannersData: { [key: string]: string } = {
    banner_about: '',
    banner_services: '',
    banner_projects: '',
    banner_gallery: '',
    banner_careers: '',
    banner_contact: ''
  };

  bannerKeys = [
    { key: 'banner_about', label: 'about company' },
    { key: 'banner_services', label: 'our services' },
    { key: 'banner_projects', label: 'projects portfolio' },
    { key: 'banner_gallery', label: 'photo & drone gallery' },
    { key: 'banner_careers', label: 'careers portal' },
    { key: 'banner_contact', label: 'contact details' }
  ];

  // Accordion & Partners & CTA Data
  accordionItems: any[] = [];
  partnerItems: any[] = [];
  ctaTitle: string = "LET'S MAKE SOMETHING TOGETHER";
  ctaTitleSw: string = '';
  ctaSubtitle: string = "Get in touch with us and send some basic info for a quick quote";
  ctaSubtitleSw: string = '';
  homeShowcaseSubtitle: string = "Focus Showcase";
  homeShowcaseSubtitleSw: string = '';
  homeShowcaseTitle: string = "Our Major Landmark Works";
  homeShowcaseTitleSw: string = '';
  homeServicesSubtitle: string = "What We Do";
  homeServicesSubtitleSw: string = '';
  homeServicesTitle: string = "Our Engineering Expertise";
  homeServicesTitleSw: string = '';
  homeProjectsSubtitle: string = "Our Works";
  homeProjectsSubtitleSw: string = '';
  homeProjectsTitle: string = "Featured Infrastructure";
  homeProjectsTitleSw: string = '';

  // Media Picker properties
  showMediaModal = signal(false);
  activeSlideIndexForPicker: number | null = null;
  activeBrandingKeyForPicker: string | null = null;
  activeBannerKeyForPicker: string | null = null;
  activeAccordionIndexForPicker: number | null = null;
  activePartnerIndexForPicker: number | null = null;
  activeDirectorIndexForPicker: number | null = null;
  activeManagerIndexForPicker: number | null = null;
  activeMdPhotoForPicker = false;
  activeNewsImageForPicker = false;

  // FAQs
  faqs: any[] = [];
  showFaqForm = signal(false);
  editingFaqId: string | null = null;
  faqForm: FormGroup;

  // Services
  services: any[] = [];
  showServiceForm = signal(false);
  editingServiceId: string | null = null;
  serviceForm: FormGroup;

  // News
  news: any[] = [];
  showNewsForm = signal(false);
  editingNewsId: string | null = null;
  newsForm!: FormGroup;

  // Careers
  careers: any[] = [];
  showCareerForm = signal(false);
  editingCareerId: string | null = null;
  careerForm: FormGroup;

  private adminApiUrl = `${environment.apiUrl}/admin-website`;

  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.faqForm = this.fb.group({
      question: ['', Validators.required],
      answer: ['', Validators.required],
      displayOrder: [0, Validators.required],
      question_sw: [''],
      answer_sw: ['']
    });

    this.serviceForm = this.fb.group({
      title: ['', Validators.required],
      icon: ['bi-building', Validators.required],
      description: [''],
      overviewText: [''],
      benefits: [''],
      title_sw: [''],
      description_sw: [''],
      overviewText_sw: ['']
    });

    this.newsForm = this.fb.group({
      title: ['', Validators.required],
      category: ['General', Validators.required],
      summary: ['', Validators.required],
      content: [''],
      image: [''],
      title_sw: [''],
      summary_sw: [''],
      content_sw: ['']
    });

    this.careerForm = this.fb.group({
      title: ['', Validators.required],
      department: ['', Validators.required],
      location: ['', Validators.required],
      type: ['Full-time', Validators.required],
      description: [''],
      status: ['active', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading.set(true);
    // 1. Fetch general settings
    this.http.get<any>(`${this.adminApiUrl}/settings`).subscribe({
      next: (res) => {
        const data = res.data || {};
        this.aboutData.companyName = data.about_company_name || 'United Ram Construction Company Ltd';
        this.aboutData.companyName_sw = data.about_company_name_sw || '';
        this.aboutData.whoWeAre = data.about_who_we_are || '';
        this.aboutData.whoWeAre_sw = data.about_who_we_are_sw || '';
        this.aboutData.vision_sw = data.about_vision_sw || '';
        this.aboutData.mission_sw = data.about_mission_sw || '';
        this.aboutData.vision = data.about_vision || '';
        this.aboutData.mission = data.about_mission || '';
        this.aboutData.coreValues = data.about_core_values || '';
        this.aboutData.mdName = data.about_md_name || 'MOHAMMED MUHIDDIN CHACHE';
        this.aboutData.mdQuote = data.about_md_quote || 'Our journey has been defined by our commitment to engineering excellence. We continue to adapt to sustainable development goals, ensuring that every bridge, road, and building we erect is built for generations to come.';
        this.aboutData.mdPhoto = data.about_md_photo || '/managing-director.jpg';
        this.aboutData.mdPhone = data.about_md_phone || '+255 777 412 337';
        this.aboutData.mdEmail = data.about_md_email || 'managing_director@unitedram.com';

        if (data.about_board_directors_json) {
          try {
            this.boardDirectors = JSON.parse(data.about_board_directors_json);
          } catch {
            this.boardDirectors = [];
          }
        } else {
          this.boardDirectors = [
            { name: 'ALI MUHIDDIN CHACHE', role: 'Director', phone: '+255 777 412 337', email: 'managing_director@unitedram.com', photo: '/cropped-logo.png' },
            { name: 'MOHAMMED M. CHACHE', role: 'Managing Director', phone: '+255 777 412 337', email: 'managing_director@unitedram.com', photo: '/managing-director.jpg' },
            { name: 'MAKAME MUHIDDIN CHACHE', role: 'Director', phone: '+255 777 471 849', email: 'info@unitedram.com', photo: '/cropped-logo.png' }
          ];
        }

        if (data.about_management_team_json) {
          try {
            this.managementTeam = JSON.parse(data.about_management_team_json);
          } catch {
            this.managementTeam = [];
          }
        } else {
          this.managementTeam = [
            { name: 'FALHIYA MOHAMMED MUHIDDIN', role: 'Procurement Manager', phone: '+255 777 250 625', email: 'procurement@unitedram.com', photo: '/cropped-logo.png' },
            { name: 'MUHIDINI MASOUD MALIK', role: 'Project Manager', phone: '+255 777 988 498', email: 'project_manager@unitedram.com', photo: '/cropped-logo.png' },
            { name: 'HAMIS MATINA LUTOBEKA', role: 'Quantity Surveyor', phone: '+255 622 261 824', email: 'qs@unitedram.com', photo: '/cropped-logo.png' }
          ];
        }

        this.statsData.yearsExperience = Number(data.stats_years_experience || 0);
        this.statsData.completedProjects = Number(data.stats_completed_projects || 0);
        this.statsData.activeEquipment = Number(data.stats_active_equipment || 0);
        this.statsData.engineers = Number(data.stats_engineers || 0);

        this.brandingData.siteTitle = data.site_title || '';
        this.brandingData.siteLogo = data.site_logo || '';
        this.brandingData.siteFavicon = data.site_favicon || '';
        this.brandingData.contactEmail = data.contact_email || '';
        this.brandingData.contactPhone = data.contact_phone || '';
        this.brandingData.contactAddress = data.contact_address || '';
        this.brandingData.socialFacebook = data.social_facebook || '';
        this.brandingData.socialTwitter = data.social_twitter || '';
        this.brandingData.socialInstagram = data.social_instagram || '';
        this.brandingData.socialLinkedin = data.social_linkedin || '';
        this.brandingData.footerCopyright = data.footer_copyright || '';
        this.brandingData.footerAboutText = data.footer_about_text || '';
        this.brandingData.footerWhatsappNumber = data.footer_whatsapp_number || '';
        this.brandingData.footerStaffMailUrl = data.footer_staff_mail_url || '';
        this.brandingData.pembaAddress = data.contact_pemba_address || '';
        this.brandingData.pembaPhone = data.contact_pemba_phone || '';
        this.brandingData.pembaEmail = data.contact_pemba_email || '';
        this.brandingData.themePrimaryColor = data.theme_primary_color || '#3E50B4';
        this.brandingData.themeSecondaryColor = data.theme_secondary_color || '#D97706';
        this.brandingData.themeDarkColor = data.theme_dark_color || '#0F172A';
        this.brandingData.themeDarkAccent = data.theme_dark_accent || '#1E293B';
        if (data.footer_services_json) {
          try {
            this.brandingData.footerServices = (JSON.parse(data.footer_services_json) || []).join(', ');
          } catch {
            this.brandingData.footerServices = '';
          }
        }

        this.bannersData['banner_about'] = data.banner_about || '';
        this.bannersData['banner_services'] = data.banner_services || '';
        this.bannersData['banner_projects'] = data.banner_projects || '';
        this.bannersData['banner_gallery'] = data.banner_gallery || '';
        this.bannersData['banner_careers'] = data.banner_careers || '';
        this.bannersData['banner_contact'] = data.banner_contact || '';

        this.ctaTitle = data.home_cta_title || "LET'S MAKE SOMETHING TOGETHER";
        this.ctaTitleSw = data.home_cta_title_sw || '';
        this.ctaSubtitle = data.home_cta_subtitle || "Get in touch with us and send some basic info for a quick quote";
        this.ctaSubtitleSw = data.home_cta_subtitle_sw || '';
        this.homeShowcaseSubtitle = data.home_showcase_subtitle || "Focus Showcase";
        this.homeShowcaseSubtitleSw = data.home_showcase_subtitle_sw || '';
        this.homeShowcaseTitle = data.home_showcase_title || "Our Major Landmark Works";
        this.homeShowcaseTitleSw = data.home_showcase_title_sw || '';
        this.homeServicesSubtitle = data.home_services_subtitle || "What We Do";
        this.homeServicesSubtitleSw = data.home_services_subtitle_sw || '';
        this.homeServicesTitle = data.home_services_title || "Our Engineering Expertise";
        this.homeServicesTitleSw = data.home_services_title_sw || '';
        this.homeProjectsSubtitle = data.home_projects_subtitle || "Our Works";
        this.homeProjectsSubtitleSw = data.home_projects_subtitle_sw || '';
        this.homeProjectsTitle = data.home_projects_title || "Featured Infrastructure";
        this.homeProjectsTitleSw = data.home_projects_title_sw || '';

        if (data.home_accordion_json) {
          try {
            this.accordionItems = JSON.parse(data.home_accordion_json);
          } catch {
            this.accordionItems = [];
          }
        }

        if (data.home_partners_json) {
          try {
            this.partnerItems = JSON.parse(data.home_partners_json);
          } catch {
            this.partnerItems = [];
          }
        }

        try {
          this.heroSlides = JSON.parse(data.hero_slider_json || '[]');
        } catch {
          this.heroSlides = [];
        }
      }
    });

    // 2. Fetch FAQs
    this.http.get<any>(`${this.adminApiUrl}/faqs`).subscribe({
      next: (res) => this.faqs = res.data || []
    });

    // 3. Fetch Services
    this.http.get<any>(`${this.adminApiUrl}/services`).subscribe({
      next: (res) => this.services = res.data || []
    });

    // 3b. Fetch News
    this.http.get<any>(`${this.adminApiUrl}/news`).subscribe({
      next: (res) => this.news = res.data || []
    });

    // 4. Fetch Careers
    this.http.get<any>(`${this.adminApiUrl}/careers`).subscribe({
      next: (res) => {
        this.careers = res.data || [];
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        Swal.fire('Error', 'Failed to retrieve website contents.', 'error');
      }
    });
  }

  // ── SLIDE DYNAMIC LIST CONTROLS ──────────────────────────

  addSlide(): void {
    this.heroSlides.push({
      title: 'New Infrastructure Slide',
      subtitle: 'Premium engineering and heavy structural delivery across East Africa.',
      image: '/project3.jpg'
    });
    Swal.fire({
      icon: 'success',
      title: 'New Slide Added',
      text: 'Configure its details and click Save Hero Slideshow to persist changes.',
      timer: 1500,
      showConfirmButton: false
    });
  }

  removeSlide(index: number): void {
    if (this.heroSlides.length <= 1) {
      Swal.fire('Warning', 'You must maintain at least one slideshow slide.', 'warning');
      return;
    }
    Swal.fire({
      title: 'Remove Slide?',
      text: `Are you sure you want to delete Slide #${index + 1}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then(res => {
      if (res.isConfirmed) {
        this.heroSlides.splice(index, 1);
        Swal.fire('Removed', 'Slide has been deleted locally. Save to apply.', 'success');
      }
    });
  }

  // ── MEDIA PICKER LOGIC ───────────────────────────────────

  private resetMediaPickerTargets(): void {
    this.activeSlideIndexForPicker = null;
    this.activeBrandingKeyForPicker = null;
    this.activeBannerKeyForPicker = null;
    this.activeAccordionIndexForPicker = null;
    this.activePartnerIndexForPicker = null;
    this.activeDirectorIndexForPicker = null;
    this.activeManagerIndexForPicker = null;
    this.activeMdPhotoForPicker = false;
    this.activeNewsImageForPicker = false;
  }

  openMediaPicker(index: number): void {
    this.resetMediaPickerTargets();
    this.activeSlideIndexForPicker = index;
    this.showMediaModal.set(true);
  }

  openBrandingPicker(key: string): void {
    this.resetMediaPickerTargets();
    this.activeBrandingKeyForPicker = key;
    this.showMediaModal.set(true);
  }

  openBannerPicker(key: string): void {
    this.resetMediaPickerTargets();
    this.activeBannerKeyForPicker = key;
    this.showMediaModal.set(true);
  }

  openAccordionPicker(index: number): void {
    this.resetMediaPickerTargets();
    this.activeAccordionIndexForPicker = index;
    this.showMediaModal.set(true);
  }

  openPartnerPicker(index: number): void {
    this.resetMediaPickerTargets();
    this.activePartnerIndexForPicker = index;
    this.showMediaModal.set(true);
  }

  openDirectorPicker(index: number): void {
    this.resetMediaPickerTargets();
    this.activeDirectorIndexForPicker = index;
    this.showMediaModal.set(true);
  }

  openManagerPicker(index: number): void {
    this.resetMediaPickerTargets();
    this.activeManagerIndexForPicker = index;
    this.showMediaModal.set(true);
  }

  openMdPhotoPicker(): void {
    this.resetMediaPickerTargets();
    this.activeMdPhotoForPicker = true;
    this.showMediaModal.set(true);
  }

  openNewsImagePicker(): void {
    this.resetMediaPickerTargets();
    this.activeNewsImageForPicker = true;
    this.showMediaModal.set(true);
  }

  addDirector(): void {
    this.boardDirectors = [
      ...this.boardDirectors,
      {
        name: '',
        role: 'Director',
        photo: '/cropped-logo.png',
        phone: '',
        email: ''
      }
    ];
  }

  removeDirector(index: number): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this director profile?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.boardDirectors.splice(index, 1);
        this.boardDirectors = [...this.boardDirectors];
        Swal.fire('Removed', 'Director profile removed locally. Click "SAVE ALL LEADERSHIP & COMPANY DETAILS" at the bottom to apply.', 'success');
      }
    });
  }

  addManager(): void {
    this.managementTeam = [
      ...this.managementTeam,
      {
        name: '',
        role: 'Manager',
        photo: '/cropped-logo.png',
        phone: '',
        email: ''
      }
    ];
  }

  removeManager(index: number): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this manager profile?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.managementTeam.splice(index, 1);
        this.managementTeam = [...this.managementTeam];
        Swal.fire('Removed', 'Manager profile removed locally. Click "SAVE ALL LEADERSHIP & COMPANY DETAILS" at the bottom to apply.', 'success');
      }
    });
  }

  onMediaSelected(mediaItems: any[]): void {
    if (mediaItems.length) {
      const imgUrl = environment.apiUrl.replace('/api', '') + '/uploads/media/' + mediaItems[0].filename;
      let saveInstruction = '';
      
      if (this.activeSlideIndexForPicker !== null) {
        this.heroSlides[this.activeSlideIndexForPicker].image = imgUrl;
        saveInstruction = 'Click "Save Hero Slideshow" to persist.';
      } else if (this.activeBrandingKeyForPicker !== null) {
        if (this.activeBrandingKeyForPicker === 'site_logo') this.brandingData.siteLogo = imgUrl;
        if (this.activeBrandingKeyForPicker === 'site_favicon') this.brandingData.siteFavicon = imgUrl;
        saveInstruction = 'Click "Save Branding Settings" to persist.';
      } else if (this.activeBannerKeyForPicker !== null) {
        this.bannersData[this.activeBannerKeyForPicker] = imgUrl;
        saveInstruction = 'Click "Save Page Banners" to persist.';
      } else if (this.activeAccordionIndexForPicker !== null) {
        this.accordionItems[this.activeAccordionIndexForPicker].image = imgUrl;
        saveInstruction = 'Click "Save Homepage Sections" to persist.';
      } else if (this.activePartnerIndexForPicker !== null) {
        this.partnerItems[this.activePartnerIndexForPicker].image = imgUrl;
        saveInstruction = 'Click "Save Homepage Sections" to persist.';
      } else if (this.activeDirectorIndexForPicker !== null) {
        this.boardDirectors[this.activeDirectorIndexForPicker].photo = imgUrl;
        saveInstruction = 'Click "SAVE ALL LEADERSHIP & COMPANY DETAILS" to persist.';
      } else if (this.activeManagerIndexForPicker !== null) {
        this.managementTeam[this.activeManagerIndexForPicker].photo = imgUrl;
        saveInstruction = 'Click "SAVE ALL LEADERSHIP & COMPANY DETAILS" to persist.';
      } else if (this.activeMdPhotoForPicker) {
        this.aboutData.mdPhoto = imgUrl;
        saveInstruction = 'Click "SAVE ALL LEADERSHIP & COMPANY DETAILS" to persist.';
      } else if (this.activeNewsImageForPicker) {
        this.newsForm.patchValue({ image: imgUrl });
        saveInstruction = 'Click "Save" on the article form to persist.';
      }

      Swal.fire({
        icon: 'success',
        title: 'Image Selected',
        text: `Image applied locally. ${saveInstruction}`,
        showConfirmButton: true,
        confirmButtonText: 'OK'
      });
    }
    this.showMediaModal.set(false);
  }

  // ── SAVE SETTINGS METHODS ────────────────────────────────

  saveHeroSlides(): void {
    Swal.fire({ title: 'Saving Slideshow...', didOpen: () => Swal.showLoading() });
    const payload = { hero_slider_json: JSON.stringify(this.heroSlides) };
    this.http.put(`${this.adminApiUrl}/settings`, payload).subscribe({
      next: () => Swal.fire('Saved', 'Homepage hero slider saved successfully.', 'success'),
      error: () => Swal.fire('Error', 'Failed to save hero slider slides.', 'error')
    });
  }

  saveAboutCompany(): void {
    Swal.fire({ title: 'Saving About Info...', didOpen: () => Swal.showLoading() });
    const payload = {
      about_who_we_are: this.aboutData.whoWeAre,
      about_vision: this.aboutData.vision,
      about_mission: this.aboutData.mission,
      about_core_values: this.aboutData.coreValues,
      about_md_name: this.aboutData.mdName,
      about_md_quote: this.aboutData.mdQuote,
      about_md_photo: this.aboutData.mdPhoto,
      about_md_phone: this.aboutData.mdPhone,
      about_md_email: this.aboutData.mdEmail,
      about_board_directors_json: JSON.stringify(this.boardDirectors),
      about_management_team_json: JSON.stringify(this.managementTeam),
      about_company_name: this.aboutData.companyName,
      ...(this.aboutData.companyName_sw ? { about_company_name_sw: this.aboutData.companyName_sw } : {}),
      ...(this.aboutData.whoWeAre_sw ? { about_who_we_are_sw: this.aboutData.whoWeAre_sw } : {}),
      ...(this.aboutData.vision_sw ? { about_vision_sw: this.aboutData.vision_sw } : {}),
      ...(this.aboutData.mission_sw ? { about_mission_sw: this.aboutData.mission_sw } : {})
    };
    this.http.put(`${this.adminApiUrl}/settings`, payload).subscribe({
      next: () => Swal.fire('Saved', 'About details and leadership profiles updated successfully.', 'success'),
      error: () => Swal.fire('Error', 'Failed to update about details.', 'error')
    });
  }

  saveStatsCounters(): void {
    Swal.fire({ title: 'Saving Stats counters...', didOpen: () => Swal.showLoading() });
    const payload = {
      stats_years_experience: String(this.statsData.yearsExperience),
      stats_completed_projects: String(this.statsData.completedProjects),
      stats_active_equipment: String(this.statsData.activeEquipment),
      stats_engineers: String(this.statsData.engineers)
    };
    this.http.put(`${this.adminApiUrl}/settings`, payload).subscribe({
      next: () => Swal.fire('Saved', 'Stat counters updated successfully.', 'success'),
      error: () => Swal.fire('Error', 'Failed to update stat counters.', 'error')
    });
  }

  saveBrandingSettings(): void {
    Swal.fire({ title: 'Saving Branding Settings...', didOpen: () => Swal.showLoading() });
    const payload = {
      site_title: this.brandingData.siteTitle,
      site_logo: this.brandingData.siteLogo,
      site_favicon: this.brandingData.siteFavicon,
      contact_email: this.brandingData.contactEmail,
      contact_phone: this.brandingData.contactPhone,
      contact_address: this.brandingData.contactAddress,
      social_facebook: this.brandingData.socialFacebook,
      social_twitter: this.brandingData.socialTwitter,
      social_instagram: this.brandingData.socialInstagram,
      social_linkedin: this.brandingData.socialLinkedin,
      footer_copyright: this.brandingData.footerCopyright,
      footer_about_text: this.brandingData.footerAboutText,
      footer_services_json: JSON.stringify(
        this.brandingData.footerServices.split(',').map(s => s.trim()).filter(s => s.length > 0)
      ),
      footer_whatsapp_number: this.brandingData.footerWhatsappNumber,
      footer_staff_mail_url: this.brandingData.footerStaffMailUrl,
      contact_pemba_address: this.brandingData.pembaAddress,
      contact_pemba_phone: this.brandingData.pembaPhone,
      contact_pemba_email: this.brandingData.pembaEmail
    };
    this.http.put(`${this.adminApiUrl}/settings`, payload).subscribe({
      next: () => Swal.fire('Saved', 'Branding & contact settings updated.', 'success'),
      error: () => Swal.fire('Error', 'Failed to update branding settings.', 'error')
    });
  }

  saveThemeSettings(): void {
    Swal.fire({ title: 'Saving Website Theme...', didOpen: () => Swal.showLoading() });
    const payload = {
      theme_primary_color: this.brandingData.themePrimaryColor,
      theme_secondary_color: this.brandingData.themeSecondaryColor,
      theme_dark_color: this.brandingData.themeDarkColor,
      theme_dark_accent: this.brandingData.themeDarkAccent
    };
    this.http.put(`${this.adminApiUrl}/settings`, payload).subscribe({
      next: () => Swal.fire('Saved', 'Website theme updated — reload unitedram.com to see it live.', 'success'),
      error: () => Swal.fire('Error', 'Failed to update website theme.', 'error')
    });
  }

  saveBannersSettings(): void {
    Swal.fire({ title: 'Saving Page Banners...', didOpen: () => Swal.showLoading() });
    const payload = {
      banner_about: this.bannersData['banner_about'],
      banner_services: this.bannersData['banner_services'],
      banner_projects: this.bannersData['banner_projects'],
      banner_gallery: this.bannersData['banner_gallery'],
      banner_careers: this.bannersData['banner_careers'],
      banner_contact: this.bannersData['banner_contact']
    };
    this.http.put(`${this.adminApiUrl}/settings`, payload).subscribe({
      next: () => Swal.fire('Saved', 'Page banners updated successfully.', 'success'),
      error: () => Swal.fire('Error', 'Failed to update banners settings.', 'error')
    });
  }

  // ── HOMEPAGE SECTIONS & PARTNERS & CTA SAVE ──────────────

  addShowcaseItem(): void {
    this.accordionItems.push({
      title: 'New Showcase Project',
      image: '/project3.jpg',
      subtitle: 'United Ram Engineering Excellency'
    });
    Swal.fire({
      icon: 'success',
      title: 'Showcase Added',
      text: 'Configure details and click Save Homepage Sections to apply changes.',
      timer: 1500,
      showConfirmButton: false
    });
  }

  removeShowcaseItem(index: number): void {
    Swal.fire({
      title: 'Remove Showcase Item?',
      text: `Are you sure you want to delete Showcase #${index + 1}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then(res => {
      if (res.isConfirmed) {
        this.accordionItems.splice(index, 1);
        Swal.fire('Deleted!', 'Showcase item removed locally. Save to apply.', 'success');
      }
    });
  }

  addPartner(): void {
    this.partnerItems.push({ name: 'New Client Partner', image: '/zssf.png', link: '#' });
    Swal.fire({
      icon: 'success',
      title: 'Partner Added',
      text: 'Configure details and click Save Homepage Sections to apply changes.',
      timer: 1500,
      showConfirmButton: false
    });
  }

  removePartner(index: number): void {
    Swal.fire({
      title: 'Remove Partner Logo?',
      text: `Are you sure you want to delete Partner #${index + 1}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then(res => {
      if (res.isConfirmed) {
        this.partnerItems.splice(index, 1);
        Swal.fire('Deleted!', 'Partner logo removed locally. Save to apply.', 'success');
      }
    });
  }

  saveHomepageSections(): void {
    Swal.fire({ title: 'Saving Homepage Sections...', didOpen: () => Swal.showLoading() });
    const payload = {
      home_accordion_json: JSON.stringify(this.accordionItems),
      home_partners_json: JSON.stringify(this.partnerItems),
      home_cta_title: this.ctaTitle,
      home_cta_subtitle: this.ctaSubtitle,
      home_showcase_subtitle: this.homeShowcaseSubtitle,
      home_showcase_title: this.homeShowcaseTitle,
      home_services_subtitle: this.homeServicesSubtitle,
      home_services_title: this.homeServicesTitle,
      home_projects_subtitle: this.homeProjectsSubtitle,
      home_projects_title: this.homeProjectsTitle,
      ...(this.ctaTitleSw ? { home_cta_title_sw: this.ctaTitleSw } : {}),
      ...(this.ctaSubtitleSw ? { home_cta_subtitle_sw: this.ctaSubtitleSw } : {}),
      ...(this.homeShowcaseSubtitleSw ? { home_showcase_subtitle_sw: this.homeShowcaseSubtitleSw } : {}),
      ...(this.homeShowcaseTitleSw ? { home_showcase_title_sw: this.homeShowcaseTitleSw } : {}),
      ...(this.homeServicesSubtitleSw ? { home_services_subtitle_sw: this.homeServicesSubtitleSw } : {}),
      ...(this.homeServicesTitleSw ? { home_services_title_sw: this.homeServicesTitleSw } : {}),
      ...(this.homeProjectsSubtitleSw ? { home_projects_subtitle_sw: this.homeProjectsSubtitleSw } : {}),
      ...(this.homeProjectsTitleSw ? { home_projects_title_sw: this.homeProjectsTitleSw } : {})
    };
    this.http.put(`${this.adminApiUrl}/settings`, payload).subscribe({
      next: () => Swal.fire('Saved', 'Homepage showcase elements and CTA updated successfully.', 'success'),
      error: () => Swal.fire('Error', 'Failed to save homepage elements.', 'error')
    });
  }

  // ── FAQ METHODS ──────────────────────────────────────────

  openFaqModal(faq?: any): void {
    if (faq) {
      this.editingFaqId = faq.id;
      this.faqForm.patchValue({
        question: faq.question,
        answer: faq.answer,
        displayOrder: faq.displayOrder,
        question_sw: faq.question_sw || '',
        answer_sw: faq.answer_sw || ''
      });
    } else {
      this.editingFaqId = null;
      this.faqForm.reset({ question: '', answer: '', displayOrder: 0, question_sw: '', answer_sw: '' });
    }
    this.showFaqForm.set(true);
  }

  saveFaq(): void {
    if (this.faqForm.invalid) return;
    const body = this.faqForm.value;

    Swal.fire({ title: 'Saving FAQ...', didOpen: () => Swal.showLoading() });
    if (this.editingFaqId) {
      this.http.put(`${this.adminApiUrl}/faqs/${this.editingFaqId}`, body).subscribe({
        next: () => {
          Swal.fire('Updated', 'FAQ updated successfully.', 'success');
          this.showFaqForm.set(false);
          this.loadAll();
        }
      });
    } else {
      this.http.post(`${this.adminApiUrl}/faqs`, body).subscribe({
        next: () => {
          Swal.fire('Created', 'FAQ created successfully.', 'success');
          this.showFaqForm.set(false);
          this.loadAll();
        }
      });
    }
  }

  deleteFaq(faq: any): void {
    Swal.fire({
      title: 'Delete FAQ?',
      text: 'Are you sure you want to delete this FAQ entry?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then(res => {
      if (res.isConfirmed) {
        Swal.fire({ title: 'Deleting FAQ...', didOpen: () => Swal.showLoading() });
        this.http.delete(`${this.adminApiUrl}/faqs/${faq.id}`).subscribe({
          next: () => {
            Swal.fire('Deleted', 'FAQ removed.', 'success');
            this.loadAll();
          }
        });
      }
    });
  }

  // ── SERVICE METHODS ──────────────────────────────────────

  openServiceModal(svc?: any): void {
    if (svc) {
      this.editingServiceId = svc.id;
      let benefitsText = '';
      if (svc.benefitsJson) {
        try { benefitsText = (JSON.parse(svc.benefitsJson) || []).join('\n'); } catch {}
      }
      this.serviceForm.patchValue({
        title: svc.title,
        icon: svc.icon,
        description: svc.description,
        overviewText: svc.overviewText || '',
        benefits: benefitsText,
        title_sw: svc.title_sw || '',
        description_sw: svc.description_sw || '',
        overviewText_sw: svc.overviewText_sw || ''
      });
    } else {
      this.editingServiceId = null;
      this.serviceForm.reset({ title: '', icon: 'bi-building', description: '', overviewText: '', benefits: '', title_sw: '', description_sw: '', overviewText_sw: '' });
    }
    this.showServiceForm.set(true);
  }

  saveService(): void {
    if (this.serviceForm.invalid) return;
    const body = this.serviceForm.value;

    Swal.fire({ title: 'Saving Service...', didOpen: () => Swal.showLoading() });
    if (this.editingServiceId) {
      this.http.put(`${this.adminApiUrl}/services/${this.editingServiceId}`, body).subscribe({
        next: () => {
          Swal.fire('Updated', 'Service updated successfully.', 'success');
          this.showServiceForm.set(false);
          this.loadAll();
        }
      });
    } else {
      this.http.post(`${this.adminApiUrl}/services`, body).subscribe({
        next: () => {
          Swal.fire('Created', 'Service created successfully.', 'success');
          this.showServiceForm.set(false);
          this.loadAll();
        }
      });
    }
  }

  deleteService(svc: any): void {
    Swal.fire({
      title: 'Delete Service?',
      text: 'Are you sure you want to delete this service listing?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then(res => {
      if (res.isConfirmed) {
        Swal.fire({ title: 'Deleting Service...', didOpen: () => Swal.showLoading() });
        this.http.delete(`${this.adminApiUrl}/services/${svc.id}`).subscribe({
          next: () => {
            Swal.fire('Deleted', 'Service removed.', 'success');
            this.loadAll();
          }
        });
      }
    });
  }

  // ── NEWS METHODS ──────────────────────────────────────────

  openNewsModal(article?: any): void {
    if (article) {
      this.editingNewsId = article.id;
      this.newsForm.patchValue({
        title: article.title,
        category: article.category,
        summary: article.summary,
        content: article.content,
        image: article.image,
        title_sw: article.title_sw || '',
        summary_sw: article.summary_sw || '',
        content_sw: article.content_sw || ''
      });
    } else {
      this.editingNewsId = null;
      this.newsForm.reset({ title: '', category: 'General', summary: '', content: '', image: '', title_sw: '', summary_sw: '', content_sw: '' });
    }
    this.showNewsForm.set(true);
  }

  saveNews(): void {
    if (this.newsForm.invalid) return;
    const body = this.newsForm.value;

    Swal.fire({ title: 'Saving Article...', didOpen: () => Swal.showLoading() });
    if (this.editingNewsId) {
      this.http.put(`${this.adminApiUrl}/news/${this.editingNewsId}`, body).subscribe({
        next: () => {
          Swal.fire('Updated', 'Article updated successfully.', 'success');
          this.showNewsForm.set(false);
          this.loadAll();
        }
      });
    } else {
      this.http.post(`${this.adminApiUrl}/news`, body).subscribe({
        next: () => {
          Swal.fire('Created', 'Article published successfully.', 'success');
          this.showNewsForm.set(false);
          this.loadAll();
        }
      });
    }
  }

  deleteNews(article: any): void {
    Swal.fire({
      title: 'Delete Article?',
      text: 'Are you sure you want to delete this news article?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then(res => {
      if (res.isConfirmed) {
        Swal.fire({ title: 'Deleting Article...', didOpen: () => Swal.showLoading() });
        this.http.delete(`${this.adminApiUrl}/news/${article.id}`).subscribe({
          next: () => {
            Swal.fire('Deleted', 'Article removed.', 'success');
            this.loadAll();
          }
        });
      }
    });
  }

  // ── CAREER METHODS ───────────────────────────────────────

  openCareerModal(job?: any): void {
    if (job) {
      this.editingCareerId = job.id;
      this.careerForm.patchValue({
        title: job.title,
        department: job.department,
        location: job.location,
        type: job.type,
        description: job.description,
        status: job.status
      });
    } else {
      this.editingCareerId = null;
      this.careerForm.reset({ title: '', department: '', location: '', type: 'Full-time', description: '', status: 'active' });
    }
    this.showCareerForm.set(true);
  }

  saveCareer(): void {
    if (this.careerForm.invalid) return;
    const body = this.careerForm.value;

    Swal.fire({ title: 'Saving Job position...', didOpen: () => Swal.showLoading() });
    if (this.editingCareerId) {
      this.http.put(`${this.adminApiUrl}/careers/${this.editingCareerId}`, body).subscribe({
        next: () => {
          Swal.fire('Updated', 'Job posting updated.', 'success');
          this.showCareerForm.set(false);
          this.loadAll();
        }
      });
    } else {
      this.http.post(`${this.adminApiUrl}/careers`, body).subscribe({
        next: () => {
          Swal.fire('Created', 'New vacancy created successfully.', 'success');
          this.showCareerForm.set(false);
          this.loadAll();
        }
      });
    }
  }

  deleteCareer(job: any): void {
    Swal.fire({
      title: 'Delete vacancy?',
      text: 'Are you sure you want to delete this active job position?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then(res => {
      if (res.isConfirmed) {
        Swal.fire({ title: 'Deleting Job position...', didOpen: () => Swal.showLoading() });
        this.http.delete(`${this.adminApiUrl}/careers/${job.id}`).subscribe({
          next: () => {
            Swal.fire('Deleted', 'Job vacancy removed.', 'success');
            this.loadAll();
          }
        });
      }
    });
  }

  resolveImage(imagePath: string): string {
    if (!imagePath) return '/assets/img/placeholder.png';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    if (imagePath.startsWith('/uploads') || imagePath.startsWith('uploads')) {
      const path = imagePath.startsWith('/') ? imagePath : '/' + imagePath;
      return environment.apiUrl.replace('/api', '') + path;
    }
    if (imagePath.startsWith('/')) {
      return environment.websiteUrl + imagePath;
    }
    return environment.websiteUrl + '/' + imagePath;
  }
}

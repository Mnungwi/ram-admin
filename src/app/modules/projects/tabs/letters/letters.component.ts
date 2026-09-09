import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { LetterService, ProjectService, DocumentService, UserService } from '../../../../core/services/domain.services';
import { AuthService } from '../../../../core/services/auth.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { SearchableSelectComponent, SelectOption } from '../../../../shared/components/searchable-select/searchable-select.component';
import { resolveAvatarUrl } from '../../../../core/utils/avatar.util';
import { CKEditorModule } from 'ng2-ckeditor';
import { DomSanitizer } from '@angular/platform-browser';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-letters',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CKEditorModule, SearchableSelectComponent],
  templateUrl: './letters.component.html',
  styleUrls: ['./letters.component.css'],
})
export class LettersComponent implements OnInit {
  letters: any[] = [];
  filteredLetters: any[] = [];
  loading = false;
  searchTerm = '';
  statusFilter = '';

  currentView: 'table' | 'create' | 'edit' | 'preview' | 'details' = 'table';
  editMode = false;
  selectedLetter: any = null;
  form!: FormGroup;
  saving = false;
  attachmentFile: File | null = null;

  // Media Gallery & Attachments
  showMediaModal = false;
  mediaDocuments: any[] = [];
  filteredMediaDocuments: any[] = [];
  loadingMedia = false;
  mediaSearchTerm = '';
  mediaCategoryFilter = '';
  selectedGalleryDocuments: any[] = [];
  selectedAttachments: any[] = [];

  showAttachmentModal = false;
  attachmentModalUrl: any = null;
  attachmentModalType: 'image' | 'pdf' | 'other' = 'other';
  attachmentModalName = '';

  previewLetter: any = null;

  statuses = ['Draft', 'Pending Approval', 'Approved', 'Sent', 'Archived'];

  // Project context and Stakeholders selection
  projectId = '';
  projectName = '';
  projectStakeholders: any[] = [];
  selectedCcIds: string[] = [];
  selectedRecipientStakeholderId = '';

  ckeditorConfig = {
    uiColor: '#F0F3F4',
    height: '250',
    extraPlugins: 'divarea',
	versionCheck: false
  };

  get totalCount() { return this.letters.length; }
  get sentCount() { return this.letters.filter((l) => l.status === 'Sent').length; }
  get pendingCount() { return this.letters.filter((l) => l.status === 'Pending Approval').length; }
  get draftCount() { return this.letters.filter((l) => l.status === 'Draft').length; }

  allUsers: any[] = [];
  signerOptions: SelectOption[] = [];

  constructor(
    private fb: FormBuilder,
    private letterSvc: LetterService,
    private projectSvc: ProjectService,
    private docSvc: DocumentService,
    private userSvc: UserService,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    public auth: AuthService,
    public themeSvc: ThemeService,
  ) {}

  ngOnInit(): void {
    this.route.parent?.params.subscribe((params) => {
      this.projectId = params['id'];
      this.load();
      if (this.projectId) {
        this.loadProjectDetails();
        this.loadProjectStakeholders();
      }
    });

    const me = this.auth.currentUser();
    this.userSvc.getAll({ limit: 200, isActive: true }).subscribe({
      next: (res: any) => {
        this.allUsers = res?.data || [];
        this.signerOptions = this.allUsers
          .filter((u: any) => u.id !== me?.id) // no point "signing as yourself" via this picker — that's the default
          .map((u: any) => ({
            value: u.id,
            label: `${u.firstName} ${u.lastName}`,
            sublabel: u.jobTitle || u.department || '',
          }));
      },
      error: () => {},
    });
  }

  loadProjectDetails(): void {
    this.projectSvc.getOne(this.projectId).subscribe({
      next: (res: any) => {
        const p = res?.data?.project || res?.data;
        if (p) {
          this.projectName = p.name || '';
        }
      },
      error: (err: any) => {
        console.error('Failed to load project details', err);
      }
    });
  }
  openMediaModal(): void {
    this.showMediaModal = true;
    this.loadMediaDocuments();
  }

  loadMediaDocuments(): void {
    if (!this.projectId) return;
    this.loadingMedia = true;
    this.docSvc.getAll(this.projectId).subscribe({
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

  onAttachmentSelected(event: any): void {
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

  getFilteredCcStakeholders(): any[] {
    return this.projectStakeholders.filter(ps => ps.id !== this.selectedRecipientStakeholderId);
  }

  onRecipientStakeholderSelect(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const psId = select.value;
    if (!psId) {
      this.selectedRecipientStakeholderId = '';
      this.form.patchValue({
        recipientId: null,
        recipientName: '',
        recipientPosition: '',
        recipientOrganization: '',
        recipientEmail: '',
      });
      return;
    }

    const ps = this.projectStakeholders.find(item => item.id === psId);
    if (ps && ps.stakeholder) {
      this.selectedRecipientStakeholderId = psId;
      this.form.patchValue({
        recipientId: ps.stakeholder.id,
        recipientName: ps.stakeholder.name,
        recipientPosition: ps.role || ps.stakeholder.jobTitle || '',
        recipientOrganization: ps.stakeholder.organization || '',
        recipientEmail: ps.stakeholder.email || '',
      });

      // Remove recipient from CC if already checked
      const idx = this.selectedCcIds.indexOf(psId);
      if (idx > -1) {
        this.selectedCcIds.splice(idx, 1);
      }
    }
  }

  toggleCc(ps: any): void {
    const idx = this.selectedCcIds.indexOf(ps.id);
    if (idx > -1) {
      this.selectedCcIds.splice(idx, 1);
    } else {
      this.selectedCcIds.push(ps.id);
    }
  }

  isCcSelected(ps: any): boolean {
    if (!ps) return false;
    return this.selectedCcIds.some(id =>
      id === ps.id ||
      id === ps.stakeholderId ||
      (ps.stakeholder && (id === ps.stakeholder.id || id === ps.stakeholderId))
    );
  }

  viewAttachment(): void {
    let url = '';
    let name = '';
    if (this.attachmentFile) {
      url = URL.createObjectURL(this.attachmentFile);
      name = this.attachmentFile.name;
    } else if (this.previewLetter && this.previewLetter.attachmentFileName) {
      url = this.letterSvc.getAttachmentDownloadUrl(this.previewLetter.id);
      name = this.previewLetter.attachmentFileName;
    } else if (this.selectedLetter && this.selectedLetter.attachmentFileName) {
      url = this.letterSvc.getAttachmentDownloadUrl(this.selectedLetter.id);
      name = this.selectedLetter.attachmentFileName;
    }

    if (url) {
      this.attachmentModalName = name;
      const ext = name.split('.').pop()?.toLowerCase();
      if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '')) {
        this.attachmentModalType = 'image';
      } else if (ext === 'pdf') {
        this.attachmentModalType = 'pdf';
      } else {
        this.attachmentModalType = 'other';
      }
      this.attachmentModalUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      this.showAttachmentModal = true;
    }
  }

  viewSpecificAttachment(att: any, index: number): void {
    const name = att.fileName || att.title || 'attachment';
    let url = '';
    if (att.file) {
      url = URL.createObjectURL(att.file);
    } else {
      const letterId = this.selectedLetter?.id || this.previewLetter?.id;
      if (letterId) {
        url = this.letterSvc.getAttachmentDownloadUrl(letterId, att, index);
      }
    }

    if (url) {
      this.attachmentModalName = name;
      const ext = name.split('.').pop()?.toLowerCase();
      if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '')) {
        this.attachmentModalType = 'image';
      } else if (ext === 'pdf') {
        this.attachmentModalType = 'pdf';
      } else {
        this.attachmentModalType = 'other';
      }
      this.attachmentModalUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      this.showAttachmentModal = true;
    }
  }

  closeAttachmentModal(): void {
    this.showAttachmentModal = false;
    this.attachmentModalUrl = null;
  }

  downloadAttachmentDirectly(): void {
    if (this.attachmentFile) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(this.attachmentFile);
      a.download = this.attachmentFile.name;
      a.click();
    } else if (this.previewLetter) {
      window.open(this.letterSvc.getAttachmentDownloadUrl(this.previewLetter.id) + '?download=true', '_blank');
    } else if (this.selectedLetter) {
      window.open(this.letterSvc.getAttachmentDownloadUrl(this.selectedLetter.id) + '?download=true', '_blank');
    }
  }

  switchView(view: 'table' | 'create' | 'edit' | 'preview' | 'details'): void {
    this.currentView = view;
  }

  getCcStakeholdersList(): any[] {
    return this.projectStakeholders
      .filter(ps => this.selectedCcIds.includes(ps.id) && ps.stakeholder)
      .map(ps => ({
        id: ps.stakeholder?.id || ps.id,
        name: ps.stakeholder?.name,
        title: ps.role || ps.stakeholder?.jobTitle,
        organization: ps.stakeholder?.organization,
        email: ps.stakeholder?.email
      }));
  }

  getCcCount(l: any): number {
    if (!l) return 0;
    if (Array.isArray(l.ccRecipients)) return l.ccRecipients.length;
    if (Array.isArray(l.ccList)) return l.ccList.length;
    if (typeof l.ccList === 'string') {
      try {
        const parsed = JSON.parse(l.ccList);
        return Array.isArray(parsed) ? parsed.length : 0;
      } catch (e) {
        return 0;
      }
    }
    return 0;
  }

  getCcListArray(l: any): any[] {
    if (!l) return [];
    let list: any[] = [];
    if (Array.isArray(l.ccRecipients) && l.ccRecipients.length > 0) {
      list = l.ccRecipients;
    } else if (Array.isArray(l.ccList)) {
      list = l.ccList;
    } else if (typeof l.ccList === 'string') {
      try {
        const parsed = JSON.parse(l.ccList);
        if (Array.isArray(parsed)) list = parsed;
      } catch (e) {}
    }

    return list.map(item => {
      if (typeof item === 'string') {
        const match = this.projectStakeholders.find(ps => ps.id === item || ps.stakeholderId === item || ps.stakeholder?.id === item);
        if (match && match.stakeholder) {
          return {
            id: match.stakeholder.id,
            name: match.stakeholder.name,
            title: match.role || match.stakeholder.jobTitle,
            organization: match.stakeholder.organization,
            email: match.stakeholder.email
          };
        }
        return { name: item };
      } else if (item && typeof item === 'object') {
        const targetId = item.id || item.stakeholderId;
        if (targetId && !item.name && !item.email) {
          const match = this.projectStakeholders.find(ps => ps.id === targetId || ps.stakeholderId === targetId || ps.stakeholder?.id === targetId);
          if (match && match.stakeholder) {
            return {
              id: match.stakeholder.id,
              name: match.stakeholder.name,
              title: match.role || match.stakeholder.jobTitle,
              organization: match.stakeholder.organization,
              email: match.stakeholder.email
            };
          }
        }
      }
      return item;
    });
  }

  previewLetterData(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const val = this.form.value;
    
    // Map CC list from checked stakeholders
    const ccListValue = this.projectStakeholders
      .filter(ps => this.selectedCcIds.includes(ps.id) && ps.stakeholder)
      .map(ps => ({
        name: ps.stakeholder.name,
        email: ps.stakeholder.email
      }));

    this.previewLetter = {
      ...val,
      ccList: ccListValue,
      createdAt: this.editMode && this.selectedLetter ? this.selectedLetter.createdAt : new Date(),
      letterNo: this.editMode && this.selectedLetter ? this.selectedLetter.letterNo : 'DRAFT',
      status: this.editMode && this.selectedLetter ? this.selectedLetter.status : 'Draft'
    };
    this.switchView('preview');
  }

  saveLetter(): void {
    this.onSubmit();
  }

  generatePDF(): void {
    if (this.previewLetter && this.previewLetter.id) {
      this.letterSvc.downloadPdf(this.previewLetter.id).subscribe({
        next: (blob: Blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${this.previewLetter.letterNo || 'letter'}.pdf`;
          a.click();
          URL.revokeObjectURL(url);
        },
        error: (err: any) => {
          Swal.fire('Error', 'Failed to generate PDF.', 'error');
        }
      });
    } else {
      Swal.fire('Info', 'Please save the letter first to print/download PDF.', 'info');
    }
  }

  viewDetails(row: any): void {
    this.selectedLetter = row;
    this.switchView('details');
  }

  loadProjectStakeholders(): void {
    this.projectSvc.getStakeholders(this.projectId).subscribe({
      next: (res: any) => {
        this.projectStakeholders = res?.data?.stakeholders || [];
      },
      error: (err: any) => {
        console.error('Failed to load project stakeholders', err);
      }
    });
  }

  // onStakeholderSelect has been replaced by onRecipientStakeholderSelect

  load(): void {
    this.loading = true;
    const obs$ = this.projectId
      ? this.letterSvc.getProjectLetters(this.projectId)
      : this.letterSvc.getAll();
    obs$.subscribe({
      next: (res: any) => {
        const rawLetters = res?.data?.rows || res?.data?.letters || res?.data || [];
        this.letters = rawLetters.map((l: any) => {
          const senderName = l.sender ? `${l.sender.firstName} ${l.sender.lastName}` : (l.senderName || 'United');
          const senderPosition = l.sender ? l.sender.jobTitle : (l.senderPosition || 'Project Director');
          const senderOrganization = l.sender ? (l.sender.department || 'United') : (l.senderOrganization || 'United');
          const senderEmail = l.sender ? l.sender.email : (l.senderEmail || 'info@united.co.tz');

          const recipientName = l.recipient ? l.recipient.name : (l.recipientName || '');
          const recipientPosition = l.recipient ? l.recipient.jobTitle : (l.recipientPosition || '');
          const recipientOrganization = l.recipient ? l.recipient.organization : (l.recipientOrganization || '');
          const recipientEmail = l.recipient ? l.recipient.email : (l.recipientEmail || '');

          return {
            ...l,
            senderName,
            senderPosition,
            senderOrganization,
            senderEmail,
            recipientName,
            recipientPosition,
            recipientOrganization,
            recipientEmail,
          };
        });
        this.applyFilters();
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredLetters = this.letters.filter((l) => {
      const matchSearch = !term
        || l.subject?.toLowerCase().includes(term)
        || l.recipientName?.toLowerCase().includes(term)
        || l.letterNo?.toLowerCase().includes(term);
      const matchStatus = !this.statusFilter || l.status === this.statusFilter;
      return matchSearch && matchStatus;
    });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      Draft: 'status-pending',
      'Pending Approval': 'status-pending',
      Approved: 'status-completed',
      Sent: 'status-completed',
      Archived: 'status-overdue',
    };
    return map[status] || 'status-pending';
  }

  // ══════════════════════════════════════════════════════════
  // COMPOSE MODAL
  // ══════════════════════════════════════════════════════════

  get ccArray(): FormArray {
    return this.form.get('ccList') as FormArray;
  }

  openComposeModal(): void {
    this.editMode = false;
    this.selectedLetter = null;
    this.attachmentFile = null;
    this.selectedCcIds = [];
    this.selectedRecipientStakeholderId = '';
    this.selectedAttachments = [];
    const me = this.auth.currentUser();
    this.form = this.fb.group({
      projectName: [this.projectName],
      subTitle: [''],
      subject: ['', Validators.required],
      body: ['', Validators.required],
      senderId: [null],
      senderName: [me ? `${me.firstName} ${me.lastName}` : '', Validators.required],
      senderPosition: [me?.jobTitle || ''],
      senderOrganization: [this.themeSvc.appName() || ''],
      senderEmail: [me?.email || '', [Validators.email]],
      recipientId: [null],
      recipientName: ['', Validators.required],
      recipientPosition: [''],
      recipientOrganization: [''],
      recipientEmail: ['', [Validators.required, Validators.email]],
    });
    this.switchView('create');
  }

  // "Signing As" — same delegation pattern as the sidebar Compose page
  // (letter-form.component.ts): auto-fills From (Sender) from the chosen
  // colleague's own profile (still editable) and records senderId so the
  // letter gets auto-forwarded to them for their own signature on save.
  // Clearing it reverts to signing as yourself.
  onSignerSelected(userId: string | null): void {
    this.form.get('senderId')?.setValue(userId || null);
    const chosen = userId ? this.allUsers.find((u) => u.id === userId) : null;
    const me = this.auth.currentUser();
    const person = chosen || me;
    if (person) {
      this.form.patchValue({
        senderName: `${person.firstName} ${person.lastName}`,
        senderPosition: person.jobTitle || '',
        senderOrganization: chosen ? (this.form.get('senderOrganization')?.value || this.themeSvc.appName()) : this.themeSvc.appName(),
      });
    }
  }

  mySignatureUrl(): string | null {
    const sig = this.auth.currentUser()?.signatureImage;
    return sig ? resolveAvatarUrl(sig) : null;
  }

  getChosenSignerName(): string {
    const id = this.form.get('senderId')?.value;
    const u = id ? this.allUsers.find((x) => x.id === id) : null;
    return u ? `${u.firstName} ${u.lastName}` : '';
  }

  openEditModal(l: any): void {
    this.editMode = true;
    this.selectedLetter = l;
    this.attachmentFile = null;
    
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
    } else {
      this.selectedAttachments = [];
    }

    // Find matching recipient stakeholder by ID or email
    const matchRecipient = this.projectStakeholders.find(ps => ps.stakeholder?.id === l.recipientId || ps.stakeholder?.email === l.recipientEmail);
    this.selectedRecipientStakeholderId = matchRecipient ? matchRecipient.id : '';

    // Map CC list or ccRecipients to stakeholder IDs (excluding recipient)
    this.selectedCcIds = [];
    let ccSource = l.ccRecipients || l.ccList || [];
    if (typeof ccSource === 'string') {
      try { ccSource = JSON.parse(ccSource); } catch (e) { ccSource = []; }
    }
    if (!Array.isArray(ccSource)) ccSource = [];

    ccSource.forEach((cc: any) => {
      const targetId = typeof cc === 'string' ? cc : (cc.id || cc.stakeholderId);
      const targetEmail = typeof cc === 'object' ? (cc.email || cc.recipientEmail) : null;
      const targetName = typeof cc === 'object' ? (cc.name ? cc.name.trim().toLowerCase() : null) : null;

      const match = this.projectStakeholders.find(ps => {
        const pStId = ps.id;
        const stId = ps.stakeholderId || ps.stakeholder?.id;
        const stEmail = ps.stakeholder?.email || ps.email;
        const stName = ps.stakeholder?.name ? ps.stakeholder.name.trim().toLowerCase() : null;

        if (targetId && (pStId === targetId || stId === targetId)) return true;
        if (targetEmail && stEmail && stEmail.toLowerCase() === targetEmail.toLowerCase()) return true;
        if (targetName && stName && stName === targetName) return true;
        return false;
      });

      if (match && match.id !== this.selectedRecipientStakeholderId) {
        if (!this.selectedCcIds.includes(match.id)) {
          this.selectedCcIds.push(match.id);
        }
      }
    });

    this.form = this.fb.group({
      projectName: [this.projectName],
      subTitle: [l.subTitle || ''],
      subject: [l.subject, Validators.required],
      body: [l.body, Validators.required],
      senderId: [l.senderId || null],
      senderName: [l.senderName, Validators.required],
      senderPosition: [l.senderPosition || ''],
      senderOrganization: [l.senderOrganization || ''],
      senderEmail: [l.senderEmail || '', [Validators.email]],
      recipientId: [l.recipientId || null],
      recipientName: [l.recipientName, Validators.required],
      recipientPosition: [l.recipientPosition || ''],
      recipientOrganization: [l.recipientOrganization || ''],
      recipientEmail: [l.recipientEmail, [Validators.required, Validators.email]],
    });
    this.switchView('edit');
  }

  closeModal(): void {
    this.switchView('table');
  }

  get f() {
    return this.form.controls;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;

    // Compile CC List from selected stakeholders (collect only stakeholder IDs)
    const ccListValue = this.projectStakeholders
      .filter(ps => this.selectedCcIds.includes(ps.id) && ps.stakeholder)
      .map(ps => ps.stakeholder.id);

    const fd = new FormData();
    const val = this.form.value;
    Object.keys(val).forEach((key) => {
      if (val[key] !== null && val[key] !== undefined) {
        fd.append(key, val[key]);
      }
    });
    fd.append('ccList', JSON.stringify(ccListValue));
    if (this.projectId) {
      fd.append('projectId', this.projectId);
    }

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

    const obs$ = this.editMode && this.selectedLetter
      ? this.letterSvc.update(this.selectedLetter.id, fd)
      : this.letterSvc.create(fd);

    const signerId = this.form.get('senderId')?.value;

    obs$.subscribe({
      next: (res: any) => {
        const id = res?.data?.letter?.id || this.selectedLetter?.id;
        // "Signing As" someone else -> send it straight to them for their
        // own approval/signature (same delegation as the sidebar Compose
        // page) instead of just recording their name — their signature
        // only ever gets stamped once THEY actually approve it.
        if (signerId && id) {
          this.letterSvc.forward(id, signerId, 'Prepared for your signature.').subscribe({
            next: () => this.finishSave('Letter sent for signature!'),
            error: () => this.finishSave(this.editMode ? 'Letter updated!' : 'Letter created!'),
          });
        } else {
          this.finishSave(this.editMode ? 'Letter updated!' : 'Letter created!');
        }
      },
      error: (err: any) => {
        this.saving = false;
        Swal.fire('Error', err?.error?.message || 'Failed to save letter.', 'error');
      },
    });
  }

  private uploadAttachmentThenFinish(letterId: string): void {
    const fd = new FormData();
    fd.append('attachment', this.attachmentFile as File);
    this.letterSvc.updateAttachment(letterId, fd).subscribe({
      next: () => this.finishSave('Letter updated!'),
      error: (err: any) => {
        this.saving = false;
        Swal.fire('Error', err?.error?.message || 'Failed to upload attachment.', 'error');
      },
    });
  }

  private finishSave(message: string): void {
    this.saving = false;
    this.currentView = 'table';
    this.load();
    Swal.fire({ icon: 'success', title: message, timer: 1800, showConfirmButton: false });
  }

  deleteLetter(l: any): void {
    Swal.fire({
      title: 'Delete Letter?',
      text: `Delete "${l.subject}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete!',
    }).then((r) => {
      if (!r.isConfirmed) return;
      this.letterSvc.deleteLetter(l.id).subscribe({
        next: () => {
          this.load();
          Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1200, showConfirmButton: false });
        },
        error: (err: any) => Swal.fire('Error', err?.error?.message || 'Failed.', 'error'),
      });
    });
  }

  // ══════════════════════════════════════════════════════════
  // WORKFLOW
  // ══════════════════════════════════════════════════════════

  submitForApproval(l: any): void {
    this.letterSvc.submit(l.id).subscribe({
      next: () => { this.load(); Swal.fire({ icon: 'success', title: 'Submitted for approval!', timer: 1500, showConfirmButton: false }); },
      error: (err: any) => Swal.fire('Error', err?.error?.message || 'Failed.', 'error'),
    });
  }

  approve(l: any): void {
    Swal.fire({
      title: 'Approve Letter?', icon: 'question', showCancelButton: true, confirmButtonText: 'Yes, approve',
    }).then((r) => {
      if (!r.isConfirmed) return;
      this.letterSvc.approve(l.id).subscribe({
        next: () => { this.load(); Swal.fire({ icon: 'success', title: 'Approved!', timer: 1500, showConfirmButton: false }); },
        error: (err: any) => Swal.fire('Error', err?.error?.message || 'Failed.', 'error'),
      });
    });
  }

  send(l: any): void {
    const ccInfo = (l.ccList || []).length ? ` na CC kwa ${l.ccList.length} watu` : '';
    Swal.fire({
      title: 'Send Letter via Email?',
      text: `Barua itatumwa kwa ${l.recipientEmail}${ccInfo}. Endelea?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#1a56db',
      confirmButtonText: 'Yes, send it',
    }).then((r) => {
      if (!r.isConfirmed) return;
      Swal.fire({ title: 'Sending...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      this.letterSvc.send(l.id).subscribe({
        next: (res: any) => {
          this.load();
          Swal.fire({ icon: 'success', title: 'Email Sent!', text: res?.message || '', timer: 3000, showConfirmButton: false });
        },
        error: (err: any) => Swal.fire('Error', err?.error?.message || 'Failed to send email.', 'error'),
      });
    });
  }

  archive(l: any): void {
    this.letterSvc.archive(l.id).subscribe({
      next: () => { this.load(); Swal.fire({ icon: 'success', title: 'Archived!', timer: 1200, showConfirmButton: false }); },
      error: (err: any) => Swal.fire('Error', err?.error?.message || 'Failed.', 'error'),
    });
  }

  // ══════════════════════════════════════════════════════════
  // PREVIEW / ATTACHMENT
  // ══════════════════════════════════════════════════════════

  openPreview(l: any): void {
    // Populate form using openEditModal first to ensure form values are loaded if user clicks Edit Form
    this.openEditModal(l);

    // Resolve CC list details dynamically from projectStakeholders
    let resolvedCcList: any[] = [];
    let ccSource = l.ccRecipients || l.ccList || [];
    if (typeof ccSource === 'string') {
      try { ccSource = JSON.parse(ccSource); } catch (e) { ccSource = []; }
    }
    if (Array.isArray(ccSource)) {
      ccSource.forEach((cc: any) => {
        if (typeof cc === 'string') {
          const match = this.projectStakeholders.find(ps => ps.stakeholder?.id === cc || ps.id === cc);
          if (match && match.stakeholder) {
            resolvedCcList.push({
              name: match.stakeholder.name,
              email: match.stakeholder.email,
              title: match.role || match.stakeholder.jobTitle,
              organization: match.stakeholder.organization
            });
          }
        } else if (cc && cc.name) {
          resolvedCcList.push(cc);
        }
      });
    }

    this.previewLetter = {
      ...l,
      ccList: resolvedCcList
    };
    this.switchView('preview');
  }

  closePreview(): void {
    this.switchView('table');
    this.previewLetter = null;
  }

  downloadAttachment(l: any): void {
    window.open(this.letterSvc.getAttachmentDownloadUrl(l.id) + '?download=true', '_blank');
  }

  canEdit(l: any): boolean { return l.status !== 'Sent'; }
  canDelete(l: any): boolean { return l.status !== 'Sent'; }
  canSubmit(l: any): boolean { return l.status === 'Draft'; }
  // "Pending Approval" is the normal self-review path — anyone with
  // approve rights may sign. "Pending Signature" means it was forwarded
  // to a SPECIFIC designated signer ("Signing As") — only that exact
  // person may sign it, otherwise whoever prepared it could sign on the
  // designated signer's behalf without them ever seeing it.
  canApprove(l: any): boolean {
    if (l.status === 'Pending Approval') return true;
    if (l.status === 'Pending Signature') {
      return !l.forwardedToId || l.forwardedToId === this.auth.currentUser()?.id;
    }
    return false;
  }
  canSend(l: any): boolean { return l.status === 'Approved'; }
  canArchive(l: any): boolean { return l.status === 'Sent'; }
}

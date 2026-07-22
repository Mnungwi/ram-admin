import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  FinanceService,
  ProjectService,
} from '../../../../../core/services/domain.services'; // rekebisha idadi ya '../'
import { SearchableSelectComponent } from '../../../../../shared/components/searchable-select/searchable-select.component'; // BADILISHA path/jina
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-budget-tab',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SearchableSelectComponent,
  ],
  templateUrl: './budget-tab.component.html',
  styleUrls: ['./budget-tab.component.css'],
})
export class BudgetTabComponent implements OnChanges {
  @Input() projectId!: string;
  @Input() overview: any = {};

  budgetCategories: any[] = [];
  upcomingPayments: any[] = [];
  topExpenses: any[] = [];
  recentPayments: any[] = [];
  loading = false;

  showModal = false;
  editMode = false;
  selectedCategory: any = null;
  form!: FormGroup;
  saving = false;

  // Detail view (View button)
  showDetailModal = false;
  loadingDetail = false;
  detail: any = null;

  // Full report
  showReportModal = false;
  loadingReport = false;
  report: any = null;

  // PDF Preview
  showPdfModal = false;
  generatingPdf = false;
  pdfPreviewUrl: SafeResourceUrl | null = null;
  private pdfBlobUrl: string | null = null;

  activityOptions: { value: string; label: string }[] = [];
  loadingActivities = false;

  constructor(
    private fb: FormBuilder,
    private financeSvc: FinanceService,
    private projectSvc: ProjectService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projectId'] && this.projectId) {
      this.loadBudget();
    }
  }

  loadBudget(): void {
    this.loading = true;
    this.financeSvc.getBudget(this.projectId).subscribe({
      next: (res: any) => {
        const data = res?.data || {};
        this.budgetCategories = data.categories || [];
        this.upcomingPayments = data.upcomingPayments || [];
        this.topExpenses = data.topExpenses || [];
        this.recentPayments = data.recentPayments || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  get totals() {
    return this.budgetCategories.reduce(
      (acc, c) => ({
        budget: acc.budget + (+c.budget || 0),
        committed: acc.committed + (+c.committed || 0),
        paid: acc.paid + (+c.paid || 0),
        balance: acc.balance + (+c.balance || 0),
      }),
      { budget: 0, committed: 0, paid: 0, balance: 0 },
    );
  }

  progressPct(paid: number, budget: number): number {
    if (!budget) return 0;
    return (+paid / +budget) * 100;
  }

  formatCurrency(amount: number): string {
    return (+amount || 0).toLocaleString();
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      Paid: 'status-completed',
      Approved: 'status-completed',
      'Partially Paid': 'status-pending',
      'Pending Approval': 'status-pending',
      Overdue: 'status-overdue',
      Open: 'status-pending',
    };
    return map[status] || 'status-pending';
  }

  // ══════════════════════════════════════════════════════════
  // BUDGET CATEGORY MODAL
  // ══════════════════════════════════════════════════════════

  loadActivities(): void {
    this.loadingActivities = true;
    this.projectSvc.getActivities(this.projectId).subscribe({
      next: (res: any) => {
        const activities =
          res?.data?.activities || res?.data?.rows || res?.data || [];
        this.activityOptions = activities
          .map((a: any) => ({
            value: a.id,
            label: (a.name || '').toString().trim(),
          }))
          .filter((o: any) => o.value && o.label);
        this.loadingActivities = false;
      },
      error: () => {
        this.loadingActivities = false;
      },
    });
  }

  openAddModal(): void {
    this.editMode = false;
    this.selectedCategory = null;
    this.form = this.fb.group({
      activityId: ['', Validators.required],
      budgetAmount: [null, [Validators.required, Validators.min(0)]],
      notes: [''],
    });
    this.loadActivities();
    this.showModal = true;
  }

  openEditModal(cat: any): void {
    this.editMode = true;
    this.selectedCategory = cat;
    this.form = this.fb.group({
      activityId: [cat.activityId || '', Validators.required],
      budgetAmount: [cat.budget, [Validators.required, Validators.min(0)]],
      notes: [cat.notes || ''],
    });
    this.loadActivities();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
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
    const payload = {
      ...this.form.value,
      id: this.editMode ? this.selectedCategory.id : undefined,
    };
    this.financeSvc.upsertBudget(this.projectId, payload).subscribe({
      next: (res: any) => {
        this.saving = false;
        this.showModal = false;
        this.loadBudget();
        Swal.fire({
          icon: 'success',
          title: res?.message || 'Budget saved!',
          timer: 1800,
          showConfirmButton: false,
        });
      },
      error: (err: any) => {
        this.saving = false;
        Swal.fire(
          'Error',
          err?.error?.message || 'Failed to save budget category.',
          'error',
        );
      },
    });
  }

  deleteCategory(cat: any): void {
    Swal.fire({
      title: 'Delete Category?',
      text: `Delete budget category "${cat.category}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete!',
    }).then((r) => {
      if (!r.isConfirmed) return;
      this.financeSvc.deleteBudgetCategory(this.projectId, cat.id).subscribe({
        next: () => {
          this.loadBudget();
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            timer: 1200,
            showConfirmButton: false,
          });
        },
        error: (err: any) =>
          Swal.fire('Error', err?.error?.message || 'Failed.', 'error'),
      });
    });
  }

  // ══════════════════════════════════════════════════════════
  // VIEW DETAIL (button "View" kwenye kila row)
  // ══════════════════════════════════════════════════════════

  viewDetail(cat: any): void {
    this.showDetailModal = true;
    this.loadingDetail = true;
    this.detail = null;
    this.financeSvc.getBudgetDetail(this.projectId, cat.id).subscribe({
      next: (res: any) => {
        this.detail = res?.data || res;
        this.loadingDetail = false;
      },
      error: (err: any) => {
        this.loadingDetail = false;
        Swal.fire(
          'Error',
          err?.error?.message || 'Failed to load details.',
          'error',
        );
      },
    });
  }

  closeDetailModal(): void {
    this.showDetailModal = false;
    this.detail = null;
  }

  // ══════════════════════════════════════════════════════════
  // FULL REPORT
  // ══════════════════════════════════════════════════════════

  generateReport(): void {
    this.showReportModal = true;
    this.loadingReport = true;
    this.report = null;
    this.financeSvc.getBudgetReport(this.projectId).subscribe({
      next: (res: any) => {
        this.report = res?.data || res;
        this.loadingReport = false;
      },
      error: (err: any) => {
        this.loadingReport = false;
        Swal.fire(
          'Error',
          err?.error?.message || 'Failed to generate report.',
          'error',
        );
      },
    });
  }

  // ══════════════════════════════════════════════════════════
  // PDF GENERATION (jsPDF + autoTable) + Preview Modal
  // ══════════════════════════════════════════════════════════

  closeReportModal(): void {
    this.showReportModal = false;
    this.report = null;
  }

  private buildPdfDocument(): jsPDF {
    const doc = new jsPDF();
    const r = this.report;
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 14;
    const contentWidth = pageWidth - marginX * 2;

    const COLORS = {
      primary: [26, 86, 219] as [number, number, number],
      green: [22, 163, 74] as [number, number, number],
      orange: [234, 88, 12] as [number, number, number],
      purple: [124, 58, 237] as [number, number, number],
      teal: [8, 145, 178] as [number, number, number],
      red: [239, 68, 68] as [number, number, number],
      gray: [107, 114, 128] as [number, number, number],
      dark: [17, 24, 39] as [number, number, number],
      lightBg: [248, 250, 252] as [number, number, number],
    };

    // ── HEADER BANNER ──────────────────────────────────────────
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, pageWidth, 32, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('PROJECT FINANCIAL REPORT', marginX, 16);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Generated on ${new Date(r.generatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} at ${new Date(r.generatedAt).toLocaleTimeString()}`,
      marginX,
      24,
    );
    doc.setTextColor(...COLORS.dark);

    let y = 42;

    // ── GRAND SUMMARY — 4 stat cards ───────────────────────────
    const cardGap = 4;
    const cardWidth = (contentWidth - cardGap * 3) / 4;
    const cards = [
      {
        label: 'TOTAL BUDGET',
        value: r.grandSummary.budget,
        color: COLORS.primary,
      },
      { label: 'TOTAL PAID', value: r.grandSummary.paid, color: COLORS.green },
      {
        label: 'TOTAL COMMITTED',
        value: r.grandSummary.committed,
        color: COLORS.purple,
      },
      {
        label: 'BALANCE',
        value: r.grandSummary.balance,
        color: r.grandSummary.balance < 0 ? COLORS.red : COLORS.orange,
      },
    ];
    cards.forEach((c, i) => {
      const x = marginX + i * (cardWidth + cardGap);
      doc.setFillColor(...COLORS.lightBg);
      doc.roundedRect(x, y, cardWidth, 22, 2, 2, 'F');
      doc.setFillColor(...c.color);
      doc.roundedRect(x, y, 1.5, 22, 0, 0, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.gray);
      doc.text(c.label, x + 5, y + 8);
      doc.setFontSize(11);
      doc.setTextColor(...COLORS.dark);
      doc.text(this.formatCurrency(c.value), x + 5, y + 16);
    });
    doc.setTextColor(...COLORS.dark);
    y += 30;

    // ── PER-ACTIVITY SECTIONS ──────────────────────────────────
    r.sections.forEach((s: any) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      // Section title band
      doc.setFillColor(...COLORS.lightBg);
      doc.rect(marginX, y, contentWidth, 10, 'F');
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.dark);
      doc.text(s.category, marginX + 3, y + 7);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const miniSummary = `Budget: ${this.formatCurrency(s.budget)}    Paid: ${this.formatCurrency(s.paid)}    Balance: ${this.formatCurrency(s.balance)}`;
      const miniWidth = doc.getTextWidth(miniSummary);
      doc.setTextColor(...COLORS.gray);
      doc.text(miniSummary, marginX + contentWidth - miniWidth - 3, y + 7);
      doc.setTextColor(...COLORS.dark);
      y += 14;

      const tableDefaults = {
        margin: { left: marginX, right: marginX },
        styles: { fontSize: 8, cellPadding: 2.5, textColor: COLORS.dark },
        alternateRowStyles: {
          fillColor: [249, 250, 251] as [number, number, number],
        },
        headStyles: {
          fontSize: 7.5,
          fontStyle: 'bold' as const,
          textColor: 255,
        },
      };

      if (s.invoices?.length) {
        autoTable(doc, {
          ...tableDefaults,
          startY: y,
          head: [['Invoice No.', 'Supplier', 'Date', 'Amount', 'Paid']],
          body: s.invoices.map((i: any) => [
            i.invoiceNo,
            i.supplier?.name || '—',
            this.fmtDate(i.date),
            this.formatCurrency(i.amount),
            this.formatCurrency(i.paidAmount),
          ]),
          headStyles: { ...tableDefaults.headStyles, fillColor: COLORS.purple },
          columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' } },
        });
        y = (doc as any).lastAutoTable.finalY + 5;
      }

      if (s.payments?.length) {
        autoTable(doc, {
          ...tableDefaults,
          startY: y,
          head: [['Description', 'Paid To', 'Date', 'Amount']],
          body: s.payments.map((p: any) => [
            p.description,
            p.paidTo?.name || '—',
            this.fmtDate(p.date),
            this.formatCurrency(p.amount),
          ]),
          headStyles: { ...tableDefaults.headStyles, fillColor: COLORS.green },
          columnStyles: { 3: { halign: 'right' } },
        });
        y = (doc as any).lastAutoTable.finalY + 5;
      }

      if (s.expenses?.length) {
        autoTable(doc, {
          ...tableDefaults,
          startY: y,
          head: [['Description', 'Date', 'Amount']],
          body: s.expenses.map((e: any) => [
            e.description,
            this.fmtDate(e.date),
            this.formatCurrency(e.amount),
          ]),
          headStyles: { ...tableDefaults.headStyles, fillColor: COLORS.orange },
          columnStyles: { 2: { halign: 'right' } },
        });
        y = (doc as any).lastAutoTable.finalY + 5;
      }

      if (s.lpos?.length) {
        autoTable(doc, {
          ...tableDefaults,
          startY: y,
          head: [['LPO No.', 'Date', 'Total', 'Invoice Status']],
          body: s.lpos.map((l: any) => [
            l.lpoNo,
            this.fmtDate(l.date),
            this.formatCurrency(l.total),
            l.linkedInvoices?.length
              ? `${this.formatCurrency(l.invoicedPaid)} paid of ${this.formatCurrency(l.invoicedTotal)} invoiced`
              : 'Not yet invoiced',
          ]),
          headStyles: { ...tableDefaults.headStyles, fillColor: COLORS.teal },
          columnStyles: { 2: { halign: 'right' } },
        });
        y = (doc as any).lastAutoTable.finalY + 5;
      }

      if (
        !s.invoices?.length &&
        !s.payments?.length &&
        !s.expenses?.length &&
        !s.lpos?.length
      ) {
        doc.setFontSize(8);
        doc.setTextColor(...COLORS.gray);
        doc.text('No transactions recorded for this category.', marginX + 3, y);
        doc.setTextColor(...COLORS.dark);
        y += 8;
      }

      y += 6;
    });

    // ── FOOTER (page numbers on every page) ────────────────────
    const pageCount = (doc as any).internal.getNumberOfPages
      ? (doc as any).internal.getNumberOfPages()
      : (doc as any).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setDrawColor(229, 231, 235);
      doc.line(marginX, pageHeight - 14, pageWidth - marginX, pageHeight - 14);
      doc.setFontSize(7.5);
      doc.setTextColor(...COLORS.gray);
      doc.text(
        'Generated by RAM Project Management System',
        marginX,
        pageHeight - 8,
      );
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth - marginX,
        pageHeight - 8,
        { align: 'right' },
      );
    }

    return doc;
  }

  private fmtDate(d: string): string {
    if (!d) return '—';
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  openPdfPreview(): void {
    if (!this.report) return;
    this.generatingPdf = true;

    // setTimeout inaruhusu spinner ionekane kabla ya ku-block thread na jsPDF
    setTimeout(() => {
      const doc = this.buildPdfDocument();
      const blob = doc.output('blob');
      this.pdfBlobUrl = URL.createObjectURL(blob);
      this.pdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        this.pdfBlobUrl,
      );
      this.generatingPdf = false;
      this.showPdfModal = true;
    }, 50);
  }

  downloadPdf(): void {
    const doc = this.buildPdfDocument();
    const filename = `financial-report-${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
  }

  closePdfModal(): void {
    this.showPdfModal = false;
    if (this.pdfBlobUrl) {
      URL.revokeObjectURL(this.pdfBlobUrl);
      this.pdfBlobUrl = null;
    }
    this.pdfPreviewUrl = null;
  }
}

import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FinanceService, StorekeeperService } from '../../../../../core/services/domain.services';
import { AuthService } from '../../../../../core/services/auth.service';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Chart, registerables } from 'chart.js';
import * as XLSX from 'xlsx';

Chart.register(...registerables);

@Component({
  selector: 'app-site-fund-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './site-fund-tab.component.html',
  styleUrls: ['./site-fund-tab.component.css'],
})
export class SiteFundTabComponent implements OnChanges, OnDestroy {
  @Input() projectId!: string;

  storekeepers: any[] = [];
  selectedStorekeeperId = '';
  loading = false;

  // Overview (all storekeepers)
  overviewList: any[] = [];

  // Detail (one storekeeper selected)
  detail: any = null;

  filters = { dateFrom: '', dateTo: '' };

  showModal = false;
  saving = false;
  form!: FormGroup;

  showSummary = false;
  loadingSummary = false;
  summary: any = null;

  private breakdownChart: Chart | null = null;

  constructor(
    private fb: FormBuilder,
    private financeSvc: FinanceService,
    private storekeeperSvc: StorekeeperService,
    private sanitizer: DomSanitizer,
    public auth: AuthService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projectId'] && this.projectId) {
      this.loadStorekeepers();
      this.loadOverview();
    }
  }

  ngOnDestroy(): void {
    this.breakdownChart?.destroy();
  }

  loadStorekeepers(): void {
    this.storekeeperSvc.getProjectStorekeepers(this.projectId).subscribe({
      next: (res: any) => {
        // Each item is a ProjectStorekeeper assignment — the actual person is `.user`
        this.storekeepers = res?.data?.storekeepers || [];
      },
    });
  }

  loadOverview(): void {
    this.loading = true;
    this.financeSvc.getSiteFundBalance(this.projectId, this.filters).subscribe({
      next: (res: any) => {
        this.overviewList = res?.data?.storekeepers || [];
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  onFilterChange(): void {
    this.loadOverview();
    if (this.selectedStorekeeperId) this.loadDetail();
  }

  selectStorekeeper(id: string): void {
    this.selectedStorekeeperId = id;
    if (id) this.loadDetail();
    else this.detail = null;
  }

  loadDetail(): void {
    this.loading = true;
    this.financeSvc.getSiteFundBalance(this.projectId, {
      ...this.filters,
      storekeeperUserId: this.selectedStorekeeperId,
    }).subscribe({
      next: (res: any) => {
        const list = res?.data?.storekeepers || [];
        this.detail = list[0] || null;
        this.loading = false;
        setTimeout(() => this.renderBreakdownChart(), 0);
      },
      error: () => { this.loading = false; },
    });
  }

  private renderBreakdownChart(): void {
    const el = document.getElementById('siteFundBreakdownChart') as HTMLCanvasElement;
    if (!el || !this.detail) return;

    this.breakdownChart?.destroy();
    try {
      const existing = Chart.getChart(el);
      if (existing) existing.destroy();
    } catch (e) {}

    const breakdown = this.detail.expenseBreakdown || [];
    const colors = ['#1a56db', '#16a34a', '#ea580c', '#7c3aed', '#0891b2', '#dc2626', '#64748b'];

    this.breakdownChart = new Chart(el, {
      type: 'doughnut',
      data: {
        labels: breakdown.map((b: any) => b.category),
        datasets: [{
          data: breakdown.map((b: any) => b.amount),
          backgroundColor: breakdown.map((_: any, i: number) => colors[i % colors.length]),
          borderWidth: 0,
        }],
      },
      options: {
        cutout: '65%',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'right' } },
      },
    });
  }

  formatCurrency(amount: number): string {
    return (+amount || 0).toLocaleString();
  }

  fmtDate(d: string): string {
    if (!d) return '—';
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // ══════════════════════════════════════════════════════════
  // FULL SUMMARY REPORT — Received → Materials → Payments
  // ══════════════════════════════════════════════════════════

  openSummary(): void {
    this.showSummary = true;
    this.loadSummary();
  }

  closeSummary(): void {
    this.showSummary = false;
    this.summary = null;
  }

  siteFundBalance(): number {
    if (!this.summary) return 0;
    return +(this.summary.received.total - this.summary.materials.total - this.summary.labour.total).toFixed(2);
  }

  loadSummary(): void {
    this.loadingSummary = true;
    this.financeSvc.getSiteFundSummary(this.projectId, this.filters).subscribe({
      next: (res: any) => {
        this.summary = res?.data || null;
        this.loadingSummary = false;
      },
      error: () => { this.loadingSummary = false; },
    });
  }

  private periodLabel(): string {
    if (!this.filters.dateFrom && !this.filters.dateTo) return 'All time';
    return `${this.filters.dateFrom || 'start'} to ${this.filters.dateTo || 'now'}`;
  }

  exportSummaryExcel(): void {
    if (!this.summary) return;
    const s = this.summary;
    const wb = XLSX.utils.book_new();

    const summaryRows = [
      { Item: 'Money Received', Amount: +s.received.total },
      { Item: 'Materials — Subtotal', Amount: +s.materials.total },
      { Item: 'Labour — Subtotal', Amount: +s.labour.total },
      { Item: 'Site Fund Balance (Received − Materials − Labour)', Amount: this.siteFundBalance() },
      { Item: '', Amount: '' },
      { Item: 'Payments — Subtotal (separate cash flow)', Amount: +s.payments.total },
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'Summary');

    const receivedRows = (s.received.items || []).map((d: any) => ({
      Date: this.fmtDate(d.date),
      Storekeeper: `${d.storekeeper?.firstName || ''} ${d.storekeeper?.lastName || ''}`.trim(),
      Amount: +d.amount,
      Method: d.method,
      'Disbursed By': d.disbursedBy ? `${d.disbursedBy.firstName} ${d.disbursedBy.lastName}` : '',
    }));
    receivedRows.push({ Date: '', Storekeeper: 'TOTAL', Amount: +s.received.total, Method: '', 'Disbursed By': '' } as any);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(receivedRows), 'Money Received');

    const materialsRows = (s.materials.items || []).map((e: any) => ({
      Date: this.fmtDate(e.date),
      Description: e.description,
      Category: e.category?.name || '',
      'Spent By': e.createdBy ? `${e.createdBy.firstName} ${e.createdBy.lastName}` : '',
      Amount: +e.amount,
    }));
    materialsRows.push({ Date: '', Description: '', Category: '', 'Spent By': 'TOTAL', Amount: +s.materials.total } as any);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(materialsRows), 'Materials');

    const labourRows = (s.labour.items || []).map((l: any) => ({
      Date: this.fmtDate(l.date),
      Description: l.description,
      'Spent By': l.createdBy ? `${l.createdBy.firstName} ${l.createdBy.lastName}` : '',
      Amount: +l.amount,
    }));
    labourRows.push({ Date: '', Description: '', 'Spent By': 'TOTAL', Amount: +s.labour.total } as any);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(labourRows), 'Labour');

    const paymentsRows = (s.payments.items || []).map((p: any) => ({
      Date: this.fmtDate(p.date),
      Description: p.description,
      'Paid To': p.paidTo?.name || '',
      Status: p.status,
      Amount: +p.amount,
    }));
    paymentsRows.push({ Date: '', Description: '', 'Paid To': '', Status: 'TOTAL', Amount: +s.payments.total } as any);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(paymentsRows), 'Payments');

    XLSX.writeFile(wb, `site-fund-summary-${this.projectId}-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  exportSummaryPdf(): void {
    if (!this.summary) return;
    const s = this.summary;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 14;
    const contentWidth = pageWidth - marginX * 2;

    const COLORS = {
      green: [22, 163, 74] as [number, number, number],
      orange: [234, 88, 12] as [number, number, number],
      purple: [124, 58, 237] as [number, number, number],
      blue: [37, 99, 235] as [number, number, number],
      gray: [107, 114, 128] as [number, number, number],
      dark: [17, 24, 39] as [number, number, number],
      lightBg: [248, 250, 252] as [number, number, number],
    };

    doc.setFillColor(17, 24, 39);
    doc.rect(0, 0, pageWidth, 32, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('SITE FUND SUMMARY REPORT', marginX, 16);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`${s.project?.name || ''}  —  Period: ${this.periodLabel()}`, marginX, 24);
    doc.setTextColor(...COLORS.dark);

    let y = 42;
    const cardGap = 4;
    const balance = this.siteFundBalance();
    const cardWidth = (contentWidth - cardGap * 3) / 4;
    const cards = [
      { label: 'MONEY RECEIVED', value: s.received.total, color: COLORS.green },
      { label: 'MATERIALS — SUBTOTAL', value: s.materials.total, color: COLORS.orange },
      { label: 'LABOUR — SUBTOTAL', value: s.labour.total, color: COLORS.purple },
      { label: 'SITE FUND BALANCE', value: balance, color: balance < 0 ? [220, 38, 38] as [number, number, number] : COLORS.blue },
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
      doc.setFontSize(12);
      doc.setTextColor(...COLORS.dark);
      doc.text(this.formatCurrency(c.value), x + 5, y + 17);
    });
    doc.setTextColor(...COLORS.dark);
    y += 26;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...COLORS.gray);
    doc.text(
      `Balance = Received - Materials - Labour (cash still held by storekeepers). Payments (${this.formatCurrency(s.payments.total)} TZS) is a separate cash flow — see section 4.`,
      marginX, y,
    );
    doc.setTextColor(...COLORS.dark);
    y += 10;

    const tableDefaults = {
      margin: { left: marginX, right: marginX },
      styles: { fontSize: 8, cellPadding: 2.5, textColor: COLORS.dark },
      alternateRowStyles: { fillColor: [249, 250, 251] as [number, number, number] },
      headStyles: { fontSize: 7.5, fontStyle: 'bold' as const, textColor: 255 },
    };

    const addSectionTitle = (title: string) => {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(title, marginX, y);
      y += 6;
    };

    addSectionTitle('1. Money Received');
    autoTable(doc, {
      ...tableDefaults,
      startY: y,
      head: [['Date', 'Storekeeper', 'Amount', 'Method', 'Disbursed By']],
      body: (s.received.items || []).map((d: any) => [
        this.fmtDate(d.date),
        `${d.storekeeper?.firstName || ''} ${d.storekeeper?.lastName || ''}`,
        this.formatCurrency(d.amount),
        d.method,
        d.disbursedBy ? `${d.disbursedBy.firstName} ${d.disbursedBy.lastName}` : '—',
      ]),
      headStyles: { ...tableDefaults.headStyles, fillColor: COLORS.green },
      foot: [['', 'Subtotal', this.formatCurrency(s.received.total), '', '']],
      footStyles: { fontStyle: 'bold' as const, fillColor: [241, 245, 249] as [number, number, number], textColor: COLORS.dark },
      columnStyles: { 2: { halign: 'right' } },
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    addSectionTitle('2. Materials (Expenses)');
    autoTable(doc, {
      ...tableDefaults,
      startY: y,
      head: [['Date', 'Description', 'Category', 'Amount']],
      body: (s.materials.items || []).map((e: any) => [
        this.fmtDate(e.date),
        e.description,
        e.category?.name || '—',
        this.formatCurrency(e.amount),
      ]),
      headStyles: { ...tableDefaults.headStyles, fillColor: COLORS.orange },
      foot: [['', '', 'Subtotal', this.formatCurrency(s.materials.total)]],
      footStyles: { fontStyle: 'bold' as const, fillColor: [241, 245, 249] as [number, number, number], textColor: COLORS.dark },
      columnStyles: { 3: { halign: 'right' } },
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    if (y > 240) { doc.addPage(); y = 20; }
    addSectionTitle('3. Labour');
    autoTable(doc, {
      ...tableDefaults,
      startY: y,
      head: [['Date', 'Description', 'Spent By', 'Amount']],
      body: (s.labour.items || []).map((l: any) => [
        this.fmtDate(l.date),
        l.description,
        l.createdBy ? `${l.createdBy.firstName} ${l.createdBy.lastName}` : '—',
        this.formatCurrency(l.amount),
      ]),
      headStyles: { ...tableDefaults.headStyles, fillColor: COLORS.purple },
      foot: [['', '', 'Subtotal', this.formatCurrency(s.labour.total)]],
      footStyles: { fontStyle: 'bold' as const, fillColor: [241, 245, 249] as [number, number, number], textColor: COLORS.dark },
      columnStyles: { 3: { halign: 'right' } },
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    if (y > 240) { doc.addPage(); y = 20; }
    addSectionTitle('4. Payments');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...COLORS.gray);
    const noteLines = doc.splitTextToSize(
      'Different from Materials/Labour above: these are formal payments to contractors/suppliers approved through the Finance workflow — not cash spent by a storekeeper from the site fund.',
      contentWidth,
    );
    doc.text(noteLines, marginX, y);
    doc.setTextColor(...COLORS.dark);
    y += noteLines.length * 3.5 + 4;

    autoTable(doc, {
      ...tableDefaults,
      startY: y,
      head: [['Date', 'Description', 'Paid To', 'Status', 'Amount']],
      body: (s.payments.items || []).map((p: any) => [
        this.fmtDate(p.date),
        p.description,
        p.paidTo?.name || '—',
        p.status,
        this.formatCurrency(p.amount),
      ]),
      headStyles: { ...tableDefaults.headStyles, fillColor: COLORS.blue },
      foot: [['', '', '', 'Subtotal', this.formatCurrency(s.payments.total)]],
      footStyles: { fontStyle: 'bold' as const, fillColor: [241, 245, 249] as [number, number, number], textColor: COLORS.dark },
      columnStyles: { 4: { halign: 'right' } },
    });

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
      doc.text('Generated by RAM Project Management System', marginX, pageHeight - 8);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - marginX, pageHeight - 8, { align: 'right' });
    }

    doc.save(`site-fund-summary-${this.projectId}-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  // ══════════════════════════════════════════════════════════
  // ADD "MONEY RECEIVED" (disbursement)
  // ══════════════════════════════════════════════════════════

  openAddModal(): void {
    this.form = this.fb.group({
      storekeeperUserId: [this.selectedStorekeeperId || '', Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
      date: [new Date().toISOString().split('T')[0], Validators.required],
      method: ['cash'],
      referenceNo: [''],
      notes: [''],
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  get f() { return this.form.controls; }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.financeSvc.createSiteFundDisbursement(this.projectId, this.form.value).subscribe({
      next: (res: any) => {
        this.saving = false;
        this.showModal = false;
        this.loadOverview();
        if (this.selectedStorekeeperId) this.loadDetail();
        Swal.fire({ icon: 'success', title: res?.message || 'Funds recorded!', timer: 1800, showConfirmButton: false });
      },
      error: (err: any) => {
        this.saving = false;
        Swal.fire('Error', err?.error?.message || 'Failed to record funds.', 'error');
      },
    });
  }

  deleteDisbursement(d: any): void {
    Swal.fire({
      title: 'Delete this entry?',
      text: `Remove the ${this.formatCurrency(d.amount)} TZS disbursement dated ${this.fmtDate(d.date)}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete!',
    }).then((r) => {
      if (!r.isConfirmed) return;
      this.financeSvc.deleteSiteFundDisbursement(this.projectId, d.id).subscribe({
        next: () => {
          this.loadOverview();
          if (this.selectedStorekeeperId) this.loadDetail();
          Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1200, showConfirmButton: false });
        },
        error: (err: any) => Swal.fire('Error', err?.error?.message || 'Failed.', 'error'),
      });
    });
  }

  // ══════════════════════════════════════════════════════════
  // PRINTABLE REPORT (jsPDF) — same visual language as the Budget report
  // ══════════════════════════════════════════════════════════

  private buildPdfDocument(): jsPDF {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 14;
    const contentWidth = pageWidth - marginX * 2;
    const d = this.detail;
    const sk = d.storekeeper;

    const COLORS = {
      primary: [26, 86, 219] as [number, number, number],
      green: [22, 163, 74] as [number, number, number],
      orange: [234, 88, 12] as [number, number, number],
      purple: [124, 58, 237] as [number, number, number],
      red: [239, 68, 68] as [number, number, number],
      gray: [107, 114, 128] as [number, number, number],
      dark: [17, 24, 39] as [number, number, number],
      lightBg: [248, 250, 252] as [number, number, number],
    };

    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, pageWidth, 32, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('SITE FUND REPORT', marginX, 16);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const period = this.filters.dateFrom || this.filters.dateTo
      ? `Period: ${this.filters.dateFrom || 'start'} to ${this.filters.dateTo || 'now'}`
      : 'Period: All time';
    doc.text(`${sk.firstName} ${sk.lastName}  —  ${period}`, marginX, 24);
    doc.setTextColor(...COLORS.dark);

    let y = 42;
    const cardGap = 4;
    const cardWidth = (contentWidth - cardGap * 2) / 3;
    const cards = [
      { label: 'RECEIVED', value: d.received, color: COLORS.green },
      { label: 'SPENT', value: d.spent, color: COLORS.orange },
      { label: 'BALANCE', value: d.balance, color: d.balance < 0 ? COLORS.red : COLORS.primary },
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
      doc.setFontSize(12);
      doc.setTextColor(...COLORS.dark);
      doc.text(this.formatCurrency(c.value), x + 5, y + 17);
    });
    doc.setTextColor(...COLORS.dark);
    y += 32;

    const tableDefaults = {
      margin: { left: marginX, right: marginX },
      styles: { fontSize: 8, cellPadding: 2.5, textColor: COLORS.dark },
      alternateRowStyles: { fillColor: [249, 250, 251] as [number, number, number] },
      headStyles: { fontSize: 7.5, fontStyle: 'bold' as const, textColor: 255 },
    };

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Money Received', marginX, y);
    y += 6;
    autoTable(doc, {
      ...tableDefaults,
      startY: y,
      head: [['Date', 'Amount', 'Method', 'Reference', 'Disbursed By']],
      body: (d.disbursements || []).map((r: any) => [
        this.fmtDate(r.date),
        this.formatCurrency(r.amount),
        r.method,
        r.referenceNo || '—',
        r.disbursedBy ? `${r.disbursedBy.firstName} ${r.disbursedBy.lastName}` : '—',
      ]),
      headStyles: { ...tableDefaults.headStyles, fillColor: COLORS.green },
      foot: [['', 'Subtotal', this.formatCurrency(d.received), '', '']],
      footStyles: { fontStyle: 'bold' as const, fillColor: [241, 245, 249] as [number, number, number], textColor: COLORS.dark },
      columnStyles: { 1: { halign: 'right' } },
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Materials', marginX, y);
    y += 6;
    autoTable(doc, {
      ...tableDefaults,
      startY: y,
      head: [['Date', 'Description', 'Category', 'Amount']],
      body: (d.materials?.items || []).map((e: any) => [
        this.fmtDate(e.date),
        e.description,
        e.category?.name || '—',
        this.formatCurrency(e.amount),
      ]),
      headStyles: { ...tableDefaults.headStyles, fillColor: COLORS.orange },
      foot: [['', '', 'Subtotal', this.formatCurrency(d.materials?.total || 0)]],
      footStyles: { fontStyle: 'bold' as const, fillColor: [241, 245, 249] as [number, number, number], textColor: COLORS.dark },
      columnStyles: { 3: { halign: 'right' } },
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Labour', marginX, y);
    y += 6;
    autoTable(doc, {
      ...tableDefaults,
      startY: y,
      head: [['Date', 'Description', 'Amount']],
      body: (d.labour?.items || []).map((l: any) => [
        this.fmtDate(l.date),
        l.description,
        this.formatCurrency(l.amount),
      ]),
      headStyles: { ...tableDefaults.headStyles, fillColor: COLORS.purple },
      foot: [
        ['', 'Subtotal', this.formatCurrency(d.labour?.total || 0)],
        ['', 'Balance (Received − Materials − Labour)', this.formatCurrency(d.balance)],
      ],
      footStyles: { fontStyle: 'bold' as const, fillColor: [241, 245, 249] as [number, number, number], textColor: COLORS.dark },
      columnStyles: { 2: { halign: 'right' } },
    });

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
      doc.text('Generated by RAM Project Management System', marginX, pageHeight - 8);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - marginX, pageHeight - 8, { align: 'right' });
    }

    return doc;
  }

  printReport(): void {
    if (!this.detail) return;
    const doc = this.buildPdfDocument();
    doc.autoPrint();
    window.open(doc.output('bloburl') as any, '_blank');
  }

  downloadReport(): void {
    if (!this.detail) return;
    const doc = this.buildPdfDocument();
    const name = `${this.detail.storekeeper.firstName}-${this.detail.storekeeper.lastName}`.toLowerCase();
    doc.save(`site-fund-${name}-${new Date().toISOString().slice(0, 10)}.pdf`);
  }
}

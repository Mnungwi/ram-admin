import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { SupplierService, ProductService, ProjectService } from '../../../core/services/domain.services';
import { CurrencyShortPipe } from 'src/app/theme/pipes/currency-short.pipe';
import { loadCompanyLogo, drawLetterhead, drawFooterOnAllPages } from '../../../shared/utils/pdf-letterhead';
import { SearchableSelectComponent, SelectOption } from '../../../shared/components/searchable-select/searchable-select.component';

@Component({
  selector: 'app-supplier-ledger',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CurrencyShortPipe, SearchableSelectComponent],
  templateUrl: './supplier-ledger.component.html',
  styleUrls: ['./supplier-ledger.component.css'],
})
export class SupplierLedgerComponent implements OnInit {
  supplierId = '';
  loading = false;

  supplier: any = null;
  items: any[] = [];
  invoices: any[] = [];
  summary: any = null;

  projects: any[] = [];
  products: any[] = [];
  projectOptions: SelectOption[] = [];
  productOptions: SelectOption[] = [];

  projectId = '';
  productId = '';
  startDate = '';
  endDate = '';

  constructor(
    private route: ActivatedRoute,
    private svc: SupplierService,
    private productSvc: ProductService,
    private projectSvc: ProjectService,
  ) {}

  ngOnInit(): void {
    this.supplierId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.supplierId) return;

    loadCompanyLogo();
    this.load();
    this.projectSvc.getAll({ limit: 1000 }).subscribe({
      next: (res: any) => {
        this.projects = res.data || [];
        this.projectOptions = this.projects.map((p) => ({
          value: p.id,
          label: p.projectCode && p.name ? `${p.projectCode} — ${p.name}` : (p.name || p.projectCode),
        }));
      },
      error: () => {},
    });
    this.productSvc.getAll().subscribe({
      next: (res: any) => {
        this.products = res.data?.products || res.data || [];
        this.productOptions = this.products.map((p: any) => ({
          value: p.id,
          label: p.name,
          sublabel: p.code || '',
        }));
      },
      error: () => {},
    });
  }

  onProjectFilterChange(val: any): void {
    this.projectId = val || '';
  }

  onProductFilterChange(val: any): void {
    this.productId = val || '';
  }

  load(): void {
    this.loading = true;
    const params: any = {};
    if (this.projectId) params.projectId = this.projectId;
    if (this.productId) params.productId = this.productId;
    if (this.startDate) params.startDate = this.startDate;
    if (this.endDate) params.endDate = this.endDate;

    this.svc.getLedger(this.supplierId, params).subscribe({
      next: (res: any) => {
        this.supplier = res.data?.supplier;
        this.items = res.data?.items || [];
        this.invoices = res.data?.invoices || [];
        this.summary = res.data?.summary;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  applyFilters(): void {
    this.load();
  }

  clearFilters(): void {
    this.projectId = '';
    this.productId = '';
    this.startDate = '';
    this.endDate = '';
    this.load();
  }

  fmtDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatCurrency(v: any): string {
    const n = Number(v) || 0;
    return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  getInvoiceStatusClass(status: string): string {
    switch ((status || '').toLowerCase()) {
      case 'paid': return 'status-active';
      case 'partial': return 'status-on-hold';
      case 'overdue': return 'status-overdue';
      default: return 'status-pending';
    }
  }

  // "Balance Owed" = what WE still owe THIS supplier: every invoice's
  // amount minus what's actually been paid against it so far (unpaid +
  // partially-paid invoices only — a fully-paid invoice has balance 0).
  getOutstandingInvoices(): any[] {
    return this.invoices.filter((inv) => (inv.balance || 0) > 0);
  }

  // Which delivered items a given (unpaid) invoice actually covers — matched
  // by LPO, since an Invoice optionally references the LPO it was raised
  // against (lpoId). An invoice raised independently of any LPO has no
  // items to show here; its own description is the only detail available.
  getItemsForInvoice(inv: any): any[] {
    if (!inv?.lpoId) return [];
    return this.items.filter((i) => i.lpoId === inv.lpoId);
  }

  // ── Excel / CSV export ──────────────────────────────────────
  exportExcel(): void {
    const wb = XLSX.utils.book_new();

    const summarySheet = XLSX.utils.aoa_to_sheet([
      ['Supplier Ledger', this.supplier?.name || ''],
      ['Generated', new Date().toLocaleString()],
      [],
      ['Total Supplied (TZS)', this.summary?.totalSupplied ?? 0],
      ['Total Invoiced (TZS)', this.summary?.totalInvoiced ?? 0],
      ['Total Paid (TZS)', this.summary?.totalPaid ?? 0],
      ['Balance Owed (TZS)', this.summary?.balance ?? 0],
    ]);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

    const itemRows = this.items.map((i) => ({
      Date: this.fmtDate(i.date),
      'LPO No': i.lpoNo,
      Project: i.project?.name || '—',
      Product: i.product?.name || i.description,
      Description: i.description,
      Unit: i.unit || '',
      Quantity: i.quantity,
      'Qty Received': i.quantityReceived,
      'Unit Price': i.unitPrice,
      Amount: i.amount,
      Status: i.status,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(itemRows), 'Items Supplied');

    const paymentRows: any[] = [];
    for (const inv of this.invoices) {
      if (!inv.paymentHistory?.length) {
        paymentRows.push({
          'Invoice No': inv.invoiceNo,
          Date: this.fmtDate(inv.date),
          Project: inv.project?.name || '—',
          'Invoice Amount': inv.amount,
          'Payment Date': '',
          'Payment Amount': '',
          Notes: '(no payments recorded yet)',
        });
      } else {
        for (const p of inv.paymentHistory) {
          paymentRows.push({
            'Invoice No': inv.invoiceNo,
            Date: this.fmtDate(inv.date),
            Project: inv.project?.name || '—',
            'Invoice Amount': inv.amount,
            'Payment Date': this.fmtDate(p.date),
            'Payment Amount': p.amount,
            Notes: p.notes || '',
          });
        }
      }
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(paymentRows), 'Payments');

    XLSX.writeFile(wb, `supplier-ledger-${this.supplier?.name || this.supplierId}-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  // ── PDF export ───────────────────────────────────────────────
  async downloadPdf(): Promise<void> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 14;
    const contentWidth = pageWidth - marginX * 2;

    const COLORS = {
      green: [22, 163, 74] as [number, number, number],
      blue: [37, 99, 235] as [number, number, number],
      gray: [107, 114, 128] as [number, number, number],
      dark: [17, 24, 39] as [number, number, number],
      lightBg: [248, 250, 252] as [number, number, number],
      red: [220, 38, 38] as [number, number, number],
    };

    const logo = await loadCompanyLogo();
    let y = drawLetterhead(doc, {
      title: 'SUPPLIER LEDGER',
      subtitle: `${this.supplier?.name || ''}${this.supplier?.phone ? '  —  ' + this.supplier.phone : ''}`,
      logoDataUrl: logo,
    });
    doc.setTextColor(...COLORS.dark);

    const cardGap = 4;
    const cardWidth = (contentWidth - cardGap * 3) / 4;
    const cards = [
      { label: 'TOTAL SUPPLIED', value: this.summary?.totalSupplied || 0, color: COLORS.blue },
      { label: 'TOTAL INVOICED', value: this.summary?.totalInvoiced || 0, color: COLORS.gray },
      { label: 'TOTAL PAID', value: this.summary?.totalPaid || 0, color: COLORS.green },
      { label: 'BALANCE OWED', value: this.summary?.balance || 0, color: (this.summary?.balance || 0) > 0 ? COLORS.red : COLORS.green },
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
    y += 30;

    const tableDefaults = {
      margin: { left: marginX, right: marginX },
      styles: { fontSize: 7.5, cellPadding: 2.5, textColor: COLORS.dark },
      alternateRowStyles: { fillColor: [249, 250, 251] as [number, number, number] },
      headStyles: { fontSize: 7, fontStyle: 'bold' as const, textColor: 255 },
    };

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Items Supplied', marginX, y);
    y += 6;
    autoTable(doc, {
      ...tableDefaults,
      startY: y,
      head: [['Date', 'LPO No', 'Project', 'Product', 'Qty', 'Unit Price', 'Amount']],
      body: this.items.map((i) => [
        this.fmtDate(i.date),
        i.lpoNo,
        i.project?.name || '—',
        i.product?.name || i.description,
        `${i.quantity} ${i.unit || ''}`,
        this.formatCurrency(i.unitPrice),
        this.formatCurrency(i.amount),
      ]),
      headStyles: { ...tableDefaults.headStyles, fillColor: COLORS.blue },
      foot: [['', '', '', '', '', 'Total', this.formatCurrency(this.summary?.totalSupplied || 0)]],
      footStyles: { fontStyle: 'bold' as const, fillColor: [241, 245, 249] as [number, number, number], textColor: COLORS.dark },
      columnStyles: { 5: { halign: 'right' }, 6: { halign: 'right' } },
    });
    y = (doc as any).lastAutoTable.finalY + 10;

    if (y > 230) { doc.addPage(); y = 20; }
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Invoices & Payments', marginX, y);
    y += 6;
    autoTable(doc, {
      ...tableDefaults,
      startY: y,
      head: [['Invoice No', 'Date', 'Project', 'Status', 'Amount', 'Paid', 'Balance']],
      body: this.invoices.map((inv) => [
        inv.invoiceNo,
        this.fmtDate(inv.date),
        inv.project?.name || '—',
        inv.status,
        this.formatCurrency(inv.amount),
        this.formatCurrency(inv.paid),
        this.formatCurrency(inv.balance),
      ]),
      headStyles: { ...tableDefaults.headStyles, fillColor: COLORS.green },
      foot: [['', '', '', 'Total', this.formatCurrency(this.summary?.totalInvoiced || 0), this.formatCurrency(this.summary?.totalPaid || 0), this.formatCurrency(this.summary?.balance || 0)]],
      footStyles: { fontStyle: 'bold' as const, fillColor: [241, 245, 249] as [number, number, number], textColor: COLORS.dark },
      columnStyles: { 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' } },
    });

    drawFooterOnAllPages(doc);
    doc.save(`supplier-ledger-${this.supplier?.name || this.supplierId}-${new Date().toISOString().slice(0, 10)}.pdf`);
  }
}

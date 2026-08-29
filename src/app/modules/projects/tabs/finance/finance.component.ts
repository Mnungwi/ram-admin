import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FinanceService } from '../../../../core/services/domain.services'; // rekebisha idadi ya '../'

import { BudgetTabComponent } from './budget-tab/budget-tab.component';
import { PaymentsTabComponent } from './payments-tab/payments-tab.component';
import { InvoicesTabComponent } from './invoices-tab/invoices-tab.component';
import { ExpensesTabComponent } from './expenses-tab/expenses-tab.component';
import { RetentionTabComponent } from './retention-tab/retention-tab.component';
import { TaxesTabComponent } from './taxes-tab/taxes-tab.component';
import { FundingSourcesTabComponent } from './funding-sources-tab/funding-sources-tab.component';
import { SiteFundTabComponent } from './site-fund-tab/site-fund-tab.component';

type FinanceTab = 'budget' | 'payments' | 'invoices' | 'expenses' | 'retention' | 'taxes' | 'funding' | 'sitefund';

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [
    CommonModule,
    BudgetTabComponent,
    PaymentsTabComponent,
    InvoicesTabComponent,
    ExpensesTabComponent,
    RetentionTabComponent,
    TaxesTabComponent,
    FundingSourcesTabComponent,
    SiteFundTabComponent,
  ],
  templateUrl: './finance.component.html',
  styleUrls: ['./finance.component.css'],
})
export class FinanceComponent implements OnInit {
  projectId = '';

  activeTab: FinanceTab = 'budget';
  overview: any = {};
  loadingOverview = false;

  constructor(
    private route: ActivatedRoute,
    private financeSvc: FinanceService,
  ) {}

  ngOnInit(): void {
    // Finance ni routed child component (router-outlet), sio [projectId]
    // binding — hivyo :id inatoka kwenye parent route (project-detail).
    const parent = this.route.parent;
    if (!parent) {
      console.error('FinanceComponent: hakuna parent route — hakiwezi kupata projectId');
      return;
    }
    parent.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.projectId = id;
        this.loadOverview();
      }
    });
  }

  setTab(tab: FinanceTab): void {
    this.activeTab = tab;
  }

  loadOverview(): void {
    this.loadingOverview = true;
    this.financeSvc.getOverview(this.projectId).subscribe({
      next: (res: any) => {
        this.overview = res?.data?.overview || res?.data || {};
        this.loadingOverview = false;
      },
      error: () => { this.loadingOverview = false; },
    });
  }

  fmt(n: number): string {
    const v = +n || 0;
    if (v >= 1_000_000) return (v / 1_000_000).toFixed(2) + 'M TZS';
    return v.toLocaleString() + ' TZS';
  }

  pct(part: number, whole: number): string {
    if (!whole) return '0%';
    return ((+part / +whole) * 100).toFixed(2) + '%';
  }
}

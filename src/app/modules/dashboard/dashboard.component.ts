import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProjectService, LetterService, StoreService } from '../../core/services/domain.services';
import { CurrencyShortPipe } from 'src/app/theme/pipes/currency-short.pipe';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyShortPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  loading = signal(true);
  activeProjects = 0;
  projects = signal<any[]>([]);

  stats = [
    {
      label: 'Total Projects',
      value: '3',
      icon: 'building',
      color: 'blue',
      change: '2 this year',
      changeDir: 'up',
    },
    {
      label: 'Active Projects',
      value: '2',
      icon: 'lightning-charge',
      color: 'green',
      change: '1 completed',
      changeDir: 'up',
    },
    {
      label: 'Total Budget',
      value: '450M TZS',
      icon: 'cash-stack',
      color: 'purple',
      change: '100% allocated',
      changeDir: 'up',
    },
    {
      label: 'Paid to Date',
      value: '210M TZS',
      icon: 'check-circle',
      color: 'teal',
      change: '46.8% of budget',
      changeDir: 'up',
    },
    {
      label: 'Pending Letters',
      value: '4',
      icon: 'envelope-open',
      color: 'orange',
      change: '2 urgent',
      changeDir: 'down',
    },
    {
      label: 'Low Stock Items',
      value: '3',
      icon: 'exclamation-triangle',
      color: 'red',
      change: 'Need reorder',
      changeDir: 'down',
    },
  ];

  quickActions = [
    {
      label: 'New Letter',
      desc: 'Compose & send a letter',
      route: '/letters/new',
      icon: 'envelope-plus',
      color: 'blue',
      permission: 'letter:create',
    },
    {
      label: 'Receive Items',
      desc: 'Create a Goods Received Note',
      route: '/store/receive',
      icon: 'box-arrow-in-down',
      color: 'green',
      permission: 'store:receive',
    },
    {
      label: 'Issue Items',
      desc: 'Create a Material Issue Note',
      route: '/store/issue',
      icon: 'box-arrow-right',
      color: 'orange',
      permission: 'store:issue',
    },
    {
      label: 'Add Project',
      desc: 'Start a new project',
      route: '/projects',
      icon: 'building-add',
      color: 'purple',
      permission: 'project:create',
    },
    {
      label: 'Manage Users',
      desc: 'Users, roles & permissions',
      route: '/users',
      icon: 'people',
      color: 'teal',
      permission: 'user:view',
    },
  ];

  budgetItems = [
    { label: 'Civil Works', value: '82.5M TZS', pct: 46, color: '#2563eb' },
    {
      label: 'Electrical Works',
      value: '24.8M TZS',
      pct: 41,
      color: '#16a34a',
    },
    { label: 'HVAC Works', value: '21.2M TZS', pct: 47, color: '#f97316' },
    { label: 'Finishes', value: '18.6M TZS', pct: 37, color: '#9333ea' },
  ];

  recentLetters = [
    {
      id: '1',
      subject: 'Site Inspection Schedule – June 2026',
      to: 'Hassan Juma',
      date: '29 Jun 2026',
      type: 'outgoing',
      status: 'sent',
    },
    {
      id: '2',
      subject: 'Re: Electrical Works Progress Report',
      to: 'Mega Electricals',
      date: '28 Jun 2026',
      type: 'incoming',
      status: 'received',
    },
    {
      id: '3',
      subject: 'HVAC Equipment Delivery Confirmation',
      to: 'Cool Air Solutions',
      date: '27 Jun 2026',
      type: 'outgoing',
      status: 'approved',
    },
    {
      id: '4',
      subject: 'Monthly Progress Report – June 2026',
      to: 'Zanzibar Government',
      date: '25 Jun 2026',
      type: 'outgoing',
      status: 'draft',
    },
  ];

  lowStockItems = [
    {
      name: 'Cement (50kg bags)',
      qty: 8,
      unit: 'bags',
      reorder: 20,
      level: 'low',
    },
    {
      name: 'Steel Rebar 12mm',
      qty: 0,
      unit: 'tons',
      reorder: 5,
      level: 'empty',
    },
    {
      name: 'PVC Conduit 25mm',
      qty: 12,
      unit: 'pcs',
      reorder: 50,
      level: 'low',
    },
  ];

  constructor(
    public auth: AuthService,
    private projectSvc: ProjectService,
    private letterSvc: LetterService,
    private storeSvc: StoreService,
  ) {}

  ngOnInit(): void {
    this.loading.set(true);

    // 1. Fetch active projects
    this.projectSvc.getAll().subscribe({
      next: (res: any) => {
        const allProjects = res.data || [];
        this.projects.set(allProjects.slice(0, 6)); // show latest 6

        const activeCount = allProjects.filter((p: any) => p.status === 'Active' || p.status === 'active').length;
        this.activeProjects = activeCount;

        const totalBudgetVal = allProjects.reduce((sum: number, p: any) => sum + Number(p.totalBudget || 0), 0);
        const paidToDateVal = allProjects.reduce((sum: number, p: any) => sum + (Number(p.totalBudget || 0) * (Number(p.progress || 0) / 100)), 0);

        // Update stats values dynamically!
        this.stats[0].value = `${allProjects.length}`;
        this.stats[1].value = `${activeCount}`;
        this.stats[2].value = `${(totalBudgetVal / 1000000).toFixed(1)}M TZS`;
        this.stats[3].value = `${(paidToDateVal / 1000000).toFixed(1)}M TZS`;
        this.stats[3].change = `${totalBudgetVal > 0 ? ((paidToDateVal / totalBudgetVal) * 100).toFixed(1) : 0}% of budget`;
      },
      error: () => {}
    });

    // 2. Fetch pending letters count and recent letters list
    this.letterSvc.getStats().subscribe({
      next: (res: any) => {
        const stats = res.data?.stats || {};
        const pendingCount = Number(stats.pending_approval || 0) + Number(stats.draft || 0);
        this.stats[4].value = `${pendingCount}`;
        this.stats[4].change = `${stats.pending_approval || 0} pending approval`;
      }
    });

    this.letterSvc.getAll({ page: 1, limit: 4 }).subscribe({
      next: (res: any) => {
        const lettersList = res.data?.letters || [];
        this.recentLetters = lettersList.map((l: any) => ({
          id: l.id,
          subject: l.subject,
          to: l.recipientName || l.recipient?.name || '—',
          date: new Date(l.letterDate || l.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          type: l.type,
          status: l.status.toLowerCase(),
        }));
      }
    });

    // 3. Fetch store low stock items
    this.storeSvc.getCentralStore().subscribe({
      next: (res: any) => {
        const items = res.data?.items || [];
        const lowStock = items.filter((i: any) => Number(i.quantity) <= Number(i.minQuantity));
        this.stats[5].value = `${lowStock.length}`;
        this.stats[5].change = lowStock.length > 0 ? 'Action required' : 'Stock level healthy';
        
        this.lowStockItems = lowStock.slice(0, 3).map((i: any) => ({
          name: i.description,
          qty: Number(i.quantity),
          unit: i.unit || 'pcs',
          reorder: Number(i.minQuantity),
          level: Number(i.quantity) === 0 ? 'empty' : 'low'
        }));
      },
      complete: () => {
        this.loading.set(false);
      }
    });
  }
  getProjectManager(project: any): string {
    if (!project?.projectManager) return '—';

    return [project.projectManager.firstName, project.projectManager.lastName]
      .filter(Boolean)
      .join(' ');
  }
  getClientName(project: any): string {
    return (
      project?.clientInfo?.name ||
      project?.client?.name ||
      project?.clientName ||
      '—'
    );
  }
  getProgressColor(pct: number): string {
    if (pct >= 80) return '#16a34a';
    if (pct >= 50) return '#2563eb';
    if (pct >= 25) return '#d97706';
    return '#ef4444';
  }

  getStatusClass(s: string): string {
    const m: any = {
      Active: 'status-active',
      'On Hold': 'status-on-hold',
      Completed: 'status-completed',
      Cancelled: 'status-overdue',
    };
    return m[s] || 'status-pending';
  }
}

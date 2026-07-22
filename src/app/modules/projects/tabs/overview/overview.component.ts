import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ProjectService } from '../../../../core/services/domain.services';
import { Project } from '../../../../core/models/index';
import { CurrencyShortPipe } from "../../../../theme/pipes/currency-short.pipe";

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyShortPipe],
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.css'],
})
export class OverviewComponent implements OnInit {
  project: Project | undefined;
  projectId = '';
  phases: any[] = [];
  recentActivities: any[] = [];
  recentPayments: any[] = [];
  stats: any = {};
  loading = true;

  totalActivities = 0;
  completedActivities = 0;
  inProgressActivities = 0;
  pendingActivities = 0;

  constructor(
    private route: ActivatedRoute,
    private projectSvc: ProjectService,
  ) {}

  ngOnInit() {
    this.route.parent?.params.subscribe((params) => {
      this.projectId = params['id'];
      this.loadOverview();
    });
  }

  loadOverview() {
    this.loading = true;
    this.projectSvc.getOverview(this.projectId).subscribe({
      next: (res: any) => {
        this.project = res.data?.project;
        this.stats = res.data?.stats || {};
        this.phases = this.project?.phases || [];

        this.totalActivities = this.stats.totalActivities || 0;
        this.completedActivities = this.stats.completed || 0;
        this.inProgressActivities = this.stats.inProgress || 0;
        this.pendingActivities = this.stats.pending || 0;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });

    // Load recent activities
    this.projectSvc.getActivities(this.projectId, { limit: 5 }).subscribe({
      next: (res: any) => {
        this.recentActivities = res.data || [];
      },
    });
  }

  getProgressColor(n: number): string {
    if (n >= 75) return '#10b981';
    if (n >= 40) return '#f59e0b';
    return '#1a56db';
  }

  getStatusClass(s: string): string {
    const m: any = {
      completed: 'status-completed',
      in_progress: 'status-in-progress',
      pending: 'status-pending',
      on_hold: 'status-overdue',
      active: 'status-active',
    };
    return m[s?.toLowerCase()] || 'status-pending';
  }

  getPhaseBarColor(index: number): string {
    const colors = [
      '#1a56db',
      '#f59e0b',
      '#7c3aed',
      '#10b981',
      '#ef4444',
      '#0ea5e9',
    ];
    return colors[index % colors.length];
  }
  getTotalBudget(): number {
    return Math.round(
      Number(this.stats?.totalBudget || this.project?.totalBudget || this.project?.budget || 0),
    );
  }
  getBudgetPaidPct(): number {
    const budget = Number(
      this.stats?.totalBudget || this.project?.totalBudget || this.project?.budget || 0,
    );
    const totalPaid = Number(this.stats?.totalPaid || 0);

    if (budget <= 0) return 0;

    return Math.round((totalPaid / budget) * 100);
  }

  getBudgetCommittedPct(): number {
    const budget = Number(
      this.stats?.totalBudget || this.project?.totalBudget || this.project?.budget || 0,
    );
    if (!budget) return 0;
    return Math.round(((this.stats.totalCommitted || 0) / budget) * 100);
  }

  formatCurrency(n: number): string {
    if (!n) return '0 TZS';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M TZS';
    if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K TZS';
    return n.toLocaleString() + ' TZS';
  }

  getClientName(): string {
    return (
      this.project?.clientInfo?.name || (this.project as any)?.client || '—'
    );
  }

  getManagerName(): string {
    const pm = this.project?.projectManager;
    if (!pm) return '—';
    return `${pm.firstName} ${pm.lastName}`;
  }

  getDaysRemaining(): number {
    if (!this.project?.endDate) return 0;

    const today = new Date();
    const end = new Date(this.project.endDate);

    const diff = end.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    return days > 0 ? days : 0;
  }

  getUpcomingDeadlines() {
    return this.phases
      .filter((p) => p.status !== 'completed')
      .slice(0, 3)
      .map((p) => {
        const end = new Date(p.endDate);
        const today = new Date();
        const days = Math.max(
          0,
          Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
        );
        return {
          day: end.getDate().toString().padStart(2, '0'),
          month: end.toLocaleString('en', { month: 'short' }).toUpperCase(),
          title: p.name,
          sub: p.description || '',
          days,
          date: p.endDate,
          status: p.status,
          type: days <= 7 ? 'danger' : days <= 30 ? 'warning' : 'info',
        };
      });
  }

  getLatestDocuments() {
    return [
      {
        name: 'Contract Agreement.pdf',
        category: 'Contracts',
        date: '12 May 2026',
        size: '2.4 MB',
        icon: 'pdf',
      },
      {
        name: 'Site Plan Drawing.dwg',
        category: 'Drawings',
        date: '10 May 2026',
        size: '5.7 MB',
        icon: 'dwg',
      },
      {
        name: 'Progress Report.pdf',
        category: 'Reports',
        date: '05 May 2026',
        size: '1.8 MB',
        icon: 'pdf',
      },
    ];
  }
}

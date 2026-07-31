import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ProjectService, PhaseService, DocumentService } from '../../../../core/services/domain.services';
import { AuthService } from '../../../../core/services/auth.service';
import { Report, Phase } from '../../../../core/models/index';
import Swal from 'sweetalert2';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css'],
})
export class ReportsComponent implements OnInit, AfterViewInit, OnDestroy {
  projectId = '';
  activeTab = 'summary';
  reports: Report[] = [];
  filteredReports: Report[] = [];
  phases: Phase[] = [];
  showModal = false;
  editMode = false;
  selectedReport: Report | null = null;
  form!: FormGroup;
  searchTerm = '';
  filterPhase = 'All Phases';
  filterType = 'All Report Types';
  filterStatus = 'All Status';
  startDate = '';
  endDate = '';
  currentPage = 1;
  pageSize = 8;
  expandedPhases: Set<string> = new Set();
  private charts: Chart[] = [];

  allPhasesForView: any[] = [];
  pagedReports: any[] = [];
  pages: number[] = [];
  upcomingReportsList: any[] = [];
  latestReportsList: any[] = [];

  reportTypes = [
    'Progress Report',
    'Test Report',
    'RFI Report',
    'Inspection Report',
    'Completion Report',
    'Environmental Report',
  ];
  statuses = ['Completed', 'In Progress', 'Pending', 'Overdue'];

  get totalReports() { return this.filteredReports.length; }
  get completedReports() { return this.filteredReports.filter(r => r.status === 'Completed').length; }
  get inProgressReports() { return this.filteredReports.filter(r => r.status === 'In Progress').length; }
  get pendingReports() { return this.filteredReports.filter(r => r.status === 'Pending').length; }
  get overdueReports() { return this.filteredReports.filter(r => r.status === 'Overdue').length; }

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private projectSvc: ProjectService,
    private phaseSvc: PhaseService,
    private docSvc: DocumentService,
    public auth: AuthService,
  ) {}

  project: any = null;

  ngOnInit() {
    this.route.parent?.params.subscribe((params) => {
      this.projectId = params['id'];
      this.load();
      this.loadPhases();
      this.loadProject();
    });
  }

  loadProject() {
    if (!this.projectId) return;
    this.projectSvc.getOne(this.projectId).subscribe({
      next: (res: any) => {
        this.project = res.data?.project || res.data;
      }
    });
  }

  get projectDaysRemaining(): number {
    if (!this.project?.endDate) return 0;
    const end = new Date(this.project.endDate).getTime();
    const now = new Date().getTime();
    const diff = Math.ceil((end - now) / (1000 * 3600 * 24));
    return diff > 0 ? diff : 0;
  }

  load() {
    forkJoin({
      reportsRes: this.projectSvc.getReports(this.projectId).pipe(catchError(() => of({ data: { reports: [] } }))),
      docsRes: this.docSvc.getAll(this.projectId, { limit: 1000 }).pipe(catchError(() => of({ data: { documents: [] } })))
    }).subscribe(({ reportsRes, docsRes }) => {
      const dbReports = reportsRes?.data?.reports || reportsRes?.data || [];
      const docs = docsRes?.data?.documents || docsRes?.data?.rows || docsRes?.data || [];
      const reportDocs = docs.filter((d: any) => d.category === 'Report' || d.reportType || d.type === 'Report');

      const mappedReports = [
        ...dbReports.map((r: any) => ({
          id: r.id,
          reportNo: r.reportNo || `REP-${r.id.substring(0, 6).toUpperCase()}`,
          title: r.title,
          type: r.type || 'Progress Report',
          subject: r.content || r.title || 'Project Report',
          submittedBy: r.submittedByUser ? `${r.submittedByUser.firstName} ${r.submittedByUser.lastName}` : (r.submittedBy || 'System User'),
          submittedOn: r.submittedOn ? r.submittedOn.split('T')[0] : (r.createdAt ? r.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
          status: r.status ? (r.status.charAt(0).toUpperCase() + r.status.slice(1)) : 'Completed',
          progress: r.progress || 100,
          phaseId: r.phaseId || '',
          fileUrl: r.fileUrl || '',
          fileName: r.fileName || ''
        })),
        ...reportDocs.map((d: any) => ({
          id: d.id,
          reportNo: d.documentNo || d.code || `REP-${d.id.substring(0, 6).toUpperCase()}`,
          title: d.title || d.fileName,
          type: d.reportType || d.drawingType || d.type || 'Progress Report',
          subject: d.description || d.title || 'Project Report',
          submittedBy: d.submittedBy || (d.uploadedBy?.firstName ? `${d.uploadedBy.firstName} ${d.uploadedBy.lastName}` : 'System User'),
          submittedOn: d.submittedOn || (d.createdAt ? d.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
          status: d.status || 'Completed',
          progress: d.progress || 100,
          phaseId: d.phaseId || '',
          fileUrl: d.filePath,
          fileName: d.fileName
        }))
      ];

      const uniqueMap = new Map();
      mappedReports.forEach(item => uniqueMap.set(item.id, item));
      this.reports = Array.from(uniqueMap.values());

      this.applyFilters();
    });
  }

  loadPhases() {
    this.phaseSvc.getAll().subscribe({
      next: (res: any) => {
        this.phases = res.data?.phases || res.data || [];
        this.updateViewData();
      },
      error: () => {
        this.phases = [];
        this.updateViewData();
      }
    });
  }

  ngAfterViewInit() {
    if (this.activeTab === 'summary') {
      setTimeout(() => this.initCharts(), 100);
    }
  }

  setTab(t: string) {
    this.activeTab = t;
    if (t === 'summary') {
      setTimeout(() => this.initCharts(), 100);
    } else {
      this.destroyCharts();
    }
  }

  togglePhase(phaseId: string) {
    if (this.expandedPhases.has(phaseId)) this.expandedPhases.delete(phaseId);
    else this.expandedPhases.add(phaseId);
  }

  isExpanded(phaseId: string) {
    return this.expandedPhases.has(phaseId);
  }

  updateViewData() {
    const list: any[] = (this.phases || []).map(p => {
      const pReports = this.filteredReports.filter(r => r.phaseId === p.id);
      return {
        ...p,
        reports: pReports,
        stats: {
          completed: pReports.filter(r => r.status === 'Completed').length,
          inProgress: pReports.filter(r => r.status === 'In Progress').length,
          pending: pReports.filter(r => r.status === 'Pending').length,
          overdue: pReports.filter(r => r.status === 'Overdue').length,
          total: pReports.length,
        }
      };
    });

    const generalReports = this.filteredReports.filter(r => !r.phaseId);
    if (generalReports.length > 0 || list.length === 0) {
      list.push({
        id: 'general',
        projectId: this.projectId,
        name: 'General Project Reports',
        startDate: 'N/A',
        endDate: 'N/A',
        duration: 0,
        status: 'Active',
        progress: 100,
        color: '#3b82f6',
        activities: [],
        totalActivities: generalReports.length,
        reports: generalReports,
        stats: {
          completed: generalReports.filter(r => r.status === 'Completed').length,
          inProgress: generalReports.filter(r => r.status === 'In Progress').length,
          pending: generalReports.filter(r => r.status === 'Pending').length,
          overdue: generalReports.filter(r => r.status === 'Overdue').length,
          total: generalReports.length,
        }
      });
    }
    this.allPhasesForView = list;

    const s = (this.currentPage - 1) * this.pageSize;
    this.pagedReports = this.filteredReports.slice(s, s + this.pageSize);
    const totalP = Math.ceil(this.filteredReports.length / this.pageSize) || 1;
    this.pages = Array.from({ length: totalP }, (_, i) => i + 1);

    this.upcomingReportsList = this.reports
      .filter(r => r.status === 'Pending' || r.status === 'In Progress')
      .slice(0, 5)
      .map(r => ({ title: r.title, date: r.submittedOn }));

    this.latestReportsList = this.reports
      .slice(0, 5)
      .map(r => ({ title: r.title, status: r.status }));
  }

  getPhaseStatusClass(status: string) {
    const map: any = {
      Active: 'badge-active',
      'In Progress': 'badge-in-progress',
      Pending: 'badge-pending',
      Completed: 'badge-completed',
    };
    return map[status] || 'badge-pending';
  }

  getPhaseColor(i: number) {
    const colors = ['#3b82f6', '#f59e0b', '#a855f7', '#22c55e'];
    return colors[i % colors.length];
  }

  applyFilters() {
    let r = [...this.reports];
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      r = r.filter(
        (x) =>
          (x.title || '').toLowerCase().includes(term) ||
          (x.reportNo || '').toLowerCase().includes(term) ||
          (x.submittedBy || '').toLowerCase().includes(term)
      );
    }
    if (this.filterPhase && this.filterPhase !== 'All Phases') {
      r = r.filter((x) => x.phaseId === this.filterPhase || (x as any).phaseName === this.filterPhase);
    }
    if (this.filterType && this.filterType !== 'All Report Types') {
      r = r.filter((x) => x.type === this.filterType);
    }
    if (this.filterStatus && this.filterStatus !== 'All Status') {
      r = r.filter((x) => x.status === this.filterStatus);
    }
    if (this.startDate) {
      r = r.filter((x) => x.submittedOn ? x.submittedOn >= this.startDate : false);
    }
    if (this.endDate) {
      r = r.filter((x) => x.submittedOn ? x.submittedOn <= this.endDate : false);
    }
    this.filteredReports = r;
    this.currentPage = 1;
    this.updateViewData();
    if (this.activeTab === 'summary') {
      this.initCharts();
    }
  }

  get totalPages() {
    return Math.ceil(this.filteredReports.length / this.pageSize) || 1;
  }

  initCharts() {
    this.destroyCharts();
    if (this.activeTab === 'summary') {
      setTimeout(() => {
        this.initTypeDonut();
        this.initStatusDonut();
        this.initTrendChart();
      }, 50);
    }
  }

  destroyCharts() {
    this.charts.forEach((c) => {
      try { c.destroy(); } catch (e) {}
    });
    this.charts = [];
  }

  ngOnDestroy() {
    this.destroyCharts();
  }

  initTypeDonut() {
    const el = document.getElementById('reportTypeChart') as HTMLCanvasElement;
    if (!el) return;
    try {
      const existing = Chart.getChart(el);
      if (existing) existing.destroy();
    } catch (e) {}

    const types = [
      'Progress Report',
      'Test Report',
      'RFI Report',
      'Inspection Report',
      'Completion Report',
    ];
    const typeCounts = types.map(t => this.filteredReports.filter(r => r.type === t).length);
    try {
      const c = new Chart(el, {
        type: 'doughnut',
        data: {
          labels: types,
          datasets: [
            {
              data: typeCounts,
              backgroundColor: [
                '#3b82f6',
                '#22c55e',
                '#f59e0b',
                '#a855f7',
                '#ef4444',
              ],
              borderWidth: 0,
            },
          ],
        },
        options: {
          cutout: '65%',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
        },
      });
      this.charts.push(c);
    } catch (e) {
      console.error('Error creating reportTypeChart', e);
    }
  }

  initStatusDonut() {
    const el = document.getElementById('reportStatusChart') as HTMLCanvasElement;
    if (!el) return;
    try {
      const existing = Chart.getChart(el);
      if (existing) existing.destroy();
    } catch (e) {}

    const statuses = ['Completed', 'In Progress', 'Pending', 'Overdue'];
    const statusCounts = statuses.map(s => this.filteredReports.filter(r => r.status === s).length);
    try {
      const c = new Chart(el, {
        type: 'doughnut',
        data: {
          labels: statuses,
          datasets: [
            {
              data: statusCounts,
              backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'],
              borderWidth: 0,
            },
          ],
        },
        options: {
          cutout: '65%',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
        },
      });
      this.charts.push(c);
    } catch (e) {
      console.error('Error creating reportStatusChart', e);
    }
  }

  initTrendChart() {
    const el = document.getElementById('reportTrendChart') as HTMLCanvasElement;
    if (!el) return;
    try {
      const existing = Chart.getChart(el);
      if (existing) existing.destroy();
    } catch (e) {}

    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const completedData = Array(12).fill(0);
    const inProgressData = Array(12).fill(0);
    const totalData = Array(12).fill(0);

    this.filteredReports.forEach(r => {
      const dateStr = r.submittedOn || (r as any).createdAt;
      if (dateStr) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          const m = d.getMonth();
          if (m >= 0 && m < 12) {
            if (r.status === 'Completed') completedData[m]++;
            else if (r.status === 'In Progress') inProgressData[m]++;
            totalData[m]++;
          }
        }
      }
    });

    try {
      const c = new Chart(el, {
        type: 'line',
        data: {
          labels: months,
          datasets: [
            {
              label: 'Total Reports',
              data: totalData,
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              fill: true,
              tension: 0.3,
            },
            {
              label: 'Completed',
              data: completedData,
              borderColor: '#22c55e',
              backgroundColor: 'transparent',
              tension: 0.3,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'top' } },
          scales: {
            y: { beginAtZero: true, ticks: { precision: 0 } }
          }
        },
      });
      this.charts.push(c);
    } catch (e) {
      console.error('Error creating reportTrendChart', e);
    }
  }

  initForm(r?: Report) {
    this.form = this.fb.group({
      title: [r?.title || '', Validators.required],
      reportNo: [r?.reportNo || '', Validators.required],
      type: [r?.type || 'Progress Report', Validators.required],
      subject: [r?.subject || '', Validators.required],
      status: [r?.status || 'Pending', Validators.required],
      submittedBy: [r?.submittedBy || '', Validators.required],
      submittedOn: [r?.submittedOn || ''],
      progress: [
        r?.progress ?? 0,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
      phaseId: [r?.phaseId || ''],
    });
  }

  openAddModal() {
    this.editMode = false;
    this.selectedReport = null;
    this.initForm();
    this.showModal = true;
  }
  openEditModal(r: Report) {
    this.editMode = true;
    this.selectedReport = r;
    this.initForm(r);
    this.showModal = true;
  }
  closeModal() {
    this.showModal = false;
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const val = this.form.value;
    if (this.editMode && this.selectedReport) {
      this.projectSvc.updateReport(this.projectId, this.selectedReport.id, val).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Report Updated!',
            timer: 1500,
            showConfirmButton: false,
          });
          this.load();
        },
        error: (err) => Swal.fire('Error', err.error?.message || 'Failed to update report', 'error')
      });
    } else {
      this.projectSvc.createReport(this.projectId, val).subscribe({
        next: () => {
          Swal.fire({
            icon: 'success',
            title: 'Report Added!',
            timer: 1500,
            showConfirmButton: false,
          });
          this.load();
        },
        error: (err) => Swal.fire('Error', err.error?.message || 'Failed to create report', 'error')
      });
    }
    this.closeModal();
  }

  deleteReport(r: Report) {
    Swal.fire({
      title: 'Delete Report?',
      text: `Delete "${r.title}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete!',
    }).then((res) => {
      if (res.isConfirmed) {
        this.projectSvc.deleteReport(this.projectId, r.id).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              timer: 1200,
              showConfirmButton: false,
            });
            this.load();
          },
          error: (err) => Swal.fire('Error', err.error?.message || 'Failed to delete report', 'error')
        });
      }
    });
  }

  getTypeClass(t: string) {
    const m: any = {
      'Progress Report': 'type-progress',
      'Test Report': 'type-test',
      'RFI Report': 'type-rfi',
      'Inspection Report': 'type-inspection',
      'Completion Report': 'type-completion',
      'Environmental Report': 'type-env',
    };
    return m[t] || 'type-progress';
  }

  getStatusClass(s: string) {
    const m: any = {
      Completed: 'status-completed',
      'In Progress': 'status-in-progress',
      Pending: 'status-pending',
      Overdue: 'status-overdue',
    };
    return m[s] || 'status-pending';
  }

  getReportsByType(t: string) {
    return this.reports.filter((r) => r.type === t);
  }

  get f() {
    return this.form.controls;
  }
  get Math() {
    return Math;
  }
}

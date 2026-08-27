import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import {
  Project, Phase, Activity, Report, FinanceBudgetCategory,
  Payment, Invoice, Expense, Contract, PurchaseOrder,
  Supplier, IssueItem, Document, TeamMember
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class DataService {

  // ============ PROJECTS ============
  private projects: Project[] = [
    {
      id: 'ZAE-2026-001', code: 'ZAE-2026-001',
      name: 'Zanzibar Airport Expansion', status: 'Active',
      startDate: '12 Jan 2026', endDate: '30 Dec 2026',
      client: 'Zanzibar Government', description: 'Expansion of Zanzibar International Airport including new terminal building, runway extension, and supporting infrastructure.',
      budget: 450000000, currency: 'TZS', progress: 62, daysRemaining: 183,
      projectManager: 'Ali Mohamed', location: 'Zanzibar, Tanzania',
      thumbnail: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=200&h=150&fit=crop'
    },
    {
      id: 'WSP-2026-001', code: 'WSP-2026-001',
      name: 'Water Supply Project', status: 'Active',
      startDate: '01 Mar 2026', endDate: '28 Feb 2027',
      client: 'Zanzibar Water Authority', description: 'Urban water supply improvement project for Zanzibar City.',
      budget: 120000000, currency: 'TZS', progress: 35, daysRemaining: 245,
      projectManager: 'Fatma Hassan', location: 'Zanzibar City',
      thumbnail: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=200&h=150&fit=crop'
    },
    {
      id: 'RC-2026-001', code: 'RC-2026-001',
      name: 'Road Construction', status: 'On Hold',
      startDate: '15 Feb 2026', endDate: '30 Nov 2026',
      client: 'Ministry of Infrastructure', description: 'Construction of 15km road network connecting northern Zanzibar.',
      budget: 85000000, currency: 'TZS', progress: 18, daysRemaining: 0,
      projectManager: 'Omar Khamis', location: 'North Zanzibar'
    }
  ];
  private projectsSubject = new BehaviorSubject<Project[]>(this.projects);

  // ============ PHASES ============
  private phases: Phase[] = [
    {
      id: 'PH1', projectId: 'ZAE-2026-001',
      name: 'Phase 1: Pre-Construction & Mobilization',
      status: 'Active', startDate: '12 Jan 2026', endDate: '31 Mar 2026',
      duration: 79, progress: 78, color: '#1a56db',
      totalActivities: 19, completed: 15, inProgress: 3, pending: 1, overdue: 0,
      activities: []
    },
    {
      id: 'PH2', projectId: 'ZAE-2026-001',
      name: 'Phase 2: Construction Works',
      status: 'In Progress', startDate: '01 Apr 2026', endDate: '30 Sep 2026',
      duration: 183, progress: 42, color: '#f59e0b',
      totalActivities: 54, completed: 23, inProgress: 18, pending: 13, overdue: 2,
      activities: []
    },
    {
      id: 'PH3', projectId: 'ZAE-2026-001',
      name: 'Phase 3: Finishing & Installation',
      status: 'Pending', startDate: '01 Oct 2026', endDate: '30 Nov 2026',
      duration: 61, progress: 8, color: '#7c3aed',
      totalActivities: 26, completed: 2, inProgress: 0, pending: 24, overdue: 0,
      activities: []
    },
    {
      id: 'PH4', projectId: 'ZAE-2026-001',
      name: 'Phase 4: Testing, Commissioning & Handover',
      status: 'Pending', startDate: '01 Dec 2026', endDate: '30 Dec 2026',
      duration: 30, progress: 0, color: '#10b981',
      totalActivities: 12, completed: 0, inProgress: 0, pending: 12, overdue: 0,
      activities: []
    }
  ];

  // ============ ACTIVITIES ============
  private activities: Activity[] = [
    { id: 'A001', projectId: 'ZAE-2026-001', phaseId: 'PH1', name: 'Site Mobilization', type: 'Mobilization', status: 'Completed', progress: 100, startDate: '12 Jan 2026', dueDate: '25 Jan 2026', assignedTo: 'ZanBuild Ltd', priority: 'High', description: 'Initial site setup and mobilization of resources.' },
    { id: 'A002', projectId: 'ZAE-2026-001', phaseId: 'PH1', name: 'Site Survey & Topography', type: 'Survey', status: 'Completed', progress: 100, startDate: '15 Jan 2026', dueDate: '05 Feb 2026', assignedTo: 'Survey Team', priority: 'High' },
    { id: 'A003', projectId: 'ZAE-2026-001', phaseId: 'PH1', name: 'Environmental Impact Assessment', type: 'Assessment', status: 'Completed', progress: 100, startDate: '20 Jan 2026', dueDate: '15 Feb 2026', assignedTo: 'Env. Consultants', priority: 'High' },
    { id: 'A004', projectId: 'ZAE-2026-001', phaseId: 'PH1', name: 'Design Review & Approval', type: 'Design', status: 'Completed', progress: 100, startDate: '25 Jan 2026', dueDate: '28 Feb 2026', assignedTo: 'Design Team', priority: 'High' },
    { id: 'A005', projectId: 'ZAE-2026-001', phaseId: 'PH1', name: 'Procurement Planning', type: 'Procurement', status: 'Completed', progress: 100, startDate: '01 Feb 2026', dueDate: '15 Feb 2026', assignedTo: 'Ali Mohamed', priority: 'Medium' },
    { id: 'A006', projectId: 'ZAE-2026-001', phaseId: 'PH1', name: 'Contractor Onboarding', type: 'Administration', status: 'In Progress', progress: 75, startDate: '01 Feb 2026', dueDate: '31 Mar 2026', assignedTo: 'ZanBuild Ltd', priority: 'High' },
    { id: 'A007', projectId: 'ZAE-2026-001', phaseId: 'PH1', name: 'Utility Relocation', type: 'Infrastructure', status: 'In Progress', progress: 60, startDate: '10 Feb 2026', dueDate: '31 Mar 2026', assignedTo: 'ZanBuild Ltd', priority: 'High' },
    { id: 'A008', projectId: 'ZAE-2026-001', phaseId: 'PH1', name: 'Temporary Works Setup', type: 'Setup', status: 'Pending', progress: 20, startDate: '15 Mar 2026', dueDate: '31 Mar 2026', assignedTo: 'ZanBuild Ltd', priority: 'Medium' },
    { id: 'A009', projectId: 'ZAE-2026-001', phaseId: 'PH2', name: 'Foundation Works - Terminal Building', type: 'Construction', status: 'In Progress', progress: 65, startDate: '01 Apr 2026', dueDate: '30 Jun 2026', assignedTo: 'ZanBuild Ltd', priority: 'High' },
    { id: 'A010', projectId: 'ZAE-2026-001', phaseId: 'PH2', name: 'Structural Steel Erection', type: 'Construction', status: 'In Progress', progress: 40, startDate: '15 Apr 2026', dueDate: '31 Jul 2026', assignedTo: 'ZanBuild Ltd', priority: 'High' },
    { id: 'A011', projectId: 'ZAE-2026-001', phaseId: 'PH2', name: 'Electrical Installation - Phase 1', type: 'Electrical', status: 'In Progress', progress: 30, startDate: '01 May 2026', dueDate: '31 Aug 2026', assignedTo: 'Mega Electricals', priority: 'High' },
    { id: 'A012', projectId: 'ZAE-2026-001', phaseId: 'PH2', name: 'Plumbing Works', type: 'Plumbing', status: 'Pending', progress: 0, startDate: '01 Jun 2026', dueDate: '31 Aug 2026', assignedTo: 'PlumbTech Co.', priority: 'Medium' },
    { id: 'A013', projectId: 'ZAE-2026-001', phaseId: 'PH2', name: 'HVAC System Installation', type: 'HVAC', status: 'Pending', progress: 0, startDate: '01 Jul 2026', dueDate: '30 Sep 2026', assignedTo: 'Cool Air Solutions', priority: 'Medium' },
    { id: 'A014', projectId: 'ZAE-2026-001', phaseId: 'PH2', name: 'Runway Extension Works', type: 'Civil Works', status: 'Overdue', progress: 55, startDate: '01 Apr 2026', dueDate: '31 May 2026', assignedTo: 'ZanBuild Ltd', priority: 'High' },
    { id: 'A015', projectId: 'ZAE-2026-001', phaseId: 'PH3', name: 'Interior Finishing', type: 'Finishing', status: 'Pending', progress: 0, startDate: '01 Oct 2026', dueDate: '30 Nov 2026', assignedTo: 'Prime Interiors', priority: 'Medium' },
    { id: 'A016', projectId: 'ZAE-2026-001', phaseId: 'PH3', name: 'Landscape & External Works', type: 'Landscaping', status: 'Pending', progress: 0, startDate: '01 Oct 2026', dueDate: '30 Nov 2026', assignedTo: 'Green Landscape', priority: 'Low' },
    { id: 'A017', projectId: 'ZAE-2026-001', phaseId: 'PH4', name: 'Systems Testing & Commissioning', type: 'Testing', status: 'Pending', progress: 0, startDate: '01 Dec 2026', dueDate: '20 Dec 2026', assignedTo: 'Ali Mohamed', priority: 'High' },
    { id: 'A018', projectId: 'ZAE-2026-001', phaseId: 'PH4', name: 'Safety Inspection', type: 'Inspection', status: 'Pending', progress: 0, startDate: '05 Dec 2026', dueDate: '25 Dec 2026', assignedTo: 'Safety First Ltd', priority: 'High' },
    { id: 'A019', projectId: 'ZAE-2026-001', phaseId: 'PH4', name: 'Final Handover', type: 'Handover', status: 'Pending', progress: 0, startDate: '28 Dec 2026', dueDate: '30 Dec 2026', assignedTo: 'Ali Mohamed', priority: 'High' }
  ];
  private activitiesSubject = new BehaviorSubject<Activity[]>(this.activities);

  // ============ REPORTS ============
  private reports: Report[] = [
    { id: 'R001', projectId: 'ZAE-2026-001', reportNo: 'PRG-2026-012', title: 'Monthly Progress Report - May 2026', type: 'Progress Report', status: 'Completed', periodSubject: 'May 2026', submittedBy: 'Ali Mohamed', submittedOn: '05 May 2026', progress: 100, phaseId: 'PH1' },
    { id: 'R002', projectId: 'ZAE-2026-001', reportNo: 'TEST-2026-006', title: 'Concrete Strength Test Report', type: 'Test Report', status: 'Completed', periodSubject: 'Apr 2026', submittedBy: 'Salim Ali', submittedOn: '28 Apr 2026', progress: 100, phaseId: 'PH2' },
    { id: 'R003', projectId: 'ZAE-2026-001', reportNo: 'RFI-2026-005', title: 'RFI - Drainage Design Clarification', type: 'RFI Report', status: 'In Progress', periodSubject: 'Apr 2026', submittedBy: 'Hassan Juma', submittedOn: '25 Apr 2026', progress: 60, phaseId: 'PH2' },
    { id: 'R004', projectId: 'ZAE-2026-001', reportNo: 'INSP-2026-003', title: 'Site Inspection Report', type: 'Inspection Report', status: 'Completed', periodSubject: 'Apr 2026', submittedBy: 'Mohamed Said', submittedOn: '20 Apr 2026', progress: 100, phaseId: 'PH2' },
    { id: 'R005', projectId: 'ZAE-2026-001', reportNo: 'PRG-2026-011', title: 'Monthly Progress Report - April 2026', type: 'Progress Report', status: 'Completed', periodSubject: 'Apr 2026', submittedBy: 'Ali Mohamed', submittedOn: '10 Apr 2026', progress: 100, phaseId: 'PH2' },
    { id: 'R006', projectId: 'ZAE-2026-001', reportNo: 'TEST-2026-005', title: 'Soil Compaction Test Report', type: 'Test Report', status: 'In Progress', periodSubject: 'Mar 2026', submittedBy: 'Salim Ali', submittedOn: '05 Apr 2026', progress: 70, phaseId: 'PH1' },
    { id: 'R007', projectId: 'ZAE-2026-001', reportNo: 'RFI-2026-004', title: 'RFI - Electrical Load Calculation', type: 'RFI Report', status: 'Pending', periodSubject: 'Mar 2026', submittedBy: 'Hassan Juma', submittedOn: '28 Mar 2026', progress: 30, phaseId: 'PH2' },
    { id: 'R008', projectId: 'ZAE-2026-001', reportNo: 'PRG-2026-010', title: 'Monthly Progress Report - March 2026', type: 'Progress Report', status: 'Completed', periodSubject: 'Mar 2026', submittedBy: 'Ali Mohamed', submittedOn: '10 Mar 2026', progress: 100, phaseId: 'PH1' },
    { id: 'R009', projectId: 'ZAE-2026-001', reportNo: 'PRG-2026-001', title: 'Mobilization Report', type: 'Progress Report', status: 'Completed', periodSubject: 'Jan 2026', submittedBy: 'Ali Mohamed', submittedOn: '25 Jan 2026', progress: 100, phaseId: 'PH1' },
    { id: 'R010', projectId: 'ZAE-2026-001', reportNo: 'INSP-2026-001', title: 'Site Survey Report', type: 'Inspection Report', status: 'Completed', periodSubject: 'Jan 2026', submittedBy: 'Survey Team', submittedOn: '05 Feb 2026', progress: 100, phaseId: 'PH1' }
  ];
  private reportsSubject = new BehaviorSubject<Report[]>(this.reports);

  // ============ FINANCE ============
  private budgetCategories: FinanceBudgetCategory[] = [
    { id: 'BC1', category: 'Preliminaries', budget: 35000000, committed: 28500000, paid: 18250000, balance: 16750000, progress: 52.14 },
    { id: 'BC2', category: 'Civil Works', budget: 180000000, committed: 128000000, paid: 82500000, balance: 97500000, progress: 45.83 },
    { id: 'BC3', category: 'Electrical Works', budget: 60000000, committed: 45600000, paid: 24750000, balance: 35250000, progress: 41.25 },
    { id: 'BC4', category: 'Mechanical Works (HVAC)', budget: 45000000, committed: 36800000, paid: 21200000, balance: 23800000, progress: 47.11 },
    { id: 'BC5', category: 'Finishes', budget: 50000000, committed: 36000000, paid: 18600000, balance: 31400000, progress: 37.20 },
    { id: 'BC6', category: 'External Works', budget: 40000000, committed: 25500000, paid: 15300000, balance: 24700000, progress: 38.25 },
    { id: 'BC7', category: 'Contingencies', budget: 40000000, committed: 20000000, paid: 10050000, balance: 29950000, progress: 25.13 }
  ];

  private payments: Payment[] = [
    { id: 'PAY001', projectId: 'ZAE-2026-001', invoiceNo: 'PAY-2026-018', description: 'Payment for Construction Phase 1', date: '15 May 2026', amount: 25000000, status: 'Paid', currency: 'TZS' },
    { id: 'PAY002', projectId: 'ZAE-2026-001', invoiceNo: 'INV-2026-017', description: 'Payment for Materials', date: '28 Apr 2026', amount: 18500000, status: 'Paid', currency: 'TZS' },
    { id: 'PAY003', projectId: 'ZAE-2026-001', invoiceNo: 'PAY-2026-016', description: 'Advance Payment - Electrical', date: '15 Apr 2026', amount: 50000000, status: 'Paid', currency: 'TZS' },
    { id: 'PAY004', projectId: 'ZAE-2026-001', invoiceNo: 'PAY-2026-015', description: 'Civil Works Progress Payment', date: '28 Mar 2026', amount: 32000000, status: 'Paid', currency: 'TZS' },
    { id: 'PAY005', projectId: 'ZAE-2026-001', invoiceNo: 'PAY-2026-014', description: 'Mobilization Payment', date: '15 Mar 2026', amount: 20500000, status: 'Paid', currency: 'TZS' },
    { id: 'PAY006', projectId: 'ZAE-2026-001', invoiceNo: 'INV-2026-024', description: 'Civil Works - Stage 3', dueDate: '20 May 2026', date: '10 Jun 2026', amount: 22000000, status: 'Pending Approval', currency: 'TZS' },
    { id: 'PAY007', projectId: 'ZAE-2026-001', invoiceNo: 'INV-2026-025', description: 'Electrical Installation', dueDate: '05 Jun 2026', date: '15 Jun 2026', amount: 15500000, status: 'Pending Approval', currency: 'TZS' }
  ];
  private paymentsSubject = new BehaviorSubject<Payment[]>(this.payments);

  // ============ PROCUREMENT ============
  private contracts: Contract[] = [
    { id: 'CON001', projectId: 'ZAE-2026-001', contractNo: 'CON-2026-001', contractor: 'ZanBuild Ltd', category: 'Building Works', value: 85000000, currency: 'TZS', startDate: '12 Jan 2026', endDate: '30 Jun 2026', status: 'Active', description: 'Main building works contract including terminal construction.' },
    { id: 'CON002', projectId: 'ZAE-2026-001', contractNo: 'CON-2026-002', contractor: 'Mega Electricals', category: 'Electrical Works', value: 45000000, currency: 'TZS', startDate: '15 Jan 2026', endDate: '15 Aug 2026', status: 'Active', description: 'Complete electrical installation for terminal building.' },
    { id: 'CON003', projectId: 'ZAE-2026-001', contractNo: 'CON-2026-003', contractor: 'PlumbTech Co.', category: 'Plumbing Works', value: 32000000, currency: 'TZS', startDate: '20 Jan 2026', endDate: '20 Aug 2026', status: 'Active', description: 'Plumbing and drainage systems.' },
    { id: 'CON004', projectId: 'ZAE-2026-001', contractNo: 'CON-2026-004', contractor: 'Cool Air Solutions', category: 'HVAC Works', value: 28500000, currency: 'TZS', startDate: '01 Feb 2026', endDate: '31 Oct 2026', status: 'Active', description: 'HVAC system design and installation.' },
    { id: 'CON005', projectId: 'ZAE-2026-001', contractNo: 'CON-2026-005', contractor: 'Prime Interiors', category: 'Interior Finishes', value: 18750000, currency: 'TZS', startDate: '01 Mar 2026', endDate: '30 Nov 2026', status: 'Active', description: 'Interior finishing and furnishing.' },
    { id: 'CON006', projectId: 'ZAE-2026-001', contractNo: 'CON-2026-006', contractor: 'Green Landscape', category: 'Landscaping', value: 8250000, currency: 'TZS', startDate: '15 Mar 2026', endDate: '15 Dec 2026', status: 'Pending', description: 'External landscaping and green works.' },
    { id: 'CON007', projectId: 'ZAE-2026-001', contractNo: 'CON-2026-007', contractor: 'ICT Solutions', category: 'ICT & Security', value: 6900000, currency: 'TZS', startDate: '01 Apr 2026', endDate: '31 Dec 2026', status: 'Pending', description: 'ICT infrastructure and security systems.' },
    { id: 'CON008', projectId: 'ZAE-2026-001', contractNo: 'CON-2026-008', contractor: 'Safety First Ltd', category: 'Safety & QA', value: 3500000, currency: 'TZS', startDate: '01 Apr 2026', endDate: '31 Dec 2026', status: 'Pending', description: 'Safety management and quality assurance.' }
  ];
  private contractsSubject = new BehaviorSubject<Contract[]>(this.contracts);

  private purchaseOrders: PurchaseOrder[] = [
    { id: 'PO001', projectId: 'ZAE-2026-001', poNo: 'LPO-2026-024', supplier: 'ZanBuild Ltd', description: 'Cement and aggregates supply', amount: 8500000, currency: 'TZS', date: '15 May 2026', status: 'Open', contractId: 'CON001' },
    { id: 'PO002', projectId: 'ZAE-2026-001', poNo: 'LPO-2026-023', supplier: 'Mega Electricals', description: 'Cable supply - Phase 2', amount: 4200000, currency: 'TZS', date: '12 May 2026', status: 'Open', contractId: 'CON002' },
    { id: 'PO003', projectId: 'ZAE-2026-001', poNo: 'LPO-2026-022', supplier: 'PlumbTech Co.', description: 'PVC pipes and fittings', amount: 2800000, currency: 'TZS', date: '10 May 2026', status: 'Received', contractId: 'CON003' },
    { id: 'PO004', projectId: 'ZAE-2026-001', poNo: 'LPO-2026-021', supplier: 'Cool Air Solutions', description: 'HVAC equipment supply', amount: 12000000, currency: 'TZS', date: '05 May 2026', status: 'Partial', contractId: 'CON004' },
    { id: 'PO005', projectId: 'ZAE-2026-001', poNo: 'LPO-2026-020', supplier: 'ZanBuild Ltd', description: 'Steel reinforcement bars', amount: 15000000, currency: 'TZS', date: '01 May 2026', status: 'Received', contractId: 'CON001' }
  ];
  private purchaseOrdersSubject = new BehaviorSubject<PurchaseOrder[]>(this.purchaseOrders);

  private suppliers: Supplier[] = [
    { id: 'S001', name: 'ZanBuild Ltd', category: 'Construction', contactPerson: 'Ahmed Omar', phone: '+255 773 001 001', email: 'ahmed@zanbuild.co.tz', totalValue: 85000000, currency: 'TZS', status: 'Active' },
    { id: 'S002', name: 'Mega Electricals', category: 'Electrical', contactPerson: 'John Mtoro', phone: '+255 773 002 002', email: 'john@megaelec.co.tz', totalValue: 45000000, currency: 'TZS', status: 'Active' },
    { id: 'S003', name: 'PlumbTech Co.', category: 'Plumbing', contactPerson: 'Sarah Juma', phone: '+255 773 003 003', email: 'sarah@plumbtech.co.tz', totalValue: 32000000, currency: 'TZS', status: 'Active' },
    { id: 'S004', name: 'Cool Air Solutions', category: 'HVAC', contactPerson: 'Mike Hassan', phone: '+255 773 004 004', email: 'mike@coolair.co.tz', totalValue: 28500000, currency: 'TZS', status: 'Active' },
    { id: 'S005', name: 'Prime Interiors', category: 'Interiors', contactPerson: 'Amina Said', phone: '+255 773 005 005', email: 'amina@prime.co.tz', totalValue: 18750000, currency: 'TZS', status: 'Active' }
  ];
  private suppliersSubject = new BehaviorSubject<Supplier[]>(this.suppliers);

  private issueItems: IssueItem[] = [
    { id: 'ISS001', projectId: 'ZAE-2026-001', itemNo: 'ISS-001', description: 'Safety helmets', category: 'Safety', quantity: 50, unit: 'pcs', issuedTo: 'ZanBuild Ltd', issuedDate: '15 Jan 2026', status: 'Issued' },
    { id: 'ISS002', projectId: 'ZAE-2026-001', itemNo: 'ISS-002', description: 'Safety vests', category: 'Safety', quantity: 50, unit: 'pcs', issuedTo: 'ZanBuild Ltd', issuedDate: '15 Jan 2026', status: 'Issued' },
    { id: 'ISS003', projectId: 'ZAE-2026-001', itemNo: 'ISS-003', description: 'Survey equipment', category: 'Equipment', quantity: 2, unit: 'sets', issuedTo: 'Survey Team', issuedDate: '14 Jan 2026', status: 'Returned' }
  ];
  private issueItemsSubject = new BehaviorSubject<IssueItem[]>(this.issueItems);

  // ============ DOCUMENTS ============
  private documents: Document[] = [
    { id: 'DOC001', projectId: 'ZAE-2026-001', name: 'Contract Agreement.pdf', category: 'Contracts', fileType: 'pdf', fileSize: '2.4 MB', uploadedBy: 'Ali Mohamed', uploadedOn: '12 May 2026', description: 'Main contract agreement with ZanBuild Ltd' },
    { id: 'DOC002', projectId: 'ZAE-2026-001', name: 'Site Plan Drawing.dwg', category: 'Drawings', fileType: 'dwg', fileSize: '5.7 MB', uploadedBy: 'Design Team', uploadedOn: '10 May 2026', description: 'Detailed site plan drawing' },
    { id: 'DOC003', projectId: 'ZAE-2026-001', name: 'Progress Report Apr 2026.pdf', category: 'Reports', fileType: 'pdf', fileSize: '1.8 MB', uploadedBy: 'Ali Mohamed', uploadedOn: '05 May 2026', description: 'Monthly progress report for April 2026' },
    { id: 'DOC004', projectId: 'ZAE-2026-001', name: 'ESIA Report.pdf', category: 'Environmental', fileType: 'pdf', fileSize: '3.2 MB', uploadedBy: 'Env. Consultants', uploadedOn: '15 Feb 2026', description: 'Environmental and Social Impact Assessment' },
    { id: 'DOC005', projectId: 'ZAE-2026-001', name: 'Structural Drawings.pdf', category: 'Drawings', fileType: 'pdf', fileSize: '8.4 MB', uploadedBy: 'Design Team', uploadedOn: '20 Jan 2026', description: 'Structural engineering drawings' },
    { id: 'DOC006', projectId: 'ZAE-2026-001', name: 'Health & Safety Plan.pdf', category: 'Safety', fileType: 'pdf', fileSize: '1.2 MB', uploadedBy: 'Safety First Ltd', uploadedOn: '12 Jan 2026', description: 'Project HSE management plan' }
  ];
  private documentsSubject = new BehaviorSubject<Document[]>(this.documents);

  // ============ TEAM ============
  private teamMembers: TeamMember[] = [
    { id: 'TM001', projectId: 'ZAE-2026-001', name: 'Ali Mohamed', role: 'Project Manager', department: 'Management', email: 'ali.mohamed@ram.co.tz', phone: '+255 773 100 001', status: 'Active', joinDate: '12 Jan 2026' },
    { id: 'TM002', projectId: 'ZAE-2026-001', name: 'Hassan Juma', role: 'Site Engineer', department: 'Engineering', email: 'hassan.juma@ram.co.tz', phone: '+255 773 100 002', status: 'Active', joinDate: '12 Jan 2026' },
    { id: 'TM003', projectId: 'ZAE-2026-001', name: 'Salim Ali', role: 'QA/QC Engineer', department: 'Quality', email: 'salim.ali@ram.co.tz', phone: '+255 773 100 003', status: 'Active', joinDate: '15 Jan 2026' },
    { id: 'TM004', projectId: 'ZAE-2026-001', name: 'Mohamed Said', role: 'Procurement Officer', department: 'Procurement', email: 'mohamed.said@ram.co.tz', phone: '+255 773 100 004', status: 'Active', joinDate: '12 Jan 2026' },
    { id: 'TM005', projectId: 'ZAE-2026-001', name: 'Fatma Hassan', role: 'Finance Officer', department: 'Finance', email: 'fatma.hassan@ram.co.tz', phone: '+255 773 100 005', status: 'Active', joinDate: '12 Jan 2026' },
    { id: 'TM006', projectId: 'ZAE-2026-001', name: 'Omar Khamis', role: 'Safety Officer', department: 'HSE', email: 'omar.khamis@ram.co.tz', phone: '+255 773 100 006', status: 'Active', joinDate: '15 Jan 2026' }
  ];
  private teamMembersSubject = new BehaviorSubject<TeamMember[]>(this.teamMembers);

  // ============ GETTERS ============
  getProjects(): Observable<Project[]> { return this.projectsSubject.asObservable(); }
  getProject(id: string): Project | undefined { return this.projects.find(p => p.id === id); }
  getPhases(projectId: string): Phase[] { return this.phases.filter(p => p.projectId === projectId); }
  getActivities(projectId: string): Observable<Activity[]> {
    return new BehaviorSubject(this.activities.filter(a => a.projectId === projectId)).asObservable();
  }
  getReports(projectId: string): Observable<Report[]> {
    return new BehaviorSubject(this.reports.filter(r => r.projectId === projectId)).asObservable();
  }
  getBudgetCategories(): FinanceBudgetCategory[] { return this.budgetCategories; }
  getPayments(projectId: string): Observable<Payment[]> {
    return new BehaviorSubject(this.payments.filter(p => p.projectId === projectId)).asObservable();
  }
  getContracts(projectId: string): Observable<Contract[]> {
    return new BehaviorSubject(this.contracts.filter(c => c.projectId === projectId)).asObservable();
  }
  getPurchaseOrders(projectId: string): Observable<PurchaseOrder[]> {
    return new BehaviorSubject(this.purchaseOrders.filter(p => p.projectId === projectId)).asObservable();
  }
  getSuppliers(): Observable<Supplier[]> { return this.suppliersSubject.asObservable(); }
  getIssueItems(projectId: string): Observable<IssueItem[]> {
    return new BehaviorSubject(this.issueItems.filter(i => i.projectId === projectId)).asObservable();
  }
  getDocuments(projectId: string): Observable<Document[]> {
    return new BehaviorSubject(this.documents.filter(d => d.projectId === projectId)).asObservable();
  }
  getTeamMembers(projectId: string): Observable<TeamMember[]> {
    return new BehaviorSubject(this.teamMembers.filter(t => t.projectId === projectId)).asObservable();
  }

  // ============ CRUD - PROJECTS ============
  addProject(p: Project): void { this.projects.push(p); this.projectsSubject.next([...this.projects]); }
  updateProject(p: Project): void {
    const i = this.projects.findIndex(x => x.id === p.id);
    if (i !== -1) { this.projects[i] = p; this.projectsSubject.next([...this.projects]); }
  }
  deleteProject(id: string): void {
    this.projects = this.projects.filter(p => p.id !== id);
    this.projectsSubject.next([...this.projects]);
  }

  // ============ CRUD - ACTIVITIES ============
  addActivity(a: Activity): void { this.activities.push(a); this.activitiesSubject.next([...this.activities]); }
  updateActivity(a: Activity): void {
    const i = this.activities.findIndex(x => x.id === a.id);
    if (i !== -1) { this.activities[i] = a; this.activitiesSubject.next([...this.activities]); }
  }
  deleteActivity(id: string): void {
    this.activities = this.activities.filter(a => a.id !== id);
    this.activitiesSubject.next([...this.activities]);
  }

  // ============ CRUD - REPORTS ============
  addReport(r: Report): void { this.reports.push(r); this.reportsSubject.next([...this.reports]); }
  updateReport(r: Report): void {
    const i = this.reports.findIndex(x => x.id === r.id);
    if (i !== -1) { this.reports[i] = r; this.reportsSubject.next([...this.reports]); }
  }
  deleteReport(id: string): void {
    this.reports = this.reports.filter(r => r.id !== id);
    this.reportsSubject.next([...this.reports]);
  }

  // ============ CRUD - CONTRACTS ============
  addContract(c: Contract): void { this.contracts.push(c); this.contractsSubject.next([...this.contracts]); }
  updateContract(c: Contract): void {
    const i = this.contracts.findIndex(x => x.id === c.id);
    if (i !== -1) { this.contracts[i] = c; this.contractsSubject.next([...this.contracts]); }
  }
  deleteContract(id: string): void {
    this.contracts = this.contracts.filter(c => c.id !== id);
    this.contractsSubject.next([...this.contracts]);
  }

  // ============ CRUD - PURCHASE ORDERS ============
  addPurchaseOrder(p: PurchaseOrder): void { this.purchaseOrders.push(p); this.purchaseOrdersSubject.next([...this.purchaseOrders]); }
  updatePurchaseOrder(p: PurchaseOrder): void {
    const i = this.purchaseOrders.findIndex(x => x.id === p.id);
    if (i !== -1) { this.purchaseOrders[i] = p; this.purchaseOrdersSubject.next([...this.purchaseOrders]); }
  }
  deletePurchaseOrder(id: string): void {
    this.purchaseOrders = this.purchaseOrders.filter(p => p.id !== id);
    this.purchaseOrdersSubject.next([...this.purchaseOrders]);
  }

  // ============ CRUD - PAYMENTS ============
  addPayment(p: Payment): void { this.payments.push(p); this.paymentsSubject.next([...this.payments]); }
  updatePayment(p: Payment): void {
    const i = this.payments.findIndex(x => x.id === p.id);
    if (i !== -1) { this.payments[i] = p; this.paymentsSubject.next([...this.payments]); }
  }
  deletePayment(id: string): void {
    this.payments = this.payments.filter(p => p.id !== id);
    this.paymentsSubject.next([...this.payments]);
  }

  // ============ CRUD - TEAM ============
  addTeamMember(t: TeamMember): void { this.teamMembers.push(t); this.teamMembersSubject.next([...this.teamMembers]); }
  updateTeamMember(t: TeamMember): void {
    const i = this.teamMembers.findIndex(x => x.id === t.id);
    if (i !== -1) { this.teamMembers[i] = t; this.teamMembersSubject.next([...this.teamMembers]); }
  }
  deleteTeamMember(id: string): void {
    this.teamMembers = this.teamMembers.filter(t => t.id !== id);
    this.teamMembersSubject.next([...this.teamMembers]);
  }

  // ============ CRUD - DOCUMENTS ============
  addDocument(d: Document): void { this.documents.push(d); this.documentsSubject.next([...this.documents]); }
  updateDocument(d: Document): void {
    const i = this.documents.findIndex(x => x.id === d.id);
    if (i !== -1) { this.documents[i] = d; this.documentsSubject.next([...this.documents]); }
  }
  deleteDocument(id: string): void {
    this.documents = this.documents.filter(d => d.id !== id);
    this.documentsSubject.next([...this.documents]);
  }

  // ============ UTILS ============
  generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  }
  formatCurrency(amount: number, currency: string = 'TZS'): string {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}M ${currency}`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K ${currency}`;
    return `${amount.toLocaleString()} ${currency}`;
  }
}

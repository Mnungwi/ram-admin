// ============================================
// RAM PROJECTS - CORE MODELS
// ============================================

export interface Project {
  id: string;
  code: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  client: string;
  description?: string;
  thumbnail?: string;
  budget: number;
  totalBudget?: number;
  currency: string;
  progress: number;
  daysRemaining: number;
  projectManager?: string;
  location?: string;
  contractor?: string;
  category?: string;
}

export interface Phase {
  id: string;
  projectId: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  duration: number;
  progress: number;
  color: string;
  activities: Activity[];
  totalActivities: number;
  completed: number;
  inProgress: number;
  pending: number;
  overdue: number;
}

export interface Activity {
  id: string;
  projectId: string;
  phaseId?: string;
  name: string;
  type: string;
  status: 'Completed' | 'In Progress' | 'Pending' | 'Overdue';
  progress: number;
  startDate: string;
  dueDate: string;
  assignedTo?: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High';
  dependencies?: string[];
}

export interface Report {
  id: string;
  projectId: string;
  reportNo: string;
  title: string;
  type: string;
  status: string;
  periodSubject?: string;
  subject?: string;
  submittedBy?: string;
  submittedOn?: string;
  progress: number;
  phaseId?: string;
  description?: string;
}

export interface FinanceBudgetCategory {
  id: string;
  category: string;
  budget: number;
  committed: number;
  paid: number;
  balance: number;
  progress: number;
}

export interface Payment {
  id: string;
  projectId: string;
  invoiceNo: string;
  description: string;
  date: string;
  dueDate?: string;
  amount: number;
  status: 'Paid' | 'Pending Approval' | 'Overdue' | 'Open';
  currency: string;
}

export interface Invoice {
  id: string;
  projectId: string;
  invoiceNo: string;
  description: string;
  vendor: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  currency: string;
}

export interface Expense {
  id: string;
  projectId: string;
  category: string;
  description: string;
  date: string;
  amount: number;
  approvedBy?: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  currency: string;
}

export interface Contract {
  id: string;
  projectId: string;
  contractNo: string;
  contractor: string;
  category: string;
  value: number;
  currency: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Pending' | 'Completed' | 'Terminated';
  description?: string;
}

export interface PurchaseOrder {
  id: string;
  projectId: string;
  poNo: string;
  supplier: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  expectedDelivery?: string;
  status: 'Open' | 'Received' | 'Partial' | 'Closed';
  contractId?: string;
}

export interface Supplier {
  id: string;
  name: string;
  category: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  totalValue: number;
  currency: string;
  status: 'Active' | 'Inactive';
}

export interface IssueItem {
  id: string;
  projectId: string;
  itemNo: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  issuedTo: string;
  issuedDate: string;
  status: 'Issued' | 'Returned' | 'Lost';
}

export interface Document {
  id: string;
  projectId: string;
  name: string;
  category: string;
  fileType: string;
  fileSize?: string;
  size?: string;
  uploadedBy?: string;
  uploadedOn?: string;
  uploadDate?: string;
  description?: string;
  version?: string;
  tags?: string[];
}

export interface TeamMember {
  id: string;
  projectId: string;
  name: string;
  role: string;
  department?: string;
  email: string;
  phone?: string;
  avatar?: string;
  company?: string;
  status: string;
  joinDate?: string;
  startDate?: string;
  expertise?: string;
}

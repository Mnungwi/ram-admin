// ============================================
// FARIDA PROJECTS - CORE MODELS (single source of truth)
// ============================================

// ─── Auth ────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  jobTitle?: string;
  department?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  mustChangePassword?: boolean;
  lastLoginAt?: string;
  createdAt: string;
  roles?: Role[];
}

export interface AuthResponse {
  user: User;
  permissions: string[];
  accessToken: string;
  refreshToken: string;
}

export interface OtpChallengeResponse {
  requiresOtp: true;
  email: string;
  emailSent: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// ─── Role & Permission ───────────────────────────────────────────────────────
export interface Role {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isSystem: boolean;
  color: string;
  permissions?: Permission[];
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  group?: string;
  description?: string;
}

// ─── API Response Wrappers ───────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}



// ============================================
// DOMAIN MODELS (Project, Activities, Finance, etc.)
// ============================================
// ─── Client ──────────────────────────────────────────────────────────────────
export interface Client {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  country?: string;
  taxNumber?: string;
  notes?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  projects?: any[];
}

export interface ClientRequest {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  country?: string;
  taxNumber?: string;
  notes?: string;
  isActive?: boolean;
}

export interface Project {
  id: string;
  projectCode: string;
  code?: string; // ← backwards compat na zamani
  name: string;
  description?: string;
  image?: string;
  status: 'active' | 'on_hold' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  clientId?: string;
  clientInfo?: Client;
  client?: string; // ← backwards compat
  projectManagerId?: string;
  projectManager?: any;
  location?: string;
  totalBudget?: number;
  budget?: number; // ← backwards compat
  currency?: string;
  progress?: number;
  contractor?: string; // ← backwards compat
  category?: string; // ← backwards compat
  createdById?: string;
  createdAt?: string;
  updatedAt?: string;
  phases?: any[];
  teamMembers?: any[];
  daysRemaining?: number;
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
  status: 'Completed' | 'In Progress' | 'Pending' | 'Overdue' | 'On hold';
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
  vendor?: string;
  date: string;
  dueDate: string;
  amount: number;
  status: string;
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
  taxNumber: string;
  bankDetails: string;
  isActive: 'Active' | 'Inactive';
  notes:String;
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
export interface LetterAttachment {
  id: string;
  letterId: string;
  fileName: string;
  filePath: string;
  fileSize?: number;
  mimeType?: string;
}
// ─── Letter ──────────────────────────────────────────────────────────────────
export interface CcRecipient {
  name: string;
  title?: string;
  email?: string;
}

export interface Letter {
  id: string;
  projectId?: string;
  letterNo: string;
  subject: string;
  body: string;
  letterDate: string;
  type: 'incoming' | 'outgoing' | 'internal' | 'memo';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'received' | 'archived';
  fromName?: string;
  fromTitle?: string;
  fromOrg?: string;
  toName: string;
  toTitle?: string;
  toOrg?: string;
  toEmail?: string;
  ccRecipients?: CcRecipient[];
  attachmentName?: string;
  attachmentFileName?: string;
  attachments?: any[];
  referenceNo?: string;
  notes?: string;
  sentAt?: string;
  createdAt: string;
  createdBy?: any;
  sentBy?: any;
  approvedBy?: any;
  project?: any;
}

export interface LetterStats {
  total: number;
  sent: number;
  drafts: number;
  pendingApproval: number;
  incoming: number;
  outgoing: number;
}
export interface TeamMember {
  id: string;
  projectId: string;
  userId?: string;
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

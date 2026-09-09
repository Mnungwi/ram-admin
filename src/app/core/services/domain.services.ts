import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

// ─── Projects Service ────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class ProjectService extends ApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  getAll(params?: any) {
    return this.get<any>('/projects', params);
  }
  getOne(id: string) {
    return this.get<any>(`/projects/${id}`);
  }
  getOverview(id: string) {
    return this.get<any>(`/projects/${id}/overview`);
  }
  create(data: any) {
    return this.post<any>('/projects', data);
  }
  update(id: string, data: any) {
    return this.put<any>(`/projects/${id}`, data);
  }
  deleteProject(id: string) {
    return this.remove<any>(`/projects/${id}`);
  }

  getActivities(pid: string, params?: any) {
    return this.get<any>(`/projects/${pid}/activities`, params);
  }
  createActivity(pid: string, data: any) {
    return this.post<any>(`/projects/${pid}/activities`, data);
  }
  updateActivity(pid: string, aid: string, data: any) {
    return this.put<any>(`/projects/${pid}/activities/${aid}`, data);
  }
  deleteActivity(pid: string, aid: string) {
    return this.remove<any>(`/projects/${pid}/activities/${aid}`);
  }

  getTeam(pid: string) {
    return this.get<any>(`/projects/${pid}/team`);
  }
  addTeamMember(pid: string, data: any) {
    return this.post<any>(`/projects/${pid}/team`, data);
  }
  removeTeamMember(pid: string, uid: string) {
    return this.remove<any>(`/projects/${pid}/team/${uid}`);
  }
  getStakeholders(pid: string) {
    return this.get<any>(`/projects/${pid}/stakeholders`);
  }

  getReports(pid: string, params?: any) {
    return this.get<any>(`/projects/${pid}/reports`, params);
  }
  createReport(pid: string, data: any) {
    return this.post<any>(`/projects/${pid}/reports`, data);
  }
  updateReport(pid: string, rid: string, data: any) {
    return this.put<any>(`/projects/${pid}/reports/${rid}`, data);
  }
  approveReport(pid: string, rid: string) {
    return this.post<any>(`/projects/${pid}/reports/${rid}/approve`, {});
  }
  deleteReport(pid: string, rid: string) {
    return this.remove<any>(`/projects/${pid}/reports/${rid}`);
  }

  getDocuments(pid: string) {
    return this.get<any>(`/projects/${pid}/documents`);
  }
  uploadDocument(pid: string, fd: FormData) {
    return this.upload<any>(`/projects/${pid}/documents`, fd);
  }

  // Contracts
  getContracts(pid: string) {
    return this.get<any>(`/projects/${pid}/contracts`);
  }
  createContract(pid: string, data: any) {
    return this.post<any>(`/projects/${pid}/contracts`, data);
  }
  updateContract(pid: string, id: string, data: any) {
    return this.put<any>(`/projects/${pid}/contracts/${id}`, data);
  }
  deleteContract(pid: string, id: string) {
    return this.remove<any>(`/projects/${pid}/contracts/${id}`);
  }

  // Purchase Orders

  // LPO
  getLpos(pid: string) {
    return this.get<any>(`/projects/${pid}/lpos`);
  }
  getLpo(pid: string, id: string) {
    return this.get<any>(`/projects/${pid}/lpos/${id}`);
  }
  createLpo(pid: string, data: any) {
    return this.post<any>(`/projects/${pid}/lpos`, data);
  }
  updateLpo(pid: string, id: string, data: any) {
    return this.put<any>(`/projects/${pid}/lpos/${id}`, data);
  }
  deleteLpo(pid: string, id: string) {
    return this.remove<any>(`/projects/${pid}/lpos/${id}`);
  }
  createLpoFromRequisition(pid: string, reqId: string, data: any) {
    return this.post<any>(
      `/projects/${pid}/lpos/from-requisition/${reqId}`,
      data,
    );
  }

  // LPO Workflow
  submitLpo(pid: string, id: string, data: any) {
    return this.post<any>(`/projects/${pid}/lpos/${id}/submit`, data);
  }
  approveLpo(pid: string, id: string, data: any) {
    return this.post<any>(`/projects/${pid}/lpos/${id}/approve`, data);
  }
  sendLpo(pid: string, id: string, data: any) {
    return this.post<any>(`/projects/${pid}/lpos/${id}/send`, data);
  }
  receiveLpo(pid: string, id: string, data: any) {
    return this.post<any>(`/projects/${pid}/lpos/${id}/receive`, data);
  }
  cancelLpo(pid: string, id: string, data: any) {
    return this.post<any>(`/projects/${pid}/lpos/${id}/cancel`, data);
  }

  // LPO Comments
  addLpoComment(pid: string, id: string, data: any) {
    return this.post<any>(`/projects/${pid}/lpos/${id}/comments`, data);
  }
  //supplier
  getProjectSuppliers(pid: string) {
    return this.get<any>(`/projects/${pid}/suppliers`);
  }
  addProjectSupplier(pid: string, data: any) {
    return this.post<any>(`/projects/${pid}/suppliers`, data);
  }
  updateProjectSupplier(pid: string, id: string, data: any) {
    return this.put<any>(`/projects/${pid}/suppliers/${id}`, data);
  }
  removeProjectSupplier(pid: string, id: string) {
    return this.remove<any>(`/projects/${pid}/suppliers/${id}`);
  }

  // Requisitions
  getRequisitions(pid: string, params?: any) {
    return this.get<any>(`/projects/${pid}/requisitions`);
  }
  getRequisition(pid: string, id: string) {
    return this.get<any>(`/projects/${pid}/requisitions/${id}`);
  }
  createRequisition(pid: string, data: any) {
    return this.post<any>(`/projects/${pid}/requisitions`, data);
  }
  updateRequisition(pid: string, id: string, data: any) {
    return this.put<any>(`/projects/${pid}/requisitions/${id}`, data);
  }
  deleteRequisition(pid: string, id: string) {
    return this.remove<any>(`/projects/${pid}/requisitions/${id}`);
  }

  // Workflow
  submitRequisition(pid: string, id: string, data: any) {
    return this.post<any>(`/projects/${pid}/requisitions/${id}/submit`, data);
  }
  reviewRequisition(pid: string, id: string, data: any) {
    return this.post<any>(`/projects/${pid}/requisitions/${id}/review`, data);
  }
  approveRequisition(pid: string, id: string, data: any) {
    return this.post<any>(`/projects/${pid}/requisitions/${id}/approve`, data);
  }
  issueRequisition(pid: string, id: string, data: any) {
    return this.post<any>(`/projects/${pid}/requisitions/${id}/issue`, data);
  }
  rejectRequisition(pid: string, id: string, data: any) {
    return this.post<any>(`/projects/${pid}/requisitions/${id}/reject`, data);
  }
  cancelRequisition(pid: string, id: string, data: any) {
    return this.post<any>(`/projects/${pid}/requisitions/${id}/cancel`, data);
  }

  // Comments
  addRequisitionComment(pid: string, id: string, data: any) {
    return this.post<any>(`/projects/${pid}/requisitions/${id}/comments`, data);
  }

  // Project Technicians
  getProjectTechnicians(projectId: string, params?: any) {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get<any>(`/projects/${projectId}/technicians${q}`);
  }
  assignToProject(projectId: string, data: any) {
    return this.post<any>(`/projects/${projectId}/technicians`, data);
  }
  updateAssignment(projectId: string, assignmentId: string, data: any) {
    return this.put<any>(
      `/projects/${projectId}/technicians/${assignmentId}`,
      data,
    );
  }
  removeFromProject(projectId: string, assignmentId: string) {
    return this.remove<any>(
      `/projects/${projectId}/technicians/${assignmentId}`,
    );
  }
}

// ── PRODUCT SERVICE ───────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class ProductService extends ApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  getAll(params?: any) {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get<any>(`/products/all${q}`);
  }
  getList(params?: any) {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get<any>(`/products${q}`);
  }
  getOne(id: string) {
    return this.get<any>(`/products/${id}`);
  }
  create(data: any) {
    return this.post<any>('/products', data);
  }
  update(id: string, data: any) {
    return this.put<any>(`/products/${id}`, data);
  }
  delete(id: string) {
    return this.remove<any>(`/products/${id}`);
  }

  // Categories
  getCategories() {
    return this.get<any>('/products/categories');
  }
  createCategory(data: any) {
    return this.post<any>('/products/categories', data);
  }
  updateCategory(id: string, data: any) {
    return this.put<any>(`/products/categories/${id}`, data);
  }
  deleteCategory(id: string) {
    return this.remove<any>(`/products/categories/${id}`);
  }
}

// ── UNIT SERVICE ──────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class UnitService extends ApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  getAll(params?: any) {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get<any>(`/units${q}`);
  }
  getCategories() {
    return this.get<any>('/units/categories');
  }
  create(data: any) {
    return this.post<any>('/units', data);
  }
  update(id: string, data: any) {
    return this.put<any>(`/units/${id}`, data);
  }
  delete(id: string) {
    return this.remove<any>(`/units/${id}`);
  }
}

// ─── Finance Service ─────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class FinanceService extends ApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  // ── Overview & Tax Summary ──
  getOverview(pid: string) {
    return this.get<any>(`/projects/${pid}/finance`);
  }
  getTaxSummary(pid: string) {
    return this.get<any>(`/projects/${pid}/finance/tax-summary`);
  }

  // ── Budget ──
  getBudget(pid: string) {
    return this.get<any>(`/projects/${pid}/finance/budget`);
  }
  getCashFlow(pid: string, year?: number) {
    return this.get<any>(`/projects/${pid}/finance/cashflow`, year ? { year } : undefined);
  }

  // ── Site Fund (money handed to storekeepers for site expenses) ──
  getSiteFundBalance(pid: string, params?: any) {
    return this.get<any>(`/projects/${pid}/site-fund/balance`, params);
  }
  getMySiteFundBalance(pid: string, params?: any) {
    return this.get<any>(`/projects/${pid}/site-fund/my-balance`, params);
  }
  listSiteFundDisbursements(pid: string, params?: any) {
    return this.get<any>(`/projects/${pid}/site-fund/disbursements`, params);
  }
  createSiteFundDisbursement(pid: string, data: any) {
    return this.post<any>(`/projects/${pid}/site-fund/disbursements`, data);
  }
  deleteSiteFundDisbursement(pid: string, id: string) {
    return this.remove<any>(`/projects/${pid}/site-fund/disbursements/${id}`);
  }
  getSiteFundSummary(pid: string, params?: any) {
    return this.get<any>(`/projects/${pid}/site-fund/summary`, params);
  }
  upsertBudget(pid: string, data: any) {
    return this.post<any>(`/projects/${pid}/finance/budget`, data);
  }
  deleteBudgetCategory(pid: string, budgetId: string) {
    return this.remove<any>(`/projects/${pid}/finance/budget/${budgetId}`);
  }
  getBudgetDetail(pid: string, budgetId: string) {
    return this.get<any>(`/projects/${pid}/finance/budget/${budgetId}/detail`);
  }
  getBudgetReport(pid: string) {
    return this.get<any>(`/projects/${pid}/finance/report`);
  }

  // ── Payments ──
  getPayments(pid: string, params?: any) {
    return this.get<any>(`/projects/${pid}/finance/payments`, params);
  }
  getPayment(pid: string, paymentId: string) {
    return this.get<any>(`/projects/${pid}/finance/payments/${paymentId}`);
  }
  createPayment(pid: string, data: any) {
    return this.post<any>(`/projects/${pid}/finance/payments`, data);
  }
  updatePayment(pid: string, paymentId: string, data: any) {
    return this.put<any>(
      `/projects/${pid}/finance/payments/${paymentId}`,
      data,
    );
  }
  approvePayment(pid: string, paymentId: string) {
    return this.post<any>(
      `/projects/${pid}/finance/payments/${paymentId}/approve`,
      {},
    );
  }
  deletePayment(pid: string, paymentId: string) {
    return this.remove<any>(`/projects/${pid}/finance/payments/${paymentId}`);
  }

  // ── Invoices ──
  getInvoices(pid: string, params?: any) {
    return this.get<any>(`/projects/${pid}/finance/invoices`, params);
  }
  createInvoice(pid: string, data: any) {
    return this.post<any>(`/projects/${pid}/finance/invoices`, data);
  }
  updateInvoice(pid: string, invoiceId: string, data: any) {
    return this.put<any>(
      `/projects/${pid}/finance/invoices/${invoiceId}`,
      data,
    );
  }
  approveInvoice(pid: string, invoiceId: string) {
    return this.post<any>(
      `/projects/${pid}/finance/invoices/${invoiceId}/approve`,
      {},
    );
  }
  recordInvoicePayment(
    pid: string,
    invoiceId: string,
    data: { amount: number; date: string; notes?: string },
  ) {
    return this.post<any>(
      `/projects/${pid}/finance/invoices/${invoiceId}/record-payment`,
      data,
    );
  }
  getInvoicePayments(pid: string, invoiceId: string) {
    return this.get<any>(
      `/projects/${pid}/finance/invoices/${invoiceId}/payments`,
    );
  }
  updateInvoicePayment(
    pid: string,
    invoiceId: string,
    paymentId: string,
    data: any,
  ) {
    return this.put<any>(
      `/projects/${pid}/finance/invoices/${invoiceId}/payments/${paymentId}`,
      data,
    );
  }
  deleteInvoicePayment(pid: string, invoiceId: string, paymentId: string) {
    return this.remove<any>(
      `/projects/${pid}/finance/invoices/${invoiceId}/payments/${paymentId}`,
    );
  }
  // updateInvoicePayment(
  //   pid: string,
  //   invoiceId: string,
  //   paymentId: string,
  //   data: any,
  // ) {
  //   return this.put<any>(
  //     `/projects/${pid}/finance/invoices/${invoiceId}/payments/${paymentId}`,
  //     data,
  //   );
  // }
  // deleteInvoicePayment(pid: string, invoiceId: string, paymentId: string) {
  //   return this.remove<any>(
  //     `/projects/${pid}/finance/invoices/${invoiceId}/payments/${paymentId}`,
  //   );
  // }
  deleteInvoice(pid: string, invoiceId: string) {
    return this.remove<any>(`/projects/${pid}/finance/invoices/${invoiceId}`);
  }

  // ── Expense Categories (global) ──
  getExpenseCategories() {
    return this.get<any>('/expense-categories');
  }
  createExpenseCategory(data: any) {
    return this.post<any>('/expense-categories', data);
  }
  updateExpenseCategory(categoryId: string, data: any) {
    return this.put<any>(`/expense-categories/${categoryId}`, data);
  }
  deleteExpenseCategory(categoryId: string) {
    return this.remove<any>(`/expense-categories/${categoryId}`);
  }

  // ── Expenses ──
  getExpenses(pid: string, params?: any) {
    return this.get<any>(`/projects/${pid}/finance/expenses`, params);
  }
  createExpense(pid: string, data: any) {
    return this.post<any>(`/projects/${pid}/finance/expenses`, data);
  }
  updateExpense(pid: string, expenseId: string, data: any) {
    return this.put<any>(
      `/projects/${pid}/finance/expenses/${expenseId}`,
      data,
    );
  }
  deleteExpense(pid: string, expenseId: string) {
    return this.remove<any>(`/projects/${pid}/finance/expenses/${expenseId}`);
  }

  // ── Funding Sources ──
  getFundingSources(pid: string) {
    return this.get<any>(`/projects/${pid}/finance/funding-sources`);
  }
  createFundingSource(pid: string, data: any) {
    return this.post<any>(`/projects/${pid}/finance/funding-sources`, data);
  }
  updateFundingSource(pid: string, sourceId: string, data: any) {
    return this.put<any>(
      `/projects/${pid}/finance/funding-sources/${sourceId}`,
      data,
    );
  }
  deleteFundingSource(pid: string, sourceId: string) {
    return this.remove<any>(
      `/projects/${pid}/finance/funding-sources/${sourceId}`,
    );
  }
}


@Injectable({ providedIn: 'root' })
export class DocumentService extends ApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  getAll(projectId: string, params?: any) {
    return this.get<any>(`/projects/${projectId}/documents`, params);
  }
  getStats(projectId: string) {
    return this.get<any>(`/projects/${projectId}/documents/stats`);
  }
  uploadDocument(projectId: string, formData: FormData) {
    return this.upload<any>(`/projects/${projectId}/documents`, formData);
  }
  update(projectId: string, documentId: string, data: any) {
    return this.put<any>(
      `/projects/${projectId}/documents/${documentId}`,
      data,
    );
  }
  uploadNewVersion(projectId: string, documentId: string, formData: FormData) {
    return this.upload<any>(
      `/projects/${projectId}/documents/${documentId}/version`,
      formData,
    );
  }
  getVersions(projectId: string, documentId: string) {
    return this.get<any>(
      `/projects/${projectId}/documents/${documentId}/versions`,
    );
  }
  getDownloadUrl(projectId: string, documentId: string, versionId?: string): string {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || '';
    let url = `${this.base}/projects/${projectId}/documents/${documentId}/download?token=${encodeURIComponent(token)}`;
    if (versionId) url += `&versionId=${versionId}`;
    return url;
  }
  getPreviewUrl(projectId: string, documentId: string, versionId?: string): string {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken') || '';
    let url = `${this.base}/projects/${projectId}/documents/${documentId}/download?inline=true&token=${encodeURIComponent(token)}`;
    if (versionId) url += `&versionId=${versionId}`;
    return url;
  }
  delete(projectId: string, documentId: string) {
    return this.remove<any>(`/projects/${projectId}/documents/${documentId}`);
  }
}

// ─── Letter Service ───────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class LetterService extends ApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  // ── Zilizokuwepo tayari (letters-list / letter-detail zinazitegemea) ──
  getAll(params?: any) {
    return this.get<any>('/letters', params);
  }
  getProjectLetters(projectId: string, params?: any) {
    return this.get<any>(`/projects/${projectId}/letters`, params);
  }
  getInbox(params?: any) {
    return this.get<any>('/letters/inbox', params);
  }
  getOne(id: string) {
    return this.get<any>(`/letters/${id}`);
  }
  // Advisory preview of the reference number the system would auto-assign
  // next — for someone about to hand-write a letter outside the system
  // (e.g. in Word) who needs a safe number to put on it.
  peekNextReference(projectId?: string) {
    return this.get<any>('/letters/next-reference', projectId ? { projectId } : undefined);
  }
  deleteLetter(id: string) {
    return this.remove<any>(`/letters/${id}`);
  }
  submit(id: string) {
    return this.post<any>(`/letters/${id}/submit`, {});
  }
  approve(id: string) {
    return this.post<any>(`/letters/${id}/approve`, {});
  }
  sign(id: string, note?: string) {
    return this.post<any>(`/letters/${id}/sign`, { note: note || '' });
  }
  forward(id: string, userId: string, note?: string) {
    return this.post<any>(`/letters/${id}/forward`, { userId, note: note || '' });
  }
  addComment(id: string, comment: string) {
    return this.post<any>(`/letters/${id}/comments`, { comment });
  }
  archive(id: string) {
    return this.post<any>(`/letters/${id}/archive`, {});
  }
  getStats(pid?: string) {
    const path = pid ? `/projects/${pid}/letters/stats` : '/letters/stats';
    return this.get<any>(path);
  }
  getPreviewUrl(id: string): string {
    return `${this.base}/letters/${id}/preview`;
  }
  downloadPdf(id: string): Observable<Blob> {
    return this.getBlob(`/letters/${id}/pdf`);
  }

  // ── Create / Update (sasa zinasupport Sender/Recipient/CC/Attachment) ──
  create(formData: FormData, projectId?: string) {
    const url = projectId ? `/projects/${projectId}/letters` : '/letters';
    return this.upload<any>(url, formData);
  }
  update(id: string, data: any) {
    return this.put<any>(`/letters/${id}`, data);
  }
  updateAttachment(id: string, formData: FormData) {
    return this.upload<any>(`/letters/${id}/attachment`, formData);
  }
  getAttachmentDownloadUrl(id: string, att?: any, index?: number): string {
    let url = `${this.base}/letters/${id}/attachment/file`;
    const params: string[] = [];
    if (att && (att.filePath || att.fileName)) {
      params.push(`file=${encodeURIComponent(att.filePath || att.fileName)}`);
    }
    if (index !== undefined && index !== null) {
      params.push(`index=${index}`);
    }
    if (params.length) {
      url += '?' + params.join('&');
    }
    return url;
  }

  // ── Send (sasa inatuma EMAIL halisi kwa recipient + CC) ──
  send(id: string, data?: any) {
    return this.post<any>(`/letters/${id}/send`, data || {});
  }
}

// ─── Media Service ─────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class MediaService extends ApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  // Media Library CRUD
  list(params?: any) {
    return this.get<any>('/media', params);
  }
  uploadMedia(formData: FormData) {
    return this.upload<any>('/media', formData);
  }
  updateDetails(mediaId: string, data: { title?: string; altText?: string }) {
    return this.patch<any>(`/media/${mediaId}`, data);
  }
  deleteMedia(mediaId: string) {
    return this.remove<any>(`/media/${mediaId}`);
  }

  // Project Gallery integration
  getProjectGallery(projectId: string) {
    return this.get<any>(`/projects/${projectId}/gallery`);
  }
  addGalleryItem(projectId: string, data: { mediaId: string; caption?: string }) {
    return this.post<any>(`/projects/${projectId}/gallery`, data);
  }
  updateGalleryItem(projectId: string, galleryId: string, data: { caption?: string; displayOrder?: number }) {
    return this.put<any>(`/projects/${projectId}/gallery/${galleryId}`, data);
  }
  removeGalleryItem(projectId: string, galleryId: string) {
    return this.remove<any>(`/projects/${projectId}/gallery/${galleryId}`);
  }
  reorderGallery(projectId: string, items: { id: string; displayOrder: number }[]) {
    return this.post<any>(`/projects/${projectId}/gallery/reorder`, { items });
  }

  getMediaUrl(filename: string): string {
    return `${this.base.replace('/api', '')}/uploads/media/${filename}`;
  }
}

// ─── Store Service ────────────────────────────────────────────────────────────
// @Injectable({ providedIn: 'root' })
// export class StoreService extends ApiService {
//   constructor(http: HttpClient) {
//     super(http);
//   }

//   getOverview(pid?: string) {
//     const p = pid ? `/projects/${pid}/store/overview` : '/store/overview';
//     return this.get<any>(p);
//   }

//   getItems(params?: any) {
//     return this.get<any>('/store', params);
//   }
//   getItem(id: string) {
//     return this.get<any>(`/store/items/${id}`);
//   }
//   createItem(data: any) {
//     return this.post<any>('/store', data);
//   }
//   updateItem(id: string, data: any) {
//     return this.put<any>(`/store/items/${id}`, data);
//   }
//   deleteItem(id: string) {
//     return this.remove<any>(`/store/items/${id}`);
//   }
//   adjustStock(id: string, data: any) {
//     return this.post<any>(`/store/items/${id}/adjust`, data);
//   }
//   getLedger(id: string, params?: any) {
//     return this.get<any>(`/store/items/${id}/ledger`, params);
//   }

//   getReceipts(params?: any) {
//     return this.get<any>('/store/receipts', params);
//   }
//   getReceipt(id: string) {
//     return this.get<any>(`/store/receipts/${id}`);
//   }
//   createReceipt(data: any) {
//     return this.post<any>('/store/receipts', data);
//   }

//   getIssues(params?: any) {
//     return this.get<any>('/store/issues', params);
//   }
//   getIssue(id: string) {
//     return this.get<any>(`/store/issues/${id}`);
//   }
//   createIssue(data: any) {
//     return this.post<any>('/store/issues', data);
//   }
//   approveIssue(id: string) {
//     return this.post<any>(`/store/issues/${id}/approve`, {});
//   }
//   dispatchIssue(id: string, data: any) {
//     return this.post<any>(`/store/issues/${id}/dispatch`, data);
//   }
//   returnIssue(id: string, data: any) {
//     return this.post<any>(`/store/issues/${id}/return`, data);
//   }
// }

// ─── User Service ─────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class UserService extends ApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  getAll(params?: any) {
    return this.get<any>('/users', params);
  }
  getOne(id: string) {
    return this.get<any>(`/users/${id}`);
  }
  create(data: any) {
    return this.post<any>('/users', data);
  }
  update(id: string, data: any) {
    return this.put<any>(`/users/${id}`, data);
  }
  deleteUser(id: string) {
    return this.remove<any>(`/users/${id}`);
  }
  activate(id: string) {
    return this.post<any>(`/users/${id}/activate`, {});
  }
  resetPassword(id: string) {
    return this.post<any>(`/users/${id}/reset-password`, {});
  }
  assignRoles(id: string, data: any) {
    return this.post<any>(`/users/${id}/roles`, data);
  }
  getPermissions(id: string) {
    return this.get<any>(`/users/${id}/permissions`);
  }
  setPermissions(id: string, data: any) {
    return this.post<any>(`/users/${id}/permissions`, data);
  }
}

// ─── Role Service ─────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class RoleService extends ApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  getAll() {
    return this.get<any>('/roles');
  }
  getOne(id: string) {
    return this.get<any>(`/roles/${id}`);
  }
  create(data: any) {
    return this.post<any>('/roles', data);
  }
  // createPermission(data: any) {
  //   return this.post<any>('/permissions', data);
  // }
  createPermission(data: any) {
    return this.post<any>('/permissions', data);
  }
  updatePermission(id: string, data: any) {
    return this.put<any>(`/permissions/${id}`, data);
  }
  deletePermission(id: string) {
    return this.remove<any>(`/permissions/${id}`);
  }
  update(id: string, data: any) {
    return this.put<any>(`/roles/${id}`, data);
  }
  delete(id: string) {
    return this.remove<any>(`/roles/${id}`);
  }
  getAllPermissions() {
    return this.get<any>('/permissions');
  }
  syncPermissions(id: string, permissionIds: string[]) {
    return this.put<any>(`/roles/${id}/permissions`, { permissionIds });
  }
}

// ─── Supplier Service ─────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class SupplierService extends ApiService {
  constructor(http: HttpClient) {
    super(http);
  }
  getAll() {
    return this.get<any>('/suppliers');
  }
  create(data: any) {
    return this.post<any>('/suppliers', data);
  }
  update(id: string, data: any) {
    return this.put<any>(`/suppliers/${id}`, data);
  }
  delete(id: string) {
    return this.remove<any>(`/suppliers/${id}`);
  }
}

@Injectable({ providedIn: 'root' })
export class PhaseService extends ApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  getAll() {
    return this.get<any>('/phases');
  }
  create(data: any) {
    return this.post<any>('/phases', data);
  }
  update(id: string, data: any) {
    return this.put<any>(`/phases/${id}`, data);
  }
  delete(id: string) {
    return this.remove<any>(`/phases/${id}`);
  }
}
// ─── Activity Type Service ────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class ActivityTypeService extends ApiService {
  constructor(http: HttpClient) {
    super(http);
  }
  getAll() {
    return this.get<any>('/activity-types');
  }
  create(data: any) {
    return this.post<any>('/activity-types', data);
  }
  update(id: string, data: any) {
    return this.put<any>(`/activity-types/${id}`, data);
  }
  delete(id: string) {
    return this.remove<any>(`/activity-types/${id}`);
  }
}

// ── STORE SERVICE ─────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class StoreService extends ApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  // Project Store
  getProjectStore(projectId: string) {
    return this.get<any>(`/projects/${projectId}/store`);
  }
  getProjectTransactions(projectId: string) {
    return this.get<any>(`/projects/${projectId}/store/transactions`);
  }
  issueRequisition(projectId: string, data: any) {
    return this.post<any>(`/projects/${projectId}/store/issue-rn`, data);
  }
  transferToCentral(projectId: string, data: any) {
    return this.post<any>(
      `/projects/${projectId}/store/transfer-to-central`,
      data,
    );
  }
  adjustProject(projectId: string, data: any) {
    return this.post<any>(`/projects/${projectId}/store/adjust`, data);
  }

  // Central Store
  getCentralStore() {
    return this.get<any>('/store/central');
  }
  getCentralTransactions() {
    return this.get<any>('/store/central/transactions');
  }
  transferToProject(projectId: string, data: any) {
    return this.post<any>(`/store/central/transfer/${projectId}`, data);
  }
}

@Injectable({ providedIn: 'root' })
export class TechnicianService extends ApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  // Categories
  getCategories() {
    return this.get<any>('/technicians/categories');
  }
  createCategory(data: any) {
    return this.post<any>('/technicians/categories', data);
  }
  updateCategory(id: string, data: any) {
    return this.put<any>(`/technicians/categories/${id}`, data);
  }
  deleteCategory(id: string) {
    return this.remove<any>(`/technicians/categories/${id}`);
  }

  // Technicians
  getAll(params?: any) {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get<any>(`/technicians${q}`);
  }
  getOne(id: string) {
    return this.get<any>(`/technicians/${id}`);
  }
  create(data: any) {
    return this.post<any>('/technicians', data);
  }
  update(id: string, data: any) {
    return this.put<any>(`/technicians/${id}`, data);
  }
  delete(id: string) {
    return this.remove<any>(`/technicians/${id}`);
  }
  getReceipts(id: string, params?: any) {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get<any>(`/technicians/${id}/receipts${q}`);
  }

  // Project Receipts
  getProjectReceipts(projectId: string, params?: any) {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get<any>(`/projects/${projectId}/technician-receipts${q}`);
  }
  distribute(projectId: string, data: any) {
    return this.post<any>(
      `/projects/${projectId}/technician-receipts/distribute`,
      data,
    );
  }
  createReceipt(projectId: string, data: any) {
    return this.post<any>(`/projects/${projectId}/technician-receipts`, data);
  }
  acknowledge(projectId: string, receiptId: string, data?: any) {
    return this.post<any>(
      `/projects/${projectId}/technician-receipts/${receiptId}/acknowledge`,
      data || {},
    );
  }
  deleteReceipt(projectId: string, receiptId: string) {
    return this.remove<any>(
      `/projects/${projectId}/technician-receipts/${receiptId}`,
    );
  }

  // Ongeza kwenye TechnicianService:
  getProjectTechnicians(projectId: string, params?: any) {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get<any>(`/projects/${projectId}/technicians${q}`);
  }
  assignToProject(projectId: string, data: any) {
    return this.post<any>(`/projects/${projectId}/technicians`, data);
  }
  updateAssignment(projectId: string, assignmentId: string, data: any) {
    return this.put<any>(
      `/projects/${projectId}/technicians/${assignmentId}`,
      data,
    );
  }
  removeFromProject(projectId: string, assignmentId: string) {
    return this.remove<any>(
      `/projects/${projectId}/technicians/${assignmentId}`,
    );
  }
}

// ─── Storekeeper Service ────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class StorekeeperService extends ApiService {
  constructor(http: HttpClient) {
    super(http);
  }

  getProjectStorekeepers(projectId: string, params?: any) {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get<any>(`/projects/${projectId}/storekeepers${q}`);
  }
  assignToProject(projectId: string, data: any) {
    return this.post<any>(`/projects/${projectId}/storekeepers`, data);
  }
  updateAssignment(projectId: string, assignmentId: string, data: any) {
    return this.put<any>(
      `/projects/${projectId}/storekeepers/${assignmentId}`,
      data,
    );
  }
  removeFromProject(projectId: string, assignmentId: string) {
    return this.remove<any>(
      `/projects/${projectId}/storekeepers/${assignmentId}`,
    );
  }

  // Global (Administration) — all storekeepers across all projects
  getAll(params?: any) {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get<any>(`/storekeepers${q}`);
  }
  setStatus(assignmentId: string, isActive: boolean) {
    return this.patch<any>(`/storekeepers/${assignmentId}/status`, {
      isActive,
    });
  }
}

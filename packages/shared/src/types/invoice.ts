export type InvoiceType = 'INCOME' | 'COST';
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type InvoiceSource = 'MANUAL' | 'KSEF' | 'SCAN';

export interface InvoiceItem {
  id?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  unit?: string;
}

export interface Invoice {
  id: string;
  userId: string;
  type: InvoiceType;
  source: InvoiceSource;
  status: InvoiceStatus;
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  paymentDate?: Date;
  sellerName: string;
  sellerNip: string;
  sellerAddress?: string;
  buyerName: string;
  buyerNip?: string;
  buyerAddress?: string;
  items: InvoiceItem[];
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  currency: string;
  ksefId?: string;
  ksefNumber?: string;
  pdfUrl?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInvoiceDto {
  type: InvoiceType;
  buyerName: string;
  buyerNip?: string;
  buyerAddress?: string;
  issueDate: Date;
  dueDate: Date;
  items: Omit<InvoiceItem, 'id'>[];
  currency?: string;
  notes?: string;
}

export interface InvoiceListParams {
  type?: InvoiceType;
  status?: InvoiceStatus;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedInvoices {
  data: Invoice[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

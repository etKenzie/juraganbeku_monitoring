export interface InvoiceData {
  kode_gerai: string;
  total_amount: number;
  invoice_id: string;
  nama_gerai: string;
  va_number: string;
  sales_date: string;
  pickup_date: string;
}

export interface Company {
  id: number;
  name: string;
  slug: string;
  db_name: string;
  desc: string;
}

export interface PDFInvoiceConfig {
  companyName: string;
  companyLogo?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyCity?: string;
  companyEmail?: string;
  invoiceTitle?: string;
  invoiceNo?: string;
  showLogo?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
  secondaryColor?: string;
  fontFamily?: string;
  fontSize?: number;
  pageSize?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
}

export interface PDFInvoiceData {
  invoice: InvoiceData;
  company: Company;
  config: PDFInvoiceConfig;
  generatedDate: Date;
}

export interface PDFGenerator {
  generatePDF(data: PDFInvoiceData): Promise<void>;
  getConfig(): PDFInvoiceConfig;
}

export interface PDFGeneratorFactory {
  createGenerator(companySlug: string): PDFGenerator;
} 
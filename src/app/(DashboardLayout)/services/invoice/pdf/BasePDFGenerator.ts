import { jsPDF } from "jspdf";
import { PDFGenerator, PDFInvoiceConfig, PDFInvoiceData } from "../types/InvoicePDFTypes";

export abstract class BasePDFGenerator implements PDFGenerator {
  protected config: PDFInvoiceConfig;

  constructor(config: PDFInvoiceConfig) {
    this.config = config;
  }

  abstract generatePDF(data: PDFInvoiceData): Promise<void>;
  
  getConfig(): PDFInvoiceConfig {
    return this.config;
  }

  protected createDocument(): jsPDF {
    const doc = new jsPDF({
      orientation: this.config.orientation || 'portrait',
      unit: 'mm',
      format: this.config.pageSize || 'A4'
    });

    // Set default font
    doc.setFont(this.config.fontFamily || 'helvetica');
    doc.setFontSize(this.config.fontSize || 12);

    return doc;
  }

  protected async addLogo(doc: jsPDF, y: number, width: number = 80, height: number = 20): Promise<void> {
    if (!this.config.showLogo || !this.config.companyLogo) return;

    const pageWidth = doc.internal.pageSize.getWidth();
    const x = (pageWidth - width) / 2; // Center the logo horizontally

    try {
      // Try to load the actual logo image
      const logoImage = await this.loadImage("/images/logos/topan.png");
      doc.addImage(logoImage, 'PNG', x, y, width, height, undefined, 'FAST');
    } catch (error) {
      console.error('Failed to load logo, using placeholder:', error);
      // Fallback: Draw a placeholder
      doc.setFillColor(240, 240, 240);
      doc.rect(x, y, width, height, 'F');
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(8);
      doc.text('TOKOPANDAI', x + width/2, y + height/2, { align: 'center' });
    }
  }

  protected addFooter(doc: jsPDF, data: PDFInvoiceData): void {
    if (!this.config.showFooter) return;

    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const y = pageHeight - 20;

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${data.generatedDate.toLocaleDateString()}`, margin, y);
    doc.text(`Page ${doc.getCurrentPageInfo().pageNumber}`, pageWidth - margin, y, { align: 'right' });
  }

  protected addInvoiceInfo(doc: jsPDF, data: PDFInvoiceData): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 55; // Start below logo with more space

    // Invoice details in two columns with smaller font and reduced spacing
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Left column (switched from right)
    doc.text(`To:`, margin, y);
    doc.text(`${data.company.name}`, margin, y + 6);
    doc.text(`${this.config.companyAddress || 'N/A'}`, margin, y + 12); // Reduced spacing
    doc.text(`${this.config.companyCity || 'N/A'}`, margin, y + 18); // Reduced spacing

    // Right column (switched from left)
    doc.text(`Invoice No: ${this.config.invoiceNo}`, pageWidth - margin, y , { align: 'right' });
    doc.text(`Date: ${data.invoice.sales_date}`, pageWidth - margin, y + 6, { align: 'right' });
    doc.text(`Due Date: ${data.invoice.pickup_date}`, pageWidth - margin, y + 12, { align: 'right' }); // Reduced spacing
    doc.text(`Currency: IDR`, pageWidth - margin, y + 18, { align: 'right' }); // Reduced spacing
    
  }

  protected addInvoiceTable(doc: jsPDF, data: PDFInvoiceData): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 80; // Start below invoice info with more space

    // Table header with neutral styling
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y, pageWidth - 2 * margin, 10, 'F');
    
    doc.setFontSize(11); // Reduced font size
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('Description', margin + 5, y + 7);
    doc.text('Amount', pageWidth - margin - 30, y + 7, { align: 'right' });

    y += 15;

    // Table content
    doc.setFontSize(9); // Reduced font size
    doc.setFont('helvetica', 'normal');
    doc.text('Invoice Total', margin + 5, y + 7);
    doc.text(`Rp ${data.invoice.total_amount.toLocaleString()}`, pageWidth - margin - 5, y + 7, { align: 'right' });

    y += 20;

    // Total line
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 0, 0);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    doc.setFontSize(13); // Reduced font size
    doc.setFont('helvetica', 'bold');
    doc.text('Total Amount:', pageWidth - margin - 60, y + 7, { align: 'right' });
    doc.text(`Rp ${data.invoice.total_amount.toLocaleString()}`, pageWidth - margin - 5, y + 7, { align: 'right' });
  }

  private getCityFromAddress(address?: string): string {
    if (!address) return 'N/A';
    
    // Extract city from address (assuming format like "Jl. Example No. 123, Jakarta")
    const parts = address.split(',');
    if (parts.length > 1) {
      return parts[parts.length - 1].trim();
    }
    return 'N/A';
  }

  protected async loadImage(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = url;
    });
  }
} 
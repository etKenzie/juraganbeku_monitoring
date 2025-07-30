import { jsPDF } from "jspdf";
import { ExtendedInvoiceData, PDFGenerator, PDFInvoiceConfig, PDFInvoiceData } from "./types/InvoicePDFTypes";

const formatDate = (date: string | Date | null | undefined) => {
  if (!date) return '';
  const dateStr = typeof date === 'string' ? date : date.toISOString();
  return dateStr.split('T')[0];
};

export abstract class BasePDFGenerator implements PDFGenerator {
  protected config: PDFInvoiceConfig;

  constructor(config: PDFInvoiceConfig) {
    this.config = config;
  }

  abstract generatePDF(extendedData: ExtendedInvoiceData, company: any): Promise<void>;
  
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

  protected addFooter(doc: jsPDF, generatedDate: Date, pageNumber?: number, totalPages?: number): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;

    // Footer line
    doc.setLineWidth(0.5);
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, pageHeight - 40, pageWidth - margin, pageHeight - 40);

    // Footer text
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');

    const footerText = `Generated on ${generatedDate.toLocaleDateString()} at ${generatedDate.toLocaleTimeString()}`;
    const pageInfo = pageNumber && totalPages ? `Page ${pageNumber} of ${totalPages}` : '';

    // Left side - generation info
    doc.text(footerText, margin, pageHeight - 25);

    // Right side - page info
    if (pageInfo) {
      const textWidth = doc.getTextWidth(pageInfo);
      doc.text(pageInfo, pageWidth - margin - textWidth, pageHeight - 25);
    }
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

  protected addExtendedInvoiceInfo(doc: jsPDF, company: any, extendedData: ExtendedInvoiceData): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 55; // Start below logo with more space

    // Invoice details in two columns with smaller font and reduced spacing
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Left column (switched from right)
    doc.text(`To:`, margin, y);
    doc.text(`${company.name}`, margin, y + 6);
    doc.text(`${this.config.companyAddress || 'N/A'}`, margin, y + 12); // Reduced spacing
    doc.text(`${this.config.companyCity || 'N/A'}`, margin, y + 18); // Reduced spacing

    // Right column (switched from left)
    doc.text(`Invoice No: ${extendedData.invoice_no}`, pageWidth - margin, y, { align: 'right' });
    doc.text(`Date: ${formatDate(extendedData.date)}`, pageWidth - margin, y + 6, { align: 'right' });
    doc.text(`Due Date: ${formatDate(extendedData.due_date)}`, pageWidth - margin, y + 12, { align: 'right' }); // Reduced spacing
    doc.text(`Period: ${formatDate(extendedData.start_date)} - ${formatDate(extendedData.end_date)}`, pageWidth - margin, y + 18, { align: 'right' }); // Reduced spacing
  }

  protected addDynamicTable(doc: jsPDF, tableData: {
    headers: string[];
    rows: string[][];
  }): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let y = 80; // Start below invoice info with more space

    const columnCount = tableData.headers.length;
    
    // Calculate column positions dynamically based on column count
    let columnPositions: number[];
    let columnWidths: number[];
    
    if (columnCount === 4) {
      // For 4 columns (like Jiwa) - MANUALLY ADJUSTABLE
      columnPositions = [
        margin + 5,      // First column
        margin + 35,     // Second column
        margin + 100,    // Third column
        pageWidth - margin - 5 // Fourth column (right aligned)
      ];
      columnWidths = [30, 65, 80, 80]; // MANUALLY ADJUSTABLE widths for each column
    } else if (columnCount === 5) {
      // For 5 columns - MANUALLY ADJUSTABLE
      columnPositions = [
        margin + 5,      // First column
        margin + 30,     // Second column
        margin + 85,     // Third column
        margin + 120,    // Fourth column
        pageWidth - margin - 5 // Fifth column (right aligned)
      ];
      columnWidths = [25, 55, 35, 30, 30]; // MANUALLY ADJUSTABLE widths for each column
    } else if (columnCount === 6) {
      // For 6 columns - MANUALLY ADJUSTABLE
      columnPositions = [
        margin + 5,      // First column
        margin + 30,     // Second column
        margin + 70,     // Third column
        margin + 120,    // Fourth column
        margin + 170,    // Fifth column
        pageWidth - margin - 5 // Sixth column (right aligned)
      ];
      columnWidths = [25, 40, 50, 50, 60, 80]; // MANUALLY ADJUSTABLE widths for each column
    } else {
      // For other column counts, distribute evenly as fallback
      const availableWidth = pageWidth - 2 * margin - 20;
      const columnWidth = availableWidth / columnCount;
      columnPositions = [];
      columnWidths = [];
      
      for (let i = 0; i < columnCount; i++) {
        columnPositions.push(margin + 10 + (i * columnWidth));
        columnWidths.push(columnWidth - 5);
      }
    }

    // Calculate total pages needed
    const rowHeight = 8; // Height of each row
    const headerHeight = 12; // Height of header section
    const footerHeight = 50; // Space needed for footer
    const availableHeight = pageHeight - y - footerHeight; // Available space for table content
    const maxRowsPerPage = Math.floor(availableHeight / rowHeight);
    const totalPages = Math.ceil(tableData.rows.length / maxRowsPerPage) + 1; // +1 for first page with header

    // Table header with improved styling
    doc.setFillColor(245, 245, 245); // Lighter gray background
    doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F'); // Smaller height (8 instead of 10)
    
    // Add black border around the header
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(margin, y, pageWidth - 2 * margin, 8, 'S');
    
    doc.setFontSize(9); // Smaller font size for headers
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    
    // Headers with proper alignment
    tableData.headers.forEach((header, index) => {
      const isLastColumn = index === columnCount - 1;
      const alignment = isLastColumn ? { align: 'right' as const } : undefined;
      
      // Truncate header if too long for column
      const maxWidth = columnWidths[index] - 5;
      let displayText = header;
      if (doc.getTextWidth(header) > maxWidth) {
        // Find the longest substring that fits
        for (let i = header.length - 1; i > 0; i--) {
          const truncated = header.substring(0, i) + '...';
          if (doc.getTextWidth(truncated) <= maxWidth) {
            displayText = truncated;
            break;
          }
        }
      }
      
      doc.text(displayText, columnPositions[index], y + 5, alignment);
    });

    y += 12; // Reduced spacing after header

    // Table content with page break handling
    doc.setFontSize(9); // Smaller font size for content
    doc.setFont('helvetica', 'normal');
    
    let totalAmount = 0;
    let currentRow = 0;
    let pageNumber = 1;
    
    tableData.rows.forEach((row, rowIndex) => {
      // Check if we need a new page
      if (currentRow >= maxRowsPerPage) {
        // Add footer to current page
        this.addFooter(doc, new Date(), pageNumber, totalPages);
        
        // Add page break
        doc.addPage();
        pageNumber++;
        y = 20; // Reset Y position for new page
        
        // Re-add header on new page
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.3);
        doc.rect(margin, y, pageWidth - 2 * margin, 8, 'S');
        
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        
        tableData.headers.forEach((header, index) => {
          const isLastColumn = index === columnCount - 1;
          const alignment = isLastColumn ? { align: 'right' as const } : undefined;
          
          // Truncate header if too long for column
          const maxWidth = columnWidths[index] - 5;
          let displayText = header;
          if (doc.getTextWidth(header) > maxWidth) {
            for (let i = header.length - 1; i > 0; i--) {
              const truncated = header.substring(0, i) + '...';
              if (doc.getTextWidth(truncated) <= maxWidth) {
                displayText = truncated;
                break;
              }
            }
          }
          
          doc.text(displayText, columnPositions[index], y + 5, alignment);
        });
        
        y += 12;
        currentRow = 0;
      }
      
      // Calculate total from the last column (Total Amount)
      const amountStr = row[row.length - 1].replace(/[^\d]/g, ''); // Remove non-digits
      totalAmount += parseInt(amountStr) || 0;
      
      // Add row data with proper text wrapping
      row.forEach((cell, index) => {
        const isLastColumn = index === columnCount - 1;
        const alignment = isLastColumn ? { align: 'right' as const } : undefined;
        
        // Truncate cell text if too long for column
        const maxWidth = columnWidths[index] - 5;
        let displayText = cell;
        if (doc.getTextWidth(cell) > maxWidth) {
          // Find the longest substring that fits
          for (let i = cell.length - 1; i > 0; i--) {
            const truncated = cell.substring(0, i) + '...';
            if (doc.getTextWidth(truncated) <= maxWidth) {
              displayText = truncated;
              break;
            }
          }
        }
        
        doc.text(displayText, columnPositions[index], y + 7, alignment);
      });
      
      y += rowHeight;
      currentRow++;
    });

    // Check if we need a new page for the total line
    if (y + 20 > pageHeight - footerHeight) {
      // Add footer to current page
      this.addFooter(doc, new Date(), pageNumber, totalPages);
      
      doc.addPage();
      y = 20;
      pageNumber++;
    }

    y += 8; // Reduced spacing before total line

    // Total line
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 0, 0);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8; // Reduced spacing after total line

    // Grand total row with better spacing to avoid overlap
    doc.setFontSize(12); // Slightly smaller font size for total
    doc.setFont('helvetica', 'bold');
    
    // Position "Total Amount" text with enough space from the amount
    const totalText = 'Total Amount:';
    const totalAmountText = `Rp ${totalAmount.toLocaleString()}`;
    
    // Position text to avoid overlap - use appropriate column positions
    const totalTextColumn = columnCount >= 3 ? columnPositions[columnCount - 3] : columnPositions[0];
    const totalAmountColumn = columnPositions[columnCount - 1];
    
    doc.text(totalText, totalTextColumn, y + 7, { align: 'left' });
    doc.text(totalAmountText, totalAmountColumn, y + 7, { align: 'right' });
    
    // Add footer to the last page
    this.addFooter(doc, new Date(), pageNumber, totalPages);
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
import { jsPDF } from "jspdf";
import { InvoiceData, PDFInvoiceConfig, PDFInvoiceData } from "../../types/InvoicePDFTypes";
import { BasePDFGenerator } from "../BasePDFGenerator";

interface GeraiSummary {
  kode_gerai: string;
  nama_gerai: string;
  total_amount: number;
  charge_amount: number;
}

export class JiwaPDFGenerator extends BasePDFGenerator {
  constructor() {
    const config: PDFInvoiceConfig = {
      companyName: "Janji Jiwa",
      companyLogo: "/images/logos/topan.png",
      companyAddress: "Jl. Janji Jiwa No. 654,",
      companyCity: "Jakarta Barat",
      companyPhone: "+62 274 1234 5678",
      companyEmail: "info@janjijiwa.com",
      invoiceTitle: "JANJI JIWA INVOICE",
      invoiceNo: "235/TPN-KBN/",
      showLogo: true,
      showHeader: false,
      showFooter: true,
      secondaryColor: "#FFFFFF",
      fontFamily: "helvetica",
      fontSize: 12,
      pageSize: "A4",
      orientation: "portrait"
    };
    super(config);
  }

  private processInvoicesByGerai(invoices: InvoiceData[]): GeraiSummary[] {
    const geraiMap = new Map<string, GeraiSummary>();

    // Group invoices by kode_gerai and sum up total amounts
    invoices.forEach(invoice => {
      const { kode_gerai, nama_gerai, total_amount } = invoice;
      
      if (geraiMap.has(kode_gerai)) {
        // Add to existing gerai
        const existing = geraiMap.get(kode_gerai)!;
        existing.total_amount += total_amount;
      } else {
        // Create new gerai entry
        geraiMap.set(kode_gerai, {
          kode_gerai,
          nama_gerai,
          total_amount,
          charge_amount: 0 // Will be calculated below
        });
      }
    });

    // Calculate charge amounts for each gerai
    const geraiSummaries: GeraiSummary[] = [];
    geraiMap.forEach(gerai => {
      // If total amount > 1,000,000,000, charge 3,000,000, otherwise charge 2,500,000
      gerai.charge_amount = gerai.total_amount > 1000000000 ? 3000000 : 2500000;
      geraiSummaries.push(gerai);
    });

    return geraiSummaries;
  }

  protected addJiwaInvoiceTable(doc: jsPDF, geraiSummaries: GeraiSummary[]): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 80; // Start below invoice info

    // Define column positions for better alignment
    const col1X = margin + 5;      // Kode Gerai
    const col2X = margin + 35;     // Nama Gerai
    const col3X = margin + 110;    // Pickup Total
    const col4X = pageWidth - margin - 5; // Total Amount (right aligned)

    // Table header with smaller background and black border
    doc.setFillColor(245, 245, 245); // Lighter gray background
    doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F'); // Smaller height (8 instead of 10)
    
    // Add black border around the header
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(margin, y, pageWidth - 2 * margin, 8, 'S');
    
    // Smaller font for headers - vertically centered but left-aligned to match data
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    
    // Headers left-aligned to match the data below (only vertically centered)
    doc.text('Kode Gerai', col1X, y + 5);
    doc.text('Nama Gerai', col2X, y + 5);
    doc.text('Pickup Total', col3X, y + 5);
    doc.text('Total Amount', col4X, y + 5, { align: 'right' });

    y += 12; // Reduced spacing after header

    // Table content with consistent alignment
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    let totalCharge = 0;
    geraiSummaries.forEach(gerai => {
      totalCharge += gerai.charge_amount;
      
      // Use the same column positions for perfect alignment
      doc.text(gerai.kode_gerai, col1X, y + 7);
      doc.text(gerai.nama_gerai, col2X, y + 7);
      doc.text(`Rp ${gerai.total_amount.toLocaleString()}`, col3X, y + 7);
      doc.text(`Rp ${gerai.charge_amount.toLocaleString()}`, col4X, y + 7, { align: 'right' });
      
      y += 8;
    });

    y += 10;

    // Total line
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 0, 0);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Grand total row with better spacing to avoid overlap
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    
    // Position "Grand Total" text with enough space from the amount
    const grandTotalText = 'Grand Total:';
    const grandTotalAmount = `Rp ${totalCharge.toLocaleString()}`;
    
    // Calculate text width to ensure proper spacing
    const textWidth = doc.getTextWidth(grandTotalText);
    const amountWidth = doc.getTextWidth(grandTotalAmount);
    
    // Position text to avoid overlap
    doc.text(grandTotalText, col3X, y + 7);
    doc.text(grandTotalAmount, col4X, y + 7, { align: 'right' });
  }

  async generatePDF(data: PDFInvoiceData, allInvoices?: InvoiceData[]): Promise<void> {
    const doc = this.createDocument();

    // Add logo at the top (centered)
    await this.addLogo(doc, 20);

    // Add invoice info using base method
    this.addInvoiceInfo(doc, data);
    console.log(allInvoices)

    // Process invoices by gerai if provided
    if (allInvoices && allInvoices.length > 0) {
      const geraiSummaries = this.processInvoicesByGerai(allInvoices);
      this.addJiwaInvoiceTable(doc, geraiSummaries);
    } else {
      // Fallback to original table if no invoices provided
      this.addInvoiceTable(doc, data);
    }

    // Add footer using base method
    this.addFooter(doc, data);

    // Save the PDF
    doc.save(`jiwa_invoice_${data.invoice.invoice_id}.pdf`);
  }
} 
import { PDFInvoiceConfig, PDFInvoiceData } from "../../types/InvoicePDFTypes";
import { BasePDFGenerator } from "../BasePDFGenerator";

export class HangryPDFGenerator extends BasePDFGenerator {
  constructor() {
    const config: PDFInvoiceConfig = {
      companyName: "Hangry",
      companyLogo: "/images/logos/topan.png",
      companyAddress: "Jl. Hangry No. 789, Surabaya",
      companyPhone: "+62 31 9876 5432",
      companyEmail: "info@hangry.com",
      invoiceTitle: "HANGRY INVOICE",
      showLogo: true,
      showHeader: false,
      showFooter: true,
      secondaryColor: "#FFF3E0",
      fontFamily: "helvetica",
      fontSize: 12,
      pageSize: "A4",
      orientation: "portrait"
    };
    super(config);
  }

  async generatePDF(data: PDFInvoiceData): Promise<void> {
    const doc = this.createDocument();

    // Add logo at the top (centered)
    await this.addLogo(doc, 20);

    // Add invoice info using base method
    this.addInvoiceInfo(doc, data);

    // Add invoice table using base method
    this.addInvoiceTable(doc, data);

    // Add footer using base method
    this.addFooter(doc, data);

    // Save the PDF
    doc.save(`hangry_invoice_${data.invoice.invoice_id}.pdf`);
  }
} 
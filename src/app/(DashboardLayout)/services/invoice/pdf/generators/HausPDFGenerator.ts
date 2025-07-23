import { PDFInvoiceConfig, PDFInvoiceData } from "../../types/InvoicePDFTypes";
import { BasePDFGenerator } from "../BasePDFGenerator";

export class HausPDFGenerator extends BasePDFGenerator {
  constructor() {
    const config: PDFInvoiceConfig = {
      companyName: "Haus",
      companyLogo: "/images/logos/topan.png",
      companyAddress: "Jl. Haus No. 321, Medan",
      companyPhone: "+62 61 1234 5678",
      companyEmail: "info@haus.com",
      invoiceTitle: "HAUS INVOICE",
      showLogo: true,
      showHeader: false,
      showFooter: true,
      secondaryColor: "#E3F2FD",
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
    doc.save(`haus_invoice_${data.invoice.invoice_id}.pdf`);
  }
} 
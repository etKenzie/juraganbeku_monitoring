import { PDFInvoiceConfig, PDFInvoiceData } from "../../types/InvoicePDFTypes";
import { BasePDFGenerator } from "../BasePDFGenerator";

export class DarmiPDFGenerator extends BasePDFGenerator {
  constructor() {
    const config: PDFInvoiceConfig = {
      companyName: "Darmi",
      companyLogo: "/images/logos/topan.png",
      companyAddress: "Jl. Darmi No. 456, Bandung",
      companyPhone: "+62 22 8765 4321",
      companyEmail: "info@darmi.com",
      invoiceTitle: "DARMİ INVOICE",
      showLogo: true,
      showHeader: false,
      showFooter: true,
      secondaryColor: "#E8F5E8",
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
    doc.save(`darmi_invoice_${data.invoice.invoice_id}.pdf`);
  }
} 
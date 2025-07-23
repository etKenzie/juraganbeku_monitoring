import { PDFInvoiceConfig, PDFInvoiceData } from "../../types/InvoicePDFTypes";
import { BasePDFGenerator } from "../BasePDFGenerator";

export class DefaultPDFGenerator extends BasePDFGenerator {
  constructor() {
    const config: PDFInvoiceConfig = {
      companyName: "TokoPandai",
      companyLogo: "/images/logos/topan.png",
      companyAddress: "Jl. Example No. 123, Jakarta",
      companyPhone: "+62 21 1234 5678",
      companyEmail: "info@tokopandai.id",
      invoiceTitle: "INVOICE",
      showLogo: true,
      showHeader: false,
      showFooter: true,
      secondaryColor: "#f5f5f5",
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
    await this.addLogo(doc, 20, 50, 25);

    // Add invoice info using base method
    this.addInvoiceInfo(doc, data);

    // Add invoice table using base method
    this.addInvoiceTable(doc, data);

    // Add footer using base method
    this.addFooter(doc, data);

    // Save the PDF
    doc.save(`invoice_${data.invoice.invoice_id}_${data.company.slug}.pdf`);
  }
} 
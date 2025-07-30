import { BasePDFGenerator } from "../BasePDFGenerator";
import { Company, ExtendedInvoiceData, PDFInvoiceConfig } from "../types/InvoicePDFTypes";

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

  async generatePDF(extendedData: ExtendedInvoiceData, company: Company): Promise<void> {
    const doc = this.createDocument();

    // Add logo at the top (centered)
    await this.addLogo(doc, 20);

    // Add invoice info using extended data
    this.addExtendedInvoiceInfo(doc, company, extendedData);

    // Add dynamic table using extended data (includes footer handling)
    this.addDynamicTable(doc, extendedData.table_data);

    // Save the PDF with the actual invoice number
    const fileName = `haus_invoice_${extendedData.invoice_no}.pdf`;
    doc.save(fileName);
  }
} 
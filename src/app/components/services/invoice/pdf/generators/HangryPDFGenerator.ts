import { BasePDFGenerator } from "../BasePDFGenerator";
import { Company, ExtendedInvoiceData, PDFInvoiceConfig } from "../types/InvoicePDFTypes";

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

  async generatePDF(extendedData: ExtendedInvoiceData, company: Company): Promise<void> {
    const doc = this.createDocument();

    // Add logo at the top (centered)
    await this.addLogo(doc, 20);

    // Add invoice info using extended data
    this.addExtendedInvoiceInfo(doc, company, extendedData);

    // Add dynamic table using extended data (includes footer handling)
    this.addDynamicTable(doc, extendedData.table_data);

    // Save the PDF with the actual invoice number
    const fileName = `hangry_invoice_${extendedData.invoice_no}.pdf`;
    doc.save(fileName);
  }
} 
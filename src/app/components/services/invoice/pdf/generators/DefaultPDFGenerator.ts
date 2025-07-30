import { BasePDFGenerator } from "../BasePDFGenerator";
import { Company, ExtendedInvoiceData, PDFInvoiceConfig } from "../types/InvoicePDFTypes";

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

  async generatePDF(extendedData: ExtendedInvoiceData, company: Company): Promise<void> {
    const doc = this.createDocument();

    // Add logo at the top (centered)
    await this.addLogo(doc, 20);

    // Add invoice info using extended data
    this.addExtendedInvoiceInfo(doc, company, extendedData);

    // Add dynamic table using extended data (includes footer handling)
    this.addDynamicTable(doc, extendedData.table_data);

    // Save the PDF with the actual invoice number
    const fileName = `invoice_${extendedData.invoice_no}_${company.slug}.pdf`;
    doc.save(fileName);
  }
} 
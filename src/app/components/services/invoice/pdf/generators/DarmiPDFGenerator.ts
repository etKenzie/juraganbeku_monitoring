import { BasePDFGenerator } from "../BasePDFGenerator";
import { Company, ExtendedInvoiceData, PDFInvoiceConfig } from "../types/InvoicePDFTypes";

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

  async generatePDF(extendedData: ExtendedInvoiceData, company: Company): Promise<void> {
    const doc = this.createDocument();

    // Add logo at the top (centered)
    await this.addLogo(doc, 20);

    // Add invoice info using extended data
    this.addExtendedInvoiceInfo(doc, company, extendedData);

    // Add dynamic table using extended data (includes footer handling)
    this.addDynamicTable(doc, extendedData.table_data);

    // Save the PDF with the actual invoice number
    const fileName = `darmi_invoice_${extendedData.invoice_no}.pdf`;
    doc.save(fileName);
  }
} 
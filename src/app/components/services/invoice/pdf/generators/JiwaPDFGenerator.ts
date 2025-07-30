import { BasePDFGenerator } from "../BasePDFGenerator";
import { Company, ExtendedInvoiceData, PDFInvoiceConfig } from "../types/InvoicePDFTypes";

interface GeraiSummary {
  kode_gerai: string;
  nama_gerai: string;
  pickup_total: number; // Sum of all invoice amounts for this gerai
  total_amount: number; // Calculated amount based on pickup total threshold
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


  async generatePDF(extendedData: ExtendedInvoiceData, company: Company): Promise<void> {
    const doc = this.createDocument();

    // Log the extended data for janji_jiwa
    // console.log('=== JiwaPDFGenerator Received Extended Data ===');
    // console.log('Start Date:', extendedData.start_date);
    // console.log('End Date:', extendedData.end_date);
    // console.log('Due Date:', extendedData.due_date);
    // console.log('Invoice Date:', extendedData.date);
    // console.log('Invoice Number:', extendedData.invoice_no);
    // console.log('Table Data:', extendedData.table_data);
    // console.log('Table Data JSON:', JSON.stringify(extendedData.table_data, null, 2));
    // console.log('===============================================');

    // Add logo at the top (centered)
    await this.addLogo(doc, 20);

    // Add invoice info using extended data
    this.addExtendedInvoiceInfo(doc, company, extendedData);

    // Use the table data from extended data (includes footer handling)
    this.addDynamicTable(doc, extendedData.table_data);

    // Save the PDF with the actual invoice number
    const fileName = `jiwa_invoice_${extendedData.invoice_no}.pdf`;
    doc.save(fileName);
  }
} 
import { PDFService } from '../pdf/PDFService';
import { Company } from '../pdf/types/InvoicePDFTypes';
import { InvoiceRecord } from './InvoiceDatabaseService';

export class InvoicePDFService {
  private static pdfService = new PDFService();

  /**
   * Generate PDF from a saved invoice record
   */
  static async generatePDFFromRecord(invoice: InvoiceRecord): Promise<void> {
    try {
      console.log('=== Generating PDF from Saved Invoice ===');
      console.log('Invoice:', invoice);

      // Create company object from invoice data
      const company: Company = {
        id: 0, // We don't have the original company ID, so use 0
        name: invoice.company,
        slug: this.getCompanySlug(invoice.company),
        db_name: '',
        desc: ''
      };
      

      // Create extended data from invoice record
      const extendedData = {
        start_date: invoice.start_date,
        end_date: invoice.end_date,
        due_date: invoice.due_date,
        date: invoice.date,
        invoice_no: invoice.invoice_no,
        table_data: invoice.table_data
      };

      console.log('Company:', company);
      console.log('Extended Data:', extendedData);
      console.log('==========================================');

      // Generate PDF using the existing PDF service
      await this.pdfService.generateInvoicePDF(extendedData, company);

    } catch (error) {
      console.error('Error generating PDF from record:', error);
      throw new Error('Failed to generate PDF from saved invoice');
    }
  }

  /**
   * Get company slug from company name
   */
  private static getCompanySlug(companyName: string): string {
    const companyNameLower = companyName.toLowerCase();
    
    if (companyNameLower.includes('janji jiwa') || companyNameLower.includes('jiwa')) {
      return 'janji_jiwa';
    } else if (companyNameLower.includes('darmi')) {
      return 'darmi';
    } else if (companyNameLower.includes('hangry')) {
      return 'hangry';
    } else if (companyNameLower.includes('haus')) {
      return 'haus';
    } else {
      return 'default';
    }
  }
} 
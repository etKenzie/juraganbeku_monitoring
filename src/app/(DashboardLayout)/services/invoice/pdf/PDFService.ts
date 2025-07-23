import { Company, InvoiceData, PDFInvoiceData } from "../types/InvoicePDFTypes";
import { InvoicePDFGeneratorFactory } from "./PDFGeneratorFactory";

export class PDFService {
  private factory: InvoicePDFGeneratorFactory;

  constructor() {
    this.factory = new InvoicePDFGeneratorFactory();
  }

  /**
   * Generate PDF for a single invoice
   */
  async generateInvoicePDF(invoice: InvoiceData, company: Company, allInvoices?: InvoiceData[]): Promise<void> {
    try {
      const generator = this.factory.createGenerator(company.slug);
      
      const pdfData: PDFInvoiceData = {
        invoice,
        company,
        config: generator.getConfig(),
        generatedDate: new Date()
      };

      // Special handling for JiwaPDFGenerator
      if (company.slug === 'janji_jiwa' && allInvoices) {
        await (generator as any).generatePDF(pdfData, allInvoices);
      } else {
        await generator.generatePDF(pdfData);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF invoice');
    }
  }

  /**
   * Generate PDFs for multiple invoices
   */
  async generateMultipleInvoicePDFs(invoices: InvoiceData[], company: Company): Promise<void> {
    try {
      const generator = this.factory.createGenerator(company.slug);
      
      for (const invoice of invoices) {
        const pdfData: PDFInvoiceData = {
          invoice,
          company,
          config: generator.getConfig(),
          generatedDate: new Date()
        };

        await generator.generatePDF(pdfData);
      }
    } catch (error) {
      console.error('Error generating multiple PDFs:', error);
      throw new Error('Failed to generate PDF invoices');
    }
  }

  /**
   * Get available company generators
   */
  getAvailableCompanies(): string[] {
    return this.factory.getAvailableCompanies();
  }

  /**
   * Check if a company has a custom PDF generator
   */
  hasCustomGenerator(companySlug: string): boolean {
    const availableCompanies = this.getAvailableCompanies();
    return availableCompanies.includes(companySlug.toLowerCase());
  }

  /**
   * Get generator configuration for a company
   */
  getGeneratorConfig(companySlug: string) {
    const generator = this.factory.createGenerator(companySlug);
    return generator.getConfig();
  }
}

// Export a singleton instance
export const pdfService = new PDFService(); 
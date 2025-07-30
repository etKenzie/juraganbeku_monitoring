import { InvoicePDFGeneratorFactory } from "./PDFGeneratorFactory";
import { Company, ExtendedInvoiceData } from "./types/InvoicePDFTypes";

export class PDFService {
  private factory: InvoicePDFGeneratorFactory;

  constructor() {
    this.factory = new InvoicePDFGeneratorFactory();
  }

  /**
   * Generate PDF using extended invoice data
   */
  async generateInvoicePDF(extendedData: ExtendedInvoiceData, company: Company): Promise<void> {
    try {
      const generator = this.factory.createGenerator(company.slug);
      
      // console.log('=== PDF Service Generating Invoice ===');
      // console.log('Company:', company);
      // console.log('Extended Data:', extendedData);
      // console.log('=====================================');
      
      await generator.generatePDF(extendedData, company);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF invoice');
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
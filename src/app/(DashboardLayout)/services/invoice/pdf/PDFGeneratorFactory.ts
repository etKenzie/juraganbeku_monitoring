import { PDFGenerator, PDFGeneratorFactory } from "../types/InvoicePDFTypes";
import { DarmiPDFGenerator } from "./generators/DarmiPDFGenerator";
import { DefaultPDFGenerator } from "./generators/DefaultPDFGenerator";
import { HangryPDFGenerator } from "./generators/HangryPDFGenerator";
import { HausPDFGenerator } from "./generators/HausPDFGenerator";
import { JiwaPDFGenerator } from "./generators/JiwaPDFGenerator";

export class InvoicePDFGeneratorFactory implements PDFGeneratorFactory {
  createGenerator(companySlug: string): PDFGenerator {
    switch (companySlug.toLowerCase()) {
      case 'mbok_darmi':
        return new DarmiPDFGenerator();
      case 'hangry':
        return new HangryPDFGenerator();
      case 'haus':
        return new HausPDFGenerator();
      case 'janji_jiwa':
        return new JiwaPDFGenerator();        
      default:
        return new DefaultPDFGenerator();
    }
  }

  getAvailableCompanies(): string[] {
    return ['darmi', 'hangry', 'haus', 'jiwa'];
  }
} 
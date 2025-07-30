# PDF Invoice Generation System

This system provides a flexible and extensible way to generate PDF invoices for different companies with their own branding and requirements.

## Architecture

### Core Components

1. **BasePDFGenerator** - Abstract base class that provides common PDF generation functionality
2. **Company-Specific Generators** - Extend BasePDFGenerator with custom styling and layout
3. **PDFGeneratorFactory** - Creates the appropriate generator based on company slug
4. **PDFService** - High-level service for easy PDF generation
5. **React Components** - UI components for PDF generation buttons

### File Structure

```
pdf/
├── BasePDFGenerator.ts          # Abstract base class
├── PDFGeneratorFactory.ts       # Factory for creating generators
├── PDFService.ts               # High-level service
├── index.ts                    # Exports all functionality
├── README.md                   # This documentation
└── generators/
    ├── DefaultPDFGenerator.ts   # Default generator
    ├── DarmiPDFGenerator.ts     # Darmi-specific generator
    ├── HangryPDFGenerator.ts    # Hangry-specific generator
    └── HausPDFGenerator.ts      # Haus-specific generator
```

## Usage

### Basic Usage

```typescript
import { pdfService } from './pdf';

// Generate PDF for a single invoice
await pdfService.generateInvoicePDF(invoice, company);

// Generate PDFs for multiple invoices
await pdfService.generateMultipleInvoicePDFs(invoices, company);
```

### Using React Components

```tsx
import { TablePDFGenerateButton } from './pdf';

// Generate PDF with all table data
<TablePDFGenerateButton 
  invoices={invoices} 
  company={company} 
  variant="contained" 
/>
```

## Adding a New Company

1. Create a new generator class extending `BasePDFGenerator`:

```typescript
export class NewCompanyPDFGenerator extends BasePDFGenerator {
  constructor() {
    const config: PDFInvoiceConfig = {
      companyName: "New Company",
      companyLogo: "/images/logos/newcompany.png",
      // ... other config
    };
    super(config);
  }

  async generatePDF(data: PDFInvoiceData): Promise<void> {
    const doc = this.createDocument();
    
    // Add custom header
    await this.addCustomHeader(doc, data);
    
    // Add invoice content
    this.addInvoiceContent(doc, data);
    
    // Save PDF
    doc.save(`newcompany_invoice_${data.invoice.invoice_id}.pdf`);
  }

  private async addCustomHeader(doc: jsPDF, data: PDFInvoiceData): Promise<void> {
    // Custom header implementation
  }

  private addInvoiceContent(doc: jsPDF, data: PDFInvoiceData): void {
    // Custom content implementation
  }
}
```

2. Add the new generator to the factory:

```typescript
// In PDFGeneratorFactory.ts
case 'newcompany':
  return new NewCompanyPDFGenerator();
```

3. Update the available companies list:

```typescript
getAvailableCompanies(): string[] {
  return ['darmi', 'hangry', 'haus', 'newcompany'];
}
```

## Configuration

Each company can have its own configuration:

```typescript
interface PDFInvoiceConfig {
  companyName: string;
  companyLogo?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  invoiceTitle?: string;
  showLogo?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
  secondaryColor?: string;
  fontFamily?: string;
  fontSize?: number;
  pageSize?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
}
```

## Features

- **Company-specific branding** - Each company has its own styling with shared TokoPandai logo
- **Flexible layout** - Customizable headers, footers, and content areas
- **Single comprehensive PDF** - Generate one PDF with all table data
- **Error handling** - Graceful error handling with user feedback
- **Type safety** - Full TypeScript support
- **React integration** - Ready-to-use React components

## Dependencies

- `jspdf` - PDF generation library
- `@mui/material` - UI components
- `@mui/icons-material` - Icons

## Notes

- All companies use the shared TokoPandai logo from `/public/images/logos/topan.png`
- Each company generator can override any method from the base class
- The system automatically handles different company requirements
- PDFs are generated client-side using jsPDF
- The system generates a single comprehensive PDF with all table data 
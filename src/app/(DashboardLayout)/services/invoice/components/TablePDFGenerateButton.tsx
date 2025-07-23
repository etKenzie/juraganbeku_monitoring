"use client";
import { PictureAsPdf as PDFIcon } from '@mui/icons-material';
import {
  Alert,
  Button,
  CircularProgress,
  Snackbar,
  Tooltip
} from '@mui/material';
import React, { useState } from 'react';
import { pdfService } from '../pdf/PDFService';
import { Company, InvoiceData } from '../types/InvoicePDFTypes';
import PDFDateSelectionModal from './PDFDateSelectionModal';

interface TablePDFGenerateButtonProps {
  invoices: InvoiceData[];
  company: Company;
  variant?: 'text' | 'outlined' | 'contained';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  showTooltip?: boolean;
  tooltipText?: string;
}

const TablePDFGenerateButton: React.FC<TablePDFGenerateButtonProps> = ({
  invoices,
  company,
  variant = 'contained',
  size = 'medium',
  disabled = false,
  showTooltip = true,
  tooltipText = 'Generate PDF with all invoice data'
}) => {
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  const handleOpenModal = () => {
    if (invoices.length === 0) return;
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleGeneratePDF = async (selectedDate: string, selectedDueDate: string) => {
    if (loading) return;

    setLoading(true);
    try {
      // Log all the data that will be used for PDF generation
      console.log('=== PDF Generation Data ===');
      console.log('Company:', company);
      console.log('Total Invoices:', invoices.length);
      console.log('Invoices Data:', invoices);
      console.log('Selected Date:', selectedDate);
      console.log('Selected Due Date:', selectedDueDate);
      
      // Calculate totals
      const totalAmount = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
      const uniqueGerai = Array.from(new Set(invoices.map(inv => inv.nama_gerai)));
      
      console.log('Summary:');
      console.log('- Total Amount:', totalAmount);
      console.log('- Unique Gerai:', uniqueGerai);
      console.log('- Date Range:', {
        start: invoices[0]?.sales_date,
        end: invoices[invoices.length - 1]?.sales_date
      });
      console.log('========================');

      // For now, just generate the first invoice as a placeholder
      // In the future, this will generate a comprehensive PDF with all data
      if (invoices.length > 0) {
        // Create a modified invoice with the selected dates
        const modifiedInvoice = {
          ...invoices[0],
          sales_date: selectedDate,
          pickup_date: selectedDueDate
        };
        
        // Pass all invoices for special processing (especially for Jiwa)
        await pdfService.generateInvoicePDF(modifiedInvoice, company, invoices);
      }

      setSnackbar({
        open: true,
        message: `PDF generated with ${invoices.length} invoice records for ${company.name}`,
        severity: 'success'
      });
    } catch (error) {
      console.error('PDF generation failed:', error);
      setSnackbar({
        open: true,
        message: 'Failed to generate PDF. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const button = (
    <Button
      variant={variant}
      size={size}
      startIcon={loading ? <CircularProgress size={16} /> : <PDFIcon />}
      onClick={handleOpenModal}
      disabled={disabled || loading || invoices.length === 0}
      sx={{
        minWidth: 'auto',
        ...(loading && {
          '& .MuiButton-startIcon': {
            marginRight: 0
          }
        })
      }}
    >
      {loading ? 'Generating...' : 'Generate PDF'}
    </Button>
  );

  return (
    <>
      {showTooltip ? (
        <Tooltip title={tooltipText} arrow>
          {button}
        </Tooltip>
      ) : (
        button
      )}
      
      <PDFDateSelectionModal
        open={modalOpen}
        onClose={handleCloseModal}
        onConfirm={handleGeneratePDF}
        defaultDate={invoices[0]?.sales_date || ''}
        defaultDueDate={invoices[0]?.pickup_date || ''}
        companyName={company.name}
        invoiceCount={invoices.length}
      />
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default TablePDFGenerateButton; 
"use client";
import { Receipt as InvoiceIcon } from '@mui/icons-material';
import {
  Alert,
  Button,
  CircularProgress,
  Snackbar,
  Tooltip
} from '@mui/material';
import React, { useState } from 'react';
import { pdfService } from '../pdf/PDFService';
import { Company, InvoiceData } from '../pdf/types/InvoicePDFTypes';
import InvoicePreviewModal from './InvoicePreviewModal';

interface TablePDFGenerateButtonProps {
  invoices: InvoiceData[];
  company: Company;
  variant?: 'text' | 'outlined' | 'contained';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  showTooltip?: boolean;
  tooltipText?: string;
  startDate?: string;
  endDate?: string;
}

const TablePDFGenerateButton: React.FC<TablePDFGenerateButtonProps> = ({
  invoices,
  company,
  variant = 'contained',
  size = 'medium',
  disabled = false,
  showTooltip = true,
  tooltipText = 'Generate invoice with all invoice data',
  startDate = '',
  endDate = ''
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

  const handleGenerateInvoice = async (invoiceData: {
    start_date: string;
    end_date: string;
    due_date: string;
    date: string;
    invoice_no: string;
    table_data: {
      headers: string[];
      rows: string[][];
    };
  }) => {
    if (loading) return;

    setLoading(true);
    try {
      // Log all the data that will be used for PDF generation
      console.log('=== Invoice Generation Data ===');
      console.log('Company:', company);
      console.log('Total Invoices:', invoices.length);
      console.log('Invoice Data:', invoiceData);
      console.log('Table Data:', invoiceData.table_data);
      
      // Calculate totals
      const totalAmount = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
      const uniqueGerai = Array.from(new Set(invoices.map(inv => inv.nama_gerai)));
      
      console.log('Summary:');
      console.log('- Total Amount:', totalAmount);
      console.log('- Unique Gerai:', uniqueGerai);
      console.log('- Date Range:', {
        start: invoiceData.start_date,
        end: invoiceData.end_date
      });
      console.log('============================');

      // Pass extended data and company to PDF service
      await pdfService.generateInvoicePDF(invoiceData, company);

      setSnackbar({
        open: true,
        message: `Invoice generated with ${invoices.length} invoice records for ${company.name}`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Invoice generation failed:', error);
      setSnackbar({
        open: true,
        message: 'Failed to generate invoice. Please try again.',
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
      startIcon={loading ? <CircularProgress size={16} /> : <InvoiceIcon />}
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
      {loading ? 'Generating...' : 'Generate Invoice'}
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
      
      <InvoicePreviewModal
        open={modalOpen}
        onClose={handleCloseModal}
        onConfirm={handleGenerateInvoice}
        invoices={invoices}
        company={company}
        startDate={startDate}
        endDate={endDate}
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
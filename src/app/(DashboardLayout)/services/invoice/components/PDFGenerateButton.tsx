"use client";
import { PictureAsPdf as PDFIcon } from '@mui/icons-material';
import { Alert, Button, CircularProgress, Snackbar, Tooltip } from '@mui/material';
import React, { useState } from 'react';
import { pdfService } from '../pdf/PDFService';
import { Company, InvoiceData } from '../types/InvoicePDFTypes';

interface PDFGenerateButtonProps {
  invoice: InvoiceData;
  company: Company;
  variant?: 'text' | 'outlined' | 'contained';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  showTooltip?: boolean;
  tooltipText?: string;
}

const PDFGenerateButton: React.FC<PDFGenerateButtonProps> = ({
  invoice,
  company,
  variant = 'outlined',
  size = 'medium',
  disabled = false,
  showTooltip = true,
  tooltipText = 'Generate PDF Invoice'
}) => {
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  const handleGeneratePDF = async () => {
    if (loading) return;

    setLoading(true);
    try {
      await pdfService.generateInvoicePDF(invoice, company);
      setSnackbar({
        open: true,
        message: `PDF generated successfully for ${company.name}`,
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
      onClick={handleGeneratePDF}
      disabled={disabled || loading}
      sx={{
        minWidth: 'auto',
        ...(loading && {
          '& .MuiButton-startIcon': {
            marginRight: 0
          }
        })
      }}
    >
      {loading ? '' : 'PDF'}
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

export default PDFGenerateButton; 
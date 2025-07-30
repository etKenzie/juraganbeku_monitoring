"use client";
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography
} from '@mui/material';
import React, { useState } from 'react';
import { InvoiceDatabaseService, InvoiceRecord } from '../services/InvoiceDatabaseService';

interface InvoiceEditModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (updatedInvoice: InvoiceRecord) => void;
  invoice: InvoiceRecord | null;
}

const InvoiceEditModal: React.FC<InvoiceEditModalProps> = ({
  open,
  onClose,
  onSave,
  invoice
}) => {
  const [selectedDate, setSelectedDate] = useState(invoice?.date || '');
  const [selectedDueDate, setSelectedDueDate] = useState(invoice?.due_date || '');
  const [invoiceNo, setInvoiceNo] = useState(invoice?.invoice_no || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update form when invoice changes
  React.useEffect(() => {
    if (invoice) {
      setSelectedDate(invoice.date);
      setSelectedDueDate(invoice.due_date);
      setInvoiceNo(invoice.invoice_no);
    }
  }, [invoice]);

  const handleSave = async () => {
    if (!invoice || !selectedDate || !selectedDueDate || !invoiceNo) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updatedInvoice = {
        ...invoice,
        date: selectedDate,
        due_date: selectedDueDate,
        invoice_no: invoiceNo
      };

      await InvoiceDatabaseService.updateInvoice(invoice.id!, {
        date: selectedDate,
        due_date: selectedDueDate,
        invoice_no: invoiceNo
      });

      onSave(updatedInvoice);
      onClose();
    } catch (err) {
      console.error('Error updating invoice:', err);
      setError('Failed to update invoice.');
    } finally {
      setLoading(false);
    }
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Edit Invoice - {invoice.company} - {invoice.invoice_no}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Invoice Details
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Invoice Date"
                InputLabelProps={{ shrink: true }}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Due Date"
                InputLabelProps={{ shrink: true }}
                value={selectedDueDate}
                onChange={(e) => setSelectedDueDate(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Invoice Number"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
              />
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom>
            Invoice Period (Read Only)
          </Typography>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="textSecondary">
              Start Date: {invoice.start_date.split('T')[0]}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              End Date: {invoice.end_date.split('T')[0]}
            </Typography>
          </Box>


          <Typography variant="h6" gutterBottom>
            Table Data Preview
          </Typography>
          
          {/* Table Preview */}
          <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {invoice.table_data.headers.map((header, index) => (
                    <TableCell key={index}>{header}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {invoice.table_data.rows.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex}>{cell}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          disabled={loading || !selectedDate || !selectedDueDate || !invoiceNo}
        >
          {loading ? <CircularProgress size={24} /> : 'Save Changes'}
        </Button>
      </DialogActions>
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Dialog>
  );
};

export default InvoiceEditModal; 
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
import React, { useMemo, useState } from 'react';
import { Company } from '../pdf/types/InvoicePDFTypes';
import { InvoiceDatabaseService } from '../services/InvoiceDatabaseService';

interface InvoiceData {
  kode_gerai: string;
  total_amount: number;
  invoice_id: string;
  nama_gerai: string;
  va_number: string;
  sales_date: string;
  pickup_date: string;
}

interface TableData {
  headers: string[];
  rows: string[][];
}

interface InvoicePreviewModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (invoiceData: {
    start_date: string;
    end_date: string;
    due_date: string;
    date: string;
    invoice_no: string;
    table_data: {
      headers: string[];
      rows: string[][];
    };
  }) => void;
  invoices: InvoiceData[];
  company: Company;
  startDate?: string;
  endDate?: string;
}

const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  open,
  onClose,
  onConfirm,
  invoices,
  company,
  startDate,
  endDate
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDueDate, setSelectedDueDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate table data based on company and invoices
  const tableData = useMemo((): TableData => {
    if (company.slug === 'janji_jiwa') {
      // Jiwa-specific logic - group by kode_gerai and calculate charges
      const geraiMap = new Map<string, { kode_gerai: string; nama_gerai: string; pickup_total: number; total_amount: number }>();

      invoices.forEach(invoice => {
        const { kode_gerai, nama_gerai, total_amount } = invoice;
        
        if (geraiMap.has(kode_gerai)) {
          // Add to existing gerai pickup total
          const existing = geraiMap.get(kode_gerai)!;
          existing.pickup_total += total_amount;
        } else {
          // Create new gerai entry
          geraiMap.set(kode_gerai, {
            kode_gerai,
            nama_gerai,
            pickup_total: total_amount,
            total_amount: 0 // Will be calculated below
          });
        }
      });

      // Calculate total amounts for each gerai based on pickup total
      const rows: string[][] = [];
      console.log('\nCalculating total amounts:');
      geraiMap.forEach(gerai => {
        // If pickup total > 1,000,000,000, charge 3,000,000, otherwise charge 2,500,000
        gerai.total_amount = gerai.pickup_total > 1000000000 ? 3000000 : 2500000;
        console.log(`${gerai.kode_gerai} (${gerai.nama_gerai}): Pickup Total = ${gerai.pickup_total.toLocaleString()}, Total Amount = ${gerai.total_amount.toLocaleString()}`);
        rows.push([
          gerai.kode_gerai,
          gerai.nama_gerai,
          `Rp ${gerai.pickup_total.toLocaleString()}`,
          `Rp ${gerai.total_amount.toLocaleString()}`
        ]);
      });

      console.log('=== End Jiwa Calculation ===\n');

      return {
        headers: ["Kode Gerai", "Nama Gerai", "Pickup Total", "Total Amount"],
        rows
      };
    } else if (company.slug === 'mbok_darmi') {
      // Darmi-specific logic - count pickups per gerai
      const geraiMap = new Map<string, { kode_gerai: string; nama_gerai: string; pickup_count: number }>();

      invoices.forEach(invoice => {
        const { kode_gerai, nama_gerai } = invoice;
        
        if (geraiMap.has(kode_gerai)) {
          // Increment pickup count for existing gerai
          const existing = geraiMap.get(kode_gerai)!;
          existing.pickup_count += 1;
        } else {
          // Create new gerai entry with pickup count 1
          geraiMap.set(kode_gerai, {
            kode_gerai,
            nama_gerai,
            pickup_count: 1
          });
        }
      });

      // Calculate amounts for each gerai
      const rows: string[][] = [];
      const amountPerPickup = 40000; // Fixed amount per pickup for Darmi
      
      geraiMap.forEach(gerai => {
        const totalAmount = gerai.pickup_count * amountPerPickup;
        rows.push([
          gerai.kode_gerai,
          gerai.nama_gerai,
          gerai.pickup_count.toString(),
          `Rp ${amountPerPickup.toLocaleString()}`,
          `Rp ${totalAmount.toLocaleString()}`
        ]);
      });

      return {
        headers: ["Kode Gerai", "Nama Gerai", "Pick Up/Month", "Amount", "Total Amount"],
        rows
      };
      
    }else if (company.slug === 'roscik') {
      // Darmi-specific logic - count pickups per gerai
      const geraiMap = new Map<string, { kode_gerai: string; nama_gerai: string; pickup_count: number }>();

      invoices.forEach(invoice => {
        const { kode_gerai, nama_gerai } = invoice;
        
        if (geraiMap.has(kode_gerai)) {
          // Increment pickup count for existing gerai
          const existing = geraiMap.get(kode_gerai)!;
          existing.pickup_count += 1;
        } else {
          // Create new gerai entry with pickup count 1
          geraiMap.set(kode_gerai, {
            kode_gerai,
            nama_gerai,
            pickup_count: 1
          });
        }
      });

      // Calculate amounts for each gerai
      const rows: string[][] = [];
      let amountPerPickup = 40000; // Fixed amount per pickup for Darmi
      
      geraiMap.forEach(gerai => {
        if (gerai.pickup_count > 20) {
          amountPerPickup = 30000
        } else if (gerai.pickup_count > 10) {
          amountPerPickup = 35000
        }
        const totalAmount = gerai.pickup_count * amountPerPickup;
        rows.push([
          gerai.kode_gerai,
          gerai.nama_gerai,
          gerai.pickup_count.toString(),
          `Rp ${amountPerPickup.toLocaleString()}`,
          `Rp ${totalAmount.toLocaleString()}`
        ]);
      });

      return {
        headers: ["Kode Gerai", "Nama Gerai", "Pick Up/Month", "Amount", "Total Amount"],
        rows
      };
      
    } else if (company.slug === 'hangry') {
      // Hangry-specific logic - show invoices with pickup dates
      const rows = invoices.map(invoice => [
        invoice.kode_gerai,
        invoice.nama_gerai,
        invoice.invoice_id,
        `Rp ${invoice.total_amount.toLocaleString()}`,
        invoice.sales_date,
        invoice.pickup_date
      ]);

      return {
        headers: ["Kode Gerai", "Nama Gerai", "Invoice ID", "Total Amount", "Sales Date", "Pickup Date"],
        rows
      };
    } else if (company.slug === 'haus') {
      // Haus-specific logic - show invoices with VA numbers
      const rows = invoices.map(invoice => [
        invoice.kode_gerai,
        invoice.nama_gerai,
        invoice.va_number,
        `Rp ${invoice.total_amount.toLocaleString()}`,
        invoice.sales_date
      ]);

      return {
        headers: ["Kode Gerai", "Nama Gerai", "VA Number", "Total Amount", "Sales Date"],
        rows
      };
    } else {
      // Default logic for other companies - show individual invoices
      const rows = invoices.map(invoice => [
        invoice.kode_gerai,
        invoice.nama_gerai,
        invoice.invoice_id,
        `Rp ${invoice.total_amount.toLocaleString()}`,
        invoice.sales_date
      ]);

      return {
        headers: ["Kode Gerai", "Nama Gerai", "Invoice ID", "Total Amount", "Sales Date"],
        rows
      };
    }
  }, [invoices, company.slug]);

  // Calculate totals
  const totalAmount = useMemo(() => {
    if (company.slug === 'janji_jiwa') {
      // For Jiwa, calculate total based on pickup totals for each gerai
      const geraiMap = new Map<string, number>();

      invoices.forEach(invoice => {
        const { kode_gerai, total_amount } = invoice;
        
        if (geraiMap.has(kode_gerai)) {
          geraiMap.set(kode_gerai, geraiMap.get(kode_gerai)! + total_amount);
        } else {
          geraiMap.set(kode_gerai, total_amount);
        }
      });

      // Calculate total amount based on pickup total thresholds
      let total = 0;
      geraiMap.forEach(pickupTotal => {
        total += pickupTotal > 1000000000 ? 3000000 : 2500000;
      });

      return total;
    } else if (company.slug === 'mbok_darmi') {
      // For Darmi, calculate total based on pickup count * 40000
      const geraiMap = new Map<string, number>();

      invoices.forEach(invoice => {
        const { kode_gerai } = invoice;
        
        if (geraiMap.has(kode_gerai)) {
          geraiMap.set(kode_gerai, geraiMap.get(kode_gerai)! + 1);
        } else {
          geraiMap.set(kode_gerai, 1);
        }
      });

      // Calculate total amount based on pickup count * 40000
      let total = 0;
      const amountPerPickup = 40000;
      geraiMap.forEach(pickupCount => {
        total += pickupCount * amountPerPickup;
      });

      return total;
    } else {
      return invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
    }
  }, [invoices, company.slug]);

  const handleConfirm = async () => {
    if (!startDate || !endDate || !selectedDate || !selectedDueDate || !invoiceNo) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check for overlapping periods
      const overlappingInvoices = await InvoiceDatabaseService.checkOverlappingPeriods(
        company.name,
        startDate,
        endDate
      );
    

      if (overlappingInvoices.length > 0) {
        setError(`Invoice period overlaps with existing invoices: ${overlappingInvoices.map(inv => inv.invoice_no).join(', ')}`);
        setLoading(false);
        return;
      }

      const invoiceData = {
        start_date: startDate,
        end_date: endDate,
        due_date: selectedDueDate,
        date: selectedDate,
        invoice_no: invoiceNo,
        table_data: tableData
      };


      await InvoiceDatabaseService.createInvoice({
        start_date: startDate,
        end_date: endDate,
        due_date: selectedDueDate,
        date: selectedDate,
        company: company.name,
        invoice_no: invoiceNo,
        table_data: tableData
      });
      onConfirm(invoiceData);
      onClose();
    } catch (err) {
      console.error('Error saving invoice:', err);
      setError('Failed to save invoice to database.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setSelectedDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setInvoiceNo('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        Generate Invoice - {company.name}
      </DialogTitle>
      <DialogContent>
        <Box mb={3}>
          <Typography variant="body2" color="textSecondary">
            Preview invoice data for {invoices.length} records from {startDate} to {endDate}
          </Typography>
        </Box>

        {/* Invoice Details */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Invoice Date"
              InputLabelProps={{ shrink: true }}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              type="date"
              label="Due Date"
              InputLabelProps={{ shrink: true }}
              value={selectedDueDate}
              onChange={(e) => setSelectedDueDate(e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Invoice Number"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              placeholder="e.g., INV-001-2024"
              required
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Total Amount"
              value={`Rp ${totalAmount.toLocaleString()}`}
              InputProps={{ readOnly: true }}
            />
          </Grid>
        </Grid>

        {/* Table Preview */}
        <Typography variant="h6" mb={2}>
          Invoice Table Data
        </Typography>
        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {tableData.headers.map((header, index) => (
                  <TableCell key={index} sx={{ fontWeight: 'bold', backgroundColor: 'grey.100' }}>
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {tableData.rows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <TableCell key={cellIndex}>
                      {cell}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box mt={2}>
          <Typography variant="body2" color="textSecondary">
            Total Records: {tableData.rows.length} | Total Amount: Rp {totalAmount.toLocaleString()}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button 
          onClick={handleConfirm} 
          variant="contained"
          disabled={loading || !selectedDate || !selectedDueDate || !invoiceNo}
        >
          {loading ? <CircularProgress size={24} /> : 'Generate Invoice'}
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

export default InvoicePreviewModal; 
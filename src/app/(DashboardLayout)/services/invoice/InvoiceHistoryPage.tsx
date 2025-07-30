"use client";
import Loading from "@/app/(DashboardLayout)/loading";
import InvoiceEditModal from "@/app/components/services/invoice/components/InvoiceEditModal";
import { InvoiceDatabaseService, InvoiceRecord } from "@/app/components/services/invoice/services/InvoiceDatabaseService";
import { InvoicePDFService } from "@/app/components/services/invoice/services/InvoicePDFService";
import { useAuth } from "@/contexts/AuthContext";
import { Delete, Download, Edit } from "@mui/icons-material";
import {
    Alert,
    Box,
    Chip,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    Tooltip,
    Typography
} from "@mui/material";
import React, { useEffect, useState } from "react";

const InvoiceHistoryPage: React.FC = () => {
  const { role } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [allInvoices, setAllInvoices] = useState<InvoiceRecord[]>([]); // Store all invoices
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const fetchAllInvoices = async () => {
    try {
      setLoading(true);
      const data = await InvoiceDatabaseService.fetchInvoices();
      setAllInvoices(data);
      setInvoices(data); // Initially show all invoices
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  // Filter invoices based on selected company
  useEffect(() => {
    if (selectedCompany === "all") {
      setInvoices(allInvoices);
    } else {
      const filtered = allInvoices.filter(invoice => invoice.company === selectedCompany);
      setInvoices(filtered);
    }
    setPage(0); // Reset to first page when changing filter
  }, [selectedCompany, allInvoices]);

  useEffect(() => {
    fetchAllInvoices();
  }, []);

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    
    try {
      await InvoiceDatabaseService.deleteInvoice(id);
      fetchAllInvoices(); // Refresh all invoices
      showSnackbar('Invoice deleted successfully', 'success');
    } catch (err) {
      console.error('Error deleting invoice:', err);
      showSnackbar('Failed to delete invoice', 'error');
    }
  };

  const handleDownloadInvoice = async (invoice: InvoiceRecord) => {
    try {
      await InvoicePDFService.generatePDFFromRecord(invoice);
      showSnackbar('PDF generated successfully', 'success');
    } catch (err) {
      console.error('Error generating PDF:', err);
      showSnackbar('Failed to generate PDF', 'error');
    }
  };

  const handleEditInvoice = (invoice: InvoiceRecord) => {
    setSelectedInvoice(invoice);
    setEditModalOpen(true);
  };

  const handleSaveEdit = (updatedInvoice: InvoiceRecord) => {
    // Update the invoice in both local states
    setAllInvoices(prevInvoices => 
      prevInvoices.map(inv => 
        inv.id === updatedInvoice.id ? updatedInvoice : inv
      )
    );
    setInvoices(prevInvoices => 
      prevInvoices.map(inv => 
        inv.id === updatedInvoice.id ? updatedInvoice : inv
      )
    );
    showSnackbar('Invoice updated successfully', 'success');
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const getUniqueCompanies = () => {
    const companies = Array.from(new Set(allInvoices.map(inv => inv.company)));
    return companies;
  };

  const paginatedInvoices = invoices.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Role-based access control - moved after all hooks
  const allowed = ["invoice services", "admin"].some((r) => role?.includes(r));
  if (!allowed) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <Typography variant="h5" color="error">
          You don't have access to this page.
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Invoice History
        </Typography>
      </Box>

      {/* Filters */}
      <Box mb={3}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Company</InputLabel>
          <Select
            value={selectedCompany}
            label="Filter by Company"
            onChange={(e) => setSelectedCompany(e.target.value)}
          >
            <MenuItem value="all">All Companies</MenuItem>
            {getUniqueCompanies().map((company) => (
              <MenuItem key={company} value={company}>
                {company}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Box mb={3}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      {/* Invoice Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Invoice No</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No invoices found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {invoice.invoice_no}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={invoice.company} size="small" />
                    </TableCell>
                    <TableCell>{invoice.date.split('T')[0]}</TableCell>
                    <TableCell>{invoice.due_date.split('T')[0]}</TableCell>
                    <TableCell>{invoice.start_date.split('T')[0]}</TableCell>
                    <TableCell>{invoice.end_date.split('T')[0]}</TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="Edit Invoice">
                          <IconButton
                            size="small"
                            onClick={() => handleEditInvoice(invoice)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download PDF">
                          <IconButton
                            size="small"
                            onClick={() => handleDownloadInvoice(invoice)}
                          >
                            <Download />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Invoice">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteInvoice(invoice.id!)}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={invoices.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* Edit Modal */}
      <InvoiceEditModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedInvoice(null);
        }}
        onSave={handleSaveEdit}
        invoice={selectedInvoice}
      />

      {/* Snackbar for notifications */}
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
    </Box>
  );
};

export default InvoiceHistoryPage; 
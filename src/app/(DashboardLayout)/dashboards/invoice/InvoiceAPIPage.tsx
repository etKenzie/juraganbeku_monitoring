"use client";
import Loading from "@/app/(DashboardLayout)/loading";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface InvoiceData {
  kode_gerai: string;
  total_amount: number;
  invoice_id: string;
  nama_gerai: string;
  va_number: string;
  sales_date: string;
  pickup_date: string;
}

interface APIResponse {
  code: number;
  status: string;
  message: string;
  data: {
    metadata: {
      totalData: number;
      totalPage: number;
      currentPage: number;
      limit: number;
    };
    data: InvoiceData[];
  };
}

interface Company {
  id: number;
  name: string;
  slug: string;
  db_name: string;
  desc: string;
}

const InvoiceAPIPage: React.FC = () => {
  const { role } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  // Active states (used for fetching)
  const [selectedCompanySlug, setSelectedCompanySlug] = useState<string>("");
  const [selectedStartDate, setSelectedStartDate] = useState<string>("");
  const [selectedEndDate, setSelectedEndDate] = useState<string>("");
  // Pending states (controlled by UI)
  const [pendingCompanySlug, setPendingCompanySlug] = useState<string>("");
  const [pendingStartDate, setPendingStartDate] = useState<string>("");
  const [pendingEndDate, setPendingEndDate] = useState<string>("");
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterGerai, setFilterGerai] = useState<string>("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  // Sorting state
  const [orderBy, setOrderBy] = useState<keyof InvoiceData | "">("");
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  // Helper to get last month range
  const getLastMonthRange = () => {
    const today = new Date();
    const end = today.toISOString().slice(0, 10);
    const lastMonth = new Date(today);
    lastMonth.setMonth(today.getMonth() - 1);
    // Handle month wrap-around
    if (today.getMonth() === 0) {
      lastMonth.setFullYear(today.getFullYear() - 1);
      lastMonth.setMonth(11);
    }
    const start = lastMonth.toISOString().slice(0, 10);
    return { start, end };
  };

  // Fetch companies on mount
  useEffect(() => {
    fetch("https://dev.tokopandai.id/api/pickup/all-gerai")
      .then((res) => res.json())
      .then((json) => {
        setCompanies(json.data);
        if (json.data.length > 0) {
          setSelectedCompanySlug(json.data[0].slug);
          setPendingCompanySlug(json.data[0].slug);
          const { start, end } = getLastMonthRange();
          setSelectedStartDate(start);
          setSelectedEndDate(end);
          setPendingStartDate(start);
          setPendingEndDate(end);
        }
      });
  }, []);

  // Fetch invoices when active company or date range changes
  useEffect(() => {
    if (!selectedCompanySlug || !selectedStartDate || !selectedEndDate) return;
    setLoading(true);
    const url = `https://dev.tokopandai.id/api/pickup/${selectedCompanySlug}/invoices?limit=100000&page=1&startDate=${selectedStartDate}&endDate=${selectedEndDate}`;
    fetch(url)
      .then((res) => res.json())
      .then((json: APIResponse) => {
        setInvoices(json.data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedCompanySlug, selectedStartDate, selectedEndDate]);

  // Get unique gerai for filtering
  const geraiOptions = useMemo(() => {
    const setGerai = new Set(invoices.map((inv) => inv.nama_gerai));
    return Array.from(setGerai);
  }, [invoices]);

  // Filtered and searched data
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesGerai = filterGerai ? inv.nama_gerai === filterGerai : true;
      const matchesSearch =
        search === "" ||
        (inv.invoice_id || "").toLowerCase().includes(search.toLowerCase()) ||
        (inv.kode_gerai || "").toLowerCase().includes(search.toLowerCase()) ||
        (inv.nama_gerai || "").toLowerCase().includes(search.toLowerCase()) ||
        (inv.va_number || "").toLowerCase().includes(search.toLowerCase());
      // Date range filter (sales_date)
      const salesDate = new Date(inv.sales_date);
      const matchesStart = selectedStartDate ? salesDate >= new Date(selectedStartDate) : true;
      const matchesEnd = selectedEndDate ? salesDate <= new Date(selectedEndDate + 'T23:59:59') : true;
      return matchesGerai && matchesSearch && matchesStart && matchesEnd;
    });
  }, [invoices, filterGerai, search, selectedStartDate, selectedEndDate]);

  // Sorting logic
  const sortedInvoices = useMemo(() => {
    if (!orderBy) return filteredInvoices;
    return [...filteredInvoices].sort((a, b) => {
      let aValue = a[orderBy as keyof InvoiceData];
      let bValue = b[orderBy as keyof InvoiceData];
      // For numbers
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return order === 'asc' ? aValue - bValue : bValue - aValue;
      }
      // For dates
      if (orderBy === 'sales_date' || orderBy === 'pickup_date') {
        const aDate = new Date(aValue as string).getTime();
        const bDate = new Date(bValue as string).getTime();
        return order === 'asc' ? aDate - bDate : bDate - aDate;
      }
      // For strings
      return order === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  }, [filteredInvoices, orderBy, order]);

  // Top numbers
  const totalAmount = useMemo(
    () =>
      filteredInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0),
    [filteredInvoices]
  );
  const totalInvoices = filteredInvoices.length;

  // Pagination
  const paginatedInvoices = useMemo(
    () =>
      sortedInvoices.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
      ),
    [sortedInvoices, page, rowsPerPage]
  );

  const handleChangePage = (
    event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRequestSort = (property: keyof InvoiceData) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  return (
    <Box p={3}>
      {/* Role-based access control */}
      {(() => {
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
        return null;
      })()}
      {loading ? (
        <Loading />
      ) : (
        <>
          <Typography variant="h4" mb={3}>
            Invoice List
          </Typography>
          {/* Company selector and date range at the top */}
          <Box mb={3} display="flex" alignItems="center" gap={2}>
            <FormControl fullWidth sx={{ maxWidth: 300 }}>
              <InputLabel>Select Company</InputLabel>
              <Select
                value={pendingCompanySlug}
                label="Select Company"
                onChange={(e) => {
                  setPendingCompanySlug(e.target.value);
                }}
              >
                {companies.map((company) => (
                  <MenuItem key={company.slug} value={company.slug}>
                    {company.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {/* Date range pickers */}
            <TextField
              fullWidth
              type="date"
              label="Start Date"
              InputLabelProps={{ shrink: true }}
              value={pendingStartDate}
              onChange={(e) => setPendingStartDate(e.target.value)}
              sx={{ maxWidth: 180 }}
            />
            <TextField
              fullWidth
              type="date"
              label="End Date"
              InputLabelProps={{ shrink: true }}
              value={pendingEndDate}
              onChange={(e) => setPendingEndDate(e.target.value)}
              sx={{ maxWidth: 180 }}
            />
            <Button
              variant="contained"
              onClick={() => {
                setSelectedCompanySlug(pendingCompanySlug);
                setSelectedStartDate(pendingStartDate);
                setSelectedEndDate(pendingEndDate);
                setPage(0);
                setFilterGerai("");
                setSearch("");
              }}
              disabled={
                pendingCompanySlug === selectedCompanySlug &&
                pendingStartDate === selectedStartDate &&
                pendingEndDate === selectedEndDate
              }
            >
              Apply
            </Button>
          </Box>
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Total Amount
                </Typography>
                <Typography variant="h5">
                  Rp {totalAmount.toLocaleString()}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Total Invoices
                </Typography>
                <Typography variant="h5">{totalInvoices}</Typography>
              </Paper>
            </Grid>
          </Grid>
          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search by Invoice ID, Gerai, VA, etc."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Filter by Gerai</InputLabel>
                <Select
                  value={filterGerai}
                  label="Filter by Gerai"
                  onChange={(e) => setFilterGerai(e.target.value)}
                >
                  <MenuItem value="">All Gerai</MenuItem>
                  {geraiOptions.map((gerai) => (
                    <MenuItem key={gerai} value={gerai}>
                      {gerai}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                variant="outlined"
                onClick={() => {
                  setSearch("");
                  setFilterGerai("");
                  // Reset pending date range to last month
                  const { start, end } = getLastMonthRange();
                  setPendingStartDate(start);
                  setPendingEndDate(end);
                }}
                sx={{ height: "100%" }}
              >
                Reset Filters
              </Button>
            </Grid>
          </Grid>
          {/* Show table or no data message */}
          {Array.isArray(invoices) && invoices.length > 0 ? (
            <Paper>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'invoice_id'}
                          direction={orderBy === 'invoice_id' ? order : 'asc'}
                          onClick={() => handleRequestSort('invoice_id')}
                        >
                          Invoice ID
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'kode_gerai'}
                          direction={orderBy === 'kode_gerai' ? order : 'asc'}
                          onClick={() => handleRequestSort('kode_gerai')}
                        >
                          Kode Gerai
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'nama_gerai'}
                          direction={orderBy === 'nama_gerai' ? order : 'asc'}
                          onClick={() => handleRequestSort('nama_gerai')}
                        >
                          Nama Gerai
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'va_number'}
                          direction={orderBy === 'va_number' ? order : 'asc'}
                          onClick={() => handleRequestSort('va_number')}
                        >
                          VA Number
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'total_amount'}
                          direction={orderBy === 'total_amount' ? order : 'asc'}
                          onClick={() => handleRequestSort('total_amount')}
                        >
                          Total Amount
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'sales_date'}
                          direction={orderBy === 'sales_date' ? order : 'asc'}
                          onClick={() => handleRequestSort('sales_date')}
                        >
                          Sales Date
                        </TableSortLabel>
                      </TableCell>
                      <TableCell>
                        <TableSortLabel
                          active={orderBy === 'pickup_date'}
                          direction={orderBy === 'pickup_date' ? order : 'asc'}
                          onClick={() => handleRequestSort('pickup_date')}
                        >
                          Pickup Date
                        </TableSortLabel>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          No data found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedInvoices.map((inv) => (
                        <TableRow key={inv.invoice_id}>
                          <TableCell>{inv.invoice_id}</TableCell>
                          <TableCell>{inv.kode_gerai}</TableCell>
                          <TableCell>{inv.nama_gerai}</TableCell>
                          <TableCell>{inv.va_number}</TableCell>
                          <TableCell>Rp {inv.total_amount.toLocaleString()}</TableCell>
                          <TableCell>{inv.sales_date}</TableCell>
                          <TableCell>{inv.pickup_date}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50, 100]}
                component="div"
                count={filteredInvoices.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </Paper>
          ) : (
            <Box p={4} textAlign="center">
              <Typography variant="h6" color="textSecondary">
                No data found.
              </Typography>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default InvoiceAPIPage; 
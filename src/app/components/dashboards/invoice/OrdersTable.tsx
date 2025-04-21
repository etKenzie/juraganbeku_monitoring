"use client";
import { calculateDueDateStatus } from "@/app/(DashboardLayout)/dashboards/Invoice/data";
import DownloadButton from "@/app/components/common/DownloadButton";
import { formatCurrency } from "@/app/utils/formatNumber";
import { OrderData } from "@/store/apps/Invoice/invoiceSlice";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
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
import React, { useState } from "react";

type Order = "asc" | "desc";

type SortableField = keyof OrderData | "order_date" | "profit" | "due_date_status";

interface HeadCell {
  id: SortableField;
  label: string;
  numeric: boolean;
}

const headCells: HeadCell[] = [
  { id: "order_code", label: "Order Code", numeric: false },
  { id: "order_date", label: "Order Date", numeric: false },
  { id: "payment_due_date", label: "Due Date", numeric: false },
  { id: "reseller_name", label: "Reseller Name", numeric: false },
  { id: "store_name", label: "Store Name", numeric: false },
  { id: "status_order", label: "Status Order", numeric: false },
  { id: "status_payment", label: "Status Payment", numeric: false },
  { id: "payment_type", label: "Payment Type", numeric: false },
  { id: "due_date_status", label: "Due Date Status", numeric: false },
  { id: "total_invoice", label: "Total Invoice", numeric: true },
  { id: "profit", label: "Profit", numeric: true },
];

interface OrdersTableProps {
  orders: OrderData[];
}

const OrdersTable = ({ orders }: OrdersTableProps) => {
  const [orderBy, setOrderBy] = useState<SortableField>("order_date");
  const [order, setOrder] = useState<Order>("desc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusOrderFilter, setStatusOrderFilter] = useState<string>("");
  const [statusPaymentFilter, setStatusPaymentFilter] = useState<string>("");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>("");
  const [dueDateStatusFilter, setDueDateStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const handleRequestSort = (property: SortableField) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateOrderProfit = (order: OrderData) => {
    let totalProfit = 0;
    order.detail_order?.forEach(item => {
      if (!item) return;
      const price = (item.buy_price || 0) * (item.order_quantity || 0);
      let profit = (item.total_invoice || 0) - price;
      if (profit < 0) {
        profit = 0;
      }
      totalProfit += profit;
    });
    return totalProfit;
  };

  const filteredOrders = orders.filter((order) => {
    if (statusOrderFilter && order.status_order !== statusOrderFilter) return false;
    if (statusPaymentFilter && order.status_payment !== statusPaymentFilter) return false;
    if (paymentTypeFilter && order.payment_type !== paymentTypeFilter) return false;
    if (dueDateStatusFilter && calculateDueDateStatus(order.payment_due_date, order.status_payment) !== dueDateStatusFilter) return false;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        order.order_code.toLowerCase().includes(query) ||
        order.reseller_name.toLowerCase().includes(query) ||
        order.store_name.toLowerCase().includes(query) ||
        order.status_order.toLowerCase().includes(query) ||
        order.status_payment.toLowerCase().includes(query) ||
        order.payment_type.toLowerCase().includes(query) ||
        calculateDueDateStatus(order.payment_due_date, order.status_payment).toLowerCase().includes(query)
      );
    }
    return true;
  });

  const uniqueStatusOrders = Array.from(new Set(orders.map((order) => order.status_order)));
  const uniqueStatusPayments = Array.from(new Set(orders.map((order) => order.status_payment)));
  const uniquePaymentTypes = Array.from(new Set(orders.map((order) => order.payment_type)));
  const uniqueDueDateStatuses = ['Current', 'Below 14 DPD', '14 DPD', '30 DPD', '60 DPD', 'Lunas'];

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    if (orderBy === "order_date") {
      aValue = new Date(a.order_date).getTime();
      bValue = new Date(b.order_date).getTime();
    } else if (orderBy === "profit") {
      aValue = calculateOrderProfit(a);
      bValue = calculateOrderProfit(b);
    } else {
      aValue = a[orderBy as keyof OrderData];
      bValue = b[orderBy as keyof OrderData];
    }

    if (order === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
    }
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, mt: 4}}>
        <Typography variant="h6">Orders Table</Typography>
        <DownloadButton
          data={filteredOrders}
          filename="orders"
          sheetName="Orders"
          variant="outlined"
          size="small"
        />
      </Box>
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth>
            <InputLabel>Status Order</InputLabel>
            <Select
              value={statusOrderFilter}
              label="Status Order"
              onChange={(e) => setStatusOrderFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {uniqueStatusOrders.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth>
            <InputLabel>Status Payment</InputLabel>
            <Select
              value={statusPaymentFilter}
              label="Status Payment"
              onChange={(e) => setStatusPaymentFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {uniqueStatusPayments.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth>
            <InputLabel>Payment Type</InputLabel>
            <Select
              value={paymentTypeFilter}
              label="Payment Type"
              onChange={(e) => setPaymentTypeFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {uniquePaymentTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth>
            <InputLabel>Due Date Status</InputLabel>
            <Select
              value={dueDateStatusFilter}
              label="Due Date Status"
              onChange={(e) => setDueDateStatusFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {uniqueDueDateStatuses.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {headCells.map((headCell) => (
                <TableCell
                  key={headCell.id}
                  align={headCell.numeric ? "right" : "left"}
                  sortDirection={orderBy === headCell.id ? order : false}
                >
                  <TableSortLabel
                    active={orderBy === headCell.id}
                    direction={orderBy === headCell.id ? order : "asc"}
                    onClick={() => handleRequestSort(headCell.id)}
                  >
                    {headCell.label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedOrders
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((order) => (
                <TableRow key={order.order_id}>
                  <TableCell>{order.order_code}</TableCell>
                  <TableCell>{formatDate(order.order_date)}</TableCell>
                  <TableCell>{formatDate(order.payment_due_date)}</TableCell>
                  <TableCell>{order.reseller_name}</TableCell>
                  <TableCell>{order.store_name}</TableCell>
                  <TableCell>{order.status_order}</TableCell>
                  <TableCell>{order.status_payment}</TableCell>
                  <TableCell>{order.payment_type}</TableCell>
                  <TableCell>{calculateDueDateStatus(order.payment_due_date, order.status_payment)}</TableCell>
                  <TableCell align="right">{formatCurrency(order.total_invoice)}</TableCell>
                  <TableCell align="right">{formatCurrency(calculateOrderProfit(order))}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredOrders.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
};

export default OrdersTable; 
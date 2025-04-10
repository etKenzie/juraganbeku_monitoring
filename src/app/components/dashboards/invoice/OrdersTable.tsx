"use client";
import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  TableSortLabel,
  Box,
  Typography,
} from "@mui/material";
import { OrderData } from "@/store/apps/Invoice/invoiceSlice";

type Order = "asc" | "desc";

interface HeadCell {
  id: keyof OrderData;
  label: string;
  numeric: boolean;
}

const headCells: HeadCell[] = [
  { id: "order_code", label: "Order Code", numeric: false },
  { id: "reseller_name", label: "Reseller Name", numeric: false },
  { id: "store_name", label: "Store Name", numeric: false },
  { id: "status_order", label: "Status", numeric: false },
  { id: "payment_type", label: "Payment Type", numeric: false },
  { id: "order_date", label: "Order Date", numeric: false },
  { id: "total_invoice", label: "Total Invoice", numeric: true },
];

interface OrdersTableProps {
  orders: OrderData[];
}

export default function OrdersTable({ orders }: OrdersTableProps) {
  const [orderBy, setOrderBy] = useState<keyof OrderData>("order_date");
  const [order, setOrder] = useState<Order>("desc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleRequestSort = (property: keyof OrderData) => {
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

  const formatCurrency = (value: number) => {
    return `Rp ${value.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const sortedOrders = [...orders].sort((a, b) => {
    const aValue = a[orderBy];
    const bValue = b[orderBy];
    if (order === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
    }
  });

  return (
    <Box>
      <Typography variant="h6" mb={2}>Orders</Typography>
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
                  <TableCell>{order.reseller_name}</TableCell>
                  <TableCell>{order.store_name}</TableCell>
                  <TableCell>{order.status_order}</TableCell>
                  <TableCell>{order.payment_type}</TableCell>
                  <TableCell>{formatDate(order.order_date)}</TableCell>
                  <TableCell align="right">{formatCurrency(order.total_invoice)}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={orders.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
} 
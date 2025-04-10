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
import { ProcessedData } from "@/app/(DashboardLayout)/dashboards/Invoice/types";

type Order = "asc" | "desc";

interface HeadCell {
  id: string;
  label: string;
  numeric: boolean;
}

interface StoreSummary {
  storeName: string;
  totalInvoice: number;
  totalProfit: number;
  orderCount: number;
  activeMonths: number;
  averageOrderValue: number;
}

const headCells: HeadCell[] = [
  { id: "storeName", label: "Store Name", numeric: false },
  { id: "orderCount", label: "Total Orders", numeric: true },
  { id: "totalInvoice", label: "Total Invoice", numeric: true },
  { id: "totalProfit", label: "Total Profit", numeric: true },
  { id: "activeMonths", label: "Active Months", numeric: true },
  { id: "averageOrderValue", label: "Average Order Value", numeric: true },
];

interface StoreSummaryTableProps {
  storeSummaries: ProcessedData["storeSummaries"];
}

export default function StoreSummaryTable({ storeSummaries }: StoreSummaryTableProps) {
  const [orderBy, setOrderBy] = useState<string>("totalInvoice");
  const [order, setOrder] = useState<Order>("desc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleRequestSort = (property: string) => {
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

  const sortedStores = Object.entries(storeSummaries)
    .map(([storeName, data]) => ({
      storeName,
      ...data,
      activeMonths: data.activeMonths.size,
    }))
    .sort((a, b) => {
      const aValue = a[orderBy as keyof StoreSummary];
      const bValue = b[orderBy as keyof StoreSummary];
      if (order === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
      }
    });

  return (
    <Box>
      <Typography variant="h6" mb={2}>Store Summary</Typography>
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
            {sortedStores
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((store) => (
                <TableRow key={store.storeName}>
                  <TableCell>{store.storeName}</TableCell>
                  <TableCell align="right">{store.orderCount}</TableCell>
                  <TableCell align="right">{formatCurrency(store.totalInvoice)}</TableCell>
                  <TableCell align="right">{formatCurrency(store.totalProfit)}</TableCell>
                  <TableCell align="right">{store.activeMonths}</TableCell>
                  <TableCell align="right">{formatCurrency(store.averageOrderValue)}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={Object.keys(storeSummaries).length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
} 
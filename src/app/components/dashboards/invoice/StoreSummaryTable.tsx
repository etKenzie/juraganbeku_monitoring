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
import { ProcessedData, StoreSummary } from "@/app/(DashboardLayout)/dashboards/Invoice/types";
import { OrderData } from "@/store/apps/Invoice/invoiceSlice";
import StoreDetailsModal from './StoreDetailsModal';

type Order = "asc" | "desc";

interface HeadCell {
  id: string;
  label: string;
  numeric: boolean;
}

interface DisplayStoreSummary {
  storeName: string;
  orderCount: number;
  totalInvoice: number;
  totalProfit: number;
  activeMonths: number;
  averageOrderValue: number;
  userId: string;
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
  storeSummaries: { [key: string]: StoreSummary };
}

export default function StoreSummaryTable({ storeSummaries }: StoreSummaryTableProps) {
  const [order, setOrder] = useState<Order>("asc");
  const [orderBy, setOrderBy] = useState<keyof DisplayStoreSummary>("storeName");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedStore, setSelectedStore] = useState<StoreSummary | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  

  const handleRequestSort = (property: keyof DisplayStoreSummary) => {
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

  const sortedStores: DisplayStoreSummary[] = Object.entries(storeSummaries)
    .map(([storeName, data]) => ({
      ...data,
      activeMonths: data.activeMonths.size,
    } as DisplayStoreSummary))
    .sort((a, b) => {
      const aValue = a[orderBy];
      const bValue = b[orderBy];
      if (order === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
      }
    });

  const handleRowClick = (store: StoreSummary) => {
    console.log("Clicked store:", store);
    setSelectedStore(store);
    setModalOpen(true);
  };

  if (Object.keys(storeSummaries).length === 0) {
    return (
      <Box>
        <Typography variant="h6" mb={2}>Store Summary</Typography>
        <Typography>No store data available</Typography>
      </Box>
    );
  }

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
                    onClick={() => handleRequestSort(headCell.id as keyof DisplayStoreSummary)}
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
                <TableRow 
                  key={store.storeName}
                  onClick={() => {
                    const fullStore = storeSummaries[store.userId];
                    if (fullStore) {
                      setSelectedStore(fullStore);
                      setModalOpen(true);
                    }
                  }}
                  sx={{ cursor: 'pointer' }}
                >
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

      {selectedStore && (
        <StoreDetailsModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedStore(null);
          }}
          store={selectedStore}
        />
      )}
    </Box>
  );
} 
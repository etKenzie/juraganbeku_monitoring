"use client";
import { StoreSummary } from "@/app/(DashboardLayout)/dashboards/Invoice/types";
import DownloadButton from "@/app/components/common/DownloadButton";
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Checkbox,
  Collapse,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
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
import React, { useMemo, useState } from "react";
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
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showMonthFilter, setShowMonthFilter] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState<Set<string>>(new Set());

  // Get all unique months from all stores
  const allMonths = useMemo(() => {
    const months = new Set<string>();
    Object.values(storeSummaries).forEach(store => {
      store.activeMonths.forEach(month => months.add(month));
    });
    return Array.from(months).sort();
  }, [storeSummaries]);

  const handleMonthChange = (month: string) => {
    const newSelectedMonths = new Set(selectedMonths);
    if (newSelectedMonths.has(month)) {
      newSelectedMonths.delete(month);
    } else {
      newSelectedMonths.add(month);
    }
    setSelectedMonths(newSelectedMonths);
    setPage(0); // Reset to first page when filter changes
  };

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

  const filteredStores = Object.entries(storeSummaries)
    .filter(([_, summary]) => {
      // Text search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!summary.storeName.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Month filter
      if (selectedMonths.size > 0) {
        // Check if store has ALL selected months
        for (const month of Array.from(selectedMonths)) {
          if (!summary.activeMonths.has(month)) {
            return false;
          }
        }
      }

      return true;
    })
    .map(([id, summary]) => ({
      id,
      storeName: summary.storeName,
      orderCount: summary.orderCount,
      totalInvoice: summary.totalInvoice,
      totalProfit: summary.totalProfit,
      activeMonths: summary.activeMonths.size,
      averageOrderValue: summary.averageOrderValue,
      userId: summary.userId,
    }))
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Store Summary</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <IconButton 
            onClick={() => setShowMonthFilter(!showMonthFilter)}
            color={selectedMonths.size > 0 ? "primary" : "default"}
          >
            <FilterListIcon />
          </IconButton>
          <DownloadButton
            data={filteredStores}
            filename="store_summary"
            sheetName="Store Summary"
            variant="outlined"
            size="small"
          />
        </Box>
      </Box>

      <Collapse in={showMonthFilter}>
        <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Filter by Active Months</Typography>
          <FormGroup row>
            {allMonths.map((month) => (
              <FormControlLabel
                key={month}
                control={
                  <Checkbox
                    checked={selectedMonths.has(month)}
                    onChange={() => handleMonthChange(month)}
                  />
                }
                label={month}
              />
            ))}
          </FormGroup>
        </Box>
      </Collapse>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search stores..."
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
                    onClick={() => handleRequestSort(headCell.id as keyof DisplayStoreSummary)}
                  >
                    {headCell.label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStores
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((store) => (
                <TableRow 
                  key={store.id}
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
          count={filteredStores.length}
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
"use client";
import { StoreSummary } from "@/app/(DashboardLayout)/distribusi/sales/types";
import DownloadButton from "@/app/components/common/DownloadButton";
import { formatCurrency } from "@/app/utils/formatNumber";
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Checkbox,
  Chip,
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
  storeStatus: "Active" | "D1" | "D2" | "Inactive";
  lastOrderDate?: string;
}

const headCells: HeadCell[] = [
  { id: "storeName", label: "Store Name", numeric: false },
  { id: "storeStatus", label: "Status", numeric: false },
  { id: "lastOrderDate", label: "Last Order Date", numeric: false },
  { id: "orderCount", label: "Total Orders", numeric: true },
  { id: "totalInvoice", label: "Total Invoice", numeric: true },
  { id: "totalProfit", label: "Total Profit", numeric: true },
  { id: "activeMonths", label: "Active Months", numeric: true },
  { id: "averageOrderValue", label: "Average Order Value", numeric: true },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "Active":
      return "success";
    case "D1":
      return "info";
    case "D2":
      return "warning";
    case "D3":
      return "error";
    case "Inactive":
      return "default";
    default:
      return "default";
  }
};

interface StoreSummaryTableProps {
  storeSummaries: { [key: string]: StoreSummary };
}

export default function StoreSummaryTable({ storeSummaries }: StoreSummaryTableProps) {
  const [order, setOrder] = useState<Order>("desc");
  const [orderBy, setOrderBy] = useState<keyof DisplayStoreSummary>("lastOrderDate");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedStore, setSelectedStore] = useState<StoreSummary | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState<Set<string>>(new Set());
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set());

  // Get all unique months from all stores
  const allMonths = useMemo(() => {
    const months = new Set<string>();
    Object.values(storeSummaries).forEach(store => {
      store.activeMonths.forEach(month => months.add(month));
    });
    // Sort by date (month year)
    return Array.from(months).sort((a, b) => {
      // Parse month and year
      const [monthA, yearA] = a.split(" ");
      const [monthB, yearB] = b.split(" ");
      const dateA = new Date(`${monthA} 1, ${yearA}`);
      const dateB = new Date(`${monthB} 1, ${yearB}`);
      return dateA.getTime() - dateB.getTime();
    });
  }, [storeSummaries]);
  console.log(storeSummaries)

  // Get all unique statuses
  const allStatuses = useMemo(() => {
    const statuses = new Set<string>();
    Object.values(storeSummaries).forEach(store => {
      statuses.add(store.storeStatus);
    });
    return Array.from(statuses).sort();
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

  const handleStatusChange = (status: string) => {
    const newSelectedStatuses = new Set(selectedStatuses);
    if (newSelectedStatuses.has(status)) {
      newSelectedStatuses.delete(status);
    } else {
      newSelectedStatuses.add(status);
    }
    setSelectedStatuses(newSelectedStatuses);
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

      // Status filter
      if (selectedStatuses.size > 0) {
        if (!selectedStatuses.has(summary.storeStatus)) {
          return false;
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
      storeStatus: summary.storeStatus,
      lastOrderDate: summary.lastOrderDate,
    }))
    .sort((a, b) => {
      const aValue = a[orderBy];
      const bValue = b[orderBy];
      
      // Handle undefined values
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return order === "asc" ? 1 : -1;
      if (bValue === undefined) return order === "asc" ? -1 : 1;
      
      // Special handling for date sorting
      if (orderBy === "lastOrderDate") {
        const aDate = aValue ? new Date(aValue as string).getTime() : 0;
        const bDate = bValue ? new Date(bValue as string).getTime() : 0;
        if (order === "asc") {
          return aDate - bDate;
        } else {
          return bDate - aDate;
        }
      }
      
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
            onClick={() => setShowFilters(!showFilters)}
            color={selectedStatuses.size > 0 || selectedMonths.size > 0 ? "primary" : "default"}
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

      <Collapse in={showFilters}>
        <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Filter by Store Status</Typography>
            <FormGroup row>
              {allStatuses.map((status) => (
                <FormControlLabel
                  key={status}
                  control={
                    <Checkbox
                      checked={selectedStatuses.has(status)}
                      onChange={() => handleStatusChange(status)}
                    />
                  }
                  label={
                    <Chip 
                      label={status} 
                      color={getStatusColor(status) as any}
                      size="small"
                      variant="outlined"
                    />
                  }
                />
              ))}
            </FormGroup>
          </Box>
          <Box>
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
                  <TableCell>
                    <Chip 
                      label={store.storeStatus} 
                      color={getStatusColor(store.storeStatus) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{store.lastOrderDate ? new Date(store.lastOrderDate).toLocaleDateString() : 'N/A'}</TableCell>
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
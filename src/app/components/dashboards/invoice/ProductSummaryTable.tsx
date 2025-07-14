"use client";
import { ProductSummary } from "@/app/(DashboardLayout)/dashboards/dashboard/types";
import DownloadButton from "@/app/components/common/DownloadButton";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Grid,
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
import React, { useState } from "react";

type Order = "asc" | "desc";

interface HeadCell {
  id: string;
  label: string;
  numeric: boolean;
}

interface DisplayProductSummary {
  name: string;
  totalInvoice: number;
  quantity: number;
  averagePrice: number;
  totalProfit: number;
}

const headCells: HeadCell[] = [
  { id: "name", label: "Product Name", numeric: false },
  { id: "quantity", label: "Total Quantity", numeric: true },
  { id: "averagePrice", label: "Average Price", numeric: true },
  { id: "totalInvoice", label: "Total Invoice", numeric: true },
  { id: "totalProfit", label: "Total Profit", numeric: true },
];

interface ProductSummaryTableProps {
  productSummaries: { [key: string]: ProductSummary };
}

export default function ProductSummaryTable({ productSummaries }: ProductSummaryTableProps) {
  const [order, setOrder] = useState<Order>("desc");
  const [orderBy, setOrderBy] = useState<keyof DisplayProductSummary>("totalInvoice");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const handleRequestSort = (property: keyof DisplayProductSummary) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };
  console.log(productSummaries)

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

  const filteredProducts = Object.entries(productSummaries)
    .filter(([_, summary]) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          summary.name.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .map(([id, summary]) => ({
      id,
      name: summary.name,
      totalInvoice: summary.totalInvoice,
      quantity: summary.quantity,
      averagePrice: summary.price / summary.difPrice,
      totalProfit: summary.profit,
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

  if (Object.keys(productSummaries).length === 0) {
    return (
      <Box>
        <Typography variant="h6" mb={2}>Product Summary</Typography>
        <Typography>No product data available</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Product Summary</Typography>
        <DownloadButton
          data={filteredProducts}
          filename="product_summary"
          sheetName="Product Summary"
          variant="outlined"
          size="small"
        />
      </Box>
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search products..."
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
                    onClick={() => handleRequestSort(headCell.id as keyof DisplayProductSummary)}
                  >
                    {headCell.label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProducts
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell align="right">{product.quantity}</TableCell>
                  <TableCell align="right">{formatCurrency(product.averagePrice)}</TableCell>
                  <TableCell align="right">{formatCurrency(product.totalInvoice)}</TableCell>
                  <TableCell align="right">{formatCurrency(product.totalProfit)}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredProducts.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
} 
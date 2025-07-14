"use client";
import SearchIcon from "@mui/icons-material/Search";
import {
    Box,
    Checkbox,
    CircularProgress,
    FormControl,
    FormControlLabel,
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

const API_URL = "https://dev.tokopandai.id/api/product/";

const columns = [
  { id: "image", label: "Image" },
  { id: "sku", label: "SKU" },
  { id: "name", label: "Name" },
  { id: "variant_name", label: "Variant" },
  { id: "brand", label: "Brand" },
  { id: "category", label: "Category" },
  { id: "area", label: "Area" },
  { id: "segment", label: "Segment" },
  { id: "hub", label: "Hub" },
  { id: "stock", label: "Stock" },
  { id: "price", label: "Price" },
];

const getImageUrl = (image: string) =>
  image.startsWith("http")
    ? image
    : `https://juraganbeku.tokopandai.id/images/${image}`;

// Define static options for area, segment, and hub
const AREA_OPTIONS = [
  "CENTRAL",
  "JAKARTA",
  "TANGERANG",
  "SURABAYA",
  "BEKASI"
  // Add more as needed
];
const SEGMENT_OPTIONS = [
  "RESELLER",
  "HORECA",
  "OTHER",
  // Add more as needed
];
const HUB_OPTIONS = [
  "HUB RADEN SALEH",
  "HUB TANGERANG",
  "HUB SURABAYA",


  // Add more as needed
];

export default function StockPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    area: "CENTRAL",
    segment: "RESELLER",
    hub: "HUB RADEN SALEH",
    // brand: "",
    // category: "",
  });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState<string | null>(null);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [showZeroStock, setShowZeroStock] = useState(false);
  const [showNoPrice, setShowNoPrice] = useState(false);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (filters.area) params.append("area", filters.area);
        if (filters.segment) params.append("segment", filters.segment);
        if (filters.hub) params.append("hub", filters.hub);
        const url = `${API_URL}?${params.toString()}`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.status !== "success") throw new Error(json.message);
        setData(json.data || []);
      } catch (e: any) {
        setError(e.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line
  }, [filters.area, filters.segment, filters.hub]);

  // Extract unique values for dropdowns
  const dropdownOptions = useMemo(() => {
    const opts = {
      brand: new Set<string>(),
      category: new Set<string>(),
    };
    data.forEach((item) => {
      if (item.brand) opts.brand.add(item.brand);
      if (item.category) opts.category.add(item.category);
    });
    return {
      area: AREA_OPTIONS,
      segment: SEGMENT_OPTIONS,
      hub: HUB_OPTIONS,
      brand: Array.from(opts.brand).sort(),
      category: Array.from(opts.category).sort(),
    };
  }, [data]);

  // Sorting
  const handleRequestSort = (property: string) => {
    if (orderBy === property) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setOrderBy(property);
      setOrder('asc');
    }
    setPage(0);
  };

  // Filter, search, and sort
  const filteredData: any[] = useMemo(() => {
    let result = data.filter((item) => {
      for (const key of Object.keys(filters)) {
        if (filters[key as keyof typeof filters] && item[key] !== filters[key as keyof typeof filters]) {
          return false;
        }
      }
      if (!showZeroStock && item.stock === 0) {
        return false;
      }
      if (!showNoPrice && item.price === 0) {
        return false;
      }
      if (search) {
        const searchStr = search.toLowerCase();
        return columns.some((col) => {
          if (col.id === "image") return false;
          const val = item[col.id];
          return val && val.toString().toLowerCase().includes(searchStr);
        });
      }
      return true;
    });
    // Sorting
    if (orderBy === 'stock' || orderBy === 'price') {
      result = [...result].sort((a, b) => {
        const aValue = a[orderBy] ?? 0;
        const bValue = b[orderBy] ?? 0;
        if (order === 'asc') return aValue - bValue;
        return bValue - aValue;
      });
    }
    return result;
  }, [data, filters, search, orderBy, order, showZeroStock, showNoPrice]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const handleChangePage = (_: any, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  return (
    <Box p={4}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4" fontWeight={700}>
          Stock Table
        </Typography>
        <Box display="flex" gap={2}>
          <FormControlLabel
            control={
              <Checkbox
                checked={showZeroStock}
                onChange={(_, checked) => setShowZeroStock(checked)}
                color="primary"
              />
            }
            label="Show 0 Stock"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={showNoPrice}
                onChange={(_, checked) => setShowNoPrice(checked)}
                color="primary"
              />
            }
            label="Show No Price"
          />
        </Box>
      </Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3} md={2}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search..."
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
          {/* Area, Segment, Hub: no 'All' option, use static options */}
          {["area", "segment", "hub"].map((key) => (
            <Grid item xs={12} sm={3} md={2} key={key}>
              <FormControl fullWidth>
                <InputLabel>{key.charAt(0).toUpperCase() + key.slice(1)}</InputLabel>
                <Select
                  value={filters[key as keyof typeof filters]}
                  label={key.charAt(0).toUpperCase() + key.slice(1)}
                  onChange={(e) => handleFilterChange(key, e.target.value)}
                >
                  {(dropdownOptions[key as keyof typeof dropdownOptions] as string[]).map((option: string) => (
                    <MenuItem key={option} value={option}>
                        {option}
                    </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
          ))}
          {/* Brand and Category: dynamic, with 'All' option */}
          {["brand", "category"].map((key) => (
            <Grid item xs={12} sm={3} md={2} key={key}>
              <FormControl fullWidth>
                <InputLabel>{key.charAt(0).toUpperCase() + key.slice(1)}</InputLabel>
                <Select
                  value={filters[key as keyof typeof filters] || ""}
                  label={key.charAt(0).toUpperCase() + key.slice(1)}
                  onChange={(e) => handleFilterChange(key, e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {dropdownOptions[key as keyof typeof dropdownOptions].map((option: string) => (
                    <MenuItem key={option} value={option}>
                        {option}
                    </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
          ))}
        </Grid>
      </Paper>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {columns.map((col) => (
                    <TableCell key={col.id}>
                      {(col.id === 'stock' || col.id === 'price') ? (
                        <TableSortLabel
                          active={orderBy === col.id}
                          direction={orderBy === col.id ? order : 'asc'}
                          onClick={() => handleRequestSort(col.id)}
                        >
                          {col.label}
                        </TableSortLabel>
                      ) : (
                        col.label
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row: any) => (
                    <TableRow key={row}>
                      {columns.map((col) => (
                        <TableCell key={col.id}>
                          {col.id === "image" ? (
                            <img
                              src={getImageUrl(row.image)}
                              alt={row.name}
                              style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 4 }}
                            />
                          ) : col.id === "price" ? (
                            row.price ? `Rp ${row.price.toLocaleString()}` : "-"
                          ) : (
                            row[col.id] ?? "-"
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={filteredData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      )}
    </Box>
  );
}

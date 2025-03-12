"use client";
import * as React from "react";
import {
  TableContainer,
  Table,
  TableRow,
  TableCell,
  TableBody,
  Avatar,
  Typography,
  TableHead,
  Chip,
  Box,
  Grid,
  MenuItem,
  Button,
  Divider,
  IconButton,
  LinearProgress,
  TextFieldProps,
  InputAdornment,
  TextField,
} from "@mui/material";
import { Stack } from "@mui/system";

import DownloadCard from "@/app/components/shared/DownloadCard";
import { basicsTableData, BasicsTableDataType } from "@/app/(DashboardLayout)/react-tables/filter/FilterTableData";

import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, createColumnHelper } from "@tanstack/react-table";
import CustomTextField from "@/app/components/forms/theme-elements/CustomTextField";
import CustomSelect from "@/app/components/forms/theme-elements/CustomSelect";
import { IconChevronLeft, IconChevronRight, IconChevronsLeft, IconChevronsRight, IconArrowBackUp, IconCheck, IconX, IconSearch } from "@tabler/icons-react";

const BCrumb = [
  {
    to: "/",
    title: "Home",
  },
  {
    title: "Filter React Table",
  },
];

const basics = basicsTableData;

const columnHelper = createColumnHelper<BasicsTableDataType>();

const columns = [
  columnHelper.accessor("id", {
    header: () => "ID",
    cell: (info) => info.getValue(),
    meta: { filterVariant: null },
  }),

  columnHelper.accessor("nama_agent", {
    header: () => "Nama Agent",
    cell: (info) => (
      <Typography variant="subtitle1" color="textPrimary" fontWeight={600}>
        {info.getValue()}
      </Typography>
    ),
    meta: { filterVariant: "text" },
  }),

  columnHelper.accessor("kode_gerai", {
    header: () => "Kode Gerai",
    cell: (info) => (
      <Typography variant="subtitle1" color="textPrimary" fontWeight={600}>
        {info.getValue()}
      </Typography>
    ),
  }),

  columnHelper.accessor("store", {
    header: () => "Store",
    cell: (info) => (
      <Typography variant="subtitle1" color="textPrimary" fontWeight={600}>
        {info.getValue()}
      </Typography>
    ),
  }),

  columnHelper.accessor("area", {
    header: () => "Area",
    cell: (info) => (
      <Typography variant="subtitle1" color="textPrimary" fontWeight={600}>
        {info.getValue()}
      </Typography>
    ),
  }),

  columnHelper.accessor("menu", {
    header: () => "Menu",
    cell: (info) => (
      <Typography variant="subtitle1" color="textPrimary" fontWeight={600}>
        {info.getValue()}
      </Typography>
    ),
  }),

  columnHelper.accessor("percentage_service", {
    header: () => "Percentage Service",
    cell: (info) => (
      <Typography variant="subtitle1" color="textPrimary" fontWeight={600}>
        {info.getValue()}
      </Typography>
    ),
  }),

  columnHelper.accessor("percentage_toilet", {
    header: () => "Percentage Toilet",
    cell: (info) => (
      <Typography variant="subtitle1" color="textPrimary" fontWeight={600}>
        {info.getValue()}
      </Typography>
    ),
  }),

  columnHelper.accessor("percentage_food", {
    header: () => "Percentage Food",
    cell: (info) => (
      <Typography variant="subtitle1" color="textPrimary" fontWeight={600}>
        {info.getValue()}
      </Typography>
    ),
  }),

  columnHelper.accessor("tanggal", {
    header: () => "Tanggal",
    cell: (info) => (
      <Typography variant="subtitle1" color="textPrimary" fontWeight={600}>
        {info.getValue()}
      </Typography>
    ),
  }),

  columnHelper.accessor("foto_produk", {
    header: () => "Foto Produk",
    cell: (info) => (
      <Typography variant="subtitle1" color="textPrimary" fontWeight={600}>
        {info.getValue()}
      </Typography>
    ),
  }),

  columnHelper.accessor("foto_struk", {
    header: () => "Foto Struk",
    cell: (info) => (
      <Typography variant="subtitle1" color="textPrimary" fontWeight={600}>
        {info.getValue()}
      </Typography>
    ),
  }),
];

function Filter({ column }: any) {
  const columnFilterValue = column.getFilterValue();
  const { filterVariant } = column.columnDef.meta || {};

  if (!filterVariant) {
    return null;
  }

  return filterVariant === "select" ? (
    <CustomSelect onChange={(e: { target: { value: any } }) => column.setFilterValue(e.target.value)} value={columnFilterValue ? columnFilterValue.toString() : ""}>
      {/* See faceted column filters example for dynamic select options */}
      <MenuItem value="">All</MenuItem>
      <MenuItem value="Paid">Paid</MenuItem>
      <MenuItem value="Cancelled">Cancelled</MenuItem>
      <MenuItem value="Refunded">Refunded</MenuItem>
    </CustomSelect>
  ) : (
    <DebouncedInput onChange={(value: any) => column.setFilterValue(value)} placeholder={`Search...`} type="text" value={columnFilterValue || ""} />
    // See faceted column filters example for datalist search suggestions
  );
}

interface DebouncedInputProps extends Omit<TextFieldProps, "onChange" | "value"> {
  value: string;
  onChange: (value: string) => void;
  debounce?: number;
}

const DebouncedInput: React.FC<DebouncedInputProps> = ({ value: initialValue, onChange, debounce = 500, ...props }) => {
  const [value, setValue] = React.useState<string>(initialValue);

  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [value, debounce, onChange]);

  // Proper typing for the event handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  return (
    <CustomTextField
      {...props}
      value={value}
      onChange={handleChange} // Use the properly typed event handler
    />
  );
};

const TableFilter = () => {
  const [data, _setData] = React.useState(() => [...basics]);
  const [columnFilters, setColumnFilters] = React.useState<any>([]);
  const rerender = React.useReducer(() => ({}), {})[1];

  const table = useReactTable({
    data,
    columns,
    filterFns: {},
    state: {
      columnFilters,
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(), //client side filtering
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    debugTable: true,
    debugHeaders: true,
    debugColumns: false,
  });

  const handleDownload = () => {
    const headers = ["Invoice", "Status", "Customer", "Progress"];
    const rows = data.map((item) => [item.nama_agent, item.status, item.name, item.progress]);

    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "table-data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DownloadCard title="Filter Table" onDownload={handleDownload}>
      <TextField
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <IconSearch size="1.1rem" />
            </InputAdornment>
          ),
        }}
        placeholder="Search Items"
        size="small"
        // onChange={handleSearch}
        // value={search}
      />
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box>
            <TableContainer>
              <Table
                sx={{
                  whiteSpace: "nowrap",
                }}>
                <TableHead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableCell key={header.id}>
                          <Typography
                            variant="h6"
                            mb={1}
                            {...{
                              className: header.column.getCanSort() ? "cursor-pointer select-none" : "",
                              onClick: header.column.getToggleSortingHandler(),
                            }}>
                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                          </Typography>
                          {header.column.getCanFilter() ? (
                            <div>
                              <Filter column={header.column} />
                            </div>
                          ) : null}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableHead>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Divider />
            <Stack gap={1} p={3} alignItems="center" direction={{ xs: "column", sm: "row" }} justifyContent="space-between">
              <Box display="flex" alignItems="center" gap={1}>
                <Button variant="contained" color="primary" onClick={() => rerender()}>
                  Force Rerender
                </Button>
                <Typography variant="body1">{table.getPrePaginationRowModel().rows.length} Rows</Typography>
              </Box>
              <Box
                sx={{
                  display: {
                    xs: "block",
                    sm: "flex",
                  },
                }}
                alignItems="center"
                gap={1}>
                <Stack direction="row" alignItems="center" gap={1}>
                  <Typography variant="body1">Page</Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" gap={1}>
                  | Go to page:
                  <CustomTextField
                    type="number"
                    min="1"
                    max={table.getPageCount()}
                    defaultValue={table.getState().pagination.pageIndex + 1}
                    onChange={(e: { target: { value: any } }) => {
                      const page = e.target.value ? Number(e.target.value) - 1 : 0;
                      table.setPageIndex(page);
                    }}
                  />
                </Stack>
                <CustomSelect
                  value={table.getState().pagination.pageSize}
                  onChange={(e: { target: { value: any } }) => {
                    table.setPageSize(Number(e.target.value));
                  }}>
                  {[10, 15, 20, 25].map((pageSize) => (
                    <MenuItem key={pageSize} value={pageSize}>
                      {pageSize}
                    </MenuItem>
                  ))}
                </CustomSelect>

                <IconButton size="small" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
                  <IconChevronsLeft />
                </IconButton>
                <IconButton size="small" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                  <IconChevronLeft />
                </IconButton>
                <IconButton size="small" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                  <IconChevronRight />
                </IconButton>
                <IconButton size="small" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
                  <IconChevronsRight />
                </IconButton>
              </Box>
            </Stack>
          </Box>
        </Grid>
      </Grid>
    </DownloadCard>
  );
};

export default TableFilter;

import DownloadButton from "@/app/components/common/DownloadButton";
import { formatCurrency } from "@/app/utils/formatNumber";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  CircularProgress,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import React, { useMemo, useState } from "react";

function formatDate(ms: number) {
  if (!ms) return "-";
  const date = new Date(ms);
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function parseArea(desc: string) {
  if (typeof desc !== 'string') return "-";
  const match = desc.match(/area ([A-Z]+)/);
  return match ? match[1] : "-";
}

function parseOrder(desc: string) {
  if (typeof desc !== 'string') return "-";
  const match = desc.match(/order (\d+)/);
  return match ? match[1] : "-";
}

interface TransactionTableProps {
  transactions: any[];
  loading: boolean;
  error: string | null;
}

const headCells = [
  { id: "transid", label: "Tx ID" },
  { id: "trans_type", label: "Type" },
  { id: "trans_date", label: "Date" },
  { id: "amount", label: "Amount" },
  { id: "desc", label: "Description" },
  { id: "saldo", label: "Balance" },
  { id: "area", label: "Area" },
  { id: "order", label: "Order" },
  { id: "month", label: "Month" },
];

const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, loading, error }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return transactions;
    return transactions.filter((t) => {
      const area = parseArea(t.desc);
      const order = parseOrder(t.desc);
      return (
        t.desc?.toLowerCase().includes(search.toLowerCase()) ||
        area?.toLowerCase().includes(search.toLowerCase()) ||
        order?.toString().includes(search)
      );
    });
  }, [transactions, search]);

  // Prepare data for Excel export
  const prepareDataForExport = (txs: any[]) => {
    return txs.map(t => ({
      'Tx ID': t.transid,
      'Type': t.trans_type,
      'Date': t.trans_date ? formatDateStr(t.trans_date) : '-',
      'Amount': Number(t.amount) || 0,
      'Description': t.desc,
      'Balance': Number(t.saldo) || 0,
      'Area': t.area,
      'Order': parseOrder(t.desc),
      'Month': t.month,
    }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }
  if (!filtered.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <Typography>No transactions found.</Typography>
      </Box>
    );
  }

  function formatDateStr(dateStr: string) {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  return (
    <Box>
      <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Transactions</Typography>
        <DownloadButton
          data={prepareDataForExport(filtered)}
          filename="transactions"
          sheetName="Transactions"
          variant="outlined"
          size="small"
        />
      </Box>
      <Box mb={2}>
        <TextField
          placeholder="Search by description, area, or order..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          fullWidth
        />
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {headCells.map(cell => (
                <TableCell key={cell.id}>{cell.label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((t, idx) => (
              <TableRow key={t.transid + idx}>
                <TableCell>{t.transid}</TableCell>
                <TableCell>{t.trans_type}</TableCell>
                <TableCell>{formatDateStr(t.trans_date)}</TableCell>
                <TableCell>{formatCurrency(Number(t.amount))}</TableCell>
                <TableCell>{t.desc}</TableCell>
                <TableCell>{formatCurrency(Number(t.saldo))}</TableCell>
                <TableCell>{t.area}</TableCell>
                <TableCell>{parseOrder(t.desc)}</TableCell>
                <TableCell>{t.month}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filtered.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={e => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>
    </Box>
  );
};

export default TransactionTable; 
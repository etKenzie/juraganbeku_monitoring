import { StoreSummary } from "@/app/(DashboardLayout)/distribusi/sales/types";
import { formatCurrency } from "@/app/utils/formatNumber";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import InvoiceLineChart from "./InvoiceLineChart";

interface StoreDetailsModalProps {
  open: boolean;
  onClose: () => void;
  store: StoreSummary;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Active":
      return "success";
    case "D1":
      return "warning";
    case "D2":
      return "error";
    case "Inactive":
      return "default";
    default:
      return "default";
  }
};

const StoreDetailsModal: React.FC<StoreDetailsModalProps> = ({
  open,
  onClose,
  store,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [chartData, setChartData] = useState<
    Array<{
      date: string;
      month: string;
      totalInvoice: number;
      totalProfit: number;
    }>
  >([]);

  useEffect(() => {
    if (store?.orders) {
      // Group orders by month
      const ordersByMonth = store.orders.reduce(
        (acc: Record<string, any[]>, order) => {
          if (!order.month) return acc;
          if (!acc[order.month]) {
            acc[order.month] = [];
          }
          acc[order.month].push(order);
          return acc;
        },
        {}
      );

      // Convert to chart data format
      const data = Object.entries(ordersByMonth).map(([month, orders]) => {
        const totalInvoice = orders.reduce(
          (sum, order) => sum + (order.total_invoice || 0),
          0
        );
        const totalProfit = orders.reduce(
          (sum, order) => sum + (order.profit || 0),
          0
        );

        // Extract date from month string (e.g., "May 2025" -> "2025-05")
        const [monthName, year] = month.split(" ");
        const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth() + 1;
        const date = `${year}-${monthIndex.toString().padStart(2, "0")}`;

        return {
          date,
          month,
          totalInvoice,
          totalProfit,
        };
      });

      // Sort by date
      setChartData(
        data.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        )
      );
    }
  }, [store]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (!store) {
    console.warn("StoreDetailsModal: No store data provided");
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: "80vh",
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle>{store.storeName} - Store Details</DialogTitle>
      <DialogContent>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="Overview" />
          <Tab label="Orders" />
        </Tabs>

        {activeTab === 0 && (
          <Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Store Summary
                  </Typography>
                  <Typography>Total Orders: {store.orderCount}</Typography>
                  <Typography>
                    Total Invoice: {formatCurrency(store.totalInvoice)}
                  </Typography>
                  <Typography>
                    Total Profit: {formatCurrency(store.totalProfit)}
                  </Typography>
                  <Typography>
                    Average Order Value:{" "}
                    {formatCurrency(store.averageOrderValue)}
                  </Typography>
                  <Typography>
                    Active Months: {store.activeMonths.size}
                  </Typography>
                  <Typography>
                    Store Status:{" "}
                    <Chip 
                      label={store.storeStatus} 
                      color={getStatusColor(store.storeStatus) as any}
                      size="small"
                    />
                  </Typography>
                  {store.lastOrderDate && (
                    <Typography>
                      Last Order Date: {new Date(store.lastOrderDate).toLocaleDateString()}
                    </Typography>
                  )}
                  <Typography color="error">
                    Total Hutang:{" "}
                    {formatCurrency(
                      store.orders?.reduce(
                        (total, order) =>
                          order.status_payment !== "LUNAS"
                            ? total + (order.total_invoice || 0)
                            : total,
                        0
                      ) || 0
                    )}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <InvoiceLineChart data={chartData} timePeriod="Monthly" />
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}

        {activeTab === 1 && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order Date</TableCell>
                  <TableCell>Order Code</TableCell>
                  <TableCell>Payment Type</TableCell>
                  <TableCell>Status Payment</TableCell>
                  <TableCell>Total Invoice</TableCell>
                  <TableCell>Total Payment</TableCell>
                  <TableCell>Profit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {store.orders?.map((order) => (
                  <TableRow key={order.order_id}>
                    <TableCell>
                      {new Date(order.order_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{order.order_code}</TableCell>
                    <TableCell>{order.payment_type}</TableCell>
                    <TableCell>
                      <Typography
                        color={
                          order.status_payment === "LUNAS"
                            ? "success.main"
                            : "error.main"
                        }
                      >
                        {order.status_payment}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatCurrency(order.total_invoice || 0)}</TableCell>
                    <TableCell>
                      {formatCurrency(order.total_pembayaran || 0)}
                    </TableCell>
                    <TableCell>{formatCurrency(order.profit || 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default StoreDetailsModal;

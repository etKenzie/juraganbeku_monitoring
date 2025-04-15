import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import { StoreSummary } from '@/app/(DashboardLayout)/dashboards/Invoice/types';
import { formatCurrency } from '@/app/utils/formatNumber';
import InvoiceLineChart from './InvoiceLineChart';

interface StoreDetailsModalProps {
  open: boolean;
  onClose: () => void;
  store: StoreSummary;
}

const StoreDetailsModal: React.FC<StoreDetailsModalProps> = ({ open, onClose, store }) => {
    
  const [activeTab, setActiveTab] = useState(0);
  const [chartData, setChartData] = useState<Array<{
    date: string;
    totalInvoice: number;
    totalProfit: number;
  }>>([]);

  useEffect(() => {
    if (store?.activeMonths) {
      const data = Array.from(store.activeMonths).sort().map(month => {
        const monthOrders = store.orders?.filter(order => 
          order?.order_date && new Date(order.order_date).toISOString().slice(0, 7) === month
        ) || [];

        const totalInvoice = monthOrders.reduce((sum, order) => sum + (order?.total_invoice || 0), 0);
        const totalProfit = monthOrders.reduce((sum, order) => {
          const profit = order?.detail_order?.reduce((total, item) => {
            const itemProfit = (item?.total_invoice || 0) - ((item?.buy_price || 0) * (item?.order_quantity || 0));
            return total + (itemProfit > 0 ? itemProfit : 0);
          }, 0) || 0;
          return sum + profit;
        }, 0);

        return {
          date: month,
          totalInvoice,
          totalProfit
        };
      });
      setChartData(data);
    }
  }, [store]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  

  if (!store) {
    console.warn('StoreDetailsModal: No store data provided');
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
          minHeight: '80vh',
          maxHeight: '90vh'
        }
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
                  <Typography variant="h6" gutterBottom>Store Summary</Typography>
                  <Typography>Total Orders: {store.orderCount}</Typography>
                  <Typography>Total Invoice: {formatCurrency(store.totalInvoice)}</Typography>
                  <Typography>Total Profit: {formatCurrency(store.totalProfit)}</Typography>
                  <Typography>Average Order Value: {formatCurrency(store.averageOrderValue)}</Typography>
                  <Typography>Active Months: {store.activeMonths.size}</Typography>
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
                  <TableCell>Total Invoice</TableCell>
                  <TableCell>Total Payment</TableCell>
                  <TableCell>Profit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {store.orders?.map((order) => {
                  const profit = order.detail_order?.reduce((total, item) => {
                    const itemProfit = (item?.total_invoice || 0) - ((item?.buy_price || 0) * (item?.order_quantity || 0));
                    return total + (itemProfit > 0 ? itemProfit : 0);
                  }, 0) || 0;

                  return (
                    <TableRow key={order.order_id}>
                      <TableCell>{new Date(order.order_date).toLocaleDateString()}</TableCell>
                      <TableCell>{order.order_code}</TableCell>
                      <TableCell>{order.payment_type}</TableCell>
                      <TableCell>{formatCurrency(order.total_invoice)}</TableCell>
                      <TableCell>{formatCurrency(order.total_pembayaran)}</TableCell>
                      <TableCell>{formatCurrency(profit)}</TableCell>
                    </TableRow>
                  );
                })}
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
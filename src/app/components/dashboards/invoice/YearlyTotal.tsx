import { formatCurrency } from "@/app/utils/formatNumber";
import {
  Box,
  Grid,
  Paper,
  Typography,
} from "@mui/material";

interface StoreMetricsProps {
  monthlyMetrics: {
    totalInvoice: number;
    totalProfit: number;
    totalOrders: number;
    totalStores: number;
    totalLunas: number;
    totalBelumLunas: number;
    totalCOD: number;
    totalTOP: number;
  };
  period: string;
}

const StoreMetrics = ({ monthlyMetrics, period }: StoreMetricsProps) => {
  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Total Summaries
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="textSecondary">
                  Total Invoice
                </Typography>
                <Typography variant="h4">
                  {formatCurrency(monthlyMetrics.totalInvoice)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="textSecondary">
                  Total Profit
                </Typography>
                <Typography variant="h4">
                  {formatCurrency(monthlyMetrics.totalProfit)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="textSecondary">
                  Total Orders
                </Typography>
                <Typography variant="h4">
                  {monthlyMetrics.totalOrders}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="textSecondary">
                  Total Stores
                </Typography>
                <Typography variant="h4">
                  {monthlyMetrics.totalStores}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="textSecondary">
                  Total Lunas
                </Typography>
                <Typography variant="h4">
                  {formatCurrency(monthlyMetrics.totalLunas)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="textSecondary">
                  Total Belum Lunas
                </Typography>
                <Typography variant="h4">
                  {formatCurrency(monthlyMetrics.totalBelumLunas)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="textSecondary">
                  Total COD
                </Typography>
                <Typography variant="h4">
                  {formatCurrency(monthlyMetrics.totalCOD)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="subtitle2" color="textSecondary">
                  Total TOP
                </Typography>
                <Typography variant="h4">
                  {formatCurrency(monthlyMetrics.totalTOP)}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StoreMetrics; 
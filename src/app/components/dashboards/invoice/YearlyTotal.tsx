import { formatCurrency } from "@/app/utils/formatNumber";
import {
  Box,
  Grid,
  Paper,
  Typography,
} from "@mui/material";

interface StoreMetricsProps {
  yearlyMetrics: {
    totalInvoice: number;
    totalProfit: number;
    totalOrders: number;
    totalStores: number;
    totalLunas: number;
    totalBelumLunas: number;
    totalCOD: number;
    totalTOP: number;
    margin: number;
  };
  period: string;
}

const StoreMetrics = ({ yearlyMetrics, period }: StoreMetricsProps) => {
  // Calculate margin percentage
  const marginPercentage = yearlyMetrics.totalInvoice > 0 
    ? (yearlyMetrics.totalProfit / yearlyMetrics.totalInvoice) * 100 
    : 0;
const md = 4;

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Total Summaries
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={md}>
                <Typography variant="subtitle2" color="textSecondary">
                  Total Invoice
                </Typography>
                <Typography variant="h4">
                  {formatCurrency(yearlyMetrics.totalInvoice)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={md}>
                <Typography variant="subtitle2" color="textSecondary">
                  Total Profit
                </Typography>
                <Typography variant="h4">
                  {formatCurrency(yearlyMetrics.totalProfit)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={md}>
                <Typography variant="subtitle2" color="textSecondary">
                  Margin
                </Typography>
                <Typography variant="h4">
                  {marginPercentage.toFixed(2)}%
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={md}>
                <Typography variant="subtitle2" color="textSecondary">
                  Total Orders
                </Typography>
                <Typography variant="h4">
                  {yearlyMetrics.totalOrders}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={md}>
                <Typography variant="subtitle2" color="textSecondary">
                  Total Stores
                </Typography>
                <Typography variant="h4">
                  {yearlyMetrics.totalStores}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={md}>
                <Typography variant="subtitle2" color="textSecondary">
                  Total Lunas
                </Typography>
                <Typography variant="h4">
                  {formatCurrency(yearlyMetrics.totalLunas)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={md}>
                <Typography variant="subtitle2" color="textSecondary">
                  Total Belum Lunas
                </Typography>
                <Typography variant="h4">
                  {formatCurrency(yearlyMetrics.totalBelumLunas)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={md}>
                <Typography variant="subtitle2" color="textSecondary">
                  Total COD
                </Typography>
                <Typography variant="h4">
                  {formatCurrency(yearlyMetrics.totalCOD)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={md}>
                <Typography variant="subtitle2" color="textSecondary">
                  Total TOP
                </Typography>
                <Typography variant="h4">
                  {formatCurrency(yearlyMetrics.totalTOP)}
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
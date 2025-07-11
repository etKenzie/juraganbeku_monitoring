import { StoreSummary } from "@/app/(DashboardLayout)/dashboards/Invoice/types";
import { formatCurrency } from "@/app/utils/formatNumber";
import {
  Box,
  Grid,
  List,
  ListItem,
  ListItemText,
  Modal,
  Paper,
  Typography,
} from "@mui/material";
import { useState } from "react";


interface StoreMetricsProps {
  storeSummaries: { [key: string]: StoreSummary };
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

const StoreMetrics = ({ storeSummaries, monthlyMetrics, period }: StoreMetricsProps) => {
  const [openModal, setOpenModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalStores, setModalStores] = useState<string[]>([]);

  // Helper function to get YYYY-MM date string without mutating input date
  function getMonthString(date: Date, monthsOffset: number = 0): string {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() + monthsOffset);
    return newDate.toISOString().slice(0, 7);
  }

  // Helper function to format month display
  function formatMonthDisplay(monthString: string): string {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  // Get all months from store summaries
  const allMonths = new Set<string>();
  Object.values(storeSummaries).forEach(store => {
    store.activeMonths.forEach(month => allMonths.add(month));
  });

  // Sort months and get the most recent three
  const sortedMonths = Array.from(allMonths).sort().reverse();
  const [mostRecentMonth, previousMonth, twoMonthsAgo] = sortedMonths;

  // Calculate activation rate
  const mostRecentMonthStores = Object.values(storeSummaries).filter(
    (store) => store.activeMonths.has(mostRecentMonth)
  ).length;

  const previousMonthStores = Object.values(storeSummaries).filter(
    (store) => store.activeMonths.has(previousMonth)
  ).length;

  const twoMonthsAgoStores = Object.values(storeSummaries).filter(
    (store) => store.activeMonths.has(twoMonthsAgo)
  ).length;

  const activationRate = previousMonthStores > 0 
    ? ((mostRecentMonthStores / previousMonthStores) * 100).toFixed(1) 
    : "N/A";

  // Calculate consecutive months (most recent + previous two)
  const storesByRecentActivity = {
    // Stores active in exactly 3 months
    exactlyThreeMonths: Object.entries(storeSummaries).filter(
      ([_, store]) => {
        const activeCount = [mostRecentMonth, previousMonth, twoMonthsAgo]
          .filter(month => store.activeMonths.has(month)).length;
        return activeCount === 3;
      }
    ),
    
    // Stores active in exactly 2 months
    exactlyTwoMonths: Object.entries(storeSummaries).filter(
      ([_, store]) => {
        const activeCount = [mostRecentMonth, previousMonth, twoMonthsAgo]
          .filter(month => store.activeMonths.has(month)).length;
        return activeCount === 2;
      }
    ),
    
    // Stores active in exactly 1 month
    exactlyOneMonth: Object.entries(storeSummaries).filter(
      ([_, store]) => {
        const activeCount = [mostRecentMonth, previousMonth, twoMonthsAgo]
          .filter(month => store.activeMonths.has(month)).length;
        return activeCount === 1;
      }
    )
  };

  const handleOpenModal = (title: string, stores: [string, StoreSummary][]) => {
    setModalTitle(title);
    setModalStores(stores.map(([_, store]) => store.storeName));
    setOpenModal(true);
  };

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              {period == "thisYear" ? 'Yearly Total' : 'Three Month Total'}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Total Invoice
                </Typography>
                <Typography variant="h4">
                  {formatCurrency(monthlyMetrics.totalInvoice)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Total Profit
                </Typography>
                <Typography variant="h4">
                  {formatCurrency(monthlyMetrics.totalProfit)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Total Orders
                </Typography>
                <Typography variant="h4">
                  {monthlyMetrics.totalOrders}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Total Lunas
                </Typography>
                <Typography variant="h4">
                  {formatCurrency(monthlyMetrics.totalLunas)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Total Belum Lunas
                </Typography>
                <Typography variant="h4">
                  {formatCurrency(monthlyMetrics.totalBelumLunas)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Total COD
                </Typography>
                <Typography variant="h4">
                  {formatCurrency(monthlyMetrics.totalCOD)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Total TOP
                </Typography>
                <Typography variant="h4">
                  {formatCurrency(monthlyMetrics.totalTOP)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Activation Rate
                </Typography>
                <Typography variant="h4">
                  {activationRate}%
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Store Activity
            </Typography>
            <Box mt={2}>
              <Box sx={{ cursor: "pointer" }} onClick={() => handleOpenModal("Active in 3 Months", storesByRecentActivity.exactlyThreeMonths)}>
                <Typography variant="h4">
                  {storesByRecentActivity.exactlyThreeMonths.length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Stores active in 3 recent months
                </Typography>
              </Box>
              <Box sx={{ cursor: "pointer", mt: 2 }} onClick={() => handleOpenModal("Active in 2 Months", storesByRecentActivity.exactlyTwoMonths)}>
                <Typography variant="h4">
                  {storesByRecentActivity.exactlyTwoMonths.length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Stores active in exactly 2 months
                </Typography>
              </Box>
              <Box sx={{ cursor: "pointer", mt: 2 }} onClick={() => handleOpenModal("Active in 1 Month", storesByRecentActivity.exactlyOneMonth)}>
                <Typography variant="h4">
                  {storesByRecentActivity.exactlyOneMonth.length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Stores active in exactly 1 month
                </Typography>
              </Box>
              <Box sx={{ mt: 2 }} >
                <Typography variant="h4">
                  {monthlyMetrics.totalStores}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Stores over 3 months
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        aria-labelledby="store-list-modal"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            maxHeight: "80vh",
            overflow: "auto",
          }}
        >
          <Typography variant="h6" gutterBottom>
            {modalTitle}
          </Typography>
          <List>
            {modalStores.map((storeName, index) => (
              <ListItem key={index}>
                <ListItemText primary={storeName} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Modal>
    </Box>
  );
};

export default StoreMetrics; 
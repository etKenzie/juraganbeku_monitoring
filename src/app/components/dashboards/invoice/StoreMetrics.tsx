import { useState } from "react";
import {
  Box,
  Grid,
  Typography,
  Modal,
  List,
  ListItem,
  ListItemText,
  Paper,
} from "@mui/material";
import { StoreSummary } from "@/app/(DashboardLayout)/dashboards/Invoice/types";

interface StoreMetricsProps {
  storeSummaries: { [key: string]: StoreSummary };
}

const StoreMetrics = ({ storeSummaries }: StoreMetricsProps) => {
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

  // Get current and previous months
  const currentDate = new Date();
  const currentMonth = getMonthString(currentDate);
  const previousMonth = getMonthString(currentDate, -1);
  const twoMonthsAgo = getMonthString(currentDate, -2);

  // Calculate activation rate
  const currentMonthStores = Object.values(storeSummaries).filter(
    (store) => store.activeMonths.has(currentMonth)
  ).length;

  const previousMonthStores = Object.values(storeSummaries).filter(
    (store) => store.activeMonths.has(previousMonth)
  ).length;

  const twoMonthsAgoStores = Object.values(storeSummaries).filter(
    (store) => store.activeMonths.has(twoMonthsAgo)
  ).length;

  const activationRate = previousMonthStores > 0 
    ? ((currentMonthStores / previousMonthStores) * 100).toFixed(1) 
    : "N/A";

  // Calculate consecutive months (current + previous two)
  const threeMonthsAgo = getMonthString(currentDate, -3);

  const storesByRecentActivity = {
    // Stores active in exactly 3 months
    exactlyThreeMonths: Object.entries(storeSummaries).filter(
      ([_, store]) => {
        const activeCount = [currentMonth, previousMonth, twoMonthsAgo]
          .filter(month => store.activeMonths.has(month)).length;
        return activeCount === 3;
      }
    ),
    
    // Stores active in exactly 2 months
    exactlyTwoMonths: Object.entries(storeSummaries).filter(
      ([_, store]) => {
        const activeCount = [currentMonth, previousMonth, twoMonthsAgo]
          .filter(month => store.activeMonths.has(month)).length;
        return activeCount === 2;
      }
    ),
    
    // Stores active in exactly 1 month
    exactlyOneMonth: Object.entries(storeSummaries).filter(
      ([_, store]) => {
        const activeCount = [currentMonth, previousMonth, twoMonthsAgo]
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
              Activation Rate
            </Typography>
            <Typography variant="h4">
              {activationRate}%
            </Typography>
            <Box mt={2}>
              <Typography variant="h5" color="textSecondary">
                {formatMonthDisplay(currentMonth)}: {currentMonthStores} stores
              </Typography>
              <Typography variant="h5" color="textSecondary">
                {formatMonthDisplay(previousMonth)}: {previousMonthStores} stores
              </Typography>
              <Typography variant="h5" color="textSecondary">
                {formatMonthDisplay(twoMonthsAgo)}: {twoMonthsAgoStores} stores
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Monthly Active Stores
            </Typography>
            <Box mt={2}>
              <Box sx={{ cursor: "pointer" }} onClick={() => handleOpenModal("Active in 3 Months", storesByRecentActivity.exactlyThreeMonths)}>
                <Typography variant="h4">
                  {storesByRecentActivity.exactlyThreeMonths.length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Stores active in all 3 months
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
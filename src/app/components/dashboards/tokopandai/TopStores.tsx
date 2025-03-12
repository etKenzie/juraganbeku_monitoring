import React from "react";
import DashboardCard from "../../shared/DashboardCard";
import CustomSelect from "../../forms/theme-elements/CustomSelect";
import {
  MenuItem,
  Typography,
  Box,
  Paper,
  Table,
  Button,
  Grid,
  Divider,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import TopStoresData from "./TopStoresData";
import LineMonthScore from "./LineMonthScore";

import { StoreData, StoreEntry } from "@/app/(DashboardLayout)/models/types";

type MonthlyData = {
  averageScore: number;
  averageToilet: number;
  averageFood: number;
  averageDrink: number;
  averageService: number;
  count: number;
};

type StoreProps = {
  data: Record<string, StoreData>;
};

type NumericKeys<T> = {
  [K in keyof T]: T[K] extends number ? K : never;
}[keyof T];

type NumericSortKey = NumericKeys<StoreData>;

const ProcessEntry = (entries: StoreEntry[]) => {
  const monthlyData: Record<string, any> = {};

  entries.forEach((entry) => {
    const month = new Date(entry.date).toLocaleString("default", {
      month: "short",
    });

    if (!monthlyData[month]) {
      monthlyData[month] = {
        averageScore: 0,
        averageToilet: 0,
        averageFood: 0,
        averageDrink: 0,
        averageService: 0,
        count: 0,
      };
    }

    const data = monthlyData[month];
    data.count += 1;
    data.averageScore += (entry.score - data.averageScore) / data.count;
    data.averageToilet += (entry.toilet - data.averageToilet) / data.count;
    data.averageFood += (entry.food - data.averageFood) / data.count;
    data.averageDrink += (entry.drink - data.averageDrink) / data.count;
    data.averageService += (entry.service - data.averageService) / data.count;
  });

  Object.entries(monthlyData).forEach(([month, values]) => {
    monthlyData[month] = {
      ...values,
      averageScore: values.averageScore * 100,
      averageToilet: values.averageToilet * 100,
      averageFood: values.averageFood * 100,
      averageDrink: values.averageDrink * 100,
      averageService: values.averageService * 100,
    };
  });

  return monthlyData;
};

const TopPerformers: React.FC<StoreProps> = ({ data }) => {
  const [month, setMonth] = React.useState("1");
  const [viewType, setViewType] = React.useState("top"); // 'top' or 'worst'
  const [sortKey, setSortKey] = React.useState<NumericSortKey>("averageScore");

  const [selectedStore, setSelectedStore] = React.useState<StoreData | null>(
    null
  );
  const [modalOpen, setModalOpen] = React.useState(false);
  // console.log(Object.keys(data).length);
  // console.log(data);

  const handleRowClick = (store: StoreData) => {
    setSelectedStore(store);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedStore(null);
  };
  data;

  // console.log(data);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMonth(event.target.value);
  };

  const handleSortChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSortKey(event.target.value as NumericSortKey);
  };

  const handleViewChange = (
    event: React.MouseEvent<HTMLElement>,
    newView: string
  ) => {
    if (newView !== null) {
      setViewType(newView);
    }
  };

  // Convert `data` to an array of Performers
  const storeData: StoreData[] = React.useMemo(() => {
    return Object.entries(data).map(([storeName, storeData]) => ({
      ...storeData, // Spread existing fields from Performer
      area: storeData.area || "Unknown", // Use provided `area` or fallback if missing
      name: storeData.name,
      averageScore: Math.round(storeData.averageScore * 100) / 100, // Round to 2 decimals
      averageToilet: Math.round(storeData.averageToilet * 100) / 100,
      averageFood: Math.round(storeData.averageFood * 100) / 100,
      averageDrink: Math.round(storeData.averageDrink * 100) / 100,
      averageService: Math.round(storeData.averageService * 100) / 100,
      kode_gerai: storeData.kode_gerai,
      entries: storeData.entries,
    }));
  }, [data]);

  // Sort and filter for top or worst performers
  // Sort and filter for top or worst performers based on selected sortKey
  const filteredPerformers = React.useMemo(() => {
    const sortedData = [...storeData].sort((a, b) => b[sortKey] - a[sortKey]);
    return viewType === "top"
      ? sortedData.slice(0, 10) // Top 5 performers
      : sortedData.slice(-10).reverse(); // Bottom 5 performers (sorted ascending)
  }, [storeData, viewType, sortKey]);

  // console.log(storeData);

  return (
    <>
      <DashboardCard
        title="Stores"
        subtitle="Best & Worst"
        action={
          <Stack direction="row" spacing={2} alignItems="center">
            <ToggleButtonGroup
              value={viewType}
              exclusive
              onChange={handleViewChange}
              size="small"
            >
              <ToggleButton value="top">Top Stores</ToggleButton>
              <ToggleButton value="worst">Worst Stores</ToggleButton>
            </ToggleButtonGroup>
            {/* <CustomSelect
            labelId="month-dd"
            id="month-dd"
            size="small"
            value={month}
            onChange={handleChange}
          >
            <MenuItem value={1}>March 2025</MenuItem>
            <MenuItem value={2}>April 2025</MenuItem>
            <MenuItem value={3}>May 2025</MenuItem>
          </CustomSelect> */}
            <Select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as NumericSortKey)}
              size="small"
            >
              <MenuItem value="averageScore">Nilai</MenuItem>
              <MenuItem value="averageToilet">Toilet</MenuItem>
              <MenuItem value="averageFood">Food</MenuItem>
              <MenuItem value="averageDrink">Drink</MenuItem>
              <MenuItem value="averageService">Service</MenuItem>
            </Select>
          </Stack>
        }
      >
        <TableContainer>
          <Table
            aria-label="simple table"
            sx={{
              whiteSpace: "nowrap",
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Nama Toko
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Kode Gerai
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Lokasi
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Toilet
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Food
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Drink
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Service
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Nilai
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPerformers.map((basic: StoreData) => (
                <TableRow
                  key={basic.name}
                  hover
                  onClick={() => handleRowClick(basic)}
                  style={{ cursor: "pointer" }}
                >
                  <TableCell>
                    <Stack direction="row" spacing={2}>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {basic.name}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={2}>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {basic.kode_gerai}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography
                      color="textSecondary"
                      variant="subtitle2"
                      fontWeight={400}
                    >
                      {basic.area}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {basic.averageToilet}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {basic.averageFood}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {basic.averageDrink}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {basic.averageService}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {basic.averageScore}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DashboardCard>

      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
      >
        <DialogContent
          sx={{
            backgroundColor: "#f5f5f5", // Light gray background
            padding: 4,
          }}
        >
          {/* First Section: Title, Scores, and Details */}
          <Paper
            elevation={3}
            sx={{
              padding: 3,
              borderRadius: 2,
              marginBottom: 4,
            }}
          >
            {/* Shop Name */}
            <Typography
              variant="h4"
              sx={{
                fontWeight: "bold",
                marginBottom: 2,
                textAlign: "center",
              }}
            >
              {selectedStore?.name || "Store Name"}
            </Typography>

            {/* <Divider sx={{ marginBottom: 3 }} /> */}

            {/* Scores and Details */}
            <Grid container spacing={4}>
              {/* Details Section */}
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  Details
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography>Kode Gerai: {selectedStore?.kode_gerai}</Typography>
                <Typography>Lokasi: {selectedStore?.area}</Typography>
                <Typography>
                  Jumlah Kunjungan: {selectedStore?.entries.length}
                </Typography>
              </Grid>
              {/* Scores Section */}
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  Scores
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography>Nilai: {selectedStore?.averageScore}</Typography>
                <Typography>Toilet: {selectedStore?.averageToilet}</Typography>
                <Typography>Food: {selectedStore?.averageFood}</Typography>
                <Typography>Drink: {selectedStore?.averageDrink}</Typography>
                <Typography>
                  Service: {selectedStore?.averageService}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Second Section: Line Graph */}
          <Paper
            elevation={3}
            sx={{
              padding: 3,
              borderRadius: 2,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                marginBottom: 2,
              }}
            >
              Graphs
            </Typography>
            {selectedStore ? (
              <LineMonthScore data={ProcessEntry(selectedStore.entries)} />
            ) : (
              <Typography>No store selected</Typography> // Fallback message or loading spinner
            )}
          </Paper>
        </DialogContent>
        {/* <DialogActions>
          <Button onClick={handleCloseModal}>Close</Button>
        </DialogActions> */}
      </Dialog>
    </>
  );
};

export default TopPerformers;

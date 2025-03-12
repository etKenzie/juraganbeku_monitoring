"use client";
import React from "react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "@/store/hooks";
import { RootState } from "@/store/store";
import { useDashboardData } from "@/app/(DashboardLayout)/dashboards/tokopandai/data";
import { fetchOrders } from "@/store/apps/Invoice/invoiceSlice";
import type { OrderData } from "@/store/apps/Invoice/invoiceSlice";

import { getCookie } from "cookies-next";
import PageContainer from "@/app/components/container/PageContainer";

import { 
  Grid, 
  Box, 
  TextField, 
  MenuItem, 
  Button, 
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select
} from "@mui/material";
import { useRouter } from "next/navigation";
import Loading from "@/app/(DashboardLayout)/loading";

export default function Dashboard() {
  // add data on peak hours. Average line length based on date. 12 - 4. download image functionality.
  // dont include data for toilet/food for those without toilet/food
  // A1018  tunjukin struk info
  // type A yang jual makanan, type B hanya minimum
  // store type 1 hanya drink and service, type 2 ada drink service food, store type 3
  // daily score updates
  // liat brp liat toko

 console.log("HERE")

  const router = useRouter();
  const dispatch = useDispatch();
  
  // Get orders from the Redux store
  const { orders, loading, error } = useSelector(
    (state: RootState) => ({
      orders: state.invoiceReducer.orders,
      loading: state.dashboardReducer.loading,
      error: state.dashboardReducer.error
    })
  );
  // const { dashboardData, geraiData, totalItems, meta, loading } = useSelector(
  //   (state: RootState) => state.dashboardReducer
  // );

  const [startDate, setStartDate] = useState("2025-01-01");
  const [endDate, setEndDate] = useState("2025-01-31");
  const [sortTime, setSortTime] = useState<'asc' | 'desc'>('desc');

  const [areas, setAreas] = useState<string[]>([""]);

  useEffect(() => {
    handleApplyFilters();
    // Initial gerai fetch
    // dispatch(fetchGeraiData({ search: "haus" }))
  }, []);

  const handleApplyFilters = async () => {
    try {
      await dispatch(
        fetchOrders({
          startDate,
          endDate,
          sortTime,
        })
      );

      // Log the results
      console.log('Fetched Orders:', orders);

    } catch (error) {
      if (error instanceof Error && error.message === "AUTH_ERROR") {
        // router.push("/auth/auth2/login");
      }
      console.error('Error fetching orders:', error);
    }
  };

  // const handleGeraiSearch = (search: string) => {
  //   setSearchGerai(search);
  //   dispatch(fetchGeraiData({ search }));
  // };

  // Show loading screen while data is being fetched
  if (loading) {
    return <Loading />;
  }

  return (
    <PageContainer title="Order Dashboard" description="Order Management Dashboard">
      <>
        {/* Filter Section */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Box display="flex" gap={2} alignItems="center" width="100%">
            <TextField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ flexBasis: "20%", flexGrow: 1 }}
            />
            <TextField
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ flexBasis: "20%", flexGrow: 1 }}
            />
            <FormControl sx={{ flexBasis: "20%", flexGrow: 1 }}>
              <InputLabel>Sort Time</InputLabel>
              <Select
                value={sortTime}
                label="Sort Time"
                onChange={(e) => setSortTime(e.target.value as 'asc' | 'desc')}
              >
                <MenuItem value="desc">Newest First</MenuItem>
                <MenuItem value="asc">Oldest First</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              color="primary"
              onClick={handleApplyFilters}
              sx={{ flexBasis: "20%", flexGrow: 1 }}
            >
              Apply Filters
            </Button>
          </Box>
        </Box>

        {/* Error Display */}
        {error && (
          <Typography color="error" mb={2}>
            {error}
          </Typography>
        )}

        <Typography variant="h6" mb={2}>Orders Table</Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Order Code</TableCell>
                <TableCell>Reseller Name</TableCell>
                <TableCell>Store Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Payment Type</TableCell>
                <TableCell>Order Date</TableCell>
                <TableCell>Total Invoice</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders && orders.map((order: OrderData) => (
                <TableRow key={order.order_id}>
                  <TableCell>{order.order_code}</TableCell>
                  <TableCell>{order.reseller_name}</TableCell>
                  <TableCell>{order.store_name}</TableCell>
                  <TableCell>{order.status_order}</TableCell>
                  <TableCell>{order.payment_type}</TableCell>
                  <TableCell>{new Date(order.order_date).toLocaleDateString()}</TableCell>
                  <TableCell>Rp {order.total_invoice.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {orders && orders.length === 0 && (
          <Typography textAlign="center" mt={3}>
            No orders found for the selected period
          </Typography>
        )}
      </>
    </PageContainer>
  );
}

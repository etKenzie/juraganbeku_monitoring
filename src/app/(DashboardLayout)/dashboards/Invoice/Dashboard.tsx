"use client";
import React, { useMemo } from "react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "@/store/hooks";
import { RootState } from "@/store/store";
import { useInvoiceData } from "./data";
import { fetchOrders } from "@/store/apps/Invoice/invoiceSlice";

import PageContainer from "@/app/components/container/PageContainer";
import InvoiceSummaryCard from "@/app/components/dashboards/invoice/InvoiceSummaryCard";
import StoreSummaryTable from "@/app/components/dashboards/invoice/StoreSummaryTable";
import OrdersTable from "@/app/components/dashboards/invoice/OrdersTable";
import {
  Stack,
  Grid,
  Box,
  TextField,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
  Select,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import Loading from "@/app/(DashboardLayout)/loading";
import { formatLargeNumber, formatCurrency } from "@/app/utils/formatNumber";
import InvoiceLineChart from "@/app/components/dashboards/invoice/InvoiceLineChart";

export default function Dashboard() {
  // add data on peak hours. Average line length based on date. 12 - 4. download image functionality.
  // dont include data for toilet/food for those without toilet/food
  // A1018  tunjukin struk info
  // type A yang jual makanan, type B hanya minimum
  // store type 1 hanya drink and service, type 2 ada drink service food, store type 3
  // daily score updates
  // liat brp liat toko

  const router = useRouter();
  const dispatch = useDispatch();
  
  // Get orders from the Redux store
  const { orders, loading, error } = useSelector(
    (state: RootState) => ({
      orders: state.invoiceReducer.orders,
      loading: state.invoiceReducer.loading,
      error: state.invoiceReducer.error
    })
  );
  // const { dashboardData, geraiData, totalItems, meta, loading } = useSelector(
  //   (state: RootState) => state.dashboardReducer
  // );

  const { processData } = useInvoiceData();
  const [processedData, setProcessedData] = useState<any>(null);
  const [isDataEmpty, setIsDataEmpty] = useState(false);

  const [period, setPeriod] = useState("thisMonth");
  const [customMonth, setCustomMonth] = useState(new Date().getMonth());
  const [customYear, setCustomYear] = useState(new Date().getFullYear());
  const [sortTime, setSortTime] = useState<'asc' | 'desc'>('desc');

  const [timePeriod, setTimePeriod] = useState("Last 30 Days");
  const [chartData, setChartData] = useState<Array<{
    date: string;
    totalInvoice: number;
    totalProfit: number;
  }>>([]);

  const getDateRange = (period: string) => {
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case "thisMonth":
        startDate.setMonth(now.getMonth());
        startDate.setDate(1);
        break;
      case "lastMonth":
        startDate.setMonth(now.getMonth() - 1);
        startDate.setDate(1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        lastMonthEnd.setHours(23, 59, 59, 999);
        return {
          startDate: startDate.toISOString().split("T")[0],
          endDate: lastMonthEnd.toISOString().split("T")[0],
        };
      case "threeMonths":
        startDate.setMonth(now.getMonth() - 2);
        startDate.setDate(1);
        break;
      case "oneYear":
        startDate.setFullYear(now.getFullYear() - 1);
        startDate.setMonth(now.getMonth());
        startDate.setDate(1);
        break;
      case "custom":
        startDate.setFullYear(customYear);
        startDate.setMonth(customMonth);
        startDate.setDate(1);
        const customEnd = new Date(customYear, customMonth + 1, 0);
        return {
          startDate: startDate.toISOString().split("T")[0],
          endDate: customEnd.toISOString().split("T")[0],
        };
      default:
        startDate.setDate(1);
    }

    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endDate.setHours(23, 59, 59, 999);

    return {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    };
  };

  const dateRange = useMemo(() => getDateRange(period), [period, customMonth, customYear]);

  const handleApplyFilters = async () => {
    try {
      console.log(dateRange);
      await dispatch(
        fetchOrders({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          sortTime,
        })
      );

      setIsDataEmpty(!orders || orders.length === 0);
    } catch (error) {
      console.error("Fetch error:", error);
      setIsDataEmpty(true);
    }
  };

  useEffect(() => {
    handleApplyFilters();
  }, [dispatch]);

  useEffect(() => {
    if (orders) {
      const processed = processData(orders);
      setProcessedData(processed);

      // Prepare chart data
      const chartData = orders.map(order => ({
        date: order.order_date,
        totalInvoice: order.total_invoice,
        totalProfit: order.total_invoice - order.total_pembayaran
      }));
      setChartData(chartData);
    }
  }, [orders]);

  // Show loading screen while data is being fetched
  if (loading) {
    return <Loading />;
  }

  return (
    <PageContainer title="Invoice Dashboard" description="Invoice dashboard">
      <>
        {/* Filter Section */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Box display="flex" gap={2} alignItems="center" width="100%">
            <FormControl sx={{ flexBasis: "40%", flexGrow: 1 }}>
              <InputLabel>Time Period</InputLabel>
              <Select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                label="Time Period"
              >
                <MenuItem value="thisMonth">This Month</MenuItem>
                <MenuItem value="lastMonth">Last Month</MenuItem>
                <MenuItem value="threeMonths">Past 3 Months</MenuItem>
                <MenuItem value="oneYear">Past Year</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
            </FormControl>

            {period === "custom" && (
              <Stack direction="row" spacing={2} sx={{ flexBasis: "40%", flexGrow: 1 }}>
                <FormControl fullWidth>
                  <InputLabel>Month</InputLabel>
                  <Select value={customMonth} onChange={(e) => setCustomMonth(Number(e.target.value))} label="Month">
                    {Array.from({ length: 12 }, (_, i) => (
                      <MenuItem key={i} value={i}>
                        {new Date(2000, i, 1).toLocaleString("default", { month: "long" })}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Year</InputLabel>
                  <Select value={customYear} onChange={(e) => setCustomYear(Number(e.target.value))} label="Year">
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - i;
                      return (
                        <MenuItem key={year} value={year}>
                          {year}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Stack>
            )}

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

        {isDataEmpty ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="50vh"
          >
            <Typography variant="h6" color="textSecondary">
              Data tidak tersedia untuk periode ini.
            </Typography>
          </Box>
        ) : (
          <>
            {/* Summary Cards */}
            {processedData && (
              <Box mb={4}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <InvoiceSummaryCard
                      title="Total Orders"
                      value={processedData.totalOrderCount}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <InvoiceSummaryCard
                      title="Total Invoice"
                      value={processedData.overallTotalInvoice}
                      isCurrency
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <InvoiceSummaryCard
                      title="Total COD"
                      value={processedData.overallCOD}
                      isCurrency
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <InvoiceSummaryCard
                      title="Total TOP"
                      value={processedData.overallTOP}
                      isCurrency
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Line Chart */}
            <Box mb={4}>
              <Grid container spacing={3}>
                <Grid item xs={12} lg={8}>
                  <InvoiceLineChart data={chartData} timePeriod={timePeriod} />
                </Grid>
              </Grid>
            </Box>

            {/* Store Summary Table */}
            {processedData && (
              <Box mb={4}>
                <StoreSummaryTable storeSummaries={processedData.storeSummaries} />
              </Box>
            )}

            {/* Orders Table */}
            {orders && (
              <Box>
                <OrdersTable orders={orders} />
              </Box>
            )}
          </>
        )}
      </>
    </PageContainer>
  );
}

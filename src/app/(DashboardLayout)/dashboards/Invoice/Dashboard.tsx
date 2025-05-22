"use client";
import { fetchNOO, fetchOrders } from "@/store/apps/Invoice/invoiceSlice";
import { useDispatch, useSelector } from "@/store/hooks";
import { RootState } from "@/store/store";
import { useEffect, useMemo, useState } from "react";
import { useInvoiceData } from "./data";

import Loading from "@/app/(DashboardLayout)/loading";
import PageContainer from "@/app/components/container/PageContainer";
import AreaChart from "@/app/components/dashboards/invoice/AreaChart";
import DueDateStatusChart from "@/app/components/dashboards/invoice/DueDateStatusChart";
import InvoiceLineChart from "@/app/components/dashboards/invoice/InvoiceLineChart";
import InvoiceSummaryCard from "@/app/components/dashboards/invoice/InvoiceSummaryCard";
import MonthlyStoreChart from "@/app/components/dashboards/invoice/MonthlyStoreChart";
import NOOAreaChart from "@/app/components/dashboards/invoice/NOOAreaChart";
import NOOChart from "@/app/components/dashboards/invoice/NOOChart";
import OrdersTable from "@/app/components/dashboards/invoice/OrdersTable";
import PaymentDistributionChart from "@/app/components/dashboards/invoice/PaymentDistributionChart";
import ProductSummaryTable from "@/app/components/dashboards/invoice/ProductSummaryTable";
import StoreMetrics from "@/app/components/dashboards/invoice/StoreMetrics";
import StoreSummaryTable from "@/app/components/dashboards/invoice/StoreSummaryTable";
import { useAuth } from "@/contexts/AuthContext";
import { OrderData } from '@/store/apps/Invoice/invoiceSlice';
import {
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { useRouter } from "next/navigation";
import { ProcessedData } from "./types";


interface StoreSummary {
  storeName: string;
  orderCount: number;
  totalInvoice: number;
  totalProfit: number;
  averageOrderValue: number;
  activeMonths: Set<string>;
  orders: OrderData[];
}

interface PaymentStatusMetrics {
  totalOrders: number;
  totalInvoice: number;
  totalProfit: number;
}

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

  const { role } = useAuth();
  console.log(role)


  
  // Get orders from the Redux store
  const { orders, nooData, loading, error } = useSelector(
    (state: RootState) => ({
      orders: state.invoiceReducer.orders,
      nooData: state.invoiceReducer.nooData,
      loading: state.invoiceReducer.loading,
      error: state.invoiceReducer.error
    })
  );
  // const { dashboardData, geraiData, totalItems, meta, loading } = useSelector(
  //   (state: RootState) => state.dashboardReducer
  // );

  console.log(orders, nooData)

  // Filter out CANCEL BY ADMIN and CANCEL orders right after data is retrieved
  const validOrders = useMemo(() => {
    return orders?.filter(order => 
      order.status_order !== "CANCEL BY ADMIN" && 
      order.status_order !== "CANCEL"
    ) || [];
  }, [orders]);

  const { processData } = useInvoiceData();
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [isDataEmpty, setIsDataEmpty] = useState(false);

  const [period, setPeriod] = useState("thisMonth");
  const [customMonth, setCustomMonth] = useState(new Date().getMonth());
  const [customYear, setCustomYear] = useState(new Date().getFullYear());
  const [sortTime, setSortTime] = useState<'asc' | 'desc'>('desc');
  const [timePeriod, setTimePeriod] = useState("Last 30 Days");
  const [chartData, setChartData] = useState<Array<{
    date: string;
    month: string;
    totalInvoice: number;
    totalProfit: number;
  }>>([]);
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [area, setArea] = useState("");
  const [areas, setAreas] = useState<string[]>([""]);
  const [segment, setSegment] = useState<string>("");

  const getDateRange = (period: string) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    switch (period) {
      case "thisMonth":
        // For this month, show last 3 months including current month
        const months = [];
        for (let i = -2; i <= 0; i++) {
          const monthDate = new Date(currentYear, currentMonth + i, 1);
          const monthName = monthDate.toLocaleString('default', { month: 'long' }).toLowerCase();
          months.push(`${monthName} ${monthDate.getFullYear()}`);
        }
        return {
          month: months.join(','),
        };
      case "custom":
        // For custom, show 3 months from selected month
        const customMonths = [];
        for (let i = -2; i <= 0; i++) {
          const monthDate = new Date(customYear, customMonth + i, 1);
          const monthName = monthDate.toLocaleString('default', { month: 'long' }).toLowerCase();
          customMonths.push(`${monthName} ${monthDate.getFullYear()}`);
        }
        return {
          month: customMonths.join(','),
        };
      default:
        const defaultMonths = [];
        for (let i = -2; i <= 0; i++) {
          const monthDate = new Date(currentYear, currentMonth + i, 1);
          const monthName = monthDate.toLocaleString('default', { month: 'long' }).toLowerCase();
          defaultMonths.push(`${monthName} ${monthDate.getFullYear()}`);
        }
        return {
          month: defaultMonths.join(','),
        };
    }
  };

  const dateRange = useMemo(() => getDateRange(period), [period, customMonth, customYear]);

  const handleApplyFilters = async () => {
    try {
      await Promise.all([
        dispatch(
          fetchOrders({
            sortTime,
            month: dateRange.month,
            area: area,
            segment: segment,
          })
        ),
        dispatch(
          fetchNOO({
            sortTime,
            month: dateRange.month,
            // startDate: "2025-03-01",
            // endDate: "2025-05-30",
            area: area,
            segment: segment,
          })
        )
      ]);
    } catch (error) {
      console.error("Fetch error:", error);
      setIsDataEmpty(true);
    }
  };

  // Add initial data fetch when component mounts
  useEffect(() => {
    handleApplyFilters();
  }, []); // Empty dependency array means this only runs once on mount

  useEffect(() => {
    if (validOrders && validOrders.length > 0) {
      const processed = processData(validOrders, customMonth, customYear);
      setProcessedData(processed);
      setIsDataEmpty(false);

      // Prepare chart data using the processed data
      const chartData = validOrders.map(order => {
        const storeSummary = processed.storeSummaries[order.user_id];
        const profit = storeSummary ? storeSummary.totalProfit / storeSummary.orderCount : 0;

        return {
          date: order.order_date,
          month: order.month,
          totalInvoice: order.total_invoice,
          totalProfit: profit
        };
      });
      setChartData(chartData);
    } else {
      setIsDataEmpty(true);
    }
  }, [validOrders]);

  useEffect(() => {
    if (processedData) {
      // Extract unique areas from the data
      const uniqueAreas = Object.keys(processedData.areaSummaries);
      setAreas(uniqueAreas);
    }
  }, [processedData]);

  const filteredOrders = validOrders.filter((order) => {
    if (selectedArea && order.area !== selectedArea) return false;

    const orderDate = new Date(order.order_date);
    const orderMonth = orderDate.toLocaleString('default', { month: 'long' }).toLowerCase();
    const orderYear = orderDate.getFullYear();
    const orderMonthYear = `${orderMonth} ${orderYear}`;

    // Check if the order's month is in the selected months
    const selectedMonths = dateRange.month.split(',');
    return selectedMonths.includes(orderMonthYear);
  });

  // Show loading screen while data is being fetched
  if (loading) {
    return <Loading />;
  }

  return (
    <PageContainer title="Invoice Dashboard" description="Invoice dashboard with analytics">
      <>
      {role !== 'admin' ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="60vh"
        >
          <Typography variant="h5" color="error">
            You don't have access to this page.
          </Typography>
        </Box>
      ) : <>
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
                  <MenuItem value="custom">Custom</MenuItem>
                </Select>
              </FormControl>

              {period === "custom" && (
                <Stack direction="row" spacing={2} sx={{ flexBasis: "40%", flexGrow: 1 }}>
                  <FormControl fullWidth>
                    <InputLabel>Month</InputLabel>
                    <Select 
                      value={customMonth} 
                      onChange={(e) => setCustomMonth(Number(e.target.value))} 
                      label="Month"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <MenuItem key={i} value={i}>
                          {new Date(2000, i, 1).toLocaleString("default", { month: "long" })}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel>Year</InputLabel>
                    <Select 
                      value={customYear} 
                      onChange={(e) => setCustomYear(Number(e.target.value))} 
                      label="Year"
                    >
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

              <TextField
                label="Select Area"
                select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ flexBasis: "30%", flexGrow: 1 }}
              >
                <MenuItem value="">All Areas</MenuItem>
                {areas
                  .filter((areaOption) => areaOption !== "")
                  .map((areaOption) => (
                    <MenuItem key={areaOption} value={areaOption}>
                      {areaOption}
                    </MenuItem>
                  ))}
              </TextField>

              <TextField
                label="Select Segment"
                select
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ flexBasis: "30%", flexGrow: 1 }}
              >
                <MenuItem value="">All Segments</MenuItem>
                <MenuItem value="HORECA">HORECA</MenuItem>
                <MenuItem value="RESELLER">RESELLER</MenuItem>
                <MenuItem value="OTHER">OTHER</MenuItem>
              </TextField>

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
                        value={processedData.thisMonthMetrics.totalOrders}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <InvoiceSummaryCard
                        title="Total Stores"
                        value={processedData.thisMonthMetrics.totalStores}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <InvoiceSummaryCard
                        title="Total Invoice"
                        value={processedData.thisMonthMetrics.totalInvoice}
                        isCurrency
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <InvoiceSummaryCard
                        title="Total Profit"
                        value={processedData.thisMonthMetrics.totalProfit}
                        isCurrency
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <InvoiceSummaryCard
                        title="Total Lunas"
                        value={processedData.thisMonthMetrics.totalLunas}
                        isCurrency
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <InvoiceSummaryCard
                        title="Total Belum Lunas"
                        value={processedData.thisMonthMetrics.totalBelumLunas}
                        isCurrency
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <InvoiceSummaryCard
                        title="Total COD"
                        value={processedData.thisMonthMetrics.totalCOD}
                        isCurrency
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <InvoiceSummaryCard
                        title="Total TOP"
                        value={processedData.thisMonthMetrics.totalTOP}
                        isCurrency
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Store Metrics */}
              {processedData && (
                <Box mb={4}>
                  <StoreMetrics 
                    storeSummaries={processedData.storeSummaries} 
                    monthlyMetrics={{
                      totalInvoice: processedData.overallTotalInvoice,
                      totalProfit: processedData.overallProfit,
                      totalOrders: processedData.totalOrderCount,
                      totalStores: Object.keys(processedData.storeSummaries).length,
                      totalLunas: processedData.overallLunas,
                      totalBelumLunas: processedData.overallBelumLunas,
                      totalCOD: processedData.overallCOD,
                      totalTOP: processedData.overallTOP
                    }}
                  />
                </Box>
              )}

              {/* Line Chart */}
              <Box mb={4}>
                <Grid container spacing={3}>
                  <Grid item xs={12} lg={8}>
                    <InvoiceLineChart data={chartData} timePeriod={timePeriod} />
                  </Grid>
                  <Grid item xs={12} lg={4}>
                    <MonthlyStoreChart 
                      data={processedData?.monthlyStoreCounts || {}} 
                      monthlyOrders={processedData?.monthlyOrderCounts || {}}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* NOO Chart */}
              <Box mb={4}>
                <NOOChart data={nooData} />
              </Box>

              {/* NOO Area Chart */}
              <Box mb={4}>
                <NOOAreaChart data={nooData} />
              </Box>

              {/* Store Summary Table */}
              {processedData && (
                <Box mb={4}>
                  <StoreSummaryTable storeSummaries={processedData.storeSummaries} />
                </Box>
              )}

              {/* Product Summary Table */}
              {processedData && (
                <Box mb={4}>
                  <ProductSummaryTable productSummaries={processedData.productSummaries} />
                </Box>
              )}

              {/* Area Chart */}
              {processedData && (
                <Box mb={4}>
                  <AreaChart
                    areaData={processedData.areaSummaries}
                    selectedMonths={dateRange.month}
                  />
                </Box>
              )}

              {/* Payment Distribution Chart */}
              {processedData && processedData.paymentStatusMetrics && (
                <Box mb={4}>
                  <PaymentDistributionChart 
                    data={Object.entries(processedData.paymentStatusMetrics as Record<string, PaymentStatusMetrics>).map(([status, metrics]) => ({
                      status,
                      totalOrders: metrics.totalOrders,
                      totalInvoice: metrics.totalInvoice,
                      totalProfit: metrics.totalProfit
                    }))}
                    selectedMonths={dateRange.month}
                  />
                </Box>
              )}
              
              {/* Orders Table */}
              {validOrders && (
                <Box>
                  {processedData && (
                    <DueDateStatusChart data={processedData.dueDateStatusCounts} />
                  )}
                  <OrdersTable orders={filteredOrders} />
                </Box>
              )}
            </>
          )}
        </>}
      </>
    </PageContainer>
  );
}

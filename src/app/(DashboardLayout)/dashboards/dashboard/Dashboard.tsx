"use client";
import { fetchNOO, fetchOrders, fetchStoreData } from "@/store/apps/Invoice/invoiceSlice";
import { useDispatch, useSelector } from "@/store/hooks";
import { RootState } from "@/store/store";
import { useEffect, useMemo, useState } from "react";
import { useInvoiceData } from "./data";

import Loading from "@/app/(DashboardLayout)/loading";
import PageContainer from "@/app/components/container/PageContainer";
import ActivationRateChart from "@/app/components/dashboards/invoice/ActivationRateChart";
import AreaChart from "@/app/components/dashboards/invoice/AreaChart";
import DueDateStatusChart from "@/app/components/dashboards/invoice/DueDateStatusChart";
import InvoiceLineChart from "@/app/components/dashboards/invoice/InvoiceLineChart";
import InvoiceSummaryCard from "@/app/components/dashboards/invoice/InvoiceSummaryCard";
import NOOAreaChart from "@/app/components/dashboards/invoice/NOOAreaChart";
import NOOChart from "@/app/components/dashboards/invoice/NOOChart";
import OrdersTable from "@/app/components/dashboards/invoice/OrdersTable";
import PaymentDetailsModal from "@/app/components/dashboards/invoice/PaymentDetailsModal";
import PaymentDistributionChart from "@/app/components/dashboards/invoice/PaymentDistributionChart";
import ProductSummaryTable from "@/app/components/dashboards/invoice/ProductSummaryTable";
import SegmentPerformanceChart from "@/app/components/dashboards/invoice/SegmentPerformanceChart";
import StoreSummaryTable from "@/app/components/dashboards/invoice/StoreSummaryTable";
import TotalSummaries from "@/app/components/dashboards/invoice/YearlyTotal";
import { useAuth } from "@/contexts/AuthContext";
import { OrderData } from "@/store/apps/Invoice/invoiceSlice";
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
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { goalProfit } from "../../goalProfit";
import { AreaData, ProcessedData } from "./types";
import SummaryTiles from "@/app/components/dashboards/shared/SummaryTiles";

interface StoreSummary {
  storeName: string;
  orderCount: number;
  totalInvoice: number;
  totalProfit: number;
  averageOrderValue: number;
  activeMonths: Set<string>;
  orders: OrderData[];
}

interface ExtendedAreaData extends AreaData {
  activeMonths: Set<string>;
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

  

  // Get orders from the Redux store
  const { orders, nooData, storeData, loading, error } = useSelector(
    (state: RootState) => ({
      orders: state.invoiceReducer.orders,
      nooData: state.invoiceReducer.nooData,
      storeData: state.invoiceReducer.storeData,
      loading: state.invoiceReducer.loading,
      error: state.invoiceReducer.error,
    })
  );
  // const { dashboardData, geraiData, totalItems, meta, loading } = useSelector(
  //   (state: RootState) => state.dashboardReducer
  // );

  // console.log(orders, nooData)

  // Filter out CANCEL BY ADMIN and CANCEL orders right after data is retrieved
  const validOrders = useMemo(() => {
    // First remove duplicates based on order_id
    const uniqueOrders =
      orders?.reduce((acc: OrderData[], order) => {
        if (!acc.find((o) => o.order_id === order.order_id)) {
          acc.push(order);
        }
        return acc;
      }, []) || [];

    // Then filter out cancelled orders
    return uniqueOrders.filter(
      (order) =>
        order.status_order !== "CANCEL BY ADMIN" &&
        order.status_order !== "CANCEL"
    );
  }, [orders]);

  const { processData } = useInvoiceData();
  const [processedData, setProcessedData] = useState<ProcessedData | null>(
    null
  );
  const [isDataEmpty, setIsDataEmpty] = useState(false);

  const [period, setPeriod] = useState("thisMonth");
  const [customMonth, setCustomMonth] = useState(new Date().getMonth());
  const [customYear, setCustomYear] = useState(new Date().getFullYear());
  const [sortTime, setSortTime] = useState<"asc" | "desc">("desc");
  const [timePeriod, setTimePeriod] = useState("Last 30 Days");
  const [chartData, setChartData] = useState<
    Array<{
      date: string;
      month: string;
      totalInvoice: number;
      totalProfit: number;
    }>
  >([]);
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [area, setArea] = useState(() => {
    if (role?.includes("surabaya")) return "SURABAYA";
    if (role?.includes("tangerang")) return "TANGERANG";
    if (role?.includes("jakarta")) return "JAKARTA";
    return "";
  });
  const [areas, setAreas] = useState<string[]>([]);
  const [allAreas, setAllAreas] = useState<string[]>([]);
  const [segment, setSegment] = useState<string>("");
  const [hasInitialized, setHasInitialized] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [monthlyTotalStoreCount, setMonthlyTotalStoreCount] = useState<Record<string, number>>({});
  const [activationRateData, setActivationRateData] = useState<Array<{ 
    month: string; 
    activationRate: number; 
    totalStores: number; 
    activeStores: number; 
    monthlyOrders: number; 
  }>>([]);


  const getDateRange = (period: string) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Helper function to get English month name
    const getEnglishMonthName = (date: Date) => {
      return date.toLocaleString("en-US", { month: "long" }).toLowerCase();
    };

    switch (period) {
      case "thisMonth":
        // For thisMonth, show all months from January to current month of current year
        const months = [];
        for (let i = 0; i <= currentMonth; i++) {
          const monthDate = new Date(currentYear, i, 1);
          const monthName = getEnglishMonthName(monthDate);
          months.push(`${monthName} ${currentYear}`);
        }
        return {
          month: months.join(","),
        };
      case "custom":
        // For custom, show 3 months from selected month
        const customMonths = [];
        for (let i = -2; i <= 0; i++) {
          const monthDate = new Date(customYear, customMonth + i, 1);
          const monthName = getEnglishMonthName(monthDate);
          customMonths.push(`${monthName} ${monthDate.getFullYear()}`);
        }
        return {
          month: customMonths.join(","),
        };
      default:
        // Fallback to all months of current year
        const defaultMonths = [];
        for (let i = 0; i < 12; i++) {
          const monthDate = new Date(currentYear, i, 1);
          const monthName = getEnglishMonthName(monthDate);
          defaultMonths.push(`${monthName} ${currentYear}`);
        }
        return {
          month: defaultMonths.join(","),
        };
    }
  };

  const dateRange = useMemo(
    () => getDateRange(period),
    [period, customMonth, customYear]
  );
  // console.log(dateRange)

  const handleApplyFilters = async () => {
    try {
      let AREA = area;
      if (role?.includes("tangerang")) {
        AREA = "TANGERANG";
      }
      if (role?.includes("surabaya")) {
        AREA = "SURABAYA";
      }
      if (role?.includes("jakarta")) {
        AREA = "JAKARTA";
      }

      await Promise.all([
        dispatch(
          fetchOrders({
            sortTime,
            month: dateRange.month,
            area: AREA,
            segment: segment,
          })
        ),
        dispatch(
          fetchNOO({
            sortTime,
            month: dateRange.month,
            // startDate: "2025-03-01",
            // endDate: "2025-05-30",
            area: AREA,
            segment: segment,
          })
        ),
        dispatch(fetchStoreData({ area: AREA }) as any),
      ]);
    } catch (error) {
      console.error("Fetch error:", error);
      setIsDataEmpty(true);
    }
  };

  useEffect(() => {
    if (role && !hasInitialized) {
      if (role.includes("surabaya")) setArea("SURABAYA");
      else if (role.includes("tangerang")) setArea("TANGERANG");
      else if (role.includes("jakarta")) setArea("JAKARTA");
      setHasInitialized(true); // prevent re-setting area
    }
  }, [role, hasInitialized]);

  // Add initial data fetch when component mounts
  useEffect(() => {
    if (hasInitialized) {
      handleApplyFilters();
    }
  }, [hasInitialized]);

  useEffect(() => {
    if (validOrders && validOrders.length > 0) {
      const processed = processData(validOrders, customMonth, customYear);
      setProcessedData(processed);
      setIsDataEmpty(false);
    } else {
      setIsDataEmpty(true);
    }
  }, [validOrders]);

  // Calculate monthlyTotalStoreCount and activation rate from storeData
  useEffect(() => {
    if (storeData && storeData.length > 0) {
      const monthlyCounts: Record<string, number> = {};
      
      // Get all unique months from store data
      const allMonths = storeData.map(store => store.first_order_month);
      const uniqueMonths = Array.from(new Set(allMonths)).sort();
      
      // For each month, count all stores that have period_month <= that month
      uniqueMonths.forEach(month => {
        const monthDate = new Date(month);
        const count = storeData.filter(store => {
          const storeMonthDate = new Date(store.first_order_month);
          return storeMonthDate <= monthDate;
        }).length;
        monthlyCounts[month] = count;
      });
      
      setMonthlyTotalStoreCount(monthlyCounts);
    }
  }, [storeData]);

  // Calculate activation rate data
  useEffect(() => {
    if (processedData && Object.keys(monthlyTotalStoreCount).length > 0) {
      const activationData: Array<{ 
        month: string; 
        activationRate: number; 
        totalStores: number; 
        activeStores: number; 
        monthlyOrders: number; 
      }> = [];
      
      // Get months from processedData that have store counts
      const monthsWithStores = Object.keys(processedData.monthlyStoreCounts);
      
      monthsWithStores.forEach(month => {
        const activeStores = processedData.monthlyStoreCounts[month]?.size || 0;
        const totalStores = monthlyTotalStoreCount[month] || 0;
        
        if (totalStores > 0) {
          const activationRate = (activeStores / totalStores) * 100;
          const monthlyOrders = processedData.monthlyOrderCounts[month] || 0;
          activationData.push({
            month,
            activationRate: Math.round(activationRate * 100) / 100, // Round to 2 decimal places
            totalStores,
            activeStores,
            monthlyOrders,
          });
        }
      });
      
      // Sort by month
      activationData.sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      });
      
      setActivationRateData(activationData);
    }
  }, [processedData, monthlyTotalStoreCount]);

  useEffect(() => {
    if (processedData) {
      // Extract unique areas from the data
      const uniqueAreas = Object.keys(processedData.areaSummaries);
      setAreas(uniqueAreas);
      // Merge new areas into allAreas
      setAllAreas(prev => {
        const merged = new Set([...prev, ...uniqueAreas]);
        return Array.from(merged);
      });
    }
  }, [processedData]);


  let filteredOrders = validOrders.filter((order) => {
    if (selectedArea && order.area !== selectedArea) return false;
    const orderMonthYear = order.month.toLowerCase();

    // Check if the order's month is in the selected months
    const selectedMonths = dateRange.month.split(",");

    return selectedMonths.includes(orderMonthYear);
  });

  // Show loading screen while data is being fetched
  if (loading) {
    return <Loading />;
  }

  const hasAccess = [
    "admin",
    "tangerang",
    "jakarta",
    "surabaya",
    "dashboard",
  ].some((r) => role?.includes(r));

  

  // Calculate NOOs for the selected month
  let selectedMonth = "";
  if (dateRange && dateRange.month) {
    const monthsArr = dateRange.month.split(",");
    selectedMonth = monthsArr[monthsArr.length - 1].trim();
    if (selectedMonth) {
      selectedMonth = selectedMonth.charAt(0).toUpperCase() + selectedMonth.slice(1);
    }
  
  }
  const nooCount = (nooData && Array.isArray(nooData))
    ? nooData.filter((noo: any) => noo.month === selectedMonth).length
    : 0;

  return (
    <PageContainer
      title="Invoice Dashboard"
      description="Invoice dashboard with analytics"
    >
      <>
        {!hasAccess ? (
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
        ) : (
          <>
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
                    <MenuItem value="custom">Custom Month</MenuItem>
                  </Select>
                </FormControl>

                {period === "custom" && (
                  <Stack
                    direction="row"
                    spacing={2}
                    sx={{ flexBasis: "40%", flexGrow: 1 }}
                  >
                    <FormControl fullWidth>
                      <InputLabel>Month</InputLabel>
                      <Select
                        value={customMonth}
                        onChange={(e) => setCustomMonth(Number(e.target.value))}
                        label="Month"
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <MenuItem key={i} value={i}>
                            {new Date(2000, i, 1).toLocaleString("default", {
                              month: "long",
                            })}
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
                  {allAreas
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
                    {(() => {
                      const areaKey = area || "NATIONAL";
                      let monthString = "";
                      if (dateRange && dateRange.month) {
                        const monthsArr = dateRange.month.split(",");
                        monthString = monthsArr[monthsArr.length - 1].trim();
                      }
                      const goal = goalProfit[areaKey]?.[monthString] || 0;
                      const profit = processedData.thisMonthMetrics.totalProfit || 0;
                      const remaining = goal - profit;
                      const isNegative = remaining > 0;
                      const invoice = processedData.thisMonthMetrics.totalInvoice;
                      const margin = (!invoice || invoice === 0) ? "-" : (profit / invoice * 100).toFixed(2) + "%";
                      const progress = (!goal || goal === 0) ? "-" : (profit / goal * 100).toFixed(2) + "%";
                      const tiles = [
                        { title: "Total Invoice", value: processedData.thisMonthMetrics.totalInvoice, isCurrency: true },
                        { title: "Profit Goal", value: goal, isCurrency: true },
                        { title: "Total Profit", value: profit, isCurrency: true },
                        { title: "Profit Progress", value: progress, isCurrency: false },
                        { title: "Profit Remaining", value: isNegative ? remaining : remaining, isCurrency: true, color: isNegative ? 'red' : 'green', fontWeight: 700 },
                        { title: "Active Stores", value: processedData.thisMonthMetrics.totalStores },
                        { title: "Total Orders", value: processedData.thisMonthMetrics.totalOrders },
                        { title: "NOOs", value: nooCount },
                        { title: "Margin", value: margin, isCurrency: false },
                        { title: "Activation Rate", value: (activationRateData && activationRateData.length > 0) ? activationRateData[activationRateData.length - 1].activationRate + "%" : "0%", isCurrency: false },
                      ];
                      return <SummaryTiles tiles={tiles} md={2.4} />;
                    })()}
                  </Box>
                )}

                

                {/* Line Chart */}
                <Box mb={4}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} lg={12}>
                      <InvoiceLineChart
                        data={processedData?.chartData || []}
                        timePeriod={timePeriod}
                      />
                    </Grid>
                    {/* <Grid item xs={12} lg={4}>
                      <MonthlyStoreChart
                        data={processedData?.monthlyStoreCounts || {}}
                        monthlyOrders={processedData?.monthlyOrderCounts || {}}
                      />
                    </Grid> */}
                  </Grid>
                </Box>

                {/* Activation Rate Chart */}
                {activationRateData.length > 0 && (
                  <Box mb={4}>
                    <ActivationRateChart data={activationRateData} />
                  </Box>
                )}

                

                {/* NOO Chart */}
                <Box mb={4}>
                  <NOOChart data={nooData} />
                </Box>

                {/* NOO Area Chart - Only show when no specific area is selected */}
                {!area && (
                  <Box mb={4}>
                    <NOOAreaChart data={nooData} />
                  </Box>
                )}

                {/* Store Summary Table */}
                {processedData && (
                  <Box mb={4}>
                    <StoreSummaryTable
                      storeSummaries={processedData.storeSummaries}
                    />
                  </Box>
                )}

                {/* Product Summary Table */}
                {processedData && (
                  <Box mb={4}>
                    <ProductSummaryTable
                      productSummaries={processedData.productSummaries}
                    />
                  </Box>
                )}

                {/* Area Chart - Only show when no specific area is selected */}
                {processedData && !area && (
                  <Box mb={4}>
                    <AreaChart
                      areaData={processedData.areaSummaries}
                      selectedMonths={dateRange.month}
                    />
                  </Box>
                )}
            

                {/* Segment Performance Chart */}
                {processedData &&
                  Object.keys(processedData.segmentSummaries).length > 0 && (
                    <Box mb={4}>
                      <SegmentPerformanceChart
                        subBusinessTypeData={
                          processedData.subBusinessTypeSummaries
                        }
                        segmentData={processedData.segmentSummaries}
                        selectedMonths={dateRange.month}
                      />
                    </Box>
                  )}

                {/* Payment Distribution Chart */}
                {processedData && processedData.paymentStatusMetrics && (
                  <Box mb={4}>
                    <PaymentDistributionChart
                      data={Object.entries(
                        processedData.paymentStatusMetrics as Record<
                          string,
                          PaymentStatusMetrics
                        >
                      ).map(([status, metrics]) => ({
                        status,
                        totalOrders: metrics.totalOrders,
                        totalInvoice: metrics.totalInvoice,
                        totalProfit: metrics.totalProfit,
                      }))}
                      selectedMonths={dateRange.month}
                    />
                  </Box>
                )}

                

                {/* Orders Table */}
                {validOrders && (
                  <Box>
                    {processedData && (
                      <DueDateStatusChart
                        data={processedData.dueDateStatusCounts}
                      />
                    )}

                    {/* Store Metrics */}
                    {processedData && (
                      <Box mb={4} mt={4}>
                        <TotalSummaries
                          monthlyMetrics={{
                            totalInvoice: processedData.overallTotalInvoice,
                            totalProfit: processedData.overallProfit,
                            totalOrders: processedData.totalOrderCount,
                            totalStores: Object.keys(processedData.storeSummaries)
                              .length,
                            totalLunas: processedData.overallLunas,
                            totalBelumLunas: processedData.overallBelumLunas,
                            totalCOD: processedData.overallCOD,
                            totalTOP: processedData.overallTOP,
                          }}
                          period={period}
                        />
                      </Box>
                    )}
                    <OrdersTable orders={filteredOrders} exportOrderDetails={true}/>
                  </Box>
                )}
              </>
            )}
          </>
        )}

        {/* Payment Details Modal */}
        {processedData && (
          <PaymentDetailsModal
            open={paymentModalOpen}
            onClose={() => setPaymentModalOpen(false)}
            paymentData={{
              // totalInvoice: processedData.thisMonthMetrics.totalInvoice,
              totalLunas: processedData.thisMonthMetrics.totalLunas,
              totalBelumLunas: processedData.thisMonthMetrics.totalBelumLunas,
              totalCOD: processedData.thisMonthMetrics.totalCOD,
              totalTOP: processedData.thisMonthMetrics.totalTOP,
            }}
          />
        )}
      </>
    </PageContainer>
  );
}

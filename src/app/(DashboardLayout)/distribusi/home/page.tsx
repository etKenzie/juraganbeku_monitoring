"use client";

import OrdersTable from "@/app/components/dashboards/invoice/OrdersTable";
import StoreSummaryTable from "@/app/components/dashboards/invoice/StoreSummaryTable";
import SummaryTiles from "@/app/components/dashboards/shared/SummaryTiles";
import { useAuth } from "@/contexts/AuthContext";
import { fetchNOO, fetchOrders, fetchStoreData } from "@/store/apps/Invoice/invoiceSlice";
import { useDispatch, useSelector } from "@/store/hooks";
import { RootState } from "@/store/store";
import { Box, Button, FormControl, InputLabel, MenuItem, Select, Stack, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { goalProfit } from "../../goalProfit";
import Loading from "../../loading";
import { useInvoiceData } from "../sales/data";

export default function DashboardPage() {
  const dispatch = useDispatch();
  const { role } = useAuth();
  const { orders, nooData, loading, storeData } = useSelector((state: RootState) => ({
    orders: state.invoiceReducer.orders,
    storeData: state.invoiceReducer.storeData,
    nooData: state.invoiceReducer.nooData,
    loading: state.invoiceReducer.loading,
  }));

  // Compose month string for API
  const getMonthString = (month: number, year: number) => {
    const date = new Date(year, month, 1);
    const monthName = date.toLocaleString("en-US", { month: "long" }).toLowerCase();
    return `${monthName} ${year}`;
  };

  // Filters
  const [area, setArea] = useState(() => {
    if (role?.includes("surabaya")) return "SURABAYA";
    if (role?.includes("tangerang")) return "TANGERANG";
    if (role?.includes("jakarta")) return "JAKARTA";
    return "";
  });
  const [segment, setSegment] = useState("");
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const[monthString, setMonthString] = useState(getMonthString(selectedMonth, selectedYear))
  const [filters, setFilters] = useState<{ area: string; segment: string; month: number; year: number }>({
    area,
    segment: "",
    month: now.getMonth(),
    year: now.getFullYear(),
  });

  // Only fetch/process data after clicking Apply Filters
  const handleApplyFilters = () => {
    setFilters({ area, segment, month: selectedMonth, year: selectedYear });
  };

  

  // Fetch data when filters are set
  useEffect(() => {
    if (!filters) return;
    let AREA = filters.area;
    if (role?.includes("tangerang")) AREA = "TANGERANG";
    if (role?.includes("surabaya")) AREA = "SURABAYA";
    if (role?.includes("jakarta")) AREA = "JAKARTA";
    const newMonthString = getMonthString(filters.month, filters.year);
    dispatch(
      fetchOrders({
        sortTime: "desc",
        month: newMonthString,
        area: AREA,
        segment: filters.segment,
      })
    );
    dispatch(
      fetchNOO({
        sortTime: "desc",
        month: newMonthString,
        area: AREA,
        segment: filters.segment,
      })
      
    );
    dispatch(fetchStoreData({ area: AREA }) as any),
    setMonthString(newMonthString); // If you still need to keep monthString in state for other reasons
    // eslint-disable-next-line
  }, [filters]);

  // Filter and process orders
  const validOrders = useMemo(() => {
    const uniqueOrders =
      orders?.reduce((acc: any[], order: any) => {
        if (!acc.find((o) => o.order_id === order.order_id)) {
          acc.push(order);
        }
        return acc;
      }, []) || [];
    return uniqueOrders.filter(
      (order) =>
        order.status_order !== "CANCEL BY ADMIN" &&
        order.status_order !== "CANCEL"
    );
  }, [orders]);

  const { processData } = useInvoiceData();
  const processedData = useMemo(() => {
    if (!filters) return null;
    return processData(validOrders, filters.month, filters.year);
  }, [validOrders, filters, processData]);

  // Calculate monthlyTotalStoreCount from storeData using useMemo
  const monthlyTotalStoreCount = useMemo(() => {
    if (!storeData || storeData.length === 0) return {};
    const monthlyCounts: Record<string, number> = {};
    const allMonths = storeData.map(store => store.first_order_month);
    const uniqueMonths = Array.from(new Set(allMonths)).sort();
    uniqueMonths.forEach(month => {
      const monthDate = new Date(month);
      const count = storeData.filter(store => {
        const storeMonthDate = new Date(store.first_order_month);
        return storeMonthDate <= monthDate;
      }).length;
      monthlyCounts[month] = count;
    });
    return monthlyCounts;
  }, [storeData]);

  // Calculate activation rate data using useMemo
  const activationRateData = useMemo(() => {
    if (!processedData || Object.keys(monthlyTotalStoreCount).length === 0) return [];
    const activationData: Array<{
      month: string;
      activationRate: number;
      totalStores: number;
      activeStores: number;
      monthlyOrders: number;
    }> = [];
    const monthsWithStores = Object.keys(processedData.monthlyStoreCounts);
    monthsWithStores.forEach(month => {
      const activeStores = processedData.monthlyStoreCounts[month]?.size || 0;
      const totalStores = monthlyTotalStoreCount[month] || 0;
      if (totalStores > 0) {
        const activationRate = (activeStores / totalStores) * 100;
        const monthlyOrders = processedData.monthlyOrderCounts[month] || 0;
        activationData.push({
          month,
          activationRate: Math.round(activationRate * 100) / 100,
          totalStores,
          activeStores,
          monthlyOrders,
        });
      }
    });
    activationData.sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA.getTime() - dateB.getTime();
    });
    return activationData;
  }, [processedData, monthlyTotalStoreCount]);

  console.log(activationRateData)

  // Areas for filter dropdown
  const areas = useMemo(() => {
    return processedData ? Object.keys(processedData.areaSummaries) : [];
  }, [processedData]);

  // NOOs for selected month
  const nooForSelectedMonth = useMemo(() => {
    if (!Array.isArray(nooData)) return 0;
    return nooData.length;
  }, [nooData]);

  // Store list for selected month
  const storeList = useMemo(() => {
    if (!processedData) return [];
    return Object.values(processedData.storeSummaries || {})
      .map((store: any) => ({
        storeName: store.storeName,
        totalInvoice: store.totalInvoice,
      }))
      .sort((a, b) => b.totalInvoice - a.totalInvoice);
  }, [processedData]);

  if (loading) {
    return <Loading />;
  }

  // Role-based access control
  const hasAccess = [
    "admin",
    "tangerang",
    "jakarta",
    "surabaya",
    "dashboard",
  ].some((r) => role?.includes(r));
  if (!hasAccess) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <Typography variant="h5" color="error">
          You don't have access to this page.
        </Typography>
      </Box>
    );
  }

  return (
    <Box p={4}>
      <Typography variant="h4" mb={3}>
        Simple Invoice Dashboard
      </Typography>
      {/* Filters */}
      <Box mb={3}>
        <Stack direction="row" spacing={2}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Area</InputLabel>
            <Select value={area} onChange={(e) => setArea(e.target.value)} label="Area">
              <MenuItem value="">All Areas</MenuItem>
              {areas.filter((a) => a !== "").map((a) => (
                <MenuItem key={a} value={a}>{a}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Segment</InputLabel>
            <Select value={segment} onChange={(e) => setSegment(e.target.value)} label="Segment">
              <MenuItem value="">All Segments</MenuItem>
              <MenuItem value="HORECA">HORECA</MenuItem>
              <MenuItem value="RESELLER">RESELLER</MenuItem>
              <MenuItem value="OTHER">OTHER</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Month</InputLabel>
            <Select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} label="Month">
              {Array.from({ length: 12 }, (_, i) => (
                <MenuItem key={i} value={i}>
                  {new Date(2000, i, 1).toLocaleString("default", { month: "long" })}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Year</InputLabel>
            <Select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} label="Year">
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                );
              })}
            </Select>
          </FormControl>
          <Button variant="contained" onClick={handleApplyFilters}>Apply Filters</Button>
        </Stack>
      </Box>
      {/* Summary Cards */}
      {processedData && (
        <Box mb={3}>
          {(() => {
            // Prepare tile data array
            const areaKey = filters.area || "NATIONAL";
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
              { title: "NOOs", value: nooForSelectedMonth },
              { title: "Margin", value: margin, isCurrency: false },
              { title: "Activation Rate", value: (activationRateData && activationRateData.length > 0) ? activationRateData[activationRateData.length - 1].activationRate + "%" : "0%", isCurrency: false },
            ];
            return <SummaryTiles tiles={tiles} md={2.4} />;
          })()}
        </Box>
      )}
      
      {/* Store Table */}
      {processedData && (
        <Box mb={3}>
          <StoreSummaryTable storeSummaries={processedData.storeSummaries} />
        </Box>
      )}
      {/* NOO Area Chart */}
      {/* {Array.isArray(nooData) && nooData.length > 0 && (
        <Box mb={3}>
          <NOOAreaChart data={nooData} />
        </Box>
      )} */}
      {/* NOO Segment Chart */}
      {/* {Array.isArray(nooData) && nooData.length > 0 && (
        <Box mb={3}>
          <NOOSegmentChart data={nooData} />
        </Box>
      )} */}
      {/* NOO Orders Table */}
      {Array.isArray(nooData) && nooData.length > 0 && (
        <Box mb={3}>
          <OrdersTable orders={nooData} title="NOOs Table" exportOrderDetails={false}/>
        </Box>
      )}
    </Box>
  );
}

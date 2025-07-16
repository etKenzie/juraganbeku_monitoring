"use client";

import InvoiceSummaryCard from "@/app/components/dashboards/invoice/InvoiceSummaryCard";
import OrdersTable from "@/app/components/dashboards/invoice/OrdersTable";
import StoreSummaryTable from "@/app/components/dashboards/invoice/StoreSummaryTable";
import { useAuth } from "@/contexts/AuthContext";
import { fetchNOO, fetchOrders } from "@/store/apps/Invoice/invoiceSlice";
import { useDispatch, useSelector } from "@/store/hooks";
import { RootState } from "@/store/store";
import { Box, Button, FormControl, Grid, InputLabel, MenuItem, Select, Stack, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import Loading from "../loading";
import { useInvoiceData } from "./dashboards/dashboard/data";
import { goalProfit } from "./goalProfit";

export default function DashboardPage() {
  const dispatch = useDispatch();
  const { role } = useAuth();
  const { orders, nooData, loading } = useSelector((state: RootState) => ({
    orders: state.invoiceReducer.orders,
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
    setMonthString(getMonthString(filters.month, filters.year));
    dispatch(
      fetchOrders({
        sortTime: "desc",
        month: monthString,
        area: AREA,
        segment: filters.segment,
      })
    );
    dispatch(
      fetchNOO({
        sortTime: "desc",
        month: monthString,
        area: AREA,
        segment: filters.segment,
      })
    );
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
          <Grid container spacing={3}>
            {/* Profit Goal Card FIRST */}
            <Grid item xs={12} sm={6} md={4}>
              <InvoiceSummaryCard
                title="Profit Goal"
                value={(() => {
                  const areaKey = area || "NATIONAL";
                  const value = goalProfit[areaKey]?.[monthString];
                  return value || 0;
                })()}
                isCurrency
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <InvoiceSummaryCard
                title="Total Profit"
                value={processedData.thisMonthMetrics.totalProfit}
                isCurrency
              />
            </Grid>
            {/* Existing summary cards */}
            <Grid item xs={12} sm={6} md={4}>
              <InvoiceSummaryCard
                title="Total Invoice"
                value={processedData.thisMonthMetrics.totalInvoice}
                isCurrency
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <InvoiceSummaryCard
                title="Total Stores"
                value={processedData.thisMonthMetrics.totalStores}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <InvoiceSummaryCard
                title="Total Orders"
                value={processedData.thisMonthMetrics.totalOrders}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <InvoiceSummaryCard
                title="New NOOs"
                value={nooForSelectedMonth}
              />
            </Grid>
          </Grid>
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

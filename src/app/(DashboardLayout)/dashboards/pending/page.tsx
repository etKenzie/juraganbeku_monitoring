"use client";
import { fetchOrders } from "@/store/apps/Invoice/invoiceSlice";
import { useDispatch, useSelector } from "@/store/hooks";
import { RootState } from "@/store/store";
import { useEffect, useMemo, useState } from "react";
import { useInvoiceData } from "../dashboard/data";

import { calculateDueDateStatus } from "@/app/(DashboardLayout)/dashboards/dashboard/data";
import { AreaData } from "@/app/(DashboardLayout)/dashboards/dashboard/types";
import Loading from "@/app/(DashboardLayout)/loading";
import PageContainer from "@/app/components/container/PageContainer";
import InvoiceSummaryCard from "@/app/components/dashboards/invoice/InvoiceSummaryCard";
import OrdersTable from "@/app/components/dashboards/invoice/OrdersTable";
import StoreSummaryTable from "@/app/components/dashboards/invoice/StoreSummaryTable";
import DueDateStatusBarChart from "@/app/components/dashboards/pending/DueDateStatusBarChart";
import PaymentStatusPieChart from "@/app/components/dashboards/pending/PaymentStatusPieChart";
import DashboardCard from "@/app/components/shared/DashboardCard";
import { useAuth } from "@/contexts/AuthContext";
import { OrderData } from "@/store/apps/Invoice/invoiceSlice";
import axiosServices from "@/utils/axios";
import {
  Box,
  Button,
  Grid,
  MenuItem,
  TextField,
  Typography
} from "@mui/material";
import { useCallback } from "react";
import TransactionAmountLineChart from "./TransactionAmountLineChart";
import TransactionTable from "./TransactionTable";

interface PaymentStatusData {
  status: string;
  totalOrders: number;
  totalInvoice: number;
  totalProfit: number;
}

interface DueDateStatusData {
  status: string;
  totalOrders: number;
  totalInvoice: number;
  totalProfit: number;
  areaData: Record<string, AreaData>;
  orders: OrderData[];
}

export default function PendingDashboard() {
  const dispatch = useDispatch();
  const { role } = useAuth();

  // Get orders from the Redux store
  const { orders, loading, error } = useSelector(
    (state: RootState) => ({
      orders: state.invoiceReducer.orders,
      loading: state.invoiceReducer.loading,
      error: state.invoiceReducer.error
    })
  );

  // Filter out CANCEL BY ADMIN and CANCEL orders right after data is retrieved
  const validOrders = useMemo(() => {
    return orders?.filter(order => 
      order.status_order !== "CANCEL BY ADMIN" && 
      order.status_order !== "CANCEL"
    ) || [];
  }, [orders]);

  const { processData } = useInvoiceData();
  const [processedData, setProcessedData] = useState<any>(null);
  const [isDataEmpty, setIsDataEmpty] = useState(false);
  const [sortTime, setSortTime] = useState<'asc' | 'desc'>('desc');
  const [area, setArea] = useState(() => {
    if (role?.includes("surabaya")) return "SURABAYA";
    if (role?.includes("tangerang")) return "TANGERANG";
    if (role?.includes("jakarta")) return "JAKARTA";
    return "";
  });
  // Area input for UI, only applied on filter click
  const [areaInput, setAreaInput] = useState(area);
  const [segment, setSegment] = useState<string>("");
  const [hasInitialized, setHasInitialized] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Transaction state
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  // Month/year filter for transactions
  const [txMonth, setTxMonth] = useState<number>(new Date().getMonth());
  const [txYear, setTxYear] = useState<number>(new Date().getFullYear());
  const [appliedTxMonth, setAppliedTxMonth] = useState<number>(new Date().getMonth());
  const [appliedTxYear, setAppliedTxYear] = useState<number>(new Date().getFullYear());

  // Helper to get month name
  function getMonthName(monthIdx: number) {
    const name = new Date(2000, monthIdx, 1).toLocaleString("en-US", { month: "long" });
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  }

  // Generate a comma-separated list of the last 12 months up to the selected month/year
  const txMonthFilter = (() => {
    const months: string[] = [];
    let month = txMonth;
    let year = txYear;
    for (let i = 0; i < 12; i++) {
      months.unshift(`${getMonthName(month)} ${year}`);
      month--;
      if (month < 0) {
        month = 11;
        year--;
      }
    }
    return months.join(",");
  })();

  const fetchTransactions = useCallback(async () => {
    setTransactionLoading(true);
    setTransactionError(null);
    try {
      console.log(txMonthFilter)
      console.log(area)
      const res = await axiosServices.get(
        `https://charlie.tokopandai.id/toko-pandai-api/v1/jurbek/transaction`,
        {
          params: {
            month_filter: txMonthFilter,
            area: area // always pass area
          },
          headers: {
            // token: "ca90810c1350c554a91e24b9a7b0ec9147a916b2eddc8ded5b2bcdc07c47c291f3080fe5f5fb409795b055bb47d834a59f0d101e",
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      console.log(res)
      setTransactions(res.data.result || []);
    } catch (err: any) {
      setTransactionError(err?.message || "Failed to fetch transactions");
    } finally {
      setTransactionLoading(false);
    }
  }, [txMonthFilter, area]);

  const handleApplyFilters = async () => {
    try {
      setArea(areaInput); // Only update area filter on apply
      setAppliedTxMonth(txMonth);
      setAppliedTxYear(txYear);
      let AREA = areaInput;
      if (role?.includes("tangerang")) {
        AREA = "TANGERANG"
      }
      if (role?.includes("surabaya")) {
        AREA = "SURABAYA"
      }
      if (role?.includes("jakarta")) {
        AREA = "JAKARTA"
      }
      await dispatch(
        fetchOrders({
          sortTime,
          area: AREA,
          month: txMonthFilter,
          segment: segment,
          payment: "BELUM LUNAS, PARTIAL, WAITING VALIDATION BY FINANCE"
        })
      );
    } catch (error) {
      console.error("Fetch error:", error);
      setIsDataEmpty(true);
    }
  };

  useEffect(() => {
    if (role && !hasInitialized) {
      let initialArea = "";
      if (role.includes("surabaya")) initialArea = "SURABAYA";
      else if (role.includes("tangerang")) initialArea = "TANGERANG";
      else if (role.includes("jakarta")) initialArea = "JAKARTA";
      setArea(initialArea);
      setAreaInput(initialArea);
      setHasInitialized(true); // prevent re-setting area
    }
  }, [role, hasInitialized]);

  useEffect(() => {
    if (initialLoad) {
      // Fetch both orders and transactions on first load
      handleApplyFilters();
      fetchTransactions();
      setInitialLoad(false);
    }
  }, [initialLoad, fetchTransactions]);

  useEffect(() => {
    if (validOrders && validOrders.length > 0) {
      const processed = processData(validOrders, new Date().getMonth(), new Date().getFullYear());
      setProcessedData(processed);
      setIsDataEmpty(false);
    } else {
      setIsDataEmpty(true);
    }
  }, [validOrders]);

  useEffect(() => {
    if (processedData) {
      // Extract unique areas from the data
      const uniqueAreas = Object.keys(processedData.areaSummaries);
      // setAreas(uniqueAreas); // This line is removed as per the edit hint
    }
  }, [processedData]);

  // Calculate payment status metrics
  const paymentStatusData = validOrders.reduce((acc: Record<string, PaymentStatusData>, order) => {
    const status = order.status_payment;
    if (!acc[status]) {
      acc[status] = {
        status,
        totalOrders: 0,
        totalInvoice: 0,
        totalProfit: 0
      };
    }
    acc[status].totalOrders += 1;
    acc[status].totalInvoice += order.total_invoice;
    acc[status].totalProfit += order.profit;
    return acc;
  }, {});

  const paymentStatusMetrics: PaymentStatusData[] = Object.values(paymentStatusData);

  // Calculate due date status metrics
  const dueDateStatusData = validOrders.reduce((acc: Record<string, DueDateStatusData>, order) => {
    const status = calculateDueDateStatus(order.payment_due_date, order.status_payment);
    if (!acc[status]) {
      acc[status] = {
        status,
        totalOrders: 0,
        totalInvoice: 0,
        totalProfit: 0,
        areaData: {},
        orders: []
      };
    }

    const statusData = acc[status];
    statusData.totalOrders += 1;
    statusData.totalInvoice += order.total_invoice;
    statusData.totalProfit += order.profit;
    statusData.orders.push(order);

    // Initialize area data if it doesn't exist
    if (!statusData.areaData[order.area]) {
      statusData.areaData[order.area] = {
        name: order.area,
        totalOrders: 0,
        totalInvoice: 0,
        totalProfit: 0,
        totalCOD: 0,
        totalTOP: 0,
        totalLunas: 0,
        totalBelumLunas: 0,
        orders: []
      };
    }

    // Update area data
    const areaData = statusData.areaData[order.area];
    areaData.totalOrders++;
    areaData.totalInvoice += order.total_invoice;
    areaData.totalProfit += order.profit;
    
    // Update payment method totals
    if (order.payment_type === 'COD') {
      areaData.totalCOD += order.total_invoice;
    } else if (order.payment_type === 'TOP') {
      areaData.totalTOP += order.total_invoice;
    }

    // Update payment status totals
    if (order.status_payment === 'Lunas') {
      areaData.totalLunas += order.total_invoice;
    } else {
      areaData.totalBelumLunas += order.total_invoice;
    }

    areaData.orders.push(order);

    return acc;
  }, {});

  const dueDateStatusMetrics: DueDateStatusData[] = Object.values(dueDateStatusData);

  // Calculate total transaction amount per month for chart
  const transactionAmountByMonth = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach((t) => {
      if (!t.month) return;
      const month = t.month;
      const amount = Number(t.amount) || 0;
      map.set(month, (map.get(month) || 0) + amount);
    });
    // Sort months chronologically if possible
    return Array.from(map.entries()).sort((a, b) => {
      // Try to parse as date for sorting
      const dateA = new Date("1 " + a[0]);
      const dateB = new Date("1 " + b[0]);
      return dateA.getTime() - dateB.getTime();
    });
  }, [transactions]);

  const totalTransactionAmount = useMemo(() => {
    return transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions]);

  // Calculate total transaction amount for the selected month and area
  const thisMonthTransactionAmount = useMemo(() => {
    const monthName = `${getMonthName(appliedTxMonth)} ${appliedTxYear}`;
    return transactions
      .filter(t => (t.month === monthName) && (!area || t.area === area || t.Area === area))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions, appliedTxMonth, appliedTxYear, area]);

  // Show loading screen while data is being fetched
  if (loading) {
    return <Loading />;
  }
  const hasAccess = ["admin", "tangerang", "jakarta", "surabaya", "dashboard", "invoice distribution"].some(r => role?.includes(r));

  return (
    <PageContainer title="Pending Invoices Dashboard" description="Dashboard for pending invoices">
      <>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Box display="flex" gap={2} alignItems="center" width="100%">
            <TextField
              label="Select Area"
              select
              value={areaInput}
              onChange={(e) => setAreaInput(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ flexBasis: '20%' }}
            >
              <MenuItem value="">All Areas</MenuItem>
              <MenuItem value="TANGERANG">TANGERANG</MenuItem>
              <MenuItem value="CENTRAL">CENTRAL</MenuItem>
              <MenuItem value="JAKARTA">JAKARTA</MenuItem>
              <MenuItem value="SURABAYA">SURABAYA</MenuItem>
            </TextField>
            <TextField
              label="Select Segment"
              select
              value={segment}
              onChange={(e) => setSegment(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ flexBasis: '20%' }}
            >
              <MenuItem value="">All Segments</MenuItem>
              <MenuItem value="HORECA">HORECA</MenuItem>
              <MenuItem value="RESELLER">RESELLER</MenuItem>
              <MenuItem value="OTHER">OTHER</MenuItem>
            </TextField>
            <TextField
              select
              label="Month"
              value={txMonth}
              onChange={e => setTxMonth(Number(e.target.value))}
              sx={{ flexBasis: '20%' }}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <MenuItem key={i} value={i}>
                  {new Date(2000, i, 1).toLocaleString("default", { month: "long" })}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Year"
              value={txYear}
              onChange={e => setTxYear(Number(e.target.value))}
              sx={{ flexBasis: '20%' }}
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                );
              })}
            </TextField>
            <Button
              variant="contained"
              color="primary"
              onClick={() => { handleApplyFilters(); fetchTransactions(); }}
              disabled={loading || transactionLoading}
              sx={{ flexBasis: '20%', height: '56px' }}
            >
              Apply Filters
            </Button>
          </Box>
        </Box>
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
        ) : <>
            {isDataEmpty ? (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                height="50vh"
              >
                <Typography variant="h6" color="textSecondary">
                  No pending invoices found.
                </Typography>
              </Box>
            ) : (
              <>
                {/* Summary Cards */}
                {processedData && (
                  <Box mb={4}>
                   <Typography variant="h6" mb={2}>Month Summary</Typography>
                    <Grid container spacing={3} mb={4}>
                      <Grid item xs={12} sm={6} md={3}>
                        <InvoiceSummaryCard
                          title="Total Pending Orders"
                          value={processedData.thisMonthMetrics.totalOrders}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <InvoiceSummaryCard
                          title="Total Pending Invoice"
                          value={processedData.thisMonthMetrics.totalInvoice}
                          isCurrency
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <InvoiceSummaryCard
                          title="Total Pending Profit"
                          value={processedData.thisMonthMetrics.totalProfit}
                          isCurrency
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <InvoiceSummaryCard
                          title="Total Transaction Amount"
                          value={thisMonthTransactionAmount}
                          isCurrency
                        />
                      </Grid>
                    </Grid>

                    <Typography variant="h6" mb={2}>Year Summary</Typography>
                    <Grid container spacing={3} mb={4}>
                      <Grid item xs={12} sm={6} md={3}>
                        <InvoiceSummaryCard
                          title="Total Pending Orders"
                          value={validOrders.length}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <InvoiceSummaryCard
                          title="Total Pending Invoice"
                          value={validOrders.reduce((sum, order) => sum + order.total_invoice, 0)}
                          isCurrency
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <InvoiceSummaryCard
                          title="Total Pending Profit"
                          value={validOrders.reduce((sum, order) => sum + order.profit, 0)}
                          isCurrency
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <InvoiceSummaryCard
                          title="Total Transaction Amount"
                          value={totalTransactionAmount}
                          isCurrency
                        />
                      </Grid>
                    </Grid>
                    
                   

                    
                  </Box>
                )}
                {/* Transaction Amount Line Chart */}
                <Box mb={4}>
                  <DashboardCard>
                    <TransactionAmountLineChart rawTransactions={transactions} />
                  </DashboardCard>
                </Box>
                {/* Charts */}
                <Grid container spacing={3} mb={4}>
                  <Grid item xs={12} md={12}>
                    <PaymentStatusPieChart data={paymentStatusMetrics} />
                  </Grid>
                  <Grid item xs={12} md={12}>
                    <DueDateStatusBarChart data={dueDateStatusMetrics} />
                  </Grid>
                </Grid>
                {/* Store Summary Table for total owed per store */}
                {processedData && (
                  <Box mb={4}>
                    <StoreSummaryTable storeSummaries={processedData.storeSummaries} />
                  </Box>
                )}
                {/* Orders Table */}
                {validOrders && (
                  <Box>
                    <OrdersTable orders={validOrders} exportOrderDetails={false}/>
                  </Box>
                )}
                {/* Transaction Table */}
                <Box mt={4}>
                  <TransactionTable
                    transactions={transactions}
                    loading={transactionLoading}
                    error={transactionError}
                  />
                </Box>
              </>
            )}
          </>}
      </>
    </PageContainer>
  );
}

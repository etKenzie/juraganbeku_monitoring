"use client";
import { fetchOrders } from "@/store/apps/Invoice/invoiceSlice";
import { useDispatch, useSelector } from "@/store/hooks";
import { RootState } from "@/store/store";
import { useEffect, useState } from "react";
import { useInvoiceData } from "../Invoice/data";

import { calculateDueDateStatus } from "@/app/(DashboardLayout)/dashboards/Invoice/data";
import Loading from "@/app/(DashboardLayout)/loading";
import PageContainer from "@/app/components/container/PageContainer";
import InvoiceSummaryCard from "@/app/components/dashboards/invoice/InvoiceSummaryCard";
import OrdersTable from "@/app/components/dashboards/invoice/OrdersTable";
import DueDateStatusBarChart from "@/app/components/dashboards/pending/DueDateStatusBarChart";
import PaymentStatusPieChart from "@/app/components/dashboards/pending/PaymentStatusPieChart";
import { useAuth } from "@/contexts/AuthContext";
import {
    Box,
    Button,
    Grid,
    MenuItem,
    TextField,
    Typography
} from "@mui/material";

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

  const { processData } = useInvoiceData();
  const [processedData, setProcessedData] = useState<any>(null);
  const [isDataEmpty, setIsDataEmpty] = useState(false);
  const [sortTime, setSortTime] = useState<'asc' | 'desc'>('desc');
  const [area, setArea] = useState("");
  const [areas, setAreas] = useState<string[]>([""]);
  const [segment, setSegment] = useState<string>("");

  const handleApplyFilters = async () => {
    try {
      await dispatch(
        fetchOrders({
          sortTime,
          area: area,
          segment: segment,
          payment: "BELUM LUNAS, PARTIAL, WAITING VALIDATION BY FINANCE"
        })
      );
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
    if (orders && orders.length > 0) {
      const processed = processData(orders, new Date().getMonth(), new Date().getFullYear());
      setProcessedData(processed);
      setIsDataEmpty(false);
    } else {
      setIsDataEmpty(true);
    }
  }, [orders]);

  useEffect(() => {
    if (processedData) {
      // Extract unique areas from the data
      const uniqueAreas = Object.keys(processedData.areaSummaries);
      setAreas(uniqueAreas);
    }
  }, [processedData]);

  // Calculate payment status metrics
  const paymentStatusData = orders.reduce((acc: Record<string, PaymentStatusData>, order) => {
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
  const dueDateStatusData = orders.reduce((acc: Record<string, DueDateStatusData>, order) => {
    const status = calculateDueDateStatus(order.payment_due_date, order.status_payment);
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

  const dueDateStatusMetrics: DueDateStatusData[] = Object.values(dueDateStatusData);

  // Show loading screen while data is being fetched
  if (loading) {
    return <Loading />;
  }

  return (
    <PageContainer title="Pending Invoices Dashboard" description="Dashboard for pending invoices">
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
                No pending invoices found.
              </Typography>
            </Box>
          ) : (
            <>
              {/* Summary Cards */}
              {processedData && (
                <Box mb={4}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={4}>
                      <InvoiceSummaryCard
                        title="Total Pending Orders"
                        value={processedData.thisMonthMetrics.totalOrders}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <InvoiceSummaryCard
                        title="Total Pending Invoice"
                        value={processedData.thisMonthMetrics.totalInvoice}
                        isCurrency
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <InvoiceSummaryCard
                        title="Total Pending Profit"
                        value={processedData.thisMonthMetrics.totalProfit}
                        isCurrency
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Charts */}
              <Grid container spacing={3} mb={4}>
                <Grid item xs={12} md={12}>
                  <PaymentStatusPieChart data={paymentStatusMetrics} />
                </Grid>
                <Grid item xs={12} md={12}>
                  <DueDateStatusBarChart data={dueDateStatusMetrics} />
                </Grid>
              </Grid>
              
              {/* Orders Table */}
              {orders && (
                <Box>
                  <OrdersTable orders={orders} />
                </Box>
              )}
            </>
          )}
        </>}
      </>
    </PageContainer>
  );
}

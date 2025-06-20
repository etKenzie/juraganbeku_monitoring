"use client";
import { fetchOrders } from "@/store/apps/Invoice/invoiceSlice";
import { useDispatch, useSelector } from "@/store/hooks";
import { RootState } from "@/store/store";
import { useEffect, useMemo, useState } from "react";
import { useInvoiceData } from "../Invoice/data";

import { calculateDueDateStatus } from "@/app/(DashboardLayout)/dashboards/Invoice/data";
import { AreaData } from "@/app/(DashboardLayout)/dashboards/Invoice/types";
import Loading from "@/app/(DashboardLayout)/loading";
import PageContainer from "@/app/components/container/PageContainer";
import InvoiceSummaryCard from "@/app/components/dashboards/invoice/InvoiceSummaryCard";
import OrdersTable from "@/app/components/dashboards/invoice/OrdersTable";
import DueDateStatusBarChart from "@/app/components/dashboards/pending/DueDateStatusBarChart";
import PaymentStatusPieChart from "@/app/components/dashboards/pending/PaymentStatusPieChart";
import { useAuth } from "@/contexts/AuthContext";
import { OrderData } from "@/store/apps/Invoice/invoiceSlice";
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
  const [areas, setAreas] = useState<string[]>([""]);
  const [segment, setSegment] = useState<string>("");
  const [hasInitialized, setHasInitialized] = useState(false);

  const handleApplyFilters = async () => {
    try {

      let AREA = area;
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
      setAreas(uniqueAreas);
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

  // Show loading screen while data is being fetched
  if (loading) {
    return <Loading />;
  }
  const hasAccess = ["admin", "tangerang", "jakarta", "surabaya", "dashboard"].some(r => role?.includes(r));

  return (
    <PageContainer title="Pending Invoices Dashboard" description="Dashboard for pending invoices">
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
                  <Typography variant="h6" mb={2}>Overall Summary</Typography>
                  <Grid container spacing={3} mb={4}>
                    <Grid item xs={12} sm={6} md={4}>
                      <InvoiceSummaryCard
                        title="Total Pending Orders"
                        value={validOrders.length}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <InvoiceSummaryCard
                        title="Total Pending Invoice"
                        value={validOrders.reduce((sum, order) => sum + order.total_invoice, 0)}
                        isCurrency
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <InvoiceSummaryCard
                        title="Total Pending Profit"
                        value={validOrders.reduce((sum, order) => sum + order.profit, 0)}
                        isCurrency
                      />
                    </Grid>
                  </Grid>
                  
                  <Typography variant="h6" mb={2}>This Month's Summary</Typography>
                  <Grid container spacing={3} mb={4}>
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
              {validOrders && (
                <Box>
                  <OrdersTable orders={validOrders} exportOrderDetails={false}/>
                </Box>
              )}
            </>
          )}
        </>}
      </>
    </PageContainer>
  );
}

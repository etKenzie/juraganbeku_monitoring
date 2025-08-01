"use client";
import { formatCurrency } from "@/app/utils/formatNumber";
import { OrderData } from "@/store/apps/Invoice/invoiceSlice";
import {
    Box,
    Dialog,
    DialogContent,
    Grid,
    IconButton,
    MenuItem,
    Paper,
    Select,
    Stack,
    Tooltip,
    Typography,
    useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { IconDownload } from "@tabler/icons-react";
import dynamic from "next/dynamic";
import React from "react";
import DashboardCard from "../../shared/DashboardCard";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface NOOSegmentChartProps {
  data: OrderData[];
  storeSummaries?: { [key: string]: any };
}

type MetricKey =
  | "nooCount"
  | "totalMonthInvoice"
  | "totalOrders"
  | "averageInvoice"
  | "totalMonthProfit"
  | "averageProfit";

type SegmentType = "business_type" | "sub_business_type";

const NOOSegmentChart = ({ data, storeSummaries }: NOOSegmentChartProps) => {
  const theme = useTheme();
  const [selectedSegment, setSelectedSegment] = React.useState<{
    name: string;
    stores: OrderData[];
  } | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false);
  const [selectedMetric, setSelectedMetric] =
    React.useState<MetricKey>("nooCount");
  const [segmentType, setSegmentType] = React.useState<SegmentType>("business_type");

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Process data to get first orders per store and group by business type or sub business type
  const segmentData = React.useMemo(() => {
    // Find the most recent month
    const allMonths = data.map(order => {
      const [month, year] = order.month.split(' ');
      const monthIndex = new Date(`${month} 1, 2000`).getMonth();
      return {
        month: order.month,
        date: new Date(parseInt(year), monthIndex, 1)
      };
    });
    
    // Add safety check for empty data
    let mostRecentMonth = "";
    if (allMonths.length > 0) {
      mostRecentMonth = allMonths.sort((a, b) => b.date.getTime() - a.date.getTime())[0].month;
    }
    console.log('NOOSegmentChart most recent month:', mostRecentMonth);

    // First, get the first order date for each store
    const storeFirstOrders = data.reduce(
      (acc: Record<string, { month: string; order: OrderData }>, order) => {
        const storeId = order.user_id;
        const monthYear = order.month.toLowerCase();

        if (
          !acc[storeId] ||
          new Date(order.order_date) < new Date(acc[storeId].order.order_date)
        ) {
          acc[storeId] = { month: monthYear, order };
        }
        return acc;
      },
      {}
    );

    // Then, group by business type or sub business type and calculate metrics for most recent month only
    const segmentGroups = Object.values(storeFirstOrders).reduce(
      (
        acc: Record<
          string,
          {
            stores: OrderData[];
            totalMonthInvoice: number;
            totalOrders: number;
            totalMonthProfit: number;
          }
        >,
        { order }
      ) => {
        // Only include orders from the most recent month
        if (order.month !== mostRecentMonth) return acc;

        // Get the segment key based on segmentType
        const segmentKey = segmentType === "business_type" 
          ? (order.business_type || "OTHER")
          : (order.sub_business_type || "OTHER");

        if (!acc[segmentKey]) {
          acc[segmentKey] = {
            stores: [],
            totalMonthInvoice: 0,
            totalOrders: 0,
            totalMonthProfit: 0,
          };
        }
        acc[segmentKey].stores.push(order);
        
        // Calculate total month metrics using the same logic as NOOChart
        if (storeSummaries) {
          // Use storeSummaries if available
          const storeSummary = storeSummaries[order.user_id];
          if (storeSummary) {
            const storeOrders = storeSummary.orders.filter((storeOrder: OrderData) => 
              storeOrder.month.toLowerCase() === mostRecentMonth.toLowerCase()
            );
            // Calculate the store's total month invoice and profit
            const storeMonthInvoice = storeOrders.reduce((sum: number, storeOrder: OrderData) => 
              sum + (storeOrder.total_invoice || 0), 0
            );
            const storeMonthProfit = storeOrders.reduce((sum: number, storeOrder: OrderData) => 
              sum + (storeOrder.profit || 0), 0
            );
            acc[segmentKey].totalMonthInvoice += storeMonthInvoice;
            acc[segmentKey].totalMonthProfit += storeMonthProfit;
            acc[segmentKey].totalOrders += storeOrders.length;
          }
        } else {
          // Fallback to original calculation
          const storeOrders = data.filter(dataOrder => 
            dataOrder.user_id === order.user_id && 
            dataOrder.month.toLowerCase() === mostRecentMonth.toLowerCase()
          );
          acc[segmentKey].totalMonthInvoice += storeOrders.reduce((sum, storeOrder) => 
            sum + (storeOrder.total_invoice || 0), 0
          );
          acc[segmentKey].totalMonthProfit += storeOrders.reduce((sum, storeOrder) => 
            sum + (storeOrder.profit || 0), 0
          );
          acc[segmentKey].totalOrders += storeOrders.length;
        }
        
        return acc;
      },
      {}
    );

    return segmentGroups;
  }, [data, segmentType, storeSummaries]);

  const handleBarClick = (event: any, chartContext: any, config: any) => {
    const segmentName = segments[config.dataPointIndex];
    setSelectedSegment({ name: segmentName, stores: segmentData[segmentName].stores });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedSegment(null);
  };

  // Sort segments based on selected metric
  const sortedSegments = Object.entries(segmentData)
    .sort(([, a], [, b]) => {
      switch (selectedMetric) {
        case "nooCount":
          return b.stores.length - a.stores.length;
        case "totalMonthInvoice":
          return b.totalMonthInvoice - a.totalMonthInvoice;
        case "totalOrders":
          return b.totalOrders - a.totalOrders;
        case "averageInvoice":
          return (
            b.totalMonthInvoice / b.stores.length - a.totalMonthInvoice / a.stores.length
          );
        case "totalMonthProfit":
          return b.totalMonthProfit - a.totalMonthProfit;
        case "averageProfit":
          return (
            b.totalMonthProfit / b.stores.length - a.totalMonthProfit / a.stores.length
          );
        default:
          return 0;
      }
    })
    .map(([key]) => key);

  const segments = sortedSegments;
  const values = segments.map((segment) => {
    const data = segmentData[segment];
    switch (selectedMetric) {
      case "nooCount":
        return data.stores.length;
      case "totalMonthInvoice":
        return data.totalMonthInvoice;
      case "totalOrders":
        return data.totalOrders;
      case "averageInvoice":
        return data.totalMonthInvoice / data.stores.length;
      case "totalMonthProfit":
        return data.totalMonthProfit;
      case "averageProfit":
        return data.totalMonthProfit / data.stores.length;
      default:
        return 0;
    }
  });

  const isSmallScreen = useMediaQuery(theme.breakpoints.down("lg"));

  const getMetricLabel = (metric: MetricKey) => {
    switch (metric) {
      case "nooCount":
        return "NOO Count";
      case "totalMonthInvoice":
        return "Total Month Invoice";
      case "totalOrders":
        return "Total Orders";
      case "averageInvoice":
        return "Average Invoice";
      case "totalMonthProfit":
        return "Total Month Profit";
      case "averageProfit":
        return "Average Profit";
      default:
        return "";
    }
  };

  const optionscolumnchart: any = {
    chart: {
      id: "noo-segment-chart",
      type: "bar",
      fontFamily: "'Plus Jakarta Sans', sans-serif;",
      foreColor: theme.palette.mode === "dark" ? "#adb0bb" : "#111",
      toolbar: {
        show: false,
      },
      height: 280,
      events: {
        dataPointSelection: handleBarClick,
      },
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: "45%",
        distributed: true,
        endingShape: "rounded",
        cursor: "pointer",
      },
    },
    colors: [theme.palette.success.main],
    dataLabels: {
      enabled: true,
      formatter: (val: number) => {
        if (
          selectedMetric === "totalMonthInvoice" ||
          selectedMetric === "averageInvoice" ||
          selectedMetric === "totalMonthProfit" ||
          selectedMetric === "averageProfit"
        ) {
          return formatCurrency(val);
        }
        return val;
      },
      style: {
        fontSize: "12px",
        colors: [theme.palette.mode === "dark" ? "#fff" : "#111"],
      },
    },
    legend: {
      show: false,
    },
    grid: {
      show: false,
    },
    xaxis: {
      categories: segments,
      labels: {
        show: !isSmallScreen,
        style: {
          fontSize: "12px",
          colors: theme.palette.mode === "dark" ? "#adb0bb" : "#111",
        },
      },
    },
    yaxis: {
      labels: {
        formatter: (val: number) => {
          if (
            selectedMetric === "totalMonthInvoice" ||
            selectedMetric === "averageInvoice" ||
            selectedMetric === "totalMonthProfit" ||
            selectedMetric === "averageProfit"
          ) {
            return formatCurrency(val);
          }
          return val;
        },
        style: {
          colors: theme.palette.mode === "dark" ? "#adb0bb" : "#111",
        },
      },
    },
    tooltip: {
      theme: theme.palette.mode,
      style: {
        fontSize: "12px",
      },
      y: {
        formatter: (val: number) => {
          if (
            selectedMetric === "totalMonthInvoice" ||
            selectedMetric === "averageInvoice" ||
            selectedMetric === "totalMonthProfit" ||
            selectedMetric === "averageProfit"
          ) {
            return formatCurrency(val);
          }
          return val;
        },
      },
    },
  };

  const seriescolumnchart = [
    {
      name: getMetricLabel(selectedMetric),
      data: values,
    },
  ];

  const handleDownload = async () => {
    if (!isClient) return;

    const ApexCharts = (await import("apexcharts")).default;

    ApexCharts.exec("noo-segment-chart", "updateOptions", {
      title: {
        text: `New Ordering Outlets by ${segmentType === "business_type" ? "Business Type" : "Sub Business Type"} - ${getMetricLabel(
          selectedMetric
        )}`,
        align: "center",
        style: {
          fontSize: "16px",
          fontWeight: 600,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          color: theme.palette.mode === "dark" ? "#fff" : "#111",
        },
      },
    }).then(() => {
      ApexCharts.exec("noo-segment-chart", "dataURI").then(
        (response: { imgURI: string }) => {
          ApexCharts.exec("noo-segment-chart", "updateOptions", {
            title: { text: undefined },
          });

          const downloadLink = document.createElement("a");
          downloadLink.href = response.imgURI;
          downloadLink.download = `NOO_Segment_Distribution_${getMetricLabel(
            selectedMetric
          )}_${new Date().toLocaleDateString()}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }
      );
    });
  };

  return (
    <>
      <DashboardCard
        title="New Ordering Outlets by Segment"
        action={
          <Box display="flex" alignItems="center" gap={2}>
            <Tooltip title="Download Chart">
              <IconButton onClick={handleDownload} size="small">
                <IconDownload size={20} />
              </IconButton>
            </Tooltip>
            <Select
              value={segmentType}
              onChange={(e) => setSegmentType(e.target.value as SegmentType)}
              size="small"
              sx={{ minWidth: '150px' }}
            >
              <MenuItem value="business_type">Business Type</MenuItem>
              <MenuItem value="sub_business_type">Sub Business Type</MenuItem>
            </Select>
            <Select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as MetricKey)}
              size="small"
            >
              <MenuItem value="nooCount">NOO Count</MenuItem>
              <MenuItem value="totalMonthInvoice">Total Month Invoice</MenuItem>
              <MenuItem value="totalOrders">Total Orders</MenuItem>
              <MenuItem value="averageInvoice">Average Invoice</MenuItem>
              <MenuItem value="totalMonthProfit">Total Month Profit</MenuItem>
              <MenuItem value="averageProfit">Average Profit</MenuItem>
            </Select>
          </Box>
        }
      >
        <Box height="300px">
          <Chart
            options={optionscolumnchart}
            series={seriescolumnchart}
            type="bar"
            height={280}
            width={"100%"}
          />
        </Box>
      </DashboardCard>

      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          {selectedSegment && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedSegment.name} - New Stores Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1">
                      New Stores ({selectedSegment.stores.length})
                    </Typography>
                    <Stack spacing={2} mt={2}>
                      {/* Group stores by area */}
                      {Object.entries(
                        selectedSegment.stores.reduce(
                          (acc: Record<string, OrderData[]>, store) => {
                            const area = store.area || "Unknown";
                            if (!acc[area]) {
                              acc[area] = [];
                            }
                            acc[area].push(store);
                            return acc;
                          },
                          {}
                        )
                      ).map(([area, stores]) => (
                        <Box key={area}>
                          <Typography
                            variant="subtitle2"
                            color="primary"
                            gutterBottom
                          >
                            {area} ({stores.length} stores)
                          </Typography>
                          <Stack spacing={1}>
                            {stores.map((store) => (
                              <Box key={store.order_id} sx={{ pl: 2 }}>
                                <Typography variant="body2">
                                  {store.store_name} -{" "}
                                  {new Date(
                                    store.order_date
                                  ).toLocaleDateString()}
                                </Typography>
                              </Box>
                            ))}
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NOOSegmentChart; 
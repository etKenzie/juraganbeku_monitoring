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

interface NOOAreaChartProps {
  data: OrderData[];
}

type MetricKey =
  | "totalInvoice"
  | "totalOrders"
  | "averageInvoice"
  | "totalProfit"
  | "averageProfit";

const NOOAreaChart = ({ data }: NOOAreaChartProps) => {
  const theme = useTheme();
  const [selectedArea, setSelectedArea] = React.useState<{
    name: string;
    stores: OrderData[];
  } | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false);
  const [selectedMetric, setSelectedMetric] =
    React.useState<MetricKey>("totalOrders");

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Process data to get first orders per store and group by area
  const areaData = React.useMemo(() => {
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
    console.log('NOOAreaChart most recent month:', mostRecentMonth);

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

    // Then, group by area and calculate metrics for most recent month only
    const areaGroups = Object.values(storeFirstOrders).reduce(
      (
        acc: Record<
          string,
          {
            stores: OrderData[];
            totalInvoice: number;
            totalOrders: number;
            totalProfit: number;
          }
        >,
        { order }
      ) => {
        // Only include orders from the most recent month
        if (order.month !== mostRecentMonth) return acc;

        const area = order.area || "Unknown";
        if (!acc[area]) {
          acc[area] = {
            stores: [],
            totalInvoice: 0,
            totalOrders: 0,
            totalProfit: 0,
          };
        }
        acc[area].stores.push(order);
        acc[area].totalInvoice += order.total_invoice;
        acc[area].totalOrders += 1;
        acc[area].totalProfit += order.profit || 0;
        return acc;
      },
      {}
    );

    return areaGroups;
  }, [data]);

  const handleBarClick = (event: any, chartContext: any, config: any) => {
    const areaName = areas[config.dataPointIndex];
    setSelectedArea({ name: areaName, stores: areaData[areaName].stores });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedArea(null);
  };

  // Sort areas based on selected metric
  const sortedAreas = Object.entries(areaData)
    .sort(([, a], [, b]) => {
      switch (selectedMetric) {
        case "totalInvoice":
          return b.totalInvoice - a.totalInvoice;
        case "totalOrders":
          return b.totalOrders - a.totalOrders;
        case "averageInvoice":
          return (
            b.totalInvoice / b.stores.length - a.totalInvoice / a.stores.length
          );
        case "totalProfit":
          return b.totalProfit - a.totalProfit;
        case "averageProfit":
          return (
            b.totalProfit / b.stores.length - a.totalProfit / a.stores.length
          );
        default:
          return 0;
      }
    })
    .map(([key]) => key);

  const areas = sortedAreas;
  const values = areas.map((area) => {
    const data = areaData[area];
    switch (selectedMetric) {
      case "totalInvoice":
        return data.totalInvoice;
      case "totalOrders":
        return data.totalOrders;
      case "averageInvoice":
        return data.totalInvoice / data.stores.length;
      case "totalProfit":
        return data.totalProfit;
      case "averageProfit":
        return data.totalProfit / data.stores.length;
      default:
        return 0;
    }
  });

  const isSmallScreen = useMediaQuery(theme.breakpoints.down("lg"));

  const getMetricLabel = (metric: MetricKey) => {
    switch (metric) {
      case "totalInvoice":
        return "Total Invoice";
      case "totalOrders":
        return "Total Orders";
      case "averageInvoice":
        return "Average Invoice";
      case "totalProfit":
        return "Total Profit";
      case "averageProfit":
        return "Average Profit";
      default:
        return "";
    }
  };

  const optionscolumnchart: any = {
    chart: {
      id: "noo-area-chart",
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
    colors: [theme.palette.primary.main],
    dataLabels: {
      enabled: true,
      formatter: (val: number) => {
        if (
          selectedMetric === "totalInvoice" ||
          selectedMetric === "averageInvoice" ||
          selectedMetric === "totalProfit" ||
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
      categories: areas,
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
            selectedMetric === "totalInvoice" ||
            selectedMetric === "averageInvoice" ||
            selectedMetric === "totalProfit" ||
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
            selectedMetric === "totalInvoice" ||
            selectedMetric === "averageInvoice" ||
            selectedMetric === "totalProfit" ||
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

    ApexCharts.exec("noo-area-chart", "updateOptions", {
      title: {
        text: `New Ordering Outlets by Area - ${getMetricLabel(
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
      ApexCharts.exec("noo-area-chart", "dataURI").then(
        (response: { imgURI: string }) => {
          ApexCharts.exec("noo-area-chart", "updateOptions", {
            title: { text: undefined },
          });

          const downloadLink = document.createElement("a");
          downloadLink.href = response.imgURI;
          downloadLink.download = `NOO_Area_Distribution_${getMetricLabel(
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
        title="New Ordering Outlets by Area"
        action={
          <Box display="flex" alignItems="center" gap={2}>
            <Tooltip title="Download Chart">
              <IconButton onClick={handleDownload} size="small">
                <IconDownload size={20} />
              </IconButton>
            </Tooltip>
            <Select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as MetricKey)}
              size="small"
            >
              <MenuItem value="totalInvoice">Total Invoice</MenuItem>
              <MenuItem value="totalOrders">Total Orders</MenuItem>
              <MenuItem value="averageInvoice">Average Invoice</MenuItem>
              <MenuItem value="totalProfit">Total Profit</MenuItem>
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
          {selectedArea && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedArea.name} - New Stores Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1">
                      New Stores ({selectedArea.stores.length})
                    </Typography>
                    <Stack spacing={2} mt={2}>
                      {/* Group stores by segment */}
                      {Object.entries(
                        selectedArea.stores.reduce(
                          (acc: Record<string, OrderData[]>, store) => {
                            const businessType = store.business_type || "OTHER";
                            if (!acc[businessType]) {
                              acc[businessType] = [];
                            }
                            acc[businessType].push(store);
                            return acc;
                          },
                          {}
                        )
                      ).map(([businessType, stores]) => (
                        <Box key={businessType}>
                          <Typography
                            variant="subtitle2"
                            color="primary"
                            gutterBottom
                          >
                            {businessType} ({stores.length} stores)
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

export default NOOAreaChart;

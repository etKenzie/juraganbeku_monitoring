"use client";
import { AreaData } from "@/app/(DashboardLayout)/distribusi/sales/types";
import { formatCurrency } from "@/app/utils/formatNumber";
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
  useMediaQuery
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { IconDownload } from "@tabler/icons-react";
import dynamic from "next/dynamic";
import React from "react";
import DashboardCard from "../../shared/DashboardCard";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface AreaChartProps {
  isLoading?: boolean;
  areaData: Record<string, AreaData>;
  selectedMonths: string;
}

type SortKey = "totalInvoice" | "totalProfit" | "totalOrders" | "totalCOD" | "totalTOP" | "averageInvoice" | "averageProfit" | "margin";

const AreaChart = ({
  isLoading,
  areaData,
  selectedMonths,
}: AreaChartProps) => {
  const theme = useTheme();
  const [selectedArea, setSelectedArea] = React.useState<AreaData | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [sortKey, setSortKey] = React.useState<SortKey>("totalInvoice");
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const handleBarClick = (event: any, chartContext: any, config: any) => {
    const areaName = areas[config.dataPointIndex];
    const areaDetails = areaData[areaName];
    setSelectedArea(areaDetails);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedArea(null);
  };

  // Sort areas based on selected key
  const sortedAreas = Object.entries(areaData)
    .sort(([, a], [, b]) => {
      switch (sortKey) {
        case "totalInvoice":
          return b.totalInvoice - a.totalInvoice;
        case "totalProfit":
          return b.totalProfit - a.totalProfit;
        case "totalOrders":
          return b.totalOrders - a.totalOrders;
        case "totalCOD":
          return b.totalCOD - a.totalCOD;
        case "totalTOP":
          return b.totalTOP - a.totalTOP;
        case "averageInvoice":
          return (b.totalInvoice / b.totalOrders) - (a.totalInvoice / a.totalOrders);
        case "averageProfit":
          return (b.totalProfit / b.totalOrders) - (a.totalProfit / a.totalOrders);
        case "margin":
          return (b.totalProfit / b.totalInvoice) - (a.totalProfit / a.totalInvoice);
        default:
          return 0;
      }
    })
    .map(([key]) => key);

  const areas = sortedAreas;
  const values = areas.map((area) => {
    const data = areaData[area];
    switch (sortKey) {
      case "totalInvoice":
        return data.totalInvoice;
      case "totalProfit":
        return data.totalProfit;
      case "totalOrders":
        return data.totalOrders;
      case "totalCOD":
        return data.totalCOD;
      case "totalTOP":
        return data.totalTOP;
      case "averageInvoice":
        return data.totalInvoice / data.totalOrders;
      case "averageProfit":
        return data.totalProfit / data.totalOrders;
      case "margin":
        return data.totalInvoice > 0 ? (data.totalProfit / data.totalInvoice) * 100 : 0;
      default:
        return 0;
    }
  });

  const isSmallScreen = useMediaQuery(theme.breakpoints.down("lg"));

  const getMetricLabel = (metric: SortKey) => {
    switch (metric) {
      case "totalInvoice":
        return "Total Invoice";
      case "totalProfit":
        return "Total Profit";
      case "totalOrders":
        return "Total Orders";
      case "totalCOD":
        return "Total COD";
      case "totalTOP":
        return "Total TOP";
      case "averageInvoice":
        return "Average Invoice";
      case "averageProfit":
        return "Average Profit";
      case "margin":
        return "Margin %";
      default:
        return "";
    }
  };

  const optionscolumnchart: any = {
    chart: {
      id: "area-performance-chart",
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
      formatter: (val: number) => {
        if (sortKey === "margin") {
          return val.toFixed(1) + '%';
        }
        if (sortKey === "totalInvoice" || sortKey === "totalProfit" || 
            sortKey === "totalCOD" || sortKey === "totalTOP" ||
            sortKey === "averageInvoice" || sortKey === "averageProfit") {
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
          if (sortKey === "margin") {
            return val.toFixed(1) + '%';
          }
          if (sortKey === "totalInvoice" || sortKey === "totalProfit" || 
              sortKey === "totalCOD" || sortKey === "totalTOP" ||
              sortKey === "averageInvoice" || sortKey === "averageProfit") {
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
          if (sortKey === "margin") {
            return val.toFixed(1) + '%';
          }
          if (sortKey === "totalInvoice" || sortKey === "totalProfit" || 
              sortKey === "totalCOD" || sortKey === "totalTOP" ||
              sortKey === "averageInvoice" || sortKey === "averageProfit") {
            return formatCurrency(val);
          }
          return val;
        },
      },
    },
  };

  const seriescolumnchart = [
    {
      name: getMetricLabel(sortKey),
      data: values,
    },
  ];

  const handleDownload = async () => {
    if (!isClient) return;

    const ApexCharts = (await import("apexcharts")).default;
    const dateRange = `for ${selectedMonths}`;

    ApexCharts.exec("area-performance-chart", "updateOptions", {
      title: {
        text: ["Area Performance", dateRange],
        align: "center",
        style: {
          fontSize: "16px",
          fontWeight: 600,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          color: theme.palette.mode === "dark" ? "#fff" : "#111",
        },
      },
    }).then(() => {
      ApexCharts.exec("area-performance-chart", "dataURI").then(
        (response: { imgURI: string }) => {
          ApexCharts.exec("area-performance-chart", "updateOptions", {
            title: { text: undefined },
          });

          const downloadLink = document.createElement("a");
          downloadLink.href = response.imgURI;
          downloadLink.download = `Area_Performance_${new Date().toLocaleDateString()}.png`;
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
        title="Area Performance"
        action={
          <Box display="flex" alignItems="center" gap={2}>
            <Tooltip title="Download Chart">
              <IconButton onClick={handleDownload} size="small">
                <IconDownload size={20} />
              </IconButton>
            </Tooltip>
            <Select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              size="small"
            >
              <MenuItem value="totalInvoice">Total Invoice</MenuItem>
              <MenuItem value="totalProfit">Total Profit</MenuItem>
              <MenuItem value="totalOrders">Total Orders</MenuItem>
              <MenuItem value="totalCOD">Total COD</MenuItem>
              <MenuItem value="totalTOP">Total TOP</MenuItem>
              <MenuItem value="averageInvoice">Average Invoice</MenuItem>
              <MenuItem value="averageProfit">Average Profit</MenuItem>
              <MenuItem value="margin">Margin %</MenuItem>
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
                {selectedArea.name} - Area Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1">Summary</Typography>
                    <Stack spacing={1} mt={1}>
                      <Typography>Total Orders: {selectedArea.totalOrders}</Typography>
                      <Typography>Total Invoice: {formatCurrency(selectedArea.totalInvoice)}</Typography>
                      <Typography>Total Profit: {formatCurrency(selectedArea.totalProfit)}</Typography>
                      <Typography>Average Invoice: {formatCurrency(selectedArea.totalInvoice / selectedArea.totalOrders)}</Typography>
                      <Typography>Average Profit: {formatCurrency(selectedArea.totalProfit / selectedArea.totalOrders)}</Typography>
                    </Stack>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1">Payment Details</Typography>
                    <Stack spacing={1} mt={1}>
                      <Typography>Total COD: {formatCurrency(selectedArea.totalCOD)}</Typography>
                      <Typography>Total TOP: {formatCurrency(selectedArea.totalTOP)}</Typography>
                      <Typography>Total Lunas: {formatCurrency(selectedArea.totalLunas)}</Typography>
                      <Typography>Total Belum Lunas: {formatCurrency(selectedArea.totalBelumLunas)}</Typography>
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

export default AreaChart; 
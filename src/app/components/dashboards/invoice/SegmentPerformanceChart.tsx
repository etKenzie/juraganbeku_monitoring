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

interface SegmentPerformanceChartProps {
  isLoading?: boolean;
  segmentData: Record<string, AreaData>;
  selectedMonths: string;
  subBusinessTypeData: Record<string, AreaData>;
  monthlySegmentData?: { [month: string]: Record<string, AreaData> };
  monthlySubBusinessTypeData?: { [month: string]: Record<string, AreaData> };
}

type SortKey = "totalInvoice" | "totalProfit" | "totalOrders" | "totalCOD" | "totalTOP" | "averageInvoice" | "averageProfit" | "margin";
type SegmentType = "business_type" | "sub_business_type";

const SegmentPerformanceChart = ({
  isLoading,
  segmentData,
  selectedMonths,
  subBusinessTypeData,
  monthlySegmentData,
  monthlySubBusinessTypeData,
}: SegmentPerformanceChartProps) => {
  const theme = useTheme();
  const [selectedSegment, setSelectedSegment] = React.useState<AreaData | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [sortKey, setSortKey] = React.useState<SortKey>("totalInvoice");
  const [segmentType, setSegmentType] = React.useState<SegmentType>("business_type");
  const [selectedMonth, setSelectedMonth] = React.useState<string>("");
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Get available months for selection
  const availableMonths = React.useMemo(() => {
    if (monthlySegmentData) {
      return Object.keys(monthlySegmentData).sort((a, b) => {
        const [monthA, yearA] = a.split(" ");
        const [monthB, yearB] = b.split(" ");
        const dateA = new Date(`${monthA} 1, ${yearA}`);
        const dateB = new Date(`${monthB} 1, ${yearB}`);
        return dateB.getTime() - dateA.getTime(); // Sort descending (most recent first)
      });
    }
    return [];
  }, [monthlySegmentData]);

  // Set default selected month to most recent
  React.useEffect(() => {
    if (availableMonths.length > 0 && !selectedMonth) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths, selectedMonth]);

  // Get current data based on selected month or overall data
  const getCurrentSegmentData = () => {
    if (selectedMonth && selectedMonth !== "" && monthlySegmentData && monthlySegmentData[selectedMonth]) {
      return monthlySegmentData[selectedMonth];
    }
    return segmentData;
  };

  const getCurrentSubBusinessTypeData = () => {
    if (selectedMonth && selectedMonth !== "" && monthlySubBusinessTypeData && monthlySubBusinessTypeData[selectedMonth]) {
      return monthlySubBusinessTypeData[selectedMonth];
    }
    return subBusinessTypeData;
  };

  const handleBarClick = (event: any, chartContext: any, config: any) => {
    const segmentName = segments[config.dataPointIndex];
    const currentData = getCurrentSegmentData();
    const segmentDetails = currentData[segmentName];
    setSelectedSegment(segmentDetails);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedSegment(null);
  };

  // Get the appropriate data based on segment type
  const currentSegmentData = segmentType === "business_type" ? getCurrentSegmentData() : getCurrentSubBusinessTypeData();

  // Sort segments based on selected key
  const sortedSegments = Object.entries(currentSegmentData || {})
    .sort(([, a], [, b]) => {
      if (!a || !b) return 0;
      
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

  const segments = sortedSegments;
  const values = segments.map((segment) => {
    const data = currentSegmentData?.[segment];
    if (!data) return 0;

    switch (sortKey) {
      case "totalInvoice":
        return data.totalInvoice || 0;
      case "totalProfit":
        return data.totalProfit || 0;
      case "totalOrders":
        return data.totalOrders || 0;
      case "totalCOD":
        return data.totalCOD || 0;
      case "totalTOP":
        return data.totalTOP || 0;
      case "averageInvoice":
        return data.totalOrders ? (data.totalInvoice || 0) / data.totalOrders : 0;
      case "averageProfit":
        return data.totalOrders ? (data.totalProfit || 0) / data.totalOrders : 0;
      case "margin":
        return data.totalInvoice && data.totalInvoice > 0 ? ((data.totalProfit || 0) / data.totalInvoice) * 100 : 0;
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
      id: "segment-performance-chart",
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
    title: {
      // text: selectedMonth ? `Segment Performance - ${selectedMonth}` : "Segment Performance - All Months",
      align: "center",
      style: {
        fontSize: "16px",
        fontWeight: 600,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        color: theme.palette.mode === "dark" ? "#fff" : "#111",
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
    colors: [theme.palette.secondary.main],
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

    ApexCharts.exec("segment-performance-chart", "updateOptions", {
      title: {
        text: ["Segment Performance", dateRange],
        align: "center",
        style: {
          fontSize: "16px",
          fontWeight: 600,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          color: theme.palette.mode === "dark" ? "#fff" : "#111",
        },
      },
    }).then(() => {
      ApexCharts.exec("segment-performance-chart", "dataURI").then(
        (response: { imgURI: string }) => {
          ApexCharts.exec("segment-performance-chart", "updateOptions", {
            title: { text: undefined },
          });

          const downloadLink = document.createElement("a");
          downloadLink.href = response.imgURI;
          downloadLink.download = `Segment_Performance_${new Date().toLocaleDateString()}.png`;
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
        title="Segment Performance"
        action={
          <Box display="flex" alignItems="center" gap={2}>
            <Tooltip title="Download Chart">
              <IconButton onClick={handleDownload} size="small">
                <IconDownload size={20} />
              </IconButton>
            </Tooltip>
            {availableMonths.length > 0 && (
              <Select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                size="small"
                sx={{ minWidth: '120px' }}
              >
                <MenuItem value="">All Months</MenuItem>
                {availableMonths.map((month) => (
                  <MenuItem key={month} value={month}>
                    {month}
                  </MenuItem>
                ))}
              </Select>
            )}
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
          {selectedSegment && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedSegment.name} - Segment Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1">Summary</Typography>
                    <Stack spacing={1} mt={1}>
                      <Typography>Total Orders: {selectedSegment.totalOrders}</Typography>
                      <Typography>Total Invoice: {formatCurrency(selectedSegment.totalInvoice)}</Typography>
                      <Typography>Total Profit: {formatCurrency(selectedSegment.totalProfit)}</Typography>
                      <Typography>Average Invoice: {formatCurrency(selectedSegment.totalInvoice / selectedSegment.totalOrders)}</Typography>
                      <Typography>Average Profit: {formatCurrency(selectedSegment.totalProfit / selectedSegment.totalOrders)}</Typography>
                    </Stack>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1">Payment Details</Typography>
                    <Stack spacing={1} mt={1}>
                      <Typography>Total COD: {formatCurrency(selectedSegment.totalCOD)}</Typography>
                      <Typography>Total TOP: {formatCurrency(selectedSegment.totalTOP)}</Typography>
                      <Typography>Total Lunas: {formatCurrency(selectedSegment.totalLunas)}</Typography>
                      <Typography>Total Belum Lunas: {formatCurrency(selectedSegment.totalBelumLunas)}</Typography>
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

export default SegmentPerformanceChart; 
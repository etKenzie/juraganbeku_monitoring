"use client";
import { AreaData } from "@/app/(DashboardLayout)/dashboards/Invoice/types";
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
  startDate: string;
  endDate: string;
}

type SortKey = "totalInvoice" | "totalProfit" | "totalOrders" | "totalCOD" | "totalTOP";

const AreaChart = ({
  isLoading,
  areaData,
  startDate,
  endDate,
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
    .sort(([, a], [, b]) => b[sortKey] - a[sortKey])
    .map(([key]) => key);

  const areas = sortedAreas;
  const values = areas.map((area) => areaData[area][sortKey]);

  const isSmallScreen = useMediaQuery(theme.breakpoints.down("lg"));

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
      formatter: (val: number) => formatCurrency(val),
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
        formatter: (val: number) => formatCurrency(val),
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
        formatter: (val: number) => formatCurrency(val),
      },
    },
  };

  const seriescolumnchart = [
    {
      name: "Value",
      data: values,
    },
  ];

  const handleDownload = async () => {
    if (!isClient) return;

    const ApexCharts = (await import("apexcharts")).default;
    const dateRange = `from ${startDate} to ${endDate}`;

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
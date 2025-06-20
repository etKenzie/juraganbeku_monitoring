"use client";
import { AreaData } from "@/app/(DashboardLayout)/dashboards/Invoice/types";
import { formatCurrency } from "@/app/utils/formatNumber";
import {
  Box,
  Dialog,
  DialogContent,
  IconButton,
  MenuItem,
  Select,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { IconDownload } from "@tabler/icons-react";
import dynamic from "next/dynamic";
import React from "react";
import DashboardCard from "../../shared/DashboardCard";
import AreaChart from "../invoice/AreaChart";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface DueDateStatusData {
  status: string;
  totalOrders: number;
  totalInvoice: number;
  totalProfit: number;
  areaData?: Record<string, AreaData>;
}

interface DueDateStatusBarChartProps {
  data: DueDateStatusData[];
}

type MetricType = "totalOrders" | "totalInvoice" | "totalProfit";

const DueDateStatusBarChart = ({ data }: DueDateStatusBarChartProps) => {
  console.log(data);
  const theme = useTheme();
  const [metricType, setMetricType] = React.useState<MetricType>("totalOrders");
  const [isClient, setIsClient] = React.useState(false);
  const [selectedStatus, setSelectedStatus] = React.useState<DueDateStatusData | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const chartId = React.useMemo(
    () => `due-date-status-chart-${Math.random().toString(36).substr(2, 9)}`,
    []
  );

  const getMetricLabel = (type: MetricType) => {
    switch (type) {
      case "totalOrders":
        return "Total Orders";
      case "totalInvoice":
        return "Total Invoice";
      case "totalProfit":
        return "Total Profit";
    }
  };

  const getMetricValue = (item: DueDateStatusData) => {
    switch (metricType) {
      case "totalOrders":
        return item.totalOrders;
      case "totalInvoice":
        return item.totalInvoice;
      case "totalProfit":
        return item.totalProfit;
    }
  };

  const getMetricFormatter = (type: MetricType) => {
    switch (type) {
      case "totalOrders":
        return (val: number) => val.toLocaleString();
      case "totalInvoice":
      case "totalProfit":
        return (val: number) => formatCurrency(val);
      default:
        return (val: number) => val.toLocaleString();
    }
  };

  const series = [{
    name: getMetricLabel(metricType),
    data: data.map(item => getMetricValue(item))
  }];

  const options: any = {
    chart: {
      id: chartId,
      type: "bar",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      foreColor: theme.palette.mode === "dark" ? "#adb0bb" : "#111",
      toolbar: {
        show: false,
      },
      events: {
        dataPointSelection: (event: any, chartContext: any, config: any) => {
          const selectedData = data[config.dataPointIndex];
          console.log(selectedData);
          setSelectedStatus(selectedData);
          setModalOpen(true);
        }
      }
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: false,
        distributed: true,
        columnWidth: '55%',
      }
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => {
        return getMetricFormatter(metricType)(val);
      },
      style: {
        fontSize: "14px",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        colors: [theme.palette.mode === "dark" ? "#fff" : "#111"],
      },
    },
    legend: {
      show: false
    },
    colors: [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.error.main,
      theme.palette.warning.main,
      theme.palette.info.main,
      theme.palette.success.main
    ],
    xaxis: {
      categories: data.map(item => item.status),
      labels: {
        style: {
          fontSize: "14px",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        },
      },
    },
    yaxis: {
      labels: {
        formatter: (val: number) => {
          return getMetricFormatter(metricType)(val);
        },
        style: {
          colors: theme.palette.mode === "dark" ? "#adb0bb" : "#111",
          fontSize: "14px",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        },
      },
    },
    tooltip: {
      theme: theme.palette.mode,
      y: {
        formatter: (val: number) => {
          return getMetricFormatter(metricType)(val);
        },
      },
    },
  };

  const handleDownload = async () => {
    if (!isClient) return;

    const ApexCharts = (await import("apexcharts")).default;
    const metricLabel = getMetricLabel(metricType);

    ApexCharts.exec(chartId, "updateOptions", {
      title: {
        text: ["Due Date Status Distribution", metricLabel],
        align: "center",
        style: {
          fontSize: "16px",
          fontWeight: 600,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          color: theme.palette.mode === "dark" ? "#fff" : "#111",
        },
      },
    }).then(() => {
      ApexCharts.exec(chartId, "dataURI").then((response: { imgURI: string }) => {
        ApexCharts.exec(chartId, "updateOptions", {
          title: { text: undefined },
        });

        const downloadLink = document.createElement("a");
        downloadLink.href = response.imgURI;
        downloadLink.download = `Due_Date_Status_Distribution_${metricLabel}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      });
    });
  };

  return (
    <>
      <DashboardCard
        title="Due Date Status Distribution"
        action={
          <Box display="flex" alignItems="center" gap={2}>
            <Tooltip title="Download Chart">
              <IconButton onClick={handleDownload} size="small">
                <IconDownload size={20} />
              </IconButton>
            </Tooltip>
            <Select
              value={metricType}
              onChange={(e) => setMetricType(e.target.value as MetricType)}
              size="small"
            >
              <MenuItem value="totalOrders">Total Orders</MenuItem>
              <MenuItem value="totalInvoice">Total Invoice</MenuItem>
              <MenuItem value="totalProfit">Total Profit</MenuItem>
            </Select>
          </Box>
        }
      >
        <Box height="400px">
          {isClient && (
            <Chart
              options={options}
              series={series}
              type="bar"
              height={350}
              width="100%"
            />
          )}
        </Box>
      </DashboardCard>

      <Dialog 
        open={modalOpen} 
        onClose={() => setModalOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent>
          {selectedStatus?.areaData && (
            <AreaChart
              areaData={selectedStatus.areaData}
              selectedMonths={selectedStatus.status}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DueDateStatusBarChart; 
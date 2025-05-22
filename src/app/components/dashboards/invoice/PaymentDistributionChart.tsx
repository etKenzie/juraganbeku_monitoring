"use client";
import { formatCurrency } from "@/app/utils/formatNumber";
import {
  Box,
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

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface PaymentStatusData {
  status: string;
  totalOrders: number;
  totalInvoice: number;
  totalProfit: number;
}

interface PaymentDistributionChartProps {
  data: PaymentStatusData[];
}

type SortKey = "totalOrders" | "totalInvoice" | "totalProfit" | "averageInvoice" | "averageProfit";

const PaymentDistributionChart = ({ data }: PaymentDistributionChartProps) => {
  const theme = useTheme();
  const [sortKey, setSortKey] = React.useState<SortKey>("totalOrders");
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const chartId = React.useMemo(
    () => `payment-distribution-chart-${Math.random().toString(36).substr(2, 9)}`,
    []
  );

  const getMetricLabel = (metric: SortKey) => {
    switch (metric) {
      case "totalOrders":
        return "Total Orders";
      case "totalInvoice":
        return "Total Invoice";
      case "totalProfit":
        return "Total Profit";
      case "averageInvoice":
        return "Average Invoice";
      case "averageProfit":
        return "Average Profit";
      default:
        return "";
    }
  };

  const getMetricFormatter = (metric: SortKey) => {
    switch (metric) {
      case "totalOrders":
        return (val: number) => val.toString();
      case "totalInvoice":
      case "totalProfit":
      case "averageInvoice":
      case "averageProfit":
        return (val: number) => formatCurrency(val);
      default:
        return (val: number) => val.toString();
    }
  };

  // Sort data based on selected key
  const sortedData = [...data].sort((a, b) => {
    switch (sortKey) {
      case "totalOrders":
        return b.totalOrders - a.totalOrders;
      case "totalInvoice":
        return b.totalInvoice - a.totalInvoice;
      case "totalProfit":
        return b.totalProfit - a.totalProfit;
      case "averageInvoice":
        return (b.totalInvoice / b.totalOrders) - (a.totalInvoice / a.totalOrders);
      case "averageProfit":
        return (b.totalProfit / b.totalOrders) - (a.totalProfit / a.totalOrders);
      default:
        return 0;
    }
  });

  const statuses = sortedData.map(item => item.status);
  const values = sortedData.map(item => {
    switch (sortKey) {
      case "totalOrders":
        return item.totalOrders;
      case "totalInvoice":
        return item.totalInvoice;
      case "totalProfit":
        return item.totalProfit;
      case "averageInvoice":
        return item.totalInvoice / item.totalOrders;
      case "averageProfit":
        return item.totalProfit / item.totalOrders;
      default:
        return 0;
    }
  });

  const options: any = {
    chart: {
      id: chartId,
      type: "bar",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      foreColor: theme.palette.mode === "dark" ? "#adb0bb" : "#111",
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: false,
        distributed: true,
        columnWidth: '55%',
      }
    },
    colors: [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.error.main,
      theme.palette.warning.main,
      theme.palette.info.main,
      theme.palette.success.main
    ],
    dataLabels: {
      enabled: true,
      formatter: (val: number) => getMetricFormatter(sortKey)(val),
      style: {
        fontSize: "14px",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        colors: [theme.palette.mode === "dark" ? "#fff" : "#111"],
      },
    },
    legend: {
      show: false
    },
    xaxis: {
      categories: statuses,
      labels: {
        style: {
          fontSize: "14px",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          colors: theme.palette.mode === "dark" ? "#adb0bb" : "#111",
        },
      },
    },
    yaxis: {
      labels: {
        formatter: (val: number) => getMetricFormatter(sortKey)(val),
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
        formatter: (val: number) => getMetricFormatter(sortKey)(val),
      },
    },
  };

  const series = [{
    name: getMetricLabel(sortKey),
    data: values
  }];

  const handleDownload = async () => {
    if (!isClient) return;

    const ApexCharts = (await import("apexcharts")).default;
    const metricLabel = getMetricLabel(sortKey);

    ApexCharts.exec(chartId, "updateOptions", {
      title: {
        text: ["Payment Status Distribution", metricLabel],
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
        downloadLink.download = `Payment_Status_Distribution_${metricLabel}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      });
    });
  };

  return (
    <DashboardCard
      title="Payment Status Distribution"
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
            <MenuItem value="totalOrders">Total Orders</MenuItem>
            <MenuItem value="totalInvoice">Total Invoice</MenuItem>
            <MenuItem value="totalProfit">Total Profit</MenuItem>
            <MenuItem value="averageInvoice">Average Invoice</MenuItem>
            <MenuItem value="averageProfit">Average Profit</MenuItem>
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
  );
};

export default PaymentDistributionChart; 
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

interface PaymentStatusPieChartProps {
  data: PaymentStatusData[];
}

type MetricType = "totalOrders" | "totalInvoice" | "totalProfit";

const PaymentStatusPieChart = ({ data }: PaymentStatusPieChartProps) => {
  const theme = useTheme();
  const [metricType, setMetricType] = React.useState<MetricType>("totalOrders");
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const chartId = React.useMemo(
    () => `payment-status-chart-${Math.random().toString(36).substr(2, 9)}`,
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

  const getMetricValue = (item: PaymentStatusData) => {
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
  const labels = data.map(item => item.status);

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
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 4,
        distributed: true,
      },
    },
    colors: [theme.palette.primary.main, theme.palette.secondary.main, theme.palette.error.main],
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
      show: false,
    },
    xaxis: {
      categories: labels,
      labels: {
        style: {
          colors: theme.palette.mode === "dark" ? "#adb0bb" : "#111",
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
  );
};

export default PaymentStatusPieChart; 
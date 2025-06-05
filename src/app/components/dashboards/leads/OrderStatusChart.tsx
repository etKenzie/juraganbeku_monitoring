"use client";
import { Lead } from "@/app/types/leads";
import {
  Box,
  IconButton,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { IconDownload } from "@tabler/icons-react";
import dynamic from "next/dynamic";
import React from "react";
import DashboardCard from "../../shared/DashboardCard";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface OrderStatusChartProps {
  data: Lead[];
}

const OrderStatusChart = ({ data }: OrderStatusChartProps) => {
  const theme = useTheme();
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const chartId = React.useMemo(
    () => `order-status-chart-${Math.random().toString(36).substr(2, 9)}`,
    []
  );

  // Process data for monthly distribution
  const monthlyOrderStatusData = data.reduce((acc: Record<string, Record<string, number>>, lead) => {
    const date = new Date(lead.date_added);
    const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    const status = lead.lead_status || 'N/A';

    if (!acc[monthYear]) {
      acc[monthYear] = {
        SUCCESS: 0,
        CURRENT: 0,
        CLOSED: 0,
        'N/A': 0
      };
    }
    acc[monthYear][status]++;

    return acc;
  }, {});

  // Convert to array format for chart and sort by date
  const sortedData = Object.entries(monthlyOrderStatusData)
    .map(([month, statusCounts]) => ({
      month,
      SUCCESS: statusCounts.SUCCESS,
      CURRENT: statusCounts.CURRENT,
      CLOSED: statusCounts.CLOSED,
      'N/A': statusCounts['N/A']
    }))
    .sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA.getTime() - dateB.getTime();
    });

  const months = sortedData.map(item => item.month);
  const successData = sortedData.map(item => item.SUCCESS);
  const currentData = sortedData.map(item => item.CURRENT);
  const closedData = sortedData.map(item => item.CLOSED);

  const options: any = {
    chart: {
      id: chartId,
      type: "bar",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      foreColor: theme.palette.mode === "dark" ? "#adb0bb" : "#111",
      toolbar: {
        show: false,
      },
      stacked: true,
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: false,
        columnWidth: '55%',
        dataLabels: {
          position: 'center',
        },
      }
    },
    colors: [
      theme.palette.success.main,  // SUCCESS
      theme.palette.warning.main,  // CURRENT
      theme.palette.error.main,    // CLOSED
    ],
    dataLabels: {
      enabled: true,
      formatter: function (val: number) {
        return val > 0 ? val : '';
      },
      style: {
        fontSize: "14px",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        colors: [theme.palette.mode === "dark" ? "#fff" : "#111"],
      },
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      offsetY: -20,
    },
    xaxis: {
      categories: months,
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
        formatter: function (val: number) {
          return val + " leads";
        }
      }
    },
  };

  const series = [
    {
      name: "Success",
      data: successData
    },
    {
      name: "Current",
      data: currentData
    },
    {
      name: "Closed",
      data: closedData
    }
  ];

  const handleDownload = async () => {
    if (!isClient) return;

    const ApexCharts = (await import("apexcharts")).default;

    ApexCharts.exec(chartId, "updateOptions", {
      title: {
        text: "Leads by Order Status",
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
        downloadLink.download = `Leads_by_Order_Status_${new Date().toLocaleDateString()}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      });
    });
  };

  return (
    <DashboardCard
      title="Leads by Order Status"
      action={
        <Box display="flex" alignItems="center" gap={2}>
          <Tooltip title="Download Chart">
            <IconButton onClick={handleDownload} size="small">
              <IconDownload size={20} />
            </IconButton>
          </Tooltip>
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

export default OrderStatusChart; 
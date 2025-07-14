"use client";
import DashboardCard from "@/app/components/shared/DashboardCard";
import {
    Box,
    IconButton,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { IconDownload } from "@tabler/icons-react";
import dynamic from "next/dynamic";
import React from "react";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface ActivationRateChartProps {
  data: Array<{
    month: string;
    activationRate: number;
    totalStores: number;
    activeStores: number;
    monthlyOrders: number;
  }>;
}

const ActivationRateChart: React.FC<ActivationRateChartProps> = ({ data }) => {
  const [viewType, setViewType] = React.useState<"rate" | "counts">("counts");
  const chartId = React.useMemo(
    () => `activation-rate-chart-${Math.random().toString(36).substr(2, 9)}`,
    []
  );

  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const secondary = theme.palette.secondary.main;
  const tertiary = theme.palette.success.main;

  const categories = data.map(item => item.month);
  
  const handleViewChange = (
    event: React.MouseEvent<HTMLElement>,
    newView: string
  ) => {
    if (newView !== null) {
      setViewType(newView as "rate" | "counts");
    }
  };

  const handleDownload = () => {
    if (typeof window === "undefined") return;

    const title = viewType === "rate" ? "Store Activation Rate" : "Store Counts";
    ApexCharts.exec(chartId, "updateOptions", {
      title: {
        text: title,
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
        downloadLink.download = `${title.replace(/\s+/g, '_')}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      });
    });
  };

  const options: any = {
    chart: {
      id: chartId,
      height: 350,
      type: "line",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      foreColor: "#adb0bb",
      toolbar: {
        show: false,
      },
      shadow: {
        enabled: true,
        color: "#000",
        top: 18,
        left: 7,
        blur: 10,
        opacity: 1,
      },
    },
    xaxis: {
      categories: categories,
      title: {
        text: "Month",
      },
      labels: {
        rotate: -45,
        trim: false,
        style: {
          fontSize: "12px",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        },
      },
    },
    grid: {
      show: false,
    },
    colors: viewType === "rate" ? [primary] : [primary, secondary, tertiary],
    dataLabels: {
      enabled: true,
      formatter: (val: number) => viewType === "rate" ? `${val.toFixed(1)}%` : Math.round(val).toString(),
    },
    stroke: {
      curve: "straight",
      width: "3",
    },
    legend: {
      position: "top",
      horizontalAlign: "right",
      floating: true,
      offsetY: -25,
      offsetX: -5,
    },
    tooltip: {
      theme: "dark",
      y: {
        formatter: (val: number) => viewType === "rate" ? `${val.toFixed(2)}%` : Math.round(val).toString(),
      },
    },
    yaxis: {
      labels: {
        formatter: (val: number) => viewType === "rate" ? `${val}%` : Math.round(val).toString(),
      },
      min: viewType === "rate" ? 0 : 0,
      max: viewType === "rate" ? 100 : undefined,
    },
  };

  const series = viewType === "rate" 
    ? [
        {
          name: "Activation Rate",
          data: data.map(item => item.activationRate),
        },
      ]
    : [
        {
          name: "Total Stores",
          data: data.map(item => item.totalStores),
        },
        {
          name: "Active Stores",
          data: data.map(item => item.activeStores),
        },
        {
          name: "Monthly Orders",
          data: data.map(item => item.monthlyOrders),
        },
      ];

  return (
    <DashboardCard
      title="Store Activation Rate"
      subtitle={viewType === "rate" ? "Percentage of active stores per month" : "Total and active stores per month"}
      action={
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <ToggleButtonGroup
            value={viewType}
            exclusive
            onChange={handleViewChange}
            size="small"
          >
            <ToggleButton value="counts">Counts</ToggleButton>
            <ToggleButton value="rate">Rate</ToggleButton>

          </ToggleButtonGroup>
          <Tooltip title="Download Chart">
            <IconButton onClick={handleDownload}>
              <IconDownload size="18" />
            </IconButton>
          </Tooltip>
        </Box>
      }
    >
      <Box sx={{ width: "100%", height: 350 }}>
        <Chart
          options={options}
          series={series}
          type="line"
          height={350}
        />
      </Box>
    </DashboardCard>
  );
};

export default ActivationRateChart; 
"use client";
import { Box, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import dynamic from "next/dynamic";
import React from "react";
import DashboardCard from "../../shared/DashboardCard";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface DueDateStatusChartProps {
  data: {
    current: number;
    below14DPD: number;
    dpd14: number;
    dpd30: number;
    dpd60: number;
    lunas: number;
  };
}

const DueDateStatusChart = ({ data }: DueDateStatusChartProps) => {
  const theme = useTheme();
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const chartData = [
    { name: "Current", value: data.current },
    { name: "Below 14 DPD", value: data.below14DPD },
    { name: "14 DPD", value: data.dpd14 },
    { name: "30 DPD", value: data.dpd30 },
    { name: "60 DPD", value: data.dpd60 },
  ];

  const optionscolumnchart: any = {
    chart: {
      id: "due-date-status-chart",
      type: "bar",
      fontFamily: "'Plus Jakarta Sans', sans-serif;",
      foreColor: theme.palette.mode === "dark" ? "#adb0bb" : "#111",
      toolbar: {
        show: false,
      },
      height: 280,
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: "45%",
        distributed: true,
        endingShape: "rounded",
      },
    },
    colors: [theme.palette.primary.main],
    dataLabels: {
      enabled: true,
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
      categories: chartData.map(item => item.name),
      labels: {
        style: {
          fontSize: "12px",
          colors: theme.palette.mode === "dark" ? "#adb0bb" : "#111",
        },
      },
    },
    yaxis: {
      labels: {
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
    },
  };

  const seriescolumnchart = [
    {
      name: "Orders",
      data: chartData.map(item => item.value),
    },
  ];

  return (
    <DashboardCard title="Days Past Due Status">
      <>
        <Box height="300px">
          {isClient && (
            <Chart
              options={optionscolumnchart}
              series={seriescolumnchart}
              type="bar"
              height={280}
              width={"100%"}
            />
          )}
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" mt={2}>
          <Typography variant="body2" color="text.secondary">
            Total Lunas Orders:
          </Typography>
          <Typography variant="body1" fontWeight="medium">
            {data.lunas}
          </Typography>
        </Stack>
      </>
    </DashboardCard>
  );
};

export default DueDateStatusChart; 
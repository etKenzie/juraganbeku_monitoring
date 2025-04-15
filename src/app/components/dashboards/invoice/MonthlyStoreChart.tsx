"use client";
import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import dynamic from "next/dynamic";
import React from "react";
import DashboardWidgetCard from "../../shared/DashboardWidgetCard";
import SkeletonEmployeeSalaryCard from "../skeleton/EmployeeSalaryCard";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface MonthlyStoreChartProps {
  isLoading?: boolean;
  data: { [key: string]: Set<string> };
}

const MonthlyStoreChart = ({ isLoading, data }: MonthlyStoreChartProps) => {
  const theme = useTheme();
  const neutral = theme.palette.grey[300];
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Sort entries by month
  const sortedEntries = Object.entries(data).sort(([a], [b]) => a.localeCompare(b));
  const categories = sortedEntries.map(([key]) => key);
  const counts = sortedEntries.map(([, stores]) => stores.size);

  const mostRecentMonth = categories[categories.length - 1];
  const mostRecentCount = data[mostRecentMonth]?.size || 0;

  // Find the highest count for highlighting
  const maxCount = Math.max(...counts);

  // Calculate average
  const average = counts.reduce((acc, curr) => acc + curr, 0) / counts.length;

  const insightText = (
    <span>
      Average of{" "}
      <strong style={{ color: theme.palette.primary.main }}>
        {average.toFixed(1)}
      </strong>{" "}
      active stores over{" "}
      <strong style={{ color: theme.palette.primary.main }}>
        {categories.length}
      </strong>{" "}
      months
    </span>
  );

  const highlightColor = theme.palette.primary.main;
  const colors = categories.map((month) =>
    data[month]?.size === maxCount ? highlightColor : neutral
  );

  const optionscolumnchart: any = {
    chart: {
      type: "bar",
      fontFamily: "'Plus Jakarta Sans', sans-serif;",
      foreColor: "#adb0bb",
      toolbar: {
        show: false,
      },
      height: 280,
    },
    colors: colors,
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: "45%",
        distributed: true,
        endingShape: "rounded",
      },
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
    },
    grid: {
      yaxis: {
        lines: {
          show: false,
        },
      },
    },
    xaxis: {
      categories: categories,
      axisBorder: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        show: false,
      },
    },
    states: {
      hover: {
        filter: {
          type: "darken",
          value: 0.1,
        },
      },
      active: {
        filter: {
          type: "none",
        },
      },
    },
    annotations: {
      yaxis: [
        {
          y: average,
          borderColor: theme.palette.primary.main,
          borderWidth: 3,
          strokeDashArray: 0,
          label: {
            borderColor: theme.palette.primary.main,
            style: {
              color: "#fff",
              background: theme.palette.primary.main,
            },
          },
        },
      ],
    },
    tooltip: {
      theme: theme.palette.mode === "dark" ? "dark" : "light",
    },
  };

  const seriescolumnchart = [
    {
      name: "Active Stores",
      data: counts,
    },
  ];

  return (
    <>
      {isLoading ? (
        <SkeletonEmployeeSalaryCard />
      ) : (
        <DashboardWidgetCard
          title="Monthly Active Stores"
          subtitle={insightText}
          dataLabel1="Current Month"
          dataItem1={mostRecentCount.toString()}
          dataLabel2="Total Months"
          dataItem2={categories.length.toString()}
        >
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
        </DashboardWidgetCard>
      )}
    </>
  );
};

export default MonthlyStoreChart; 
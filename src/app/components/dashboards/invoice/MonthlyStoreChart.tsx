"use client";
import { Box, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import dynamic from "next/dynamic";
import React from "react";
import DashboardWidgetCard from "../../shared/DashboardWidgetCard";
import SkeletonEmployeeSalaryCard from "../skeleton/EmployeeSalaryCard";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface MonthlyStoreChartProps {
  isLoading?: boolean;
  data: { [key: string]: Set<string> };
  monthlyOrders?: { [key: string]: number };
}

const MonthlyStoreChart = ({ isLoading, data, monthlyOrders }: MonthlyStoreChartProps) => {
  const theme = useTheme();
  const neutral = theme.palette.grey[300];
  const [isClient, setIsClient] = React.useState(false);
  const [viewType, setViewType] = React.useState<'stores' | 'orders'>('stores');

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Sort entries by month
  const sortedEntries = Object.entries(data).sort(([a], [b]) => a.localeCompare(b));
  const categories = sortedEntries.map(([key]) => key);
  const storeCounts = sortedEntries.map(([, stores]) => stores.size);
  const orderCounts = monthlyOrders ? categories.map(month => monthlyOrders[month] || 0) : [];

  const mostRecentMonth = categories[categories.length - 1];
  const mostRecentCount = viewType === 'stores' 
    ? data[mostRecentMonth]?.size || 0 
    : monthlyOrders?.[mostRecentMonth] || 0;

  // Find the highest count for highlighting
  const maxCount = Math.max(...(viewType === 'stores' ? storeCounts : orderCounts));

  // Calculate average
  const counts = viewType === 'stores' ? storeCounts : orderCounts;
  const average = counts.reduce((acc, curr) => acc + curr, 0) / counts.length;

  const insightText = (
    <span>
      Average of{" "}
      <strong style={{ color: theme.palette.primary.main }}>
        {average.toFixed(1)}
      </strong>{" "}
      {viewType === 'stores' ? 'active stores' : 'orders'} over{" "}
      <strong style={{ color: theme.palette.primary.main }}>
        {categories.length}
      </strong>{" "}
      months
    </span>
  );

  const highlightColor = theme.palette.primary.main;
  const colors = categories.map((month) =>
    (viewType === 'stores' ? data[month]?.size : monthlyOrders?.[month] || 0) === maxCount ? highlightColor : neutral
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
      name: viewType === 'stores' ? "Active Stores" : "Total Orders",
      data: viewType === 'stores' ? storeCounts : orderCounts,
    },
  ];

  const handleViewChange = (
    event: React.MouseEvent<HTMLElement>,
    newView: 'stores' | 'orders'
  ) => {
    if (newView !== null) {
      setViewType(newView);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {isLoading ? (
        <SkeletonEmployeeSalaryCard />
      ) : (
        <DashboardWidgetCard
          title={`Monthly ${viewType === 'stores' ? 'Active Stores' : 'Orders'}`}
          subtitle={insightText}
          dataLabel1="Current Month"
          dataItem1={mostRecentCount.toString()}
          dataLabel2="Total Months"
          dataItem2={categories.length.toString()}
          action={
            <ToggleButtonGroup
              value={viewType}
              exclusive
              onChange={handleViewChange}
              size="small"
            >
              <ToggleButton value="stores">Stores</ToggleButton>
              <ToggleButton value="orders">Orders</ToggleButton>
            </ToggleButtonGroup>
          }
        >
          <Box height="300px" width="100%">
            {isClient && (
              <Chart
                options={{
                  ...optionscolumnchart,
                  chart: {
                    ...optionscolumnchart.chart,
                    width: '100%',
                    toolbar: {
                      show: false
                    }
                  }
                }}
                series={seriescolumnchart}
                type="bar"
                height={280}
                width="100%"
              />
            )}
          </Box>
        </DashboardWidgetCard>
      )}
    </Box>
  );
};

export default MonthlyStoreChart; 
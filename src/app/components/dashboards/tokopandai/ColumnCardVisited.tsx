"use client";
import dynamic from "next/dynamic";
import React from "react";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { useTheme } from "@mui/material/styles";

import DashboardWidgetCard from "../../shared/DashboardWidgetCard";
import SkeletonEmployeeSalaryCard from "../skeleton/EmployeeSalaryCard";
import { Box } from "@mui/material";
import { WeeklyData } from "@/app/(DashboardLayout)/dashboards/janjijiwa/types";

type Data = {
  averageScore: number;
  averageToilet: number;
  averageFood: number;
  averageDrink: number;
  averageService: number;
  count: number;
};

type HangryData = {
  averageScore: number;
  averageService: number;
  averageProduct: number;
  count: number;
};

type HausEbikeData = {
  averageScore: number;
  averageProduct: number;
  averageCrew: number;
  averageBike: number;
  averageSafety: number;
  count: number;
};

type DarmiData = {
  averageScore: number;
  averageProduct: number;
  averageCashier: number;
  averageProcess: number;
  averageServing: number;
  averagePeople: number;
  averageOutlet: number;
  averageClean: number;
  count: number;
  sortKey: string;
};
type RoempiData = {
  averageScore: number;
  averageToilet: number;
  averageFood: number;
  averageDrink: number;
  averageServiceAmbience: number;
  count: number;
  sortKey: string;
};

interface EmployeeSalaryCardProps {
  isLoading?: boolean;
  data: Record<string, Data | WeeklyData | HangryData | DarmiData | RoempiData | HausEbikeData>;
  totalItems: number;
}

const ColumnCardVisited = ({
  isLoading,
  data,
  totalItems,
}: EmployeeSalaryCardProps) => {
  const theme = useTheme();
  const neutral = theme.palette.grey[300]; // neutral color for bars
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Sort entries by sortKey
  const sortedEntries = Object.entries(data).sort(([, a], [, b]) => {
    if ("sortKey" in a && "sortKey" in b) {
      //@ts-ignore
      return a.sortKey.localeCompare(b.sortKey);
    }
    return 0;
  });

  const categories = sortedEntries.map(([key]) => key);
  const counts = sortedEntries.map(([, value]) => value.count || 0);

  const mostRecentMonth = categories[categories.length - 1];
  const mostRecentCount = data[mostRecentMonth]?.count || 0;

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
      visits over{" "}
      <strong style={{ color: theme.palette.primary.main }}>
        {categories.length}
      </strong>{" "}
      {categories[0]?.includes("W") ? "weeks" : "months"}
    </span>
  );

  const highlightColor = theme.palette.primary.main; // Highlight color for the last month

  const colors = categories.map((month) =>
    data[month]?.count === maxCount ? highlightColor : neutral
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
    colors: colors, // Use dynamically generated colors
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
          type: "darken", // Change to "darken" if needed
          value: 0.1, // Adjust this value to make it less white
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
      name: "Visits",
      data: counts,
    },
  ];

  return (
    <>
      {isLoading ? (
        <SkeletonEmployeeSalaryCard />
      ) : (
        <DashboardWidgetCard
          title="Kunjungan"
          subtitle={insightText}
          dataLabel1={
            categories[0]?.includes("W") ? "Minggu Terbaru" : "Bulan Terbaru"
          }
          dataItem1={mostRecentCount.toString()}
          dataLabel2="Total"
          dataItem2={totalItems.toString()}
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

export default ColumnCardVisited;

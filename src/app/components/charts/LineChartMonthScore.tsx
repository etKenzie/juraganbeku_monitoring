"use client";
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { useTheme } from "@mui/material/styles";
import ParentCard from "@/app/components/shared/ParentCard";
import React from "react";
import LineChartCode from "./code/LineChartCode";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import DashboardCard from "../shared/DashboardCard";

type Data = {
  averageScore: number;
  averageToilet: number;
  averageFood: number;
  averageDrink: number;
  averageService: number;
  count: number;
};

type LineMonthScoreProps = {
  data: Record<string, Data>;
};

const LineChartMonthScore: React.FC<LineMonthScoreProps> = ({ data }) => {
  const [viewType, setViewType] = React.useState("combined");
  // chart color
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const secondary = theme.palette.secondary.main;
  const tertiary = theme.palette.success.main;
  const fourth = theme.palette.warning.main;

  // Generate categories (months) and series data from `data`
  const categories = Object.keys(data);
  const combinedData = categories.map((month) =>
    Math.round(data[month]?.averageScore || 0)
  );
  const categoryData = {
    averageToilet: categories.map((month) =>
      Math.round(data[month]?.averageToilet || 0)
    ),
    averageFood: categories.map((month) =>
      Math.round(data[month]?.averageFood || 0)
    ),
    averageDrink: categories.map((month) =>
      Math.round(data[month]?.averageDrink || 0)
    ),
    averageService: categories.map((month) =>
      Math.round(data[month]?.averageService || 0)
    ),
  };

  const optionslinechart: any = {
    chart: {
      height: 350,
      type: "line",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      foreColor: "#adb0bb",
      zoom: {
        type: "x",
        enabled: true,
      },
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
    },
    grid: {
      show: false,
    },
    colors: [primary, secondary, tertiary, fourth],
    dataLabels: {
      enabled: true,
    },
    stroke: {
      curve: "straight",
      width: "2",
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
    },
    yaxis: {
      show: false,
    },
  };
  const serieslinechart: any =
    viewType === "combined"
      ? [
          {
            name: "Total",
            data: combinedData,
          },
        ]
      : [
          {
            name: "Toilet",
            data: categoryData.averageToilet,
          },
          {
            name: "Food",
            data: categoryData.averageFood,
          },
          {
            name: "Drink",
            data: categoryData.averageDrink,
          },
          {
            name: "Service",
            data: categoryData.averageService,
          },
        ];

  const handleViewChange = (
    event: React.MouseEvent<HTMLElement>,
    newView: string
  ) => {
    if (newView !== null) {
      setViewType(newView);
    }
  };

  const firstMonth = combinedData[0] || 0;
  const lastMonth = combinedData[combinedData.length - 1] || 0;
  const percentChange =
    firstMonth === 0 ? 0 : ((lastMonth - firstMonth) / firstMonth) * 100;
  const formattedPercent = parseFloat(percentChange.toFixed(1)); //

  const insightText = (
    <span>
      {percentChange !== 0 ? (
        <>
          Over the last{" "}
          <strong style={{ color: theme.palette.primary.main }}>
            {categories.length}
          </strong>{" "}
          months, you have seen{" "}
          {percentChange > 0 ? "an increase" : "a decrease"} of{" "}
          <strong style={{ color: theme.palette.primary.main }}>
            {Math.abs(formattedPercent)}
          </strong>{" "}
        </>
      ) : (
        <>
          The average score remained stable over{" "}
          <strong style={{ color: theme.palette.primary.main }}>
            {categories.length}
          </strong>{" "}
          months.
        </>
      )}
    </span>
  );
  return (
    <DashboardCard
      title="Monthly Scores"
      subtitle={insightText}
      action={
        <ToggleButtonGroup
          value={viewType}
          exclusive
          onChange={handleViewChange}
          size="small"
        >
          <ToggleButton value="combined">Total</ToggleButton>
          <ToggleButton value="category">By Category</ToggleButton>
        </ToggleButtonGroup>
      }
    >
      <Chart
        options={optionslinechart}
        series={serieslinechart}
        type="line"
        height="319px"
        width={"100%"}
      />
    </DashboardCard>
  );
};

export default LineChartMonthScore;

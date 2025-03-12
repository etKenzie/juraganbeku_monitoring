"use client";

import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { useTheme } from "@mui/material/styles";
import ParentCard from "@/app/components/shared/ParentCard";
import React from "react";
import ColumnChartCode from "./code/ColumnChartCode";

const ColumnChartCategories = () => {
  // chart color
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const secondary = theme.palette.secondary.main;
  const error = theme.palette.error.main;

  const optionscolumnchart: any = {
    chart: {
      id: "column-chart",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      foreColor: "#adb0bb",
      toolbar: {
        show: false,
      },
    },
    colors: [primary, secondary, error],
    plotOptions: {
      bar: {
        horizontal: false,
        endingShape: "rounded",
        columnWidth: "40%",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ["transparent"],
    },
    xaxis: {
      categories: ["Jakarta", "Surabaya", "Bandung", "Bogor"],
    },
    yaxis: {
      title: {
        text: "score",
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      y: {
        formatter(val: any) {
          return `$ ${val} thousands`;
        },
      },
      theme: "dark",
    },
    grid: {
      show: false,
    },
    legend: {
      show: true,
      position: "bottom",
      width: "50px",
    },
  };
  const seriescolumnchart: any = [
    {
      name: "Ambience",
      data: [44, 55, 57, 56],
    },
    {
      name: "Layanan",
      data: [76, 85, 99, 98],
    },
    {
      name: "Produk",
      data: [38, 41, 32, 26],
    },
    {
      name: "Merek",
      data: [35, 41, 36, 26],
    },
  ];

  return (
    <ParentCard title="Store Categories" codeModel={<ColumnChartCode />}>
      <Chart
        options={optionscolumnchart}
        series={seriescolumnchart}
        type="bar"
        height="300px"
        width={"100%"}
      />
    </ParentCard>
  );
};

export default ColumnChartCategories;

"use client";
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { useTheme } from "@mui/material/styles";
import ParentCard from "@/app/components/shared/ParentCard";
import React from "react";
import LineChartCode from "./code/LineChartCode";

const LineChartMonthVisit = () => {
  // chart color
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const secondary = theme.palette.secondary.main;

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
      categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
      title: {
        text: "Month",
      },
    },
    grid: {
      show: false,
    },
    colors: [primary, secondary],
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
  };
  const serieslinechart: any = [
    {
      name: "2024",
      data: [65, 67, 64, 65, 66, 65, 66],
    },
    // {
    //   name: "Low - 2013",
    //   data: [12, 11, 14, 18, 17, 13, 13],
    // },
  ];

  return (
    <ParentCard
      title="Jumlah Toko yang Dikunkungi per Bulan"
      // codeModel={<LineChartCode />}
    >
      <Chart
        options={optionslinechart}
        series={serieslinechart}
        type="line"
        height="308px"
        width={"90%"}
      />
    </ParentCard>
  );
};

export default LineChartMonthVisit;

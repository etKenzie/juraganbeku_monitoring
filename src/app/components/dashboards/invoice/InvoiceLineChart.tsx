"use client";
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { useTheme } from "@mui/material/styles";
import React from "react";
import {
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Tooltip,
  Box,
} from "@mui/material";
import DashboardCard from "@/app/components/shared/DashboardCard";
import { IconDownload } from "@tabler/icons-react";
import { format } from "date-fns";
import { formatCurrency } from "@/app/utils/formatNumber";

interface InvoiceLineChartProps {
  data: {
    date: string;
    totalInvoice: number;
    totalProfit: number;
  }[];
  timePeriod: string;
}

const InvoiceLineChart = React.forwardRef<any, InvoiceLineChartProps>(
  ({ data, timePeriod }, ref) => {
    const [viewType, setViewType] = React.useState<"monthly" | "weekly">("monthly");
    const chartId = React.useMemo(
      () => `invoice-chart-${Math.random().toString(36).substr(2, 9)}`,
      []
    );

    const theme = useTheme();
    const primary = theme.palette.primary.main;
    const secondary = theme.palette.secondary.main;

    // Group data by month or week
    const groupedData = React.useMemo(() => {
      const result: Record<string, { totalInvoice: number; totalProfit: number }> = {};
      
      data.forEach(item => {
        const date = new Date(item.date);
        let key: string;
        
        if (viewType === "monthly") {
          key = format(date, "MMM yyyy");
        } else {
          const weekNumber = Math.ceil(date.getDate() / 7);
          key = `Week ${weekNumber} ${format(date, "MMM yyyy")}`;
        }
        
        if (!result[key]) {
          result[key] = { totalInvoice: 0, totalProfit: 0 };
        }
        
        result[key].totalInvoice += item.totalInvoice;
        result[key].totalProfit += item.totalProfit;
      });
      
      return result;
    }, [data, viewType]);

    const categories = Object.keys(groupedData);
    const invoiceData = Object.values(groupedData).map(d => d.totalInvoice);
    const profitData = Object.values(groupedData).map(d => d.totalProfit);

    const handleDownload = () => {
      if (typeof window === "undefined") return;

      ApexCharts.exec(chartId, "updateOptions", {
        title: {
          text: ["Invoice and Profit Overview", timePeriod],
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
          downloadLink.download = `Invoice_Profit_Overview_${timePeriod}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        });
      });
    };

    const optionslinechart: any = {
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
          text: viewType === "monthly" ? "Month" : "Week",
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
      colors: [primary, secondary],
      dataLabels: {
        enabled: true,
        formatter: (val: number) => formatCurrency(val),
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
        y: {
          formatter: (val: number) => formatCurrency(val),
        },
      },
      yaxis: {
        labels: {
          formatter: (val: number) => formatCurrency(val),
        },
      },
    };

    const serieslinechart = [
      {
        name: "Total Invoice",
        data: invoiceData,
      },
      {
        name: "Total Profit",
        data: profitData,
      },
    ];

    const handleViewChange = (
      event: React.MouseEvent<HTMLElement>,
      newView: string
    ) => {
      if (newView !== null) {
        setViewType(newView as "monthly" | "weekly");
      }
    };

    const firstInvoice = invoiceData[0] || 0;
    const lastInvoice = invoiceData[invoiceData.length - 1] || 0;
    const percentChange = firstInvoice === 0 ? 0 : ((lastInvoice - firstInvoice) / firstInvoice) * 100;
    const formattedPercent = parseFloat(percentChange.toFixed(1));

    const insightText = (
      <span>
        {percentChange !== 0 ? (
          <>
            You have seen{" "}
            {percentChange > 0 ? "an increase" : "a decrease"} of{" "}
            <strong style={{ color: theme.palette.primary.main }}>
              {Math.abs(formattedPercent)}%
            </strong>{" "}
            in total invoice
          </>
        ) : (
          <>The total invoice remained stable during this period</>
        )}
      </span>
    );

    return (
      <DashboardCard
        title="Invoice and Profit Overview"
        subtitle={insightText}
        action={
          <Box display="flex" alignItems="center" gap={2}>
            <Tooltip title="Download Chart">
              <IconButton onClick={handleDownload} size="small">
                <IconDownload size={20} />
              </IconButton>
            </Tooltip>
            <ToggleButtonGroup
              value={viewType}
              exclusive
              onChange={handleViewChange}
              size="small"
            >
              <ToggleButton value="monthly">Monthly</ToggleButton>
              <ToggleButton value="weekly">Weekly</ToggleButton>
            </ToggleButtonGroup>
          </Box>
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
  }
);

InvoiceLineChart.displayName = "InvoiceLineChart";

export default InvoiceLineChart; 
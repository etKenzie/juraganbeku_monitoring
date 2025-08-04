"use client";
import { getWeekKey } from "@/app/(DashboardLayout)/distribusi/sales/data";
import DashboardCard from "@/app/components/shared/DashboardCard";
import { formatCurrency } from "@/app/utils/formatNumber";
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

interface InvoiceLineChartProps {
  data: {
    date: string;
    month: string;
    totalInvoice: number;
    totalProfit: number;
  }[];
  timePeriod: string;
  weeklyData?: { [key: string]: { totalInvoice: number; totalProfit: number } };
}

const InvoiceLineChart = React.forwardRef<any, InvoiceLineChartProps>(
  ({ data, timePeriod, weeklyData }, ref) => {
    const [viewType, setViewType] = React.useState<"monthly" | "weekly">("monthly");
    const [metricType, setMetricType] = React.useState<"invoiceProfit" | "margin">("invoiceProfit");
    const chartId = React.useMemo(
      () => `invoice-chart-${Math.random().toString(36).substr(2, 9)}`,
      []
    );

    const theme = useTheme();
    const primary = theme.palette.primary.main;
    const secondary = theme.palette.secondary.main;
    const success = theme.palette.success.main;

    // Group data by month or week
    const groupedData = React.useMemo(() => {
      if (viewType === "weekly" && weeklyData) {
        // Use centralized weekly data if available
        return weeklyData;
      }
      
      const result: Record<string, { totalInvoice: number; totalProfit: number }> = {};
      
      // 1. Sort data to ensure chronological order
      const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      sortedData.forEach(item => {
        const date = new Date(item.date);
  
        let key: string;
        
        if (viewType === "monthly") {
          key = item.month;
        } else {
          // 2. Use centralized week calculation
          key = getWeekKey(date);
        }
        
        if (!result[key]) {
          result[key] = { totalInvoice: 0, totalProfit: 0 };
        }
        
        result[key].totalInvoice += item.totalInvoice;
        result[key].totalProfit += item.totalProfit;
      });
      
      return result;
    }, [data, viewType, weeklyData]);

    // 3. Sort and prepare data for chart
    const categories = Object.keys(groupedData);
    const invoiceData = Object.values(groupedData).map(d => d.totalInvoice);
    const profitData = Object.values(groupedData).map(d => d.totalProfit);
    const marginData = Object.values(groupedData).map(d => 
      d.totalInvoice > 0 ? (d.totalProfit / d.totalInvoice) * 100 : 0
    );

    // Reverse weekly data to show most recent on the right
    if (viewType === "weekly" && weeklyData) {
      categories.reverse();
      invoiceData.reverse();
      profitData.reverse();
      marginData.reverse();
    }

    const handleDownload = () => {
      if (typeof window === "undefined") return;

      ApexCharts.exec(chartId, "updateOptions", {
        title: {
          text: ["Invoice, Profit, and Margin Overview", timePeriod],
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
          downloadLink.download = `Invoice_Profit_Margin_Overview_${timePeriod}.png`;
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
      colors: [primary, secondary, success],
      dataLabels: {
        enabled: true,
        formatter: function(val: number, opts: any) {
          // Format margin as percentage, others as currency
          if (metricType === "margin") {
            return val.toFixed(1) + '%';
          }
          return formatCurrency(val);
        },
      },
      stroke: {
        curve: "straight",
        width: "2",
      },
      legend: {
        show: false,
      },
      tooltip: {
        theme: "dark",
        y: {
          formatter: function(val: number, opts: any) {
            // Format margin as percentage, others as currency
            if (metricType === "margin") {
              return val.toFixed(1) + '%';
            }
            return formatCurrency(val);
          },
        },
      },
      yaxis: {
        labels: {
          formatter: (val: number) => {
            if (metricType === "margin") {
              return val.toFixed(1) + '%';
            }
            return formatCurrency(val);
          },
        },
        title: {
          text: metricType === "margin" ? "Margin %" : "Amount",
        },
      },
    };

    const serieslinechart = [
      ...(metricType === "invoiceProfit" ? [
        {
          name: "Total Invoice",
          data: invoiceData,
        },
        {
          name: "Total Profit",
          data: profitData,
        },
      ] : [
        {
          name: "Margin %",
          data: marginData,
        },
      ]),
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
        title="Invoice, Profit, and Margin Overview"
        subtitle={insightText}
        action={
          <Box display="flex" alignItems="center" gap={2}>
            <Tooltip title="Download Chart">
              <IconButton onClick={handleDownload} size="small">
                <IconDownload size={20} />
              </IconButton>
            </Tooltip>
            <ToggleButtonGroup
              value={metricType}
              exclusive
              onChange={(event, newValue) => {
                if (newValue !== null) {
                  setMetricType(newValue);
                }
              }}
              size="small"
            >
              <ToggleButton value="invoiceProfit">Default</ToggleButton>
              <ToggleButton value="margin">Margin</ToggleButton>
            </ToggleButtonGroup>
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
"use client";
import { formatCurrency } from "@/app/utils/formatNumber";
import { OrderData } from "@/store/apps/Invoice/invoiceSlice";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Tooltip,
  Typography
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { IconDownload } from "@tabler/icons-react";
import dynamic from "next/dynamic";
import React, { useState } from "react";
import DashboardWidgetCard from "../../shared/DashboardWidgetCard";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface NOOChartProps {
  data: OrderData[];
}

const NOOChart = ({ data }: NOOChartProps) => {
  const theme = useTheme();
  const [isClient, setIsClient] = React.useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<'nooCount' | 'totalInvoice' | 'totalProfit' | 'averageInvoice' | 'averageProfit'>('nooCount');

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Add effect to log modal state changes
  React.useEffect(() => {
    console.log('Modal state changed:', { isModalOpen, selectedMonth });
  }, [isModalOpen, selectedMonth]);

  const handleBarClick = (month: string) => {
    console.log('Handling bar click for month:', month);
    setSelectedMonth(month);
    setIsModalOpen(true);
  };

  const chartId = React.useMemo(
    () => `noo-chart-${Math.random().toString(36).substr(2, 9)}`,
    []
  );

  // Process data to count unique stores per month and sum invoice/profit/price
  const monthlyData = React.useMemo(() => {
    // First, get the first order date for each store
    const storeFirstOrders = data.reduce((acc: Record<string, { month: string, order: OrderData }>, order) => {
      const storeId = order.user_id;
      const monthYear = order.month.toLowerCase();
      if (!acc[storeId] || new Date(order.order_date) < new Date(acc[storeId].order.order_date)) {
        acc[storeId] = { month: monthYear, order };
      }
      return acc;
    }, {});

    // Then, aggregate per month
    const monthlyCounts: Record<string, { nooCount: number; totalInvoice: number; totalProfit: number; totalPrice: number; totalOrders: number }> = {};
    Object.values(storeFirstOrders).forEach(({ month, order }) => {
      if (!monthlyCounts[month]) {
        monthlyCounts[month] = { nooCount: 0, totalInvoice: 0, totalProfit: 0, totalPrice: 0, totalOrders: 0 };
      }
      monthlyCounts[month].nooCount += 1;
      monthlyCounts[month].totalInvoice += order.total_invoice;
      monthlyCounts[month].totalProfit += order.profit || 0;
      // Sum all product prices in this order
      if (order.detail_order && Array.isArray(order.detail_order)) {
        monthlyCounts[month].totalPrice += order.detail_order.reduce((sum, item) => sum + (item?.price ? Number(item.price) : 0), 0);
      }
      monthlyCounts[month].totalOrders += 1;
    });

    return { monthlyCounts, storeFirstOrders };
  }, [data]);

  const months = Object.keys(monthlyData.monthlyCounts).sort((a, b) => {
    const [monthA, yearA] = a.split(' ');
    const [monthB, yearB] = b.split(' ');
    const dateA = new Date(`${monthA} 1, ${yearA}`);
    const dateB = new Date(`${monthB} 1, ${yearB}`);
    return dateA.getTime() - dateB.getTime(); // Earliest to latest
  });

  const nooCounts = months.map(month => monthlyData.monthlyCounts[month].nooCount);
  const totalInvoices = months.map(month => monthlyData.monthlyCounts[month].totalInvoice);
  const totalProfits = months.map(month => monthlyData.monthlyCounts[month].totalProfit);
  const averageInvoices = months.map(month => {
    const m = monthlyData.monthlyCounts[month];
    return m.totalOrders > 0 ? m.totalInvoice / m.totalOrders : 0;
  });
  const averageProfits = months.map(month => {
    const m = monthlyData.monthlyCounts[month];
    return m.totalOrders > 0 ? m.totalProfit / m.totalOrders : 0;
  });

  // Remove formatY and use formatCurrency only for display
  let chartData: number[] = [];
  let chartLabel = '';
  if (selectedMetric === 'nooCount') {
    chartData = nooCounts;
    chartLabel = 'New Ordering Outlets';
  } else if (selectedMetric === 'totalInvoice') {
    chartData = totalInvoices;
    chartLabel = 'Total Invoice';
  } else if (selectedMetric === 'totalProfit') {
    chartData = totalProfits;
    chartLabel = 'Total Profit';
  } else if (selectedMetric === 'averageInvoice') {
    chartData = averageInvoices;
    chartLabel = 'Average Invoice';
  } else if (selectedMetric === 'averageProfit') {
    chartData = averageProfits;
    chartLabel = 'Average Profit';
  }

  // Calculate average and find max count
  const average = chartData.length > 0 ? chartData.reduce((acc, curr) => acc + curr, 0) / chartData.length : 0;
  const maxCount = chartData.length > 0 ? Math.max(...chartData) : 0;
  const mostRecentMonth = months[months.length - 1];
  let mostRecentValue = 0;
  if (selectedMetric === 'averageInvoice' || selectedMetric === 'averageProfit') {
    mostRecentValue = chartData[chartData.length - 1] || 0;
  } else {
    mostRecentValue = monthlyData.monthlyCounts[mostRecentMonth]?.[selectedMetric as 'nooCount' | 'totalInvoice' | 'totalProfit'] || 0;
  }

  const neutral = theme.palette.grey[300];
  const highlightColor = theme.palette.primary.main;
  const colors = chartData.map((val) =>
    val === maxCount ? highlightColor : neutral
  );

  const insightText = (
    <span>
      Average of{" "}
      <strong style={{ color: theme.palette.primary.main }}>
        {formatCurrency(average)}
      </strong>{" "}
      {selectedMetric === 'nooCount' ? 'new stores' : (selectedMetric === 'totalInvoice' ? 'invoice' : 'profit')} over{" "}
      <strong style={{ color: theme.palette.primary.main }}>
        {months.length}
      </strong>{" "}
      months
    </span>
  );

  // Capitalize the first letter of each month for display
  const displayMonths = months.map(m => m.charAt(0).toUpperCase() + m.slice(1));

  const options: any = {
    chart: {
      type: "bar",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      foreColor: "#adb0bb",
      toolbar: {
        show: false,
      },
      height: 280,
      events: {
        click: (event: any, chartContext: any, config: any) => {
          if (config.dataPointIndex !== undefined) {
            handleBarClick(months[config.dataPointIndex]);
          }
        },
        dataPointClick: (event: any, chartContext: any, config: any) => {
          handleBarClick(months[config.dataPointIndex]);
        }
      },
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
      enabled: true,
      formatter: (val: number) => formatCurrency(val),
      style: {
        colors: ["#111"]
      },
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
      categories: displayMonths,
      axisBorder: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        show: true,
        formatter: (val: number) => formatCurrency(val),
      },
    },
    tooltip: {
      theme: theme.palette.mode === "dark" ? "dark" : "light",
    },
  };

  const series = [
    {
      name: chartLabel,
      data: chartData,
    },
  ];

  const handleDownload = async () => {
    if (!isClient) return;

    const ApexCharts = (await import("apexcharts")).default;

    ApexCharts.exec(chartId, "updateOptions", {
      title: {
        text: "New Ordering Outlets by Month",
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
        downloadLink.download = "New_Ordering_Outlets.png";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      });
    });
  };

  // Get unique store names for selected month with additional details
  const getStoresForMonth = (month: string) => {
    return Object.values(monthlyData.storeFirstOrders)
      .filter(store => store.month === month)
      .map(store => store.order)
      .sort((a, b) => a.store_name.localeCompare(b.store_name));
  };

  return (
    <>
      <DashboardWidgetCard
        title="New Ordering Outlets"
        subtitle={insightText}
        action={
          <Box display="flex" alignItems="center" gap={2}>
            <Select
              value={selectedMetric}
              onChange={e => setSelectedMetric(e.target.value as any)}
              size="small"
            >
              <MenuItem value="nooCount">NOO Count</MenuItem>
              <MenuItem value="totalInvoice">Total Invoice</MenuItem>
              <MenuItem value="totalProfit">Total Profit</MenuItem>
              <MenuItem value="averageInvoice">Average Invoice</MenuItem>
              <MenuItem value="averageProfit">Average Profit</MenuItem>
            </Select>
            <Tooltip title="Download Chart">
              <IconButton onClick={handleDownload} size="small">
                <IconDownload size={20} />
              </IconButton>
            </Tooltip>
          </Box>
        }
        dataLabel1={(() => {
          if (selectedMetric === 'nooCount') return 'Current Month NOO';
          if (selectedMetric === 'totalInvoice') return 'Current Month Invoice';
          if (selectedMetric === 'totalProfit') return 'Current Month Profit';
          if (selectedMetric === 'averageInvoice') return 'Current Month Avg Invoice';
          if (selectedMetric === 'averageProfit') return 'Current Month Avg Profit';
          return '';
        })()}
        dataItem1={formatCurrency(mostRecentValue)}
        dataLabel2="Total Months"
        dataItem2={months.length.toString()}
      >
        <Box height="300px" width="100%">
          {isClient && (
            <Chart
              options={options}
              series={series}
              type="bar"
              height={280}
              width="100%"
            />
          )}
        </Box>
      </DashboardWidgetCard>

      <Dialog
        open={isModalOpen}
        onClose={() => {
          console.log('Closing modal');
          setIsModalOpen(false);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            minHeight: '50vh',
            maxHeight: '80vh'
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              New Stores - {selectedMonth}
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              {selectedMonth && getStoresForMonth(selectedMonth).length} stores
            </Typography>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
            {selectedMonth &&
              getStoresForMonth(selectedMonth).map((order, index) => (
                <React.Fragment key={order.order_id}>
                  <ListItem alignItems="flex-start" sx={{ flexDirection: 'column' }}>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" component="div">
                          {order.store_name}
                        </Typography>
                      }
                      secondary={
                        <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                          <Typography variant="body2" color="text.secondary">
                            Reseller: {order.reseller_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Order Date: {new Date(order.order_date).toLocaleDateString()}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Invoice: {formatCurrency(order.total_invoice)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < getStoresForMonth(selectedMonth).length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NOOChart; 
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
  storeSummaries?: { [key: string]: any };
}

const NOOChart = ({ data, storeSummaries }: NOOChartProps) => {
  const theme = useTheme();
  const [isClient, setIsClient] = React.useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<'nooCount' | 'totalInvoice' | 'totalProfit' | 'averageInvoice' | 'averageProfit' | 'totalMonthInvoice' | 'totalMonthProfit' | 'totalMonthOrders' | 'averageMonthInvoice' | 'averageMonthProfit' | 'margin'>('nooCount');

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
    chartLabel = 'Total First Invoice';
  } else if (selectedMetric === 'totalProfit') {
    chartData = totalProfits;
    chartLabel = 'Total First Profit';
  } else if (selectedMetric === 'averageInvoice') {
    chartData = averageInvoices;
    chartLabel = 'Average First Invoice';
  } else if (selectedMetric === 'averageProfit') {
    chartData = averageProfits;
    chartLabel = 'Average First Profit';
  } else if (selectedMetric === 'totalMonthInvoice') {
    // Calculate total month invoice by summing up all store totals for each month
    chartData = months.map(month => {
      let totalMonthInvoice = 0;
      // Use storeSummaries if available, otherwise fall back to monthlyData
      if (storeSummaries) {
        // Only include stores that first appeared in this month (like the modal)
        Object.values(monthlyData.storeFirstOrders).forEach(({ month: storeMonth, order: firstOrder }) => {
          if (storeMonth === month) {
            // Get the store summary for this store
            const storeSummary = storeSummaries[firstOrder.user_id];
            if (storeSummary) {
              const storeOrders = storeSummary.orders.filter((storeOrder: OrderData) => 
                storeOrder.month.toLowerCase() === month.toLowerCase()
              );
              // Calculate the store's total month invoice (same as modal calculation)
              const storeMonthInvoice = storeOrders.reduce((sum: number, storeOrder: OrderData) => 
                sum + (storeOrder.total_invoice || 0), 0
              );
              totalMonthInvoice += storeMonthInvoice;
            }
          }
        });
      } else {
        // Fallback to original calculation
        Object.values(monthlyData.storeFirstOrders).forEach(({ month: storeMonth, order: firstOrder }) => {
          if (storeMonth === month) {
            const storeOrders = data.filter(dataOrder => 
              dataOrder.user_id === firstOrder.user_id && 
              dataOrder.month.toLowerCase() === month.toLowerCase()
            );
            totalMonthInvoice += storeOrders.reduce((sum, storeOrder) => 
              sum + (storeOrder.total_invoice || 0), 0
            );
          }
        });
      }
      return totalMonthInvoice;
    });
    chartLabel = 'Total Invoice';
  } else if (selectedMetric === 'totalMonthProfit') {
    // Calculate total month profit by summing up all store totals for each month
    chartData = months.map(month => {
      let totalMonthProfit = 0;
      // Use storeSummaries if available, otherwise fall back to monthlyData
      if (storeSummaries) {
        // Only include stores that first appeared in this month (like the modal)
        Object.values(monthlyData.storeFirstOrders).forEach(({ month: storeMonth, order: firstOrder }) => {
          if (storeMonth === month) {
            // Get the store summary for this store
            const storeSummary = storeSummaries[firstOrder.user_id];
            if (storeSummary) {
              const storeOrders = storeSummary.orders.filter((storeOrder: OrderData) => 
                storeOrder.month.toLowerCase() === month.toLowerCase()
              );
              // Calculate the store's total month profit (same as modal calculation)
              const storeMonthProfit = storeOrders.reduce((sum: number, storeOrder: OrderData) => 
                sum + (storeOrder.profit || 0), 0
              );
              totalMonthProfit += storeMonthProfit;
            }
          }
        });
      } else {
        // Fallback to original calculation
        Object.values(monthlyData.storeFirstOrders).forEach(({ month: storeMonth, order: firstOrder }) => {
          if (storeMonth === month) {
            const storeOrders = data.filter(dataOrder => 
              dataOrder.user_id === firstOrder.user_id && 
              dataOrder.month.toLowerCase() === month.toLowerCase()
            );
            totalMonthProfit += storeOrders.reduce((sum, storeOrder) => 
              sum + (storeOrder.profit || 0), 0
            );
          }
        });
      }
      return totalMonthProfit;
    });
    chartLabel = 'Total Profit';
  } else if (selectedMetric === 'totalMonthOrders') {
    // Calculate total month orders by summing up all store totals for each month
    chartData = months.map(month => {
      let totalMonthOrders = 0;
      // Use storeSummaries if available, otherwise fall back to monthlyData
      if (storeSummaries) {
        // Only include stores that first appeared in this month (like the modal)
        Object.values(monthlyData.storeFirstOrders).forEach(({ month: storeMonth, order: firstOrder }) => {
          if (storeMonth === month) {
            // Get the store summary for this store
            const storeSummary = storeSummaries[firstOrder.user_id];
            if (storeSummary) {
              const storeOrders = storeSummary.orders.filter((storeOrder: OrderData) => 
                storeOrder.month.toLowerCase() === month.toLowerCase()
              );
              // Calculate the store's total month orders (same as modal calculation)
              const storeMonthOrders = storeOrders.length;
              totalMonthOrders += storeMonthOrders;
            }
          }
        });
      } else {
        // Fallback to original calculation
        Object.values(monthlyData.storeFirstOrders).forEach(({ month: storeMonth, order: firstOrder }) => {
          if (storeMonth === month) {
            const storeOrders = data.filter(dataOrder => 
              dataOrder.user_id === firstOrder.user_id && 
              dataOrder.month.toLowerCase() === month.toLowerCase()
            );
            totalMonthOrders += storeOrders.length;
          }
        });
      }
      return totalMonthOrders;
    });
    chartLabel = 'Total Orders';
  } else if (selectedMetric === 'averageMonthInvoice') {
    // Calculate average month invoice by averaging the store totals for each month
    chartData = months.map(month => {
      let totalMonthInvoice = 0;
      let storeCount = 0;
      // Use storeSummaries if available, otherwise fall back to monthlyData
      if (storeSummaries) {
        // Only include stores that first appeared in this month (like the modal)
        Object.values(monthlyData.storeFirstOrders).forEach(({ month: storeMonth, order: firstOrder }) => {
          if (storeMonth === month) {
            // Get the store summary for this store
            const storeSummary = storeSummaries[firstOrder.user_id];
            if (storeSummary) {
              const storeOrders = storeSummary.orders.filter((storeOrder: OrderData) => 
                storeOrder.month.toLowerCase() === month.toLowerCase()
              );
              // Calculate the store's total month invoice (same as modal calculation)
              const storeMonthInvoice = storeOrders.reduce((sum: number, storeOrder: OrderData) => 
                sum + (storeOrder.total_invoice || 0), 0
              );
              totalMonthInvoice += storeMonthInvoice;
              storeCount += 1;
            }
          }
        });
      } else {
        // Fallback to original calculation
        Object.values(monthlyData.storeFirstOrders).forEach(({ month: storeMonth, order: firstOrder }) => {
          if (storeMonth === month) {
            const storeOrders = data.filter(dataOrder => 
              dataOrder.user_id === firstOrder.user_id && 
              dataOrder.month.toLowerCase() === month.toLowerCase()
            );
            totalMonthInvoice += storeOrders.reduce((sum, storeOrder) => 
              sum + (storeOrder.total_invoice || 0), 0
            );
            storeCount += 1;
          }
        });
      }
      return storeCount > 0 ? totalMonthInvoice / storeCount : 0;
    });
    chartLabel = 'Average Invoice';
  } else if (selectedMetric === 'averageMonthProfit') {
    // Calculate average month profit by averaging the store totals for each month
    chartData = months.map(month => {
      let totalMonthProfit = 0;
      let storeCount = 0;
      // Use storeSummaries if available, otherwise fall back to monthlyData
      if (storeSummaries) {
        // Only include stores that first appeared in this month (like the modal)
        Object.values(monthlyData.storeFirstOrders).forEach(({ month: storeMonth, order: firstOrder }) => {
          if (storeMonth === month) {
            // Get the store summary for this store
            const storeSummary = storeSummaries[firstOrder.user_id];
            if (storeSummary) {
              const storeOrders = storeSummary.orders.filter((storeOrder: OrderData) => 
                storeOrder.month.toLowerCase() === month.toLowerCase()
              );
              // Calculate the store's total month profit (same as modal calculation)
              const storeMonthProfit = storeOrders.reduce((sum: number, storeOrder: OrderData) => 
                sum + (storeOrder.profit || 0), 0
              );
              totalMonthProfit += storeMonthProfit;
              storeCount += 1;
            }
          }
        });
      } else {
        // Fallback to original calculation
        Object.values(monthlyData.storeFirstOrders).forEach(({ month: storeMonth, order: firstOrder }) => {
          if (storeMonth === month) {
            const storeOrders = data.filter(dataOrder => 
              dataOrder.user_id === firstOrder.user_id && 
              dataOrder.month.toLowerCase() === month.toLowerCase()
            );
            totalMonthProfit += storeOrders.reduce((sum, storeOrder) => 
              sum + (storeOrder.profit || 0), 0
            );
            storeCount += 1;
          }
        });
      }
      return storeCount > 0 ? totalMonthProfit / storeCount : 0;
    });
    chartLabel = 'Average Profit';
  } else if (selectedMetric === 'margin') {
    // Calculate margin by dividing total month profit by total month invoice for each month
    chartData = months.map(month => {
      let totalMonthInvoice = 0;
      let totalMonthProfit = 0;
      
      // Use storeSummaries if available, otherwise fall back to monthlyData
      if (storeSummaries) {
        // Only include stores that first appeared in this month (like the modal)
        Object.values(monthlyData.storeFirstOrders).forEach(({ month: storeMonth, order: firstOrder }) => {
          if (storeMonth === month) {
            // Get the store summary for this store
            const storeSummary = storeSummaries[firstOrder.user_id];
            if (storeSummary) {
              const storeOrders = storeSummary.orders.filter((storeOrder: OrderData) => 
                storeOrder.month.toLowerCase() === month.toLowerCase()
              );
              // Calculate the store's total month invoice and profit
              const storeMonthInvoice = storeOrders.reduce((sum: number, storeOrder: OrderData) => 
                sum + (storeOrder.total_invoice || 0), 0
              );
              const storeMonthProfit = storeOrders.reduce((sum: number, storeOrder: OrderData) => 
                sum + (storeOrder.profit || 0), 0
              );
              totalMonthInvoice += storeMonthInvoice;
              totalMonthProfit += storeMonthProfit;
            }
          }
        });
      } else {
        // Fallback to original calculation
        Object.values(monthlyData.storeFirstOrders).forEach(({ month: storeMonth, order: firstOrder }) => {
          if (storeMonth === month) {
            const storeOrders = data.filter(dataOrder => 
              dataOrder.user_id === firstOrder.user_id && 
              dataOrder.month.toLowerCase() === month.toLowerCase()
            );
            totalMonthInvoice += storeOrders.reduce((sum, storeOrder) => 
              sum + (storeOrder.total_invoice || 0), 0
            );
            totalMonthProfit += storeOrders.reduce((sum, storeOrder) => 
              sum + (storeOrder.profit || 0), 0
            );
          }
        });
      }
      
      // Calculate margin as percentage
      return totalMonthInvoice > 0 ? (totalMonthProfit / totalMonthInvoice) * 100 : 0;
    });
    chartLabel = 'Margin %';
  }

  // Calculate average and find max count
  const average = chartData.length > 0 ? chartData.reduce((acc, curr) => acc + curr, 0) / chartData.length : 0;
  const maxCount = chartData.length > 0 ? Math.max(...chartData) : 0;
  const mostRecentMonth = months[months.length - 1];
  let mostRecentValue = 0;
  if (selectedMetric === 'averageInvoice' || selectedMetric === 'averageProfit' || selectedMetric === 'averageMonthInvoice' || selectedMetric === 'averageMonthProfit' || selectedMetric === 'margin') {
    mostRecentValue = chartData[chartData.length - 1] || 0;
  } else if (selectedMetric === 'totalMonthInvoice' || selectedMetric === 'totalMonthProfit' || selectedMetric === 'totalMonthOrders') {
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
      {selectedMetric === 'nooCount' ? 'new stores' : 
       selectedMetric === 'totalInvoice' || selectedMetric === 'totalMonthInvoice' ? 'invoice' : 
       selectedMetric === 'totalProfit' || selectedMetric === 'totalMonthProfit' ? 'profit' :
       selectedMetric === 'totalMonthOrders' ? 'orders' :
       selectedMetric === 'averageMonthInvoice' ? 'average invoice' :
       selectedMetric === 'averageMonthProfit' ? 'average profit' :
       selectedMetric === 'margin' ? 'margin' : 'profit'} over{" "}
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
      formatter: (val: number) => {
        if (selectedMetric === 'margin') {
          return val.toFixed(1) + '%';
        }
        return formatCurrency(val);
      },
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
        formatter: (val: number) => {
          if (selectedMetric === 'margin') {
            return val.toFixed(1) + '%';
          }
          return formatCurrency(val);
        },
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
              <MenuItem value="totalMonthInvoice">Total Invoice</MenuItem>
              <MenuItem value="totalMonthProfit">Total Profit</MenuItem>
              <MenuItem value="totalMonthOrders">Total Orders</MenuItem>
              <MenuItem value="averageMonthInvoice">Average Invoice</MenuItem>
              <MenuItem value="averageMonthProfit">Average Profit</MenuItem>
              <MenuItem value="margin">Margin %</MenuItem>
              <MenuItem value="totalInvoice">Total First Invoice</MenuItem>
              <MenuItem value="totalProfit">Total First Profit</MenuItem>
              <MenuItem value="averageInvoice">Average First Invoice</MenuItem>
              <MenuItem value="averageProfit">Average First Profit</MenuItem>
              
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
          if (selectedMetric === 'totalInvoice') return 'Current Month First Invoice';
          if (selectedMetric === 'totalProfit') return 'Current Month First Profit';
          if (selectedMetric === 'averageInvoice') return 'Current Month Avg First Invoice';
          if (selectedMetric === 'averageProfit') return 'Current Month Avg First Profit';
          if (selectedMetric === 'totalMonthInvoice') return 'Current Month Total Invoice';
          if (selectedMetric === 'totalMonthProfit') return 'Current Month Total Profit';
          if (selectedMetric === 'totalMonthOrders') return 'Current Month Total Orders';
          if (selectedMetric === 'averageMonthInvoice') return 'Current Month Avg Invoice';
          if (selectedMetric === 'averageMonthProfit') return 'Current Month Avg Profit';
          if (selectedMetric === 'margin') return 'Current Month Margin';
          return '';
        })()}
        dataItem1={(() => {
          if (selectedMetric === 'margin') {
            return mostRecentValue.toFixed(1) + '%';
          }
          return formatCurrency(mostRecentValue);
        })()}
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
                          {storeSummaries && storeSummaries[order.user_id] && selectedMonth && (
                            (() => {
                              // Calculate first month metrics for this store based on selected month
                              const storeOrders = storeSummaries[order.user_id].orders;
                              const monthOrders = storeOrders.filter((storeOrder: OrderData) => 
                                storeOrder.month.toLowerCase() === selectedMonth.toLowerCase()
                              );
                              
                              const firstMonthInvoice = monthOrders.reduce((sum: number, storeOrder: OrderData) => 
                                sum + (storeOrder.total_invoice || 0), 0
                              );
                              const firstMonthProfit = monthOrders.reduce((sum: number, storeOrder: OrderData) => 
                                sum + (storeOrder.profit || 0), 0
                              );
                              const firstMonthOrders = monthOrders.length;
                              
                              return (
                                <>
                                  <Typography variant="body2" color="text.secondary">
                                    Total Month Invoice: {formatCurrency(firstMonthInvoice)}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Total Month Profit: {formatCurrency(firstMonthProfit)}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Total Month Orders: {firstMonthOrders}
                                  </Typography>
                                </>
                              );
                            })()
                          )}
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
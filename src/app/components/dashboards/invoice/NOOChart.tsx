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

  // Process data to count unique stores per month
  const monthlyData = React.useMemo(() => {
    // First, get the first order date for each store
    const storeFirstOrders = data.reduce((acc: Record<string, string>, order) => {
      const storeId = order.user_id;
      const orderDate = new Date(order.order_date);
      const monthYear = orderDate.toLocaleString('default', { month: 'long', year: 'numeric' }).toLowerCase();
      
      if (!acc[storeId] || new Date(order.order_date) < new Date(acc[storeId])) {
        acc[storeId] = monthYear;
      }
      return acc;
    }, {});

    // Then, count stores per month
    const monthlyCounts = Object.values(storeFirstOrders).reduce((acc: Record<string, number>, month) => {
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    return monthlyCounts;
  }, [data]);

  const months = Object.keys(monthlyData).sort((a, b) => {
    const [monthA, yearA] = a.split(' ');
    const [monthB, yearB] = b.split(' ');
    const dateA = new Date(`${monthA} 1, ${yearA}`);
    const dateB = new Date(`${monthB} 1, ${yearB}`);
    return dateA.getTime() - dateB.getTime();
  });

  const nooCounts = months.map(month => monthlyData[month]);

  // Calculate average and find max count
  const average = nooCounts.reduce((acc, curr) => acc + curr, 0) / nooCounts.length;
  const maxCount = Math.max(...nooCounts);
  const mostRecentMonth = months[months.length - 1];
  const mostRecentCount = monthlyData[mostRecentMonth] || 0;

  const neutral = theme.palette.grey[300];
  const highlightColor = theme.palette.primary.main;
  const colors = months.map((month) =>
    monthlyData[month] === maxCount ? highlightColor : neutral
  );

  const insightText = (
    <span>
      Average of{" "}
      <strong style={{ color: theme.palette.primary.main }}>
        {average.toFixed(1)}
      </strong>{" "}
      new stores over{" "}
      <strong style={{ color: theme.palette.primary.main }}>
        {months.length}
      </strong>{" "}
      months
    </span>
  );

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
          console.log('Chart clicked:', config);
          if (config.dataPointIndex !== undefined) {
            handleBarClick(months[config.dataPointIndex]);
          }
        },
        dataPointClick: (event: any, chartContext: any, config: any) => {
          console.log('Data point clicked:', config);
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
      categories: months,
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

  const series = [
    {
      name: "New Ordering Outlets",
      data: nooCounts,
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
    const storeFirstOrders = data.reduce((acc: Record<string, { month: string, order: OrderData }>, order) => {
      const storeId = order.user_id;
      const orderDate = new Date(order.order_date);
      const monthYear = orderDate.toLocaleString('default', { month: 'long', year: 'numeric' }).toLowerCase();
      
      if (!acc[storeId] || new Date(order.order_date) < new Date(acc[storeId].order.order_date)) {
        acc[storeId] = { month: monthYear, order };
      }
      return acc;
    }, {});

    return Object.values(storeFirstOrders)
      .filter(store => store.month === month)
      .map(store => store.order)
      .sort((a, b) => a.store_name.localeCompare(b.store_name));
  };

  return (
    <>
      <DashboardWidgetCard
        title="New Ordering Outlets"
        subtitle={insightText}
        dataLabel1="Current Month"
        dataItem1={mostRecentCount.toString()}
        dataLabel2="Total Months"
        dataItem2={months.length.toString()}
        action={
          <Tooltip title="Download Chart">
            <IconButton onClick={handleDownload} size="small">
              <IconDownload size={20} />
            </IconButton>
          </Tooltip>
        }
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
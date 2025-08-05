"use client";
import { formatCurrency } from "@/app/utils/formatNumber";
import {
  Box,
  Dialog,
  DialogContent,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { IconDownload } from "@tabler/icons-react";
import dynamic from "next/dynamic";
import React from "react";
import DashboardCard from "../../shared/DashboardCard";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface CategorySummary {
  totalInvoice: number;
  quantity: number;
  totalPrice: number;
  itemCount: number;
  gross_profit: number;
}

interface ProductCategoryChartProps {
  isLoading?: boolean;
  categoryData: Record<string, CategorySummary>;
  selectedMonths: string;
}

type SortKey = "totalInvoice" | "gross_profit" | "quantity" | "itemCount" | "margin";

const ProductCategoryChart = ({
  isLoading,
  categoryData,
  selectedMonths,
}: ProductCategoryChartProps) => {
  const theme = useTheme();
  const [selectedCategory, setSelectedCategory] = React.useState<CategorySummary | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [sortKey, setSortKey] = React.useState<SortKey>("totalInvoice");
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const handleBarClick = (event: any, chartContext: any, config: any) => {
    const categoryName = categories[config.dataPointIndex];
    const categoryDetails = categoryData[categoryName];
    setSelectedCategory(categoryDetails);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedCategory(null);
  };

  // Sort categories based on selected key
  const sortedCategories = Object.entries(categoryData || {})
    .sort(([, a], [, b]) => {
      if (!a || !b) return 0;
      
      switch (sortKey) {
        case "totalInvoice":
          return b.totalInvoice - a.totalInvoice;
        case "gross_profit":
          return b.gross_profit - a.gross_profit;
        case "quantity":
          return b.quantity - a.quantity;
        case "itemCount":
          return b.itemCount - a.itemCount;
        case "margin":
          const marginA = a.totalInvoice > 0 ? (a.gross_profit / a.totalInvoice) * 100 : 0;
          const marginB = b.totalInvoice > 0 ? (b.gross_profit / b.totalInvoice) * 100 : 0;
          return marginB - marginA;
        default:
          return 0;
      }
    })
    .map(([key]) => key);

  const categories = sortedCategories;
  const values = categories.map((category) => {
    const data = categoryData?.[category];
    if (!data) return 0;

    switch (sortKey) {
      case "totalInvoice":
        return data.totalInvoice || 0;
      case "gross_profit":
        return data.gross_profit || 0;
      case "quantity":
        return data.quantity || 0;
      case "itemCount":
        return data.itemCount || 0;
      case "margin":
        return data.totalInvoice && data.totalInvoice > 0 ? ((data.gross_profit || 0) / data.totalInvoice) * 100 : 0;
      default:
        return 0;
    }
  });

  const isSmallScreen = useMediaQuery(theme.breakpoints.down("lg"));

  const getMetricLabel = (metric: SortKey) => {
    switch (metric) {
      case "totalInvoice":
        return "Total Invoice";
      case "gross_profit":
        return "Total Profit";
      case "quantity":
        return "Total Quantity";
      case "itemCount":
        return "Item Count";
      case "margin":
        return "Margin %";
      default:
        return "";
    }
  };

  const optionscolumnchart: any = {
    chart: {
      id: "product-category-chart",
      type: "bar",
      fontFamily: "'Plus Jakarta Sans', sans-serif;",
      foreColor: theme.palette.mode === "dark" ? "#adb0bb" : "#111",
      toolbar: {
        show: false,
      },
      height: 280,
      events: {
        dataPointSelection: handleBarClick,
      },
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: "45%",
        distributed: true,
        endingShape: "rounded",
        cursor: "pointer",
      },
    },
    colors: [theme.palette.primary.main],
    dataLabels: {
      formatter: (val: number) => {
        if (sortKey === "margin") {
          return val.toFixed(1) + '%';
        }
        if (sortKey === "totalInvoice" || sortKey === "gross_profit") {
          return formatCurrency(val);
        }
        return val;
      },
      style: {
        fontSize: "12px",
        colors: [theme.palette.mode === "dark" ? "#fff" : "#111"],
      },
    },
    legend: {
      show: false,
    },
    grid: {
      show: false,
    },
    xaxis: {
      categories: categories,
      labels: {
        show: !isSmallScreen,
        style: {
          fontSize: "12px",
          colors: theme.palette.mode === "dark" ? "#adb0bb" : "#111",
        },
      },
    },
    yaxis: {
      labels: {
        formatter: (val: number) => {
          if (sortKey === "margin") {
            return val.toFixed(1) + '%';
          }
          if (sortKey === "totalInvoice" || sortKey === "gross_profit") {
            return formatCurrency(val);
          }
          return val;
        },
        style: {
          colors: theme.palette.mode === "dark" ? "#adb0bb" : "#111",
        },
      },
    },
    tooltip: {
      theme: theme.palette.mode,
      style: {
        fontSize: "12px",
      },
      y: {
        formatter: (val: number) => {
          if (sortKey === "margin") {
            return val.toFixed(1) + '%';
          }
          if (sortKey === "totalInvoice" || sortKey === "gross_profit") {
            return formatCurrency(val);
          }
          return val;
        },
      },
    },
  };

  const seriescolumnchart = [
    {
      name: getMetricLabel(sortKey),
      data: values,
    },
  ];

  const handleDownload = async () => {
    if (!isClient) return;

    const ApexCharts = (await import("apexcharts")).default;
    const dateRange = `for ${selectedMonths}`;

    ApexCharts.exec("product-category-chart", "updateOptions", {
      title: {
        text: ["Product Category Performance", dateRange],
        align: "center",
        style: {
          fontSize: "16px",
          fontWeight: 600,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          color: theme.palette.mode === "dark" ? "#fff" : "#111",
        },
      },
    }).then(() => {
      ApexCharts.exec("product-category-chart", "dataURI").then(
        (response: { imgURI: string }) => {
          ApexCharts.exec("product-category-chart", "updateOptions", {
            title: { text: undefined },
          });

          const downloadLink = document.createElement("a");
          downloadLink.href = response.imgURI;
          downloadLink.download = `Product_Category_Performance_${new Date().toLocaleDateString()}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }
      );
    });
  };

  return (
    <>
      <DashboardCard
        title="Product Category Performance"
        action={
          <Box display="flex" alignItems="center" gap={2}>
            <Tooltip title="Download Chart">
              <IconButton onClick={handleDownload} size="small">
                <IconDownload size={20} />
              </IconButton>
            </Tooltip>
            <Select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              size="small"
            >
              <MenuItem value="totalInvoice">Total Invoice</MenuItem>
              <MenuItem value="gross_profit">Total Profit</MenuItem>
              <MenuItem value="quantity">Total Quantity</MenuItem>
              <MenuItem value="itemCount">Item Count</MenuItem>
              <MenuItem value="margin">Margin %</MenuItem>
            </Select>
          </Box>
        }
      >
        <Box height="300px">
          <Chart
            options={optionscolumnchart}
            series={seriescolumnchart}
            type="bar"
            height={280}
            width={"100%"}
          />
        </Box>
      </DashboardCard>

      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          {selectedCategory && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Category Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1">Summary</Typography>
                    <Stack spacing={1} mt={1}>
                      <Typography>Total Invoice: {formatCurrency(selectedCategory.totalInvoice)}</Typography>
                      <Typography>Total Profit: {formatCurrency(selectedCategory.gross_profit)}</Typography>
                      <Typography>Total Quantity: {selectedCategory.quantity}</Typography>
                      <Typography>Item Count: {selectedCategory.itemCount}</Typography>
                      <Typography>Average Price: {formatCurrency(selectedCategory.totalPrice / selectedCategory.itemCount)}</Typography>
                    </Stack>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1">Performance Metrics</Typography>
                    <Stack spacing={1} mt={1}>
                      <Typography>Margin: {selectedCategory.totalInvoice > 0 ? ((selectedCategory.gross_profit / selectedCategory.totalInvoice) * 100).toFixed(2) : 0}%</Typography>
                      <Typography>Average Quantity per Item: {(selectedCategory.quantity / selectedCategory.itemCount).toFixed(2)}</Typography>
                      <Typography>Average Invoice per Item: {formatCurrency(selectedCategory.totalInvoice / selectedCategory.itemCount)}</Typography>
                      <Typography>Average Profit per Item: {formatCurrency(selectedCategory.gross_profit / selectedCategory.itemCount)}</Typography>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductCategoryChart; 
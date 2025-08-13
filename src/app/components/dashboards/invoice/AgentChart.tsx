"use client";
import { AgentData } from "@/app/(DashboardLayout)/distribusi/sales/types";
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

interface AgentChartProps {
  isLoading?: boolean;
  agentData: Record<string, AgentData>;
  monthlyAgentData?: { [month: string]: Record<string, AgentData> };
  selectedMonths: string;
}

type SortKey = "totalInvoice" | "totalProfit" | "totalOrders" | "totalCOD" | "totalTOP" | "averageInvoice" | "averageProfit" | "margin";

const AgentChart = ({
  isLoading,
  agentData,
  monthlyAgentData,
  selectedMonths,
}: AgentChartProps) => {
  const theme = useTheme();
  const [selectedAgent, setSelectedAgent] = React.useState<AgentData | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [sortKey, setSortKey] = React.useState<SortKey>("totalInvoice");
  const [selectedMonth, setSelectedMonth] = React.useState<string>("");
  const [isClient, setIsClient] = React.useState(false);

  // Get available months for dropdown (sorted in descending order)
  const availableMonths = React.useMemo(() => {
    if (!monthlyAgentData) return [];
    return Object.keys(monthlyAgentData).sort((a, b) => {
      const [monthA, yearA] = a.split(" ");
      const [monthB, yearB] = b.split(" ");
      const dateA = new Date(`${monthA} 1, ${yearA}`);
      const dateB = new Date(`${monthB} 1, ${yearB}`);
      return dateB.getTime() - dateA.getTime(); // Sort descending (most recent first)
    });
  }, [monthlyAgentData]);

  React.useEffect(() => {
    if (availableMonths.length > 0 && !selectedMonth) {
      setSelectedMonth(availableMonths[0]); // Set to most recent month
    }
  }, [availableMonths, selectedMonth]);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const getCurrentAgentData = () => {
    if (selectedMonth && monthlyAgentData && monthlyAgentData[selectedMonth]) {
      return monthlyAgentData[selectedMonth];
    }
    return {};
  };

  const handleBarClick = (event: any, chartContext: any, config: any) => {
    const agentName = agents[config.dataPointIndex];
    const currentAgentData = getCurrentAgentData();
    const agentDetails = currentAgentData[agentName];
    setSelectedAgent(agentDetails);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedAgent(null);
  };

  const currentAgentData = getCurrentAgentData();

  // Sort agents based on selected key
  const sortedAgents = Object.entries(currentAgentData)
    .sort(([, a], [, b]) => {
      switch (sortKey) {
        case "totalInvoice":
          return b.totalInvoice - a.totalInvoice;
        case "totalProfit":
          return b.totalProfit - a.totalProfit;
        case "totalOrders":
          return b.totalOrders - a.totalOrders;
        case "totalCOD":
          return b.totalCOD - a.totalCOD;
        case "totalTOP":
          return b.totalTOP - a.totalTOP;
        case "averageInvoice":
          return (b.totalInvoice / b.totalOrders) - (a.totalInvoice / a.totalOrders);
        case "averageProfit":
          return (b.totalProfit / b.totalOrders) - (a.totalProfit / a.totalOrders);
        case "margin":
          return (b.totalProfit / b.totalInvoice) - (a.totalProfit / a.totalInvoice);
        default:
          return 0;
      }
    })
    .map(([key]) => key);

  const agents = sortedAgents;
  const values = agents.map((agent) => {
    const data = currentAgentData[agent];
    switch (sortKey) {
      case "totalInvoice":
        return data.totalInvoice;
      case "totalProfit":
        return data.totalProfit;
      case "totalOrders":
        return data.totalOrders;
      case "totalCOD":
        return data.totalCOD;
      case "totalTOP":
        return data.totalTOP;
      case "averageInvoice":
        return data.totalInvoice / data.totalOrders;
      case "averageProfit":
        return data.totalProfit / data.totalOrders;
      case "margin":
        return data.totalInvoice > 0 ? (data.totalProfit / data.totalInvoice) * 100 : 0;
      default:
        return 0;
    }
  });

  const isSmallScreen = useMediaQuery(theme.breakpoints.down("lg"));

  const getMetricLabel = (metric: SortKey) => {
    switch (metric) {
      case "totalInvoice":
        return "Total Invoice";
      case "totalProfit":
        return "Total Profit";
      case "totalOrders":
        return "Total Orders";
      case "totalCOD":
        return "Total COD";
      case "totalTOP":
        return "Total TOP";
      case "averageInvoice":
        return "Average Invoice";
      case "averageProfit":
        return "Average Profit";
      case "margin":
        return "Margin %";
      default:
        return "";
    }
  };

  const optionscolumnchart: any = {
    chart: {
      id: "agent-performance-chart",
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
    title: {
      align: "center",
      style: {
        fontSize: "16px",
        fontWeight: 600,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        color: theme.palette.mode === "dark" ? "#fff" : "#111",
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
        if (sortKey === "totalInvoice" || sortKey === "totalProfit" || 
            sortKey === "totalCOD" || sortKey === "totalTOP" ||
            sortKey === "averageInvoice" || sortKey === "averageProfit") {
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
      categories: agents,
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
          if (sortKey === "totalInvoice" || sortKey === "totalProfit" || 
              sortKey === "totalCOD" || sortKey === "totalTOP" ||
              sortKey === "averageInvoice" || sortKey === "averageProfit") {
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
          if (sortKey === "totalInvoice" || sortKey === "totalProfit" || 
              sortKey === "totalCOD" || sortKey === "totalTOP" ||
              sortKey === "averageInvoice" || sortKey === "averageProfit") {
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

    ApexCharts.exec("agent-performance-chart", "updateOptions", {
      title: {
        text: ["Agent Performance", dateRange],
        align: "center",
        style: {
          fontSize: "16px",
          fontWeight: 600,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          color: theme.palette.mode === "dark" ? "#fff" : "#111",
        },
      },
    }).then(() => {
      ApexCharts.exec("agent-performance-chart", "dataURI").then(
        (response: { imgURI: string }) => {
          ApexCharts.exec("agent-performance-chart", "updateOptions", {
            title: { text: undefined },
          });

          const downloadLink = document.createElement("a");
          downloadLink.href = response.imgURI;
          downloadLink.download = `Agent_Performance_${new Date().toLocaleDateString()}.png`;
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
        title="Agent Performance"
        action={
          <Box display="flex" alignItems="center" gap={2}>
            <Tooltip title="Download Chart">
              <IconButton onClick={handleDownload} size="small">
                <IconDownload size={20} />
              </IconButton>
            </Tooltip>
            {availableMonths.length > 0 && (
              <Select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                size="small"
                sx={{ minWidth: '120px' }}
              >
                {availableMonths.map((month) => (
                  <MenuItem key={month} value={month}>
                    {month}
                  </MenuItem>
                ))}
              </Select>
            )}
            <Select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              size="small"
            >
              <MenuItem value="totalInvoice">Total Invoice</MenuItem>
              <MenuItem value="totalProfit">Total Profit</MenuItem>
              <MenuItem value="totalOrders">Total Orders</MenuItem>
              <MenuItem value="totalCOD">Total COD</MenuItem>
              <MenuItem value="totalTOP">Total TOP</MenuItem>
              <MenuItem value="averageInvoice">Average Invoice</MenuItem>
              <MenuItem value="averageProfit">Average Profit</MenuItem>
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
          {selectedAgent && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedAgent.name} - Agent Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1">Summary</Typography>
                    <Stack spacing={1} mt={1}>
                      <Typography>Total Orders: {selectedAgent.totalOrders}</Typography>
                      <Typography>Total Invoice: {formatCurrency(selectedAgent.totalInvoice)}</Typography>
                      <Typography>Total Profit: {formatCurrency(selectedAgent.totalProfit)}</Typography>
                      <Typography>Average Invoice: {formatCurrency(selectedAgent.totalInvoice / selectedAgent.totalOrders)}</Typography>
                      <Typography>Average Profit: {formatCurrency(selectedAgent.totalProfit / selectedAgent.totalOrders)}</Typography>
                    </Stack>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1">Payment Details</Typography>
                    <Stack spacing={1} mt={1}>
                      <Typography>Total COD: {formatCurrency(selectedAgent.totalCOD)}</Typography>
                      <Typography>Total TOP: {formatCurrency(selectedAgent.totalTOP)}</Typography>
                      <Typography>Total Lunas: {formatCurrency(selectedAgent.totalLunas)}</Typography>
                      <Typography>Total Belum Lunas: {formatCurrency(selectedAgent.totalBelumLunas)}</Typography>
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

export default AgentChart; 
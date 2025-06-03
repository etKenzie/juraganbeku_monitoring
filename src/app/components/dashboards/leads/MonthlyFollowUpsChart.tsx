"use client";
import { FollowUp } from "@/app/types/leads";
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
import DashboardCard from "../../shared/DashboardCard";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

type TimePeriod = 'weekly' | 'monthly';

interface MonthlyFollowUpsChartProps {
  data: FollowUp[];
}

interface ChartDataItem {
  timeKey: string;
  label: string;
  count: number;
}

const MonthlyFollowUpsChart = ({ data }: MonthlyFollowUpsChartProps) => {
  const theme = useTheme();
  const [isClient, setIsClient] = React.useState(false);
  const [timePeriod, setTimePeriod] = React.useState<TimePeriod>('monthly');

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const chartId = React.useMemo(
    () => `monthly-followups-chart-${Math.random().toString(36).substr(2, 9)}`,
    []
  );

  // Helper function to get week of month
  function getWeekOfMonth(date: Date): number {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const dayOfWeek = firstDay.getDay();
    const diff = date.getDate() + dayOfWeek - 1;
    return Math.ceil(diff / 7);
  }

  // Process data to get follow-ups count by time period
  const processedData = data.reduce((acc: { timeKey: string; count: number }[], followUp) => {
    const date = new Date(followUp.date);
    const weekNum = getWeekOfMonth(date);
    const timeKey = timePeriod === 'weekly' 
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${weekNum}`
      : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const existingTime = acc.find(item => item.timeKey === timeKey);
    
    if (existingTime) {
      existingTime.count++;
    } else {
      acc.push({ timeKey, count: 1 });
    }
    
    return acc;
  }, []).sort((a, b) => a.timeKey.localeCompare(b.timeKey));

  const chartData = processedData.map((item): ChartDataItem => {
    if (timePeriod === 'weekly') {
      const [year, month, week] = item.timeKey.split('-');
      const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'short' });
      return {
        timeKey: item.timeKey,
        label: `W${week} ${monthName}, ${year}`,
        count: item.count
      };
    }
    return {
      timeKey: item.timeKey,
      label: new Date(item.timeKey + '-01').toLocaleString('default', { month: 'short', year: 'numeric' }),
      count: item.count
    };
  });

  const options: any = {
    chart: {
      id: chartId,
      type: "line",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      foreColor: theme.palette.mode === "dark" ? "#adb0bb" : "#111",
      toolbar: {
        show: false,
      },
    },
    stroke: {
      width: 3,
      curve: 'smooth',
    },
    markers: {
      size: 4,
      strokeWidth: 0,
      hover: {
        size: 6,
      },
    },
    colors: [theme.palette.secondary.main],
    dataLabels: {
      enabled: true,
      style: {
        fontSize: "14px",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        colors: [theme.palette.mode === "dark" ? "#fff" : "#111"],
      },
    },
    legend: {
      show: false
    },
    grid: {
      borderColor: theme.palette.mode === "dark" ? "#333" : "#e0e0e0",
      strokeDashArray: 4,
    },
    xaxis: {
      categories: chartData.map(item => item.label),
      labels: {
        style: {
          fontSize: "14px",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          colors: theme.palette.mode === "dark" ? "#adb0bb" : "#111",
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: theme.palette.mode === "dark" ? "#adb0bb" : "#111",
          fontSize: "14px",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        },
      },
    },
    tooltip: {
      theme: theme.palette.mode,
      y: {
        formatter: function (val: number) {
          return val + " follow-ups";
        }
      }
    },
  };

  const series = [{
    name: "Number of Follow-ups",
    data: chartData.map(item => Number(item.count))
  }];

  const handleDownload = async () => {
    if (!isClient) return;

    const ApexCharts = (await import("apexcharts")).default;

    ApexCharts.exec(chartId, "updateOptions", {
      title: {
        text: `Follow-ups Trend (${timePeriod === 'weekly' ? 'Weekly' : 'Monthly'})`,
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
        downloadLink.download = `Followups_Trend_${timePeriod}_${new Date().toLocaleDateString()}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      });
    });
  };

  return (
    <DashboardCard
      title={`Follow-ups Trend (${timePeriod === 'weekly' ? 'Weekly' : 'Monthly'})`}
      action={
        <Box display="flex" alignItems="center" gap={2}>
          <ToggleButtonGroup
            value={timePeriod}
            exclusive
            onChange={(_, value) => value && setTimePeriod(value)}
            size="small"
          >
            <ToggleButton value="weekly">Weekly</ToggleButton>
            <ToggleButton value="monthly">Monthly</ToggleButton>
          </ToggleButtonGroup>
          <Tooltip title="Download Chart">
            <IconButton onClick={handleDownload} size="small">
              <IconDownload size={20} />
            </IconButton>
          </Tooltip>
        </Box>
      }
    >
      <Box height="400px">
        {isClient && (
          <Chart
            options={options}
            series={series}
            type="line"
            height={350}
            width="100%"
          />
        )}
      </Box>
    </DashboardCard>
  );
};

export default MonthlyFollowUpsChart; 
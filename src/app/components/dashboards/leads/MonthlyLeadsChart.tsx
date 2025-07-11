"use client";
import { Lead } from "@/app/types/leads";
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

interface MonthlyLeadsChartProps {
  data: Lead[];
}

interface ChartDataItem {
  timeKey: string;
  label: string;
  [key: string]: string | number;
}

const MonthlyLeadsChart = ({ data }: MonthlyLeadsChartProps) => {
  const theme = useTheme();
  const [isClient, setIsClient] = React.useState(false);
  const [timePeriod, setTimePeriod] = React.useState<TimePeriod>('monthly');

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const chartId = React.useMemo(
    () => `monthly-leads-chart-${Math.random().toString(36).substr(2, 9)}`,
    []
  );

  // Helper function to get week of month
  function getWeekOfMonth(date: Date): number {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const dayOfWeek = firstDay.getDay();
    const diff = date.getDate() + dayOfWeek - 1;
    return Math.ceil(diff / 7);
  }

  // Process data to get leads count by creator and time period
  const processedData = data.reduce((acc: Record<string, Record<string, number>>, lead) => {
    const date = new Date(lead.date_added);
    const weekNum = getWeekOfMonth(date);
    const timeKey = timePeriod === 'weekly' 
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${weekNum}`
      : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const creators = Array.isArray(lead.found_by) ? lead.found_by : [lead.found_by];
    
    if (!acc[timeKey]) {
      acc[timeKey] = {};
    }
    
    creators.forEach(creator => {
      if (!acc[timeKey][creator]) {
        acc[timeKey][creator] = 0;
      }
      acc[timeKey][creator]++;
    });
    
    return acc;
  }, {});

  // Get unique creators
  const creators = Array.from(new Set(data.flatMap(lead => 
    Array.isArray(lead.found_by) ? lead.found_by : [lead.found_by]
  )));

  // Convert to array format for the chart
  const chartData = Object.entries(processedData)
    .map(([timeKey, creators]): ChartDataItem => {
      if (timePeriod === 'weekly') {
        const [year, month, week] = timeKey.split('-');
        const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'short' });
        return {
          timeKey,
          label: `W${week} ${monthName}, ${year}`,
          ...creators
        };
      }
      return {
        timeKey,
        label: new Date(timeKey + '-01').toLocaleString('default', { month: 'short', year: 'numeric' }),
        ...creators
      };
    })
    .sort((a, b) => a.timeKey.localeCompare(b.timeKey));

  const options: any = {
    chart: {
      id: chartId,
      type: "bar",
      stacked: true,
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      foreColor: theme.palette.mode === "dark" ? "#adb0bb" : "#111",
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        endingShape: 'rounded'
      },
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: "14px",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        colors: [theme.palette.mode === "dark" ? "#fff" : "#111"],
      },
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
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
      title: {
        text: 'Number of Leads'
      },
      labels: {
        style: {
          colors: theme.palette.mode === "dark" ? "#adb0bb" : "#111",
          fontSize: "14px",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        },
      },
    },
    fill: {
      opacity: 1
    },
    tooltip: {
      theme: theme.palette.mode,
      y: {
        formatter: function (val: number) {
          return val + " leads";
        }
      }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      offsetX: 40
    },
    colors: ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe']
  };

  const series = creators.map(creator => ({
    name: creator,
    data: chartData.map(item => Number(item[creator] || 0))
  }));

  const handleDownload = async () => {
    if (!isClient) return;

    const ApexCharts = (await import("apexcharts")).default;

    ApexCharts.exec(chartId, "updateOptions", {
      title: {
        text: `Leads Distribution (${timePeriod === 'weekly' ? 'Weekly' : 'Monthly'})`,
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
        downloadLink.download = `Leads_Distribution_${timePeriod}_${new Date().toLocaleDateString()}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      });
    });
  };

  return (
    <DashboardCard
      title={`Leads Distribution (${timePeriod === 'weekly' ? 'Weekly' : 'Monthly'})`}
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
            type="bar"
            height={350}
            width="100%"
          />
        )}
      </Box>
    </DashboardCard>
  );
};

export default MonthlyLeadsChart; 
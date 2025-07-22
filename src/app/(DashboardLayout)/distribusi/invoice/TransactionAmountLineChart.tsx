import { formatCurrency } from "@/app/utils/formatNumber";
import { Box, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import React, { useMemo, useState } from "react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface TransactionAmountLineChartProps {
  rawTransactions: any[]; // array of transaction objects
}

const colors = [
  "#1976d2", "#d32f2f", "#388e3c", "#fbc02d", "#7b1fa2", "#0288d1", "#c2185b", "#ffa000", "#388e3c", "#303f9f"
];

const TransactionAmountLineChart: React.FC<TransactionAmountLineChartProps> = ({ rawTransactions }) => {
  const [view, setView] = useState<'total' | 'area'>('total');

  // Get all months in the data, sorted chronologically
  const months = useMemo(() => {
    const set = new Set<string>();
    rawTransactions.forEach(t => {
      if (t.month) set.add(t.month);
    });
    return Array.from(set).sort((a, b) => new Date("1 " + a).getTime() - new Date("1 " + b).getTime());
  }, [rawTransactions]);

  // Get all areas in the data
  const areas = useMemo(() => {
    const set = new Set<string>();
    rawTransactions.forEach(t => {
      if (t.area) set.add(t.area);
      else if (t.Area) set.add(t.Area);
    });
    return Array.from(set);
  }, [rawTransactions]);

  // Data for total (all areas combined)
  const totalSeries = useMemo(() => {
    const monthMap = new Map<string, number>();
    rawTransactions.forEach(t => {
      if (!t.month) return;
      const amount = Number(t.amount) || 0;
      monthMap.set(t.month, (monthMap.get(t.month) || 0) + amount);
    });
    return months.map(month => monthMap.get(month) || 0);
  }, [rawTransactions, months]);

  // Data for by area
  const areaSeries = useMemo(() => {
    // { area: { month: amount } }
    const areaMap: Record<string, Record<string, number>> = {};
    rawTransactions.forEach(t => {
      const area = t.area || t.Area || "Unknown";
      if (!t.month) return;
      if (!areaMap[area]) areaMap[area] = {};
      areaMap[area][t.month] = (areaMap[area][t.month] || 0) + (Number(t.amount) || 0);
    });
    return areas.map((area, idx) => ({
      name: area,
      data: months.map(month => areaMap[area]?.[month] || 0),
      color: colors[idx % colors.length],
    }));
  }, [rawTransactions, months, areas]);

  const options: ApexOptions = {
    chart: {
      id: "transaction-amount-line-chart",
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    xaxis: {
      categories: months,
      title: { text: "Month" },
      labels: { rotate: -45 },
    },
    yaxis: {
      title: { text: "Total Amount" },
      labels: {
        formatter: (val: number) => formatCurrency(val),
      },
    },
    tooltip: {
      y: {
        formatter: (val: number) => formatCurrency(val),
      },
    },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    markers: {
      size: 4,
    },
    colors: view === 'area' ? areaSeries.map(s => s.color) : [colors[0]],
    dataLabels: { enabled: false },
    grid: { strokeDashArray: 4 },
    legend: { show: view === 'area' },
  };

  const series = view === 'total'
    ? [{ name: "Total Transaction Amount", data: totalSeries }]
    : areaSeries;

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Transaction Amount by Month</Typography>
        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={(_, val) => val && setView(val)}
          size="small"
        >
          <ToggleButton value="total">Total</ToggleButton>
          <ToggleButton value="area">By Area</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Chart options={options} series={series} type="line" height={320} />
    </Box>
  );
};

export default TransactionAmountLineChart; 
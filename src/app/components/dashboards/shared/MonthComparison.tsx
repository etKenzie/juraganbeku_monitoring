import { getSimpleWeekKey, getWeekKey } from "@/app/(DashboardLayout)/distribusi/sales/data";
import { Box, FormControl, InputLabel, MenuItem, Paper, Select, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { useMemo, useState } from "react";

// Define the metrics to compare (should match your SummaryTiles)
const METRICS = [
  { key: "totalInvoice", label: "Total Invoice", isCurrency: true },
  { key: "totalProfit", label: "Total Profit", isCurrency: true },
  { key: "activeStores", label: "Active Stores", isCurrency: false },
  { key: "totalOrders", label: "Total Orders", isCurrency: false },
  { key: "margin", label: "Margin", isCurrency: false },
  { key: "activationRate", label: "Activation Rate", isCurrency: false },
];

interface MonthComparisonProps {
  processedData: any; // Replace with your ProcessedData type if available
  availableMonths?: string[];
}

interface MonthMetrics {
  totalInvoice: number;
  totalProfit: number;
  activeStores: number;
  totalOrders: number;
  margin: string;
  activationRate: string;
  weekInvoices: Record<string, number>; // e.g. { 'W1': 12345, ... }
}

function formatValue(val: any, isCurrency: boolean) {
  if (val === undefined || val === null) return "-";
  if (isCurrency) return `Rp ${Number(val).toLocaleString()}`;
  if (typeof val === "number") return val.toLocaleString();
  return val;
}

export default function MonthComparison({ processedData, availableMonths }: MonthComparisonProps) {
  // Extract months from processedData if not provided
  const months = useMemo(() => {
    if (availableMonths && availableMonths.length > 0) return availableMonths;
    if (!processedData) return [];
    return Object.keys(processedData.monthlyStoreCounts || {});
  }, [availableMonths, processedData]);

  const [month1, setMonth1] = useState<string>(months[0] || "");
  const [month2, setMonth2] = useState<string>(months[1] || "");

  // Use the same areaKey logic as the dashboard
  // Fallback to "NATIONAL" if not found
  const areaKey = processedData?.areaKey || "NATIONAL";

  // Helper to get metrics for a month
  function getMetrics(month: string): MonthMetrics {
    if (!processedData) return {
      totalInvoice: 0,
      totalProfit: 0,
      activeStores: 0,
      totalOrders: 0,
      margin: "-",
      activationRate: "-",
      weekInvoices: {},
    };
    // Total Invoice and Total Profit from chartData (sum for the month)
    const chartData = processedData.chartData?.filter((d: any) => d.month === month) || [];
    const totalInvoice = chartData.reduce((sum: number, d: any) => sum + (d.totalInvoice || 0), 0);
    const totalProfit = chartData.reduce((sum: number, d: any) => sum + (d.totalProfit || 0), 0);
    // Orders and stores
    const totalOrders = processedData.monthlyOrderCounts?.[month] || 0;
    const activeStores = processedData.monthlyStoreCounts?.[month]?.size || 0;
    // Margin
    const margin = (!totalInvoice || totalInvoice === 0) ? "-" : ((totalProfit / totalInvoice) * 100).toFixed(2) + "%";
    // Activation rate
    const activationRate = (!activeStores || !processedData.storeSummaries) ? "-" : ((activeStores / Object.keys(processedData.storeSummaries).length) * 100).toFixed(2) + "%";
    // Week invoices using centralized weekly data
    const weekInvoices: Record<string, number> = {};
    
    // Filter weeklyData for this month and convert to simple week keys
    if (processedData.weeklyData) {
      Object.entries(processedData.weeklyData).forEach(([weekKey, data]) => {
        const weekData = data as { totalInvoice: number; totalProfit: number };
        // Check if this week belongs to the selected month
        const weekChartData = chartData.filter((d: any) => {
          const date = new Date(d.date);
          const fullWeekKey = getWeekKey(date); // Use the full week key for comparison
          return fullWeekKey === weekKey;
        });
        
        if (weekChartData.length > 0) {
          // Convert to simple week key (W1, W2, etc.)
          const simpleKey = getSimpleWeekKey(new Date(weekChartData[0].date));
          weekInvoices[simpleKey] = weekData.totalInvoice;
        }
      });
    }
    
    return {
      totalInvoice,
      totalProfit,
      activeStores,
      totalOrders,
      margin,
      activationRate,
      weekInvoices,
    };
  }

  const metrics1 = getMetrics(month1);
  const metrics2 = getMetrics(month2);

  // Collect all week keys from both months, sorted
  const allWeekKeys = useMemo(() => {
    const keys = new Set([
      ...Object.keys(metrics1.weekInvoices),
      ...Object.keys(metrics2.weekInvoices),
    ]);
    // Sort by week number (W1, W2, ...)
    return Array.from(keys).sort((a, b) => {
      const wa = Number(a.replace('W', ''));
      const wb = Number(b.replace('W', ''));
      return wa - wb;
    });
  }, [metrics1, metrics2]);

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" mb={2}>Compare Months</Typography>
      <Box display="flex" gap={2} mb={2}>
        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel>Month 1</InputLabel>
          <Select value={month1} onChange={e => setMonth1(e.target.value as string)} label="Month 1">
            {months.map((m: string) => (
              <MenuItem key={m} value={m}>{m}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel>Month 2</InputLabel>
          <Select value={month2} onChange={e => setMonth2(e.target.value as string)} label="Month 2">
            {months.map((m: string) => (
              <MenuItem key={m} value={m}>{m}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Metric</TableCell>
            <TableCell>{month1}</TableCell>
            <TableCell>{month2}</TableCell>
            <TableCell>Difference</TableCell>
            <TableCell>% Change</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {METRICS.map(metric => {
            const v1 = metrics1[metric.key as keyof MonthMetrics];
            const v2 = metrics2[metric.key as keyof MonthMetrics];
            const diff = (typeof v1 === "number" && typeof v2 === "number") ? v2 - v1 : "-";
            const pct = (typeof v1 === "number" && typeof v2 === "number" && v1 !== 0) ? (((v2 - v1) / v1) * 100).toFixed(1) + "%" : "-";
            return (
              <TableRow key={metric.key}>
                <TableCell>{metric.label}</TableCell>
                <TableCell>{formatValue(v1, metric.isCurrency)}</TableCell>
                <TableCell>{formatValue(v2, metric.isCurrency)}</TableCell>
                <TableCell>{typeof diff === "number" ? formatValue(diff, metric.isCurrency) : diff}</TableCell>
                <TableCell>{pct}</TableCell>
              </TableRow>
            );
          })}
          {/* Add week invoice rows dynamically */}
          {allWeekKeys.map((key) => {
            const v1 = metrics1.weekInvoices[key] || 0;
            const v2 = metrics2.weekInvoices[key] || 0;
            const diff = (typeof v1 === "number" && typeof v2 === "number") ? v2 - v1 : "-";
            const pct = (typeof v1 === "number" && typeof v2 === "number" && v1 !== 0) ? (((v2 - v1) / v1) * 100).toFixed(1) + "%" : "-";
            return (
              <TableRow key={key}>
                <TableCell>{key}</TableCell>
                <TableCell>{formatValue(v1, true)}</TableCell>
                <TableCell>{formatValue(v2, true)}</TableCell>
                <TableCell>{typeof diff === "number" ? formatValue(diff, true) : diff}</TableCell>
                <TableCell>{pct}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Paper>
  );
} 
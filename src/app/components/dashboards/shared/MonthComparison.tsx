import { formatCurrency } from "@/app/utils/formatNumber";
import { Box, FormControl, InputLabel, MenuItem, Paper, Select, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { useMemo, useState } from "react";

// Define the metrics to compare (removed activation rate)
const METRICS = [
  { key: "totalInvoice", label: "Total Invoice", isCurrency: true },
  { key: "totalProfit", label: "Total Profit", isCurrency: true },
  { key: "activeStores", label: "Active Stores", isCurrency: false },
  { key: "totalOrders", label: "Total Orders", isCurrency: false },
  { key: "margin", label: "Margin", isCurrency: false },
];

interface MonthComparisonProps {
  processedData: any; // Replace with your ProcessedData type if available
  availableMonths?: string[];
}

interface WeekMetrics {
  totalInvoice: number;
  totalProfit: number;
  activeStores: number;
  totalOrders: number;
  margin: string;
}

interface MonthMetrics {
  weeks: Record<string, WeekMetrics>; // e.g. { 'W1': { totalInvoice: 12345, ... }, ... }
  monthly: {
    totalInvoice: number;
    totalProfit: number;
    activeStores: number;
    totalOrders: number;
    margin: string;
  };
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
      weeks: {},
      monthly: {
        totalInvoice: 0,
        totalProfit: 0,
        activeStores: 0,
        totalOrders: 0,
        margin: "-",
      },
    };

    // Initialize weekly metrics
    const weeks: Record<string, WeekMetrics> = {};
    const weekKeys = ['W1', 'W2', 'W3', 'W4', 'W5'];
    
    // Initialize all weeks with default values
    weekKeys.forEach(weekKey => {
      weeks[weekKey] = {
        totalInvoice: 0,
        totalProfit: 0,
        activeStores: 0,
        totalOrders: 0,
        margin: "-",
      };
    });

    // Use enhanced weeklyData directly from processedData
    if (processedData.weeklyData) {
      Object.entries(processedData.weeklyData).forEach(([weekKey, data]) => {
        const weekData = data as { 
          totalInvoice: number; 
          totalProfit: number; 
          activeStores: number; 
          totalOrders: number; 
          margin: string; 
        };
        
        // Check if this week belongs to the selected month by parsing the week key
        // weekKey format: "APR W1", "FEB W2", etc.
        const weekKeyParts = weekKey.split(' ');
        if (weekKeyParts.length >= 2) {
          const monthAbbr = weekKeyParts[0]; // e.g., "APR", "FEB"
          
          // Convert month abbreviation to full month name
          const monthMap: { [key: string]: string } = {
            'JAN': 'january', 'FEB': 'february', 'MAR': 'march', 'APR': 'april',
            'MAY': 'may', 'JUN': 'june', 'JUL': 'july', 'AUG': 'august',
            'SEP': 'september', 'OCT': 'october', 'NOV': 'november', 'DEC': 'december'
          };
          
          const monthNameLower = monthMap[monthAbbr] || monthAbbr.toLowerCase();
          // Capitalize first letter to match dropdown format (e.g., "June 2025")
          const monthName = monthNameLower.charAt(0).toUpperCase() + monthNameLower.slice(1);
          
          // Extract year from the month string (e.g., "april 2025")
          const monthParts = month.split(' ');
          const year = monthParts[monthParts.length - 1];
          
          const weekMonthString = `${monthName} ${year}`;
         
          if (weekMonthString === month) {
            // Convert to simple week key (W1, W2, etc.)
            const weekNum = weekKeyParts[1].replace('W', ''); // Extract week number
            const simpleKey = `W${weekNum}`;
            
            // Only add if it's a valid week key (W1-W5)
            if (['W1', 'W2', 'W3', 'W4', 'W5'].includes(simpleKey)) {
              weeks[simpleKey] = {
                totalInvoice: weekData.totalInvoice || 0,
                totalProfit: weekData.totalProfit || 0,
                activeStores: weekData.activeStores || 0,
                totalOrders: weekData.totalOrders || 0,
                margin: weekData.margin || "-",
              };
            }
          }
        }
      });
    }

    // Calculate monthly totals
    const monthlyStores = processedData.monthlyStoreCounts?.[month]?.size || 0;
    const monthlyOrders = processedData.monthlyOrderCounts?.[month] || 0;
    
    // Get monthly invoice and profit from chartData
    const monthlyChartData = processedData.chartData?.filter((d: any) => d.month === month) || [];
    const monthlyInvoice = monthlyChartData.reduce((sum: number, d: any) => sum + (d.totalInvoice || 0), 0);
    const monthlyProfit = monthlyChartData.reduce((sum: number, d: any) => sum + (d.totalProfit || 0), 0);
    const monthlyMargin = (!monthlyInvoice || monthlyInvoice === 0) ? "-" : ((monthlyProfit / monthlyInvoice) * 100).toFixed(2) + "%";

    return {
      weeks,
      monthly: {
        totalInvoice: monthlyInvoice,
        totalProfit: monthlyProfit,
        activeStores: monthlyStores,
        totalOrders: monthlyOrders,
        margin: monthlyMargin,
      },
    };
  }

  const metrics1 = getMetrics(month1);
  const metrics2 = getMetrics(month2);

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" mb={2}>Monthly Comparison - Weekly Breakdown</Typography>
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
      
      <Box sx={{ overflowX: 'auto', width: '100%' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }}></TableCell>
              {/* Month 1 columns */}
              <TableCell colSpan={6} align="center" sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white' }}>
                {month1}
              </TableCell>
              {/* Month 2 columns */}
              <TableCell colSpan={6} align="center" sx={{ fontWeight: 'bold', backgroundColor: 'secondary.main', color: 'white' }}>
                {month2}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}></TableCell>
              {/* Month 1 week headers */}
              <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white', minWidth: 80 }}>W1</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white', minWidth: 80 }}>W2</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white', minWidth: 80 }}>W3</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white', minWidth: 80 }}>W4</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white', minWidth: 80 }}>W5</TableCell>
              {/* Month 1 total header */}
              <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: 'primary.dark', color: 'white', minWidth: 100 }}>Total</TableCell>
              {/* Month 2 week headers */}
              <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: 'secondary.main', color: 'white', minWidth: 80 }}>W1</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: 'secondary.main', color: 'white', minWidth: 80 }}>W2</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: 'secondary.main', color: 'white', minWidth: 80 }}>W3</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: 'secondary.main', color: 'white', minWidth: 80 }}>W4</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: 'secondary.main', color: 'white', minWidth: 80 }}>W5</TableCell>
              {/* Month 2 total header */}
              <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: 'secondary.dark', color: 'white', minWidth: 100 }}>Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {METRICS.map(metric => {
              // Use monthly totals for the Total column
              let month1Total: string | number;
              let month2Total: string | number;
              
              if (metric.key === 'activeStores') {
                // Use monthly store count directly
                month1Total = metrics1.monthly.activeStores;
                month2Total = metrics2.monthly.activeStores;
              } else if (metric.key === 'margin') {
                // Use monthly margin directly
                month1Total = metrics1.monthly.margin;
                month2Total = metrics2.monthly.margin;
              } else {
                // For other metrics, sum the weekly values
                month1Total = Object.values(metrics1.weeks).reduce((sum, week) => {
                  const value = week[metric.key as keyof WeekMetrics];
                  return sum + (typeof value === 'number' ? value : 0);
                }, 0);
                month2Total = Object.values(metrics2.weeks).reduce((sum, week) => {
                  const value = week[metric.key as keyof WeekMetrics];
                  return sum + (typeof value === 'number' ? value : 0);
                }, 0);
              }
              
              return (
                <TableRow key={metric.key}>
                  <TableCell sx={{ fontWeight: 'bold' }}>{metric.label}</TableCell>
                  {/* Month 1 weekly data */}
                  <TableCell align="center">
                    {metric.key === 'margin' 
                      ? metrics1.weeks.W1?.[metric.key as keyof WeekMetrics] 
                      : formatCurrency(metrics1.weeks.W1?.[metric.key as keyof WeekMetrics] as number, metric.isCurrency)
                    }
                  </TableCell>
                  <TableCell align="center">
                    {metric.key === 'margin' 
                      ? metrics1.weeks.W2?.[metric.key as keyof WeekMetrics] 
                      : formatCurrency(metrics1.weeks.W2?.[metric.key as keyof WeekMetrics] as number, metric.isCurrency)
                    }
                  </TableCell>
                  <TableCell align="center">
                    {metric.key === 'margin' 
                      ? metrics1.weeks.W3?.[metric.key as keyof WeekMetrics] 
                      : formatCurrency(metrics1.weeks.W3?.[metric.key as keyof WeekMetrics] as number, metric.isCurrency)
                    }
                  </TableCell>
                  <TableCell align="center">
                    {metric.key === 'margin' 
                      ? metrics1.weeks.W4?.[metric.key as keyof WeekMetrics] 
                      : formatCurrency(metrics1.weeks.W4?.[metric.key as keyof WeekMetrics] as number, metric.isCurrency)
                    }
                  </TableCell>
                  <TableCell align="center">
                    {metric.key === 'margin' 
                      ? metrics1.weeks.W5?.[metric.key as keyof WeekMetrics] 
                      : formatCurrency(metrics1.weeks.W5?.[metric.key as keyof WeekMetrics] as number, metric.isCurrency)
                    }
                  </TableCell>
                  {/* Month 1 total */}
                  <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: 'primary.50' }}>
                    {metric.key === 'margin' ? month1Total : formatCurrency(month1Total as number, metric.isCurrency)}
                  </TableCell>
                  {/* Month 2 weekly data */}
                  <TableCell align="center">
                    {metric.key === 'margin' 
                      ? metrics2.weeks.W1?.[metric.key as keyof WeekMetrics] 
                      : formatCurrency(metrics2.weeks.W1?.[metric.key as keyof WeekMetrics] as number, metric.isCurrency)
                    }
                  </TableCell>
                  <TableCell align="center">
                    {metric.key === 'margin' 
                      ? metrics2.weeks.W2?.[metric.key as keyof WeekMetrics] 
                      : formatCurrency(metrics2.weeks.W2?.[metric.key as keyof WeekMetrics] as number, metric.isCurrency)
                    }
                  </TableCell>
                  <TableCell align="center">
                    {metric.key === 'margin' 
                      ? metrics2.weeks.W3?.[metric.key as keyof WeekMetrics] 
                      : formatCurrency(metrics2.weeks.W3?.[metric.key as keyof WeekMetrics] as number, metric.isCurrency)
                    }
                  </TableCell>
                  <TableCell align="center">
                    {metric.key === 'margin' 
                      ? metrics2.weeks.W4?.[metric.key as keyof WeekMetrics] 
                      : formatCurrency(metrics2.weeks.W4?.[metric.key as keyof WeekMetrics] as number, metric.isCurrency)
                    }
                  </TableCell>
                  <TableCell align="center">
                    {metric.key === 'margin' 
                      ? metrics2.weeks.W5?.[metric.key as keyof WeekMetrics] 
                      : formatCurrency(metrics2.weeks.W5?.[metric.key as keyof WeekMetrics] as number, metric.isCurrency)
                    }
                  </TableCell>
                  {/* Month 2 total */}
                  <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: 'secondary.50' }}>
                    {metric.key === 'margin' ? month2Total : formatCurrency(month2Total as number, metric.isCurrency)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
    </Paper>
  );
} 
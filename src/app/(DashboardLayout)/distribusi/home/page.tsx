"use client";

import OrdersTable from "@/app/components/dashboards/invoice/OrdersTable";
import StoreSummaryTable from "@/app/components/dashboards/invoice/StoreSummaryTable";
import SummaryTiles from "@/app/components/dashboards/shared/SummaryTiles";
import { formatCurrency } from "@/app/utils/formatNumber";
import { useAuth } from "@/contexts/AuthContext";
import { fetchNOO, fetchOrders, fetchStoreData } from "@/store/apps/Invoice/invoiceSlice";
import { useDispatch, useSelector } from "@/store/hooks";
import { RootState } from "@/store/store";
import { Box, Button, FormControl, InputLabel, MenuItem, Select, Stack, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { goalProfit } from "../../goalProfit";
import Loading from "../../loading";
import { useInvoiceData } from "../sales/data";

export default function DashboardPage() {
  const dispatch = useDispatch();
  
  const { role } = useAuth();
  

  const { orders, nooData, loading, storeData } = useSelector((state: RootState) => ({
    orders: state.invoiceReducer.orders,
    storeData: state.invoiceReducer.storeData,
    nooData: state.invoiceReducer.nooData,
    loading: state.invoiceReducer.loading,
  }));

  // Compose month string for API
  const getMonthString = (month: number, year: number) => {
    const date = new Date(year, month, 1);
    const monthName = date.toLocaleString("en-US", { month: "long" }).toLowerCase();
    return `${monthName} ${year}`;
  };

  // Filters
  const [area, setArea] = useState("");
  const [segment, setSegment] = useState("");
  const [agent, setAgent] = useState(() => {
    if (role?.includes("mardi")) return "Mardi";
    if (role?.includes("rully")) return "Rully juliandi";
    if (role?.includes("oki")) return "Oki irawan";
    if (role?.includes("rifqi")) return "Rifqi Cassidy";
    if (role?.includes("channel")) return "Channel";
    if (role?.includes("others")) return "Others";
    return "";
  });
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const[monthString, setMonthString] = useState(getMonthString(selectedMonth, selectedYear))
  const [filters, setFilters] = useState<{ area: string; segment: string; agent: string; month: number; year: number }>({
    area,
    segment: "",
    agent: "",
    month: now.getMonth(),
    year: now.getFullYear(),
  });

  // Add allAreas state to track all areas across different filter selections
  const [allAreas, setAllAreas] = useState<string[]>([]);
  const [agents, setAgents] = useState<string[]>([]);
  const [allAgents, setAllAgents] = useState<string[]>([]);

  // Only fetch/process data after clicking Apply Filters
  const handleApplyFilters = () => {
    setFilters({ area, segment, agent, month: selectedMonth, year: selectedYear });
  };

  

  // Handle role-based agent initialization
  useEffect(() => {
    if (role) {
      if (role.includes("mardi")) setAgent("Mardi");
      else if (role.includes("rully")) setAgent("Rully juliandi");
      else if (role.includes("oki")) setAgent("Oki irawan");
      else if (role.includes("rifqi")) setAgent("Rifqi Cassidy");
      else if (role.includes("channel")) setAgent("Channel");
      else if (role.includes("others")) setAgent("Others");
      else setAgent(""); // Reset for admin/dashboard users
    }
  }, [role]);

  // Fetch data when filters are set
  useEffect(() => {
    if (!filters) return;
    let AREA = filters.area;
    let AGENT = filters.agent;
    if (role?.includes("rully")) AGENT = "Rully juliandi";
    if (role?.includes("mardi")) AGENT = "Mardi";
    if (role?.includes("oki")) AGENT = "Oki irawan";
    if (role?.includes("rifqi")) AGENT = "Rifqi Cassidy";
    if (role?.includes("channel")) AGENT = "Channel";
    if (role?.includes("others")) AGENT = "Others";
    const newMonthString = getMonthString(filters.month, filters.year);
    dispatch(
      fetchOrders({
        sortTime: "desc",
        month: newMonthString,
        area: AREA,
        agent: AGENT,
        segment: filters.segment,
      })
    );
    dispatch(
      fetchNOO({
        sortTime: "desc",
        month: newMonthString,
        area: AREA,
        agent: AGENT,
        segment: filters.segment,
      })
      
    );
    dispatch(fetchStoreData({ area: AREA, agent: AGENT }) as any),
    setMonthString(newMonthString); // If you still need to keep monthString in state for other reasons
    // eslint-disable-next-line
  }, [filters]);

  // Filter and process orders
  const validOrders = useMemo(() => {
    const uniqueOrders =
      orders?.reduce((acc: any[], order: any) => {
        if (!acc.find((o) => o.order_id === order.order_id)) {
          acc.push(order);
        }
        return acc;
      }, []) || [];
    return uniqueOrders.filter(
      (order) =>
        order.status_order !== "CANCEL BY ADMIN" &&
        order.status_order !== "CANCEL"
    );
  }, [orders]);

  const { processData } = useInvoiceData();
  const processedData = useMemo(() => {
    if (!filters) return null;
    return processData(validOrders, filters.month, filters.year);
  }, [validOrders, filters, processData]);

  // Calculate monthlyTotalStoreCount from storeData using useMemo
  const monthlyTotalStoreCount = useMemo(() => {
    if (!storeData || storeData.length === 0) return {};
    const monthlyCounts: Record<string, number> = {};
    const allMonths = storeData.map(store => store.first_order_month);
    const uniqueMonths = Array.from(new Set(allMonths)).sort();
    uniqueMonths.forEach(month => {
      const monthDate = new Date(month);
      const count = storeData.filter(store => {
        const storeMonthDate = new Date(store.first_order_month);
        return storeMonthDate <= monthDate;
      }).length;
      monthlyCounts[month] = count;
    });
    return monthlyCounts;
  }, [storeData]);

  // Calculate activation rate data using useMemo
  const activationRateData = useMemo(() => {
    if (!processedData || Object.keys(monthlyTotalStoreCount).length === 0) return [];
    const activationData: Array<{
      month: string;
      activationRate: number;
      totalStores: number;
      activeStores: number;
      monthlyOrders: number;
    }> = [];
    const monthsWithStores = Object.keys(processedData.monthlyStoreCounts);
    monthsWithStores.forEach(month => {
      const activeStores = processedData.monthlyStoreCounts[month]?.size || 0;
      const totalStores = monthlyTotalStoreCount[month] || 0;
      if (totalStores > 0) {
        const activationRate = (activeStores / totalStores) * 100;
        const monthlyOrders = processedData.monthlyOrderCounts[month] || 0;
        activationData.push({
          month,
          activationRate: Math.round(activationRate * 100) / 100,
          totalStores,
          activeStores,
          monthlyOrders,
        });
      }
    });
    activationData.sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA.getTime() - dateB.getTime();
    });
    return activationData;
  }, [processedData, monthlyTotalStoreCount]);

  console.log(activationRateData)

  let areas;

  // Areas for filter dropdown - merge new areas with existing ones
  areas = useMemo(() => {
    const currentAreas = processedData ? Object.keys(processedData.areaSummaries) : [];
    
    // Merge current areas with allAreas
    const mergedAreas = new Set([...allAreas, ...currentAreas]);
    const newAllAreas = Array.from(mergedAreas);
    
    // Update allAreas if there are new areas
    if (newAllAreas.length !== allAreas.length) {
      setAllAreas(newAllAreas);
    }
    
    return newAllAreas.filter((a) => a !== "");
  }, [processedData, allAreas]);

  // Agents for filter dropdown - merge new agents with existing ones
  const agentsList = useMemo(() => {
    const currentAgents = processedData ? Object.keys(processedData.agentSummaries) : [];
    
    // Merge current agents with allAgents
    const mergedAgents = new Set([...allAgents, ...currentAgents]);
    const newAllAgents = Array.from(mergedAgents);
    
    // Update allAgents if there are new agents
    if (newAllAgents.length !== allAgents.length) {
      setAllAgents(newAllAgents);
    }
    
    return newAllAgents.filter((a) => a !== "");
  }, [processedData, allAgents]);

  // NOOs for selected month
  const nooForSelectedMonth = useMemo(() => {
    if (!Array.isArray(nooData)) return 0;
    return nooData.length;
  }, [nooData]);



  if (loading) {
    return <Loading />;
  }

  // Role-based access control
  const hasAccess = [
    "admin",
    "rully",
    "mardi",
    "oki",
    "rifqi",
    "channel",
    "others",
    "dashboard",
  ].some((r) => role?.includes(r));
  if (!hasAccess) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <Typography variant="h5" color="error">
          You don't have access to this page.
        </Typography>
      </Box>
    );
  }

  return (
    <Box p={4}>
      <Typography variant="h4" mb={3}>
        Simple Invoice Dashboard
      </Typography>
      {/* Filters */}
      <Box mb={3}>
        <Stack direction="row" spacing={2}>
                  <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Agent</InputLabel>
            <Select value={agent} onChange={(e) => setAgent(e.target.value)} label="Agent">
              {(role?.includes("admin") || role?.includes("dashboard")) && (
                <MenuItem value="">All Agents</MenuItem>
              )}
              {agentsList.filter((a) => a !== "").map((a) => (
                <MenuItem key={a} value={a}>{a}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Area</InputLabel>
            <Select value={area} onChange={(e) => setArea(e.target.value)} label="Area">
              <MenuItem value="">All Areas</MenuItem>
              {areas.filter((a) => a !== "").map((a) => (
                <MenuItem key={a} value={a}>{a}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Segment</InputLabel>
            <Select value={segment} onChange={(e) => setSegment(e.target.value)} label="Segment">
              <MenuItem value="">All Segments</MenuItem>
              <MenuItem value="HORECA">HORECA</MenuItem>
              <MenuItem value="RESELLER">RESELLER</MenuItem>
              <MenuItem value="OTHER">OTHER</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Month</InputLabel>
            <Select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} label="Month">
              {Array.from({ length: 12 }, (_, i) => (
                <MenuItem key={i} value={i}>
                  {new Date(2000, i, 1).toLocaleString("default", { month: "long" })}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Year</InputLabel>
            <Select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} label="Year">
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                );
              })}
            </Select>
          </FormControl>
          <Button variant="contained" onClick={handleApplyFilters}>Apply Filters</Button>
        </Stack>
      </Box>
      {/* Summary Cards */}
      {processedData && (
        <Box mb={3}>
          {(() => {
            // Prepare tile data array
            const agentKey = filters.agent || "NATIONAL";
            const goal = goalProfit[agentKey]?.[monthString] || 0;
            const profit = processedData.thisMonthMetrics.totalProfit || 0;
            const remaining = goal - profit;
            const isNegative = remaining > 0;
            const invoice = processedData.thisMonthMetrics.totalInvoice;
            const margin = (!invoice || invoice === 0) ? "-" : (profit / invoice * 100).toFixed(2) + "%";
            const progress = (!goal || goal === 0) ? "-" : (profit / goal * 100).toFixed(2) + "%";
            // Format profit remaining with sign
            const formatProfitRemaining = (value: number) => {
              if (value === 0) return value;
              const sign = value > 0 ? "-" : "+";
              // Use absolute value to avoid double negative signs
              const absValue = Math.abs(value);
              return `${sign} ${formatCurrency(absValue)}`;
            };

            // Calculate average orders per day/week and average profit per day/week
            const calculateAverages = () => {
              // Use the same filtered data that's used for processedData
              const filteredOrders = validOrders.filter((order) => {
                if (filters.area && order.area !== filters.area) return false;
                if (filters.agent && order.agent_name !== filters.agent) return false;
                if (filters.segment && order.business_type !== filters.segment) return false;
                
                // Check if the order's month matches the selected month
                const orderMonthYear = order.month.toLowerCase();
                const selectedMonthString = getMonthString(filters.month, filters.year).toLowerCase();
                return orderMonthYear === selectedMonthString;
              });

              if (!filteredOrders || filteredOrders.length === 0) {
                return { 
                  avgOrdersPerDay: 0, 
                  avgProfitPerDay: 0,
                  avgOrdersPerWeek: 0,
                  avgProfitPerWeek: 0
                };
              }
              
              // Get all order dates
              const orderDates = filteredOrders.map(order => new Date(order.order_date));
              const earliestDate = new Date(Math.min(...orderDates.map(date => date.getTime())));
              const latestDate = new Date(Math.max(...orderDates.map(date => date.getTime())));
              
              // Calculate total days (inclusive)
              const totalDays = Math.ceil((latestDate.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
              
              // Calculate total weeks (inclusive)
              const totalWeeks = Math.ceil(totalDays / 7);
              
              // Calculate totals
              const totalOrders = filteredOrders.length;
              const totalProfit = filteredOrders.reduce((sum, order) => sum + (order.profit || 0), 0);
              
              // Calculate averages
              const avgOrdersPerDay = totalDays > 0 ? totalOrders / totalDays : 0;
              const avgProfitPerDay = totalDays > 0 ? totalProfit / totalDays : 0;
              const avgOrdersPerWeek = totalWeeks > 0 ? totalOrders / totalWeeks : 0;
              const avgProfitPerWeek = totalWeeks > 0 ? totalProfit / totalWeeks : 0;
              
              return { 
                avgOrdersPerDay, 
                avgProfitPerDay,
                avgOrdersPerWeek,
                avgProfitPerWeek
              };
            };
            
            const { avgOrdersPerDay, avgProfitPerDay, avgOrdersPerWeek, avgProfitPerWeek } = calculateAverages();
            
            // Calculate days remaining until September 3rd
            const calculateDaysRemaining = () => {
              const today = new Date();
              const currentMonth = today.getMonth();
              const currentYear = today.getFullYear();
              
              // If selected month is not current month, return N/A
              if (filters.month !== currentMonth || filters.year !== currentYear) {
                return "N/A";
              }
              
              const targetDate = new Date(today.getFullYear(), 8, 3); // September is month 8 (0-indexed)
              
              // If September 3rd has passed this year, calculate for next year
              if (today > targetDate) {
                targetDate.setFullYear(today.getFullYear() + 1);
              }
              
              const diffTime = targetDate.getTime() - today.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              return diffDays;
            };
            
            const daysRemaining = calculateDaysRemaining();

            const tiles = [
              { title: "Total Invoice", value: processedData.thisMonthMetrics.totalInvoice, isCurrency: true },
              { title: "Profit Goal", value: goal, isCurrency: true },
              { title: "Total Profit", value: profit, isCurrency: true },
              { title: "Profit Progress", value: progress, isCurrency: false },
              { title: "Profit Remaining", value: formatProfitRemaining(remaining), isCurrency: true, color: isNegative ? 'red' : 'green', fontWeight: 700 },
              { title: "Active Stores", value: processedData.thisMonthMetrics.totalStores },
              { title: "Total Orders", value: processedData.thisMonthMetrics.totalOrders },
              { title: "NOOs", value: nooForSelectedMonth },
              { title: "Margin", value: margin, isCurrency: false },
              { title: "Activation Rate", value: (activationRateData && activationRateData.length > 0) ? activationRateData[activationRateData.length - 1].activationRate + "%" : "0%", isCurrency: false },
              { title: "Avg Orders/Day", value: avgOrdersPerDay.toFixed(2), isCurrency: false },
              { title: "Avg Profit/Day", value: avgProfitPerDay, isCurrency: true },
              { title: "Avg Orders/Week", value: avgOrdersPerWeek.toFixed(2), isCurrency: false },
              { title: "Avg Profit/Week", value: avgProfitPerWeek, isCurrency: true },
              { title: "Days Remaining", value: daysRemaining, isCurrency: false, color: 'red', fontWeight: 700 },
            ];
            return <SummaryTiles tiles={tiles} md={2.4} />;
          })()}
        </Box>
      )}
      
      {/* Store Table */}
      {processedData && (
        <Box mb={3}>
          <StoreSummaryTable storeSummaries={processedData.storeSummaries} />
        </Box>
      )}
      {/* NOO Area Chart */}
      {/* {Array.isArray(nooData) && nooData.length > 0 && (
        <Box mb={3}>
          <NOOAreaChart data={nooData} />
        </Box>
      )} */}
      {/* NOO Segment Chart */}
      {/* {Array.isArray(nooData) && nooData.length > 0 && (
        <Box mb={3}>
          <NOOSegmentChart data={nooData} />
        </Box>
      )} */}
      {/* NOO Orders Table */}
      {Array.isArray(nooData) && nooData.length > 0 && (
        <Box mb={3}>
          <OrdersTable orders={nooData} title="NOOs Table" exportOrderDetails={false}/>
        </Box>
      )}
    </Box>
  );
}

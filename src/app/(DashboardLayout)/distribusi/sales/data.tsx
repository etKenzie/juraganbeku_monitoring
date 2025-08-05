import { OrderData } from "@/store/apps/Invoice/invoiceSlice";
import { format, startOfWeek } from "date-fns";
import { ProcessedData } from "./types";

// Centralized week calculation function
export const getWeekKey = (date: Date) => {
  const weekStartDate = startOfWeek(date, { weekStartsOn: 1 }); // Start week on Monday
  const monthAbbr = format(weekStartDate, "MMM").toUpperCase();
  const weekOfMonth = Math.ceil(weekStartDate.getDate() / 7);
  return `${monthAbbr} W${weekOfMonth}`;
};

// Centralized week calculation function for simple labels (W1, W2, etc.)
export const getSimpleWeekKey = (date: Date) => {
  const weekStartDate = startOfWeek(date, { weekStartsOn: 1 }); // Start week on Monday
  const weekOfMonth = Math.ceil(weekStartDate.getDate() / 7);
  return `W${weekOfMonth}`;
};

export const calculateDueDateStatus = (
  dueDate: string,
  paymentStatus: string
): "Current" | "Below 14 DPD" | "14 DPD" | "30 DPD" | "60 DPD" | "Lunas" => {
  if (paymentStatus === "LUNAS") return "Lunas";

  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "Current";
  if (diffDays < 14) return "Below 14 DPD";
  if (diffDays < 30) return "14 DPD";
  if (diffDays < 60) return "30 DPD";
  return "60 DPD";
};

export const calculateStoreStatus = (
  orders: OrderData[]
): { status: "Active" | "D1" | "D2" | "D3" | "Inactive"; lastOrderDate?: string } => {
  if (!orders || orders.length === 0) {
    return { status: "Inactive" };
  }

  // Find the most recent order date
  const lastOrder = orders.reduce((latest, order) => {
    const orderDate = new Date(order.order_date);
    const latestDate = latest ? new Date(latest.order_date) : new Date(0);
    return orderDate > latestDate ? order : latest;
  });

  const lastOrderDate = new Date(lastOrder.order_date);
  const today = new Date();
  const diffTime = today.getTime() - lastOrderDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 30) {
    return { status: "Active", lastOrderDate: lastOrder.order_date };
  } else if (diffDays <= 60) {
    return { status: "D1", lastOrderDate: lastOrder.order_date };
  } else if (diffDays <= 90) {
    return { status: "D2", lastOrderDate: lastOrder.order_date };
  } else if (diffDays <= 120) {
    return { status: "D3", lastOrderDate: lastOrder.order_date };
  } else {
    return { status: "Inactive", lastOrderDate: lastOrder.order_date };
  }
};

export const useInvoiceData = () => {
  const processChartData = (
    orders: OrderData[]
  ): Array<{
    date: string;
    month: string;
    totalInvoice: number;
    totalProfit: number;
  }> => {
    // Group orders by date to provide daily granularity for the chart
    const dailyData = orders.reduce(
      (acc, order) => {
        const dateKey = order.order_date; // Assuming YYYY-MM-DD format

        if (!acc[dateKey]) {
          acc[dateKey] = {
            date: order.order_date,
            month: order.month,
            totalInvoice: 0,
            totalProfit: 0,
          };
        }

        acc[dateKey].totalInvoice += order.total_invoice;
        if (order.profit > 0) {
          acc[dateKey].totalProfit += order.profit;
        }

        return acc;
      },
      {} as Record<
        string,
        {
          date: string;
          month: string;
          totalInvoice: number;
          totalProfit: number;
        }
      >
    );

    // Convert the aggregated daily data into an array
    return Object.values(dailyData);
  };

  const processData = (
    orders: OrderData[],
    targetMonth: number,
    targetYear: number
  ): ProcessedData => {
    if (!orders || orders.length === 0) {
      return {
        overallTotalInvoice: 0,
        overallTotalPembayaran: 0,
        totalOrderCount: 0,
        hubSummaries: {},
        productSummaries: {},
        categorySummaries: {},
        monthlyProductSummaries: {},
        monthlyCategorySummaries: {},
        monthlyAreaSummaries: {},
        monthlySegmentSummaries: {},
        monthlySubBusinessTypeSummaries: {},
        storeSummaries: {},
        areaSummaries: {},
        segmentSummaries: {},
        subBusinessTypeSummaries: {},
        overallTOP: 0,
        overallCOD: 0,
        overallLunas: 0,
        overallBelumLunas: 0,
        overallProfit: 0,
        thisMonthMetrics: {
          totalOrders: 0,
          totalStores: 0,
          totalInvoice: 0,
          totalProfit: 0,
          activationRate: 0,
          totalLunas: 0,
          totalBelumLunas: 0,
          totalCOD: 0,
          totalTOP: 0,
        },
        monthlyStoreCounts: {},
        monthlyOrderCounts: {},
        weeklyData: {}, // Initialize weekly data
        dueDateStatusCounts: {
          current: 0,
          below14DPD: 0,
          dpd14: 0,
          dpd30: 0,
          dpd60: 0,
          lunas: 0,
        },
        paymentStatusMetrics: {},
        chartData: [],
      };
    }

    // Remove duplicates based on order_id before processing
    const uniqueOrders = orders.reduce((acc: OrderData[], order) => {
      if (!acc.find((o) => o.order_id === order.order_id)) {
        acc.push(order);
      }
      return acc;
    }, []);

    const result: ProcessedData = {
      overallTotalInvoice: 0,
      overallTotalPembayaran: 0,
      totalOrderCount: uniqueOrders.length,
      hubSummaries: {},
      productSummaries: {},
      categorySummaries: {},
      monthlyProductSummaries: {},
      monthlyCategorySummaries: {},
      monthlyAreaSummaries: {},
      monthlySegmentSummaries: {},
      monthlySubBusinessTypeSummaries: {},
      storeSummaries: {},
      areaSummaries: {},
      segmentSummaries: {},
      subBusinessTypeSummaries: {},
      overallTOP: 0,
      overallCOD: 0,
      overallLunas: 0,
      overallBelumLunas: 0,
      overallProfit: 0,
      thisMonthMetrics: {
        totalOrders: 0,
        totalStores: 0,
        totalInvoice: 0,
        totalProfit: 0,
        activationRate: 0,
        totalLunas: 0,
        totalBelumLunas: 0,
        totalCOD: 0,
        totalTOP: 0,
      },
      monthlyStoreCounts: {},
      monthlyOrderCounts: {},
      weeklyData: {}, // Initialize weekly data
      dueDateStatusCounts: {
        current: 0,
        below14DPD: 0,
        dpd14: 0,
        dpd30: 0,
        dpd60: 0,
        lunas: 0,
      },
      paymentStatusMetrics: {},
      chartData: processChartData(uniqueOrders),
    };

    // Calculate weekly data from chartData
    const weeklyData: { [key: string]: { 
      totalInvoice: number; 
      totalProfit: number; 
      activeStores: number; 
      totalOrders: number; 
      margin: string; 
    } } = {};
    
    // Group orders by month first, then by week
    const monthlyWeeklyOrders: { [monthKey: string]: { [weekKey: string]: OrderData[] } } = {};
    
    uniqueOrders.forEach(order => {
      const orderDate = new Date(order.order_date);
      const orderMonth = order.month.toLowerCase(); // e.g., "april 2025"
      
      // Get the month and year from order.month
      const monthParts = orderMonth.split(' ');
      const monthName = monthParts[0]; // e.g., "april"
      const year = monthParts[1]; // e.g., "2025"
      
      // Convert month name to abbreviation for week key
      const monthAbbrMap: { [key: string]: string } = {
        'january': 'JAN', 'february': 'FEB', 'march': 'MAR', 'april': 'APR',
        'may': 'MAY', 'june': 'JUN', 'july': 'JUL', 'august': 'AUG',
        'september': 'SEP', 'october': 'OCT', 'november': 'NOV', 'december': 'DEC'
      };
      
      const monthAbbr = monthAbbrMap[monthName] || monthName.toUpperCase();
      
      // Check if the order date matches the order.month
      const orderDateMonth = orderDate.toLocaleString("en-US", { month: "long" }).toLowerCase();
      const orderDateYear = orderDate.getFullYear().toString();
      const orderDateMonthString = `${orderDateMonth} ${orderDateYear}`;
      
      let weekKey: string;
      
      if (orderDateMonthString === orderMonth) {
        // Date matches the month - use the actual week from the date
        const weekOfMonth = Math.ceil(orderDate.getDate() / 7);
        weekKey = `${monthAbbr} W${weekOfMonth}`;
      } else {
        // Date doesn't match the month - determine if it's from previous or next month
        const orderDateObj = new Date(orderDate);
        const orderMonthObj = new Date(`${monthName} 1, ${year}`);
        
        if (orderDateObj < orderMonthObj) {
          // Date is from previous month - put it in W1
          weekKey = `${monthAbbr} W1`;
        } else {
          // Date is from next month - put it in the last week
          // First check if W5 already exists in this month
          const existingWeeks = Object.keys(monthlyWeeklyOrders[orderMonth] || {});
          const hasW5 = existingWeeks.some(week => week.includes('W5'));
          
          if (hasW5) {
            weekKey = `${monthAbbr} W5`;
          } else {
            weekKey = `${monthAbbr} W4`;
          }
        }
      }
      
      // Initialize month if not exists
      if (!monthlyWeeklyOrders[orderMonth]) {
        monthlyWeeklyOrders[orderMonth] = {};
      }
      
      // Initialize week if not exists
      if (!monthlyWeeklyOrders[orderMonth][weekKey]) {
        monthlyWeeklyOrders[orderMonth][weekKey] = [];
      }
      
      monthlyWeeklyOrders[orderMonth][weekKey].push(order);
    });
    
    // Calculate weekly metrics
    Object.entries(monthlyWeeklyOrders).forEach(([monthKey, weekOrders]) => {
      Object.entries(weekOrders).forEach(([weekKey, orders]) => {
        const totalInvoice = orders.reduce((sum, order) => sum + (order.total_invoice || 0), 0);
        const totalProfit = orders.reduce((sum, order) => sum + (order.profit || 0), 0);
        const totalOrders = orders.length;
        const activeStores = new Set(orders.map(order => order.user_id)).size;
        const margin = (!totalInvoice || totalInvoice === 0) ? "-" : ((totalProfit / totalInvoice) * 100).toFixed(2) + "%";
        
        weeklyData[weekKey] = {
          totalInvoice,
          totalProfit,
          activeStores,
          totalOrders,
          margin,
        };
      });
    });
    
    result.chartData.forEach(item => {
      const date = new Date(item.date);
      const weekKey = getWeekKey(date);
      
      // Ensure the week exists in weeklyData (in case chartData has weeks not in orders)
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          totalInvoice: 0,
          totalProfit: 0,
          activeStores: 0,
          totalOrders: 0,
          margin: "-",
        };
      }
    });
    result.weeklyData = weeklyData;



    // Find the most recent month in the data
    const allMonths = uniqueOrders.map((order) => {
      const [month, year] = order.month.split(" ");
      const monthIndex = new Date(`${month} 1, 2000`).getMonth();
      return {
        month: order.month,
        date: new Date(parseInt(year), monthIndex, 1),
      };
    });
    const mostRecentMonth = allMonths.sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    )[0].month;
    console.log("Most recent month:", mostRecentMonth);
    const mostRecentMonthStores = new Set<string>();

    // Process all data in a single pass through uniqueOrders
    uniqueOrders.forEach((order) => {
      const processedMonthKey = order.month;
      const business_type = order.business_type || "OTHER";
      const sub_business_type = order.sub_business_type || "OTHER";
      const area = order.area;
      const userId = order.user_id;
      const storeName = order.store_name;
      const hub = order.process_hub;

      // Process payment status metrics only for the most recent month
      if (processedMonthKey === mostRecentMonth) {
        const status = order.status_payment;
        if (!result.paymentStatusMetrics[status]) {
          result.paymentStatusMetrics[status] = {
            totalOrders: 0,
            totalInvoice: 0,
            totalProfit: 0,
          };
        }
        result.paymentStatusMetrics[status].totalOrders += 1;
        result.paymentStatusMetrics[status].totalInvoice += order.total_invoice;
        if (order.profit > 0) {
          result.paymentStatusMetrics[status].totalProfit += order.profit;
        }
      }

      // Initialize monthly counts if not exists
      if (!result.monthlyStoreCounts[processedMonthKey]) {
        result.monthlyStoreCounts[processedMonthKey] = new Set<string>();
      }
      if (!result.monthlyOrderCounts[processedMonthKey]) {
        result.monthlyOrderCounts[processedMonthKey] = 0;
      }

      // Add store to monthly count and increment order count
      result.monthlyStoreCounts[processedMonthKey].add(userId);
      result.monthlyOrderCounts[processedMonthKey]++;

      // Process most recent month specific data
      if (processedMonthKey === mostRecentMonth) {
        mostRecentMonthStores.add(userId);
        result.thisMonthMetrics.totalOrders++;
        result.thisMonthMetrics.totalInvoice += order.total_invoice;

        if (order.profit > 0) {
          result.thisMonthMetrics.totalProfit += order.profit;
        }

        if (order.status_payment === "LUNAS") {
          result.thisMonthMetrics.totalLunas += order.total_invoice || 0;
        } else if (
          order.status_payment === "WAITING VALIDATION BY FINANCE" ||
          order.status_payment === "BELUM LUNAS" ||
          order.status_payment === "PARTIAL"
        ) {
          result.thisMonthMetrics.totalBelumLunas += order.total_invoice || 0;
        }

        if (order.payment_type === "COD") {
          result.thisMonthMetrics.totalCOD += order.total_invoice || 0;
        } else if (order.payment_type === "TOP") {
          result.thisMonthMetrics.totalTOP += order.total_invoice || 0;
        }

        // Process product data for most recent month
        order.detail_order?.forEach((item) => {
          if (!item) return;

          if (!result.productSummaries[item.product_id]) {
            result.productSummaries[item.product_id] = {
              name: item.product_name || "",
              totalInvoice: 0,
              quantity: 0,
              price: Number(item.price) || 0,
              difPrice: 1,
              profit: 0,
              totalQuantity: 0,
              totalProfit: 0,
              margin: 0,
              orders: [],
              monthlyData: [],
            };
          }

          if (
            Number(item.price) !== result.productSummaries[item.product_id].price &&
            item.price
          ) {
            result.productSummaries[item.product_id].price += Number(item.price);
            result.productSummaries[item.product_id].difPrice += 1;
          }

          if (order.profit > 0) {
            result.productSummaries[item.product_id].profit += Number(order.profit);
          }

          result.productSummaries[item.product_id].totalInvoice +=
            Number(item.total_invoice) || 0;
          result.productSummaries[item.product_id].quantity +=
            Number(item.order_quantity) || 1;
        });

        // Process category data for most recent month (overall summaries)
        order.detail_order?.forEach((item) => {
          if (!item) return;

          const category = item.type_category || "UNCATEGORIZED";
          
          if (!result.categorySummaries[category]) {
            result.categorySummaries[category] = {
              totalInvoice: 0,
              quantity: 0,
              totalPrice: 0,
              itemCount: 0,
              gross_profit: 0,
            };
          }

          const categorySummary = result.categorySummaries[category];
          categorySummary.totalInvoice += Number(item.total_invoice) || 0;
          categorySummary.quantity += Number(item.order_quantity) || 1;
          categorySummary.totalPrice += Number(item.price) || 0;
          categorySummary.itemCount += 1;
          
          // Calculate profit contribution for this item
          if (order.profit > 0) {
            const itemInvoice = Number(item.total_invoice) || 0;
            const orderInvoice = order.total_invoice || 0;
            const profitProportion = orderInvoice > 0 ? itemInvoice / orderInvoice : 0;
            categorySummary.gross_profit += order.profit * profitProportion;
          }
        });

        // Process due date status for most recent month
        const dueDateStatus = calculateDueDateStatus(
          order.payment_due_date,
          order.status_payment
        );
        switch (dueDateStatus) {
          case "Lunas":
            result.dueDateStatusCounts.lunas++;
            break;
          case "Current":
            result.dueDateStatusCounts.current++;
            break;
          case "Below 14 DPD":
            result.dueDateStatusCounts.below14DPD++;
            break;
          case "14 DPD":
            result.dueDateStatusCounts.dpd14++;
            break;
          case "30 DPD":
            result.dueDateStatusCounts.dpd30++;
            break;
          case "60 DPD":
            result.dueDateStatusCounts.dpd60++;
            break;
        }
      }

      // Process overall totals
      result.overallTotalInvoice += order.total_invoice || 0;
      result.overallTotalPembayaran += order.total_pembayaran || 0;
      if (order.profit > 0) {
        result.overallProfit += order.profit;
      }

      if (order.status_payment === "LUNAS") {
        result.overallLunas += order.total_invoice || 0;
      } else if (
        order.status_payment === "WAITING VALIDATION BY FINANCE" ||
        order.status_payment === "BELUM LUNAS" ||
        order.status_payment === "PARTIAL"
      ) {
        result.overallBelumLunas += order.total_invoice || 0;
      }

      if (order.payment_type === "COD") {
        result.overallCOD += order.total_invoice || 0;
      } else if (order.payment_type === "TOP") {
        result.overallTOP += order.total_invoice || 0;
      }

      // Process store-specific data
      if (!result.storeSummaries[userId]) {
        result.storeSummaries[userId] = {
          storeName: storeName || "",
          userId: userId,
          totalInvoice: 0,
          totalProfit: 0,
          monthTotalInvoice: 0,
          monthTotalProfit: 0,
          orderCount: 0,
          activeMonths: new Set(),
          averageOrderValue: 0,
          orders: [],
          storeStatus: "Inactive",
        };
      }
      
      result.storeSummaries[userId].totalInvoice += order.total_invoice || 0;
      if (order.profit > 0) {
        result.storeSummaries[userId].totalProfit += order.profit;
      }

      // Calculate month-specific totals
      if (processedMonthKey === mostRecentMonth) {
        result.storeSummaries[userId].monthTotalInvoice += order.total_invoice || 0;
        if (order.profit > 0) {
          result.storeSummaries[userId].monthTotalProfit += order.profit;
        }
      }

      result.storeSummaries[userId].orderCount++;
      result.storeSummaries[userId].activeMonths.add(processedMonthKey);
      result.storeSummaries[userId].averageOrderValue =
        result.storeSummaries[userId].totalInvoice /
        result.storeSummaries[userId].orderCount;
      result.storeSummaries[userId].orders.push(order);

      // Process hub-specific data
      if (!result.hubSummaries[hub]) {
        result.hubSummaries[hub] = {
          totalInvoice: 0,
          totalProfit: 0,
          totalPembayaran: 0,
          orderCount: 0,
        };
      }

      result.hubSummaries[hub].totalInvoice += order.total_invoice || 0;
      if (order.profit > 0) {
        result.hubSummaries[hub].totalProfit += order.profit;
      }

      result.hubSummaries[hub].totalPembayaran += order.total_pembayaran || 0;
      result.hubSummaries[hub].orderCount++;

      // Process area data for overall summaries
      if (!result.areaSummaries[area]) {
        result.areaSummaries[area] = {
          name: "",
          totalOrders: 0,
          totalInvoice: 0,
          totalProfit: 0,
          totalCOD: 0,
          totalTOP: 0,
          totalLunas: 0,
          totalBelumLunas: 0,
          orders: [],
        };
      }

      const areaSummary = result.areaSummaries[area];
      areaSummary.totalOrders++;
      areaSummary.totalInvoice += order.total_invoice || 0;
      areaSummary.orders.push(order);

      if (order.payment_type === "COD") {
        areaSummary.totalCOD += order.total_invoice || 0;
      } else if (order.payment_type === "TOP") {
        areaSummary.totalTOP += order.total_invoice || 0;
      }

      if (order.status_payment === "LUNAS") {
        areaSummary.totalLunas += order.total_invoice || 0;
      } else {
        areaSummary.totalBelumLunas += order.total_invoice || 0;
      }

      if (order.profit > 0) {
        areaSummary.totalProfit += order.profit;
      }

      // Process area data for monthly summaries (ALL MONTHS, not just most recent)
      if (!result.monthlyAreaSummaries[processedMonthKey]) {
        result.monthlyAreaSummaries[processedMonthKey] = {};
      }

      if (!result.monthlyAreaSummaries[processedMonthKey][area]) {
        result.monthlyAreaSummaries[processedMonthKey][area] = {
          name: "",
          totalOrders: 0,
          totalInvoice: 0,
          totalProfit: 0,
          totalCOD: 0,
          totalTOP: 0,
          totalLunas: 0,
          totalBelumLunas: 0,
          orders: [],
        };
      }

      const monthlyAreaSummary = result.monthlyAreaSummaries[processedMonthKey][area];
      monthlyAreaSummary.totalOrders++;
      monthlyAreaSummary.totalInvoice += order.total_invoice || 0;
      monthlyAreaSummary.orders.push(order);

      if (order.payment_type === "COD") {
        monthlyAreaSummary.totalCOD += order.total_invoice || 0;
      } else if (order.payment_type === "TOP") {
        monthlyAreaSummary.totalTOP += order.total_invoice || 0;
      }

      if (order.status_payment === "LUNAS") {
        monthlyAreaSummary.totalLunas += order.total_invoice || 0;
      } else {
        monthlyAreaSummary.totalBelumLunas += order.total_invoice || 0;
      }

      if (order.profit > 0) {
        monthlyAreaSummary.totalProfit += order.profit;
      }

      // Initialize monthly segment summaries if not exists
      if (!result.monthlySegmentSummaries[processedMonthKey]) {
        result.monthlySegmentSummaries[processedMonthKey] = {};
      }
      if (!result.monthlySubBusinessTypeSummaries[processedMonthKey]) {
        result.monthlySubBusinessTypeSummaries[processedMonthKey] = {};
      }

      // Process business type (segment) data for monthly summaries
      if (!result.monthlySegmentSummaries[processedMonthKey][business_type]) {
        result.monthlySegmentSummaries[processedMonthKey][business_type] = {
          name: business_type,
          totalOrders: 0,
          totalInvoice: 0,
          totalProfit: 0,
          totalCOD: 0,
          totalTOP: 0,
          totalLunas: 0,
          totalBelumLunas: 0,
          orders: [],
          activeMonths: new Set(),
        };
      }

      const monthlySegmentSummary = result.monthlySegmentSummaries[processedMonthKey][business_type];
      monthlySegmentSummary.totalOrders++;
      monthlySegmentSummary.totalInvoice += order.total_invoice || 0;
      monthlySegmentSummary.orders.push(order);
      monthlySegmentSummary.activeMonths.add(processedMonthKey);

      if (order.payment_type === "COD") {
        monthlySegmentSummary.totalCOD += order.total_invoice || 0;
      } else if (order.payment_type === "TOP") {
        monthlySegmentSummary.totalTOP += order.total_invoice || 0;
      }

      if (order.status_payment === "LUNAS") {
        monthlySegmentSummary.totalLunas += order.total_invoice || 0;
      } else {
        monthlySegmentSummary.totalBelumLunas += order.total_invoice || 0;
      }

      if (order.profit > 0) {
        monthlySegmentSummary.totalProfit += order.profit;
      }

      // Process sub-business type data for monthly summaries
      if (!result.monthlySubBusinessTypeSummaries[processedMonthKey][sub_business_type]) {
        result.monthlySubBusinessTypeSummaries[processedMonthKey][sub_business_type] = {
          name: sub_business_type,
          totalOrders: 0,
          totalInvoice: 0,
          totalProfit: 0,
          totalCOD: 0,
          totalTOP: 0,
          totalLunas: 0,
          totalBelumLunas: 0,
          orders: [],
          activeMonths: new Set(),
        };
      }

      const monthlySubBusinessTypeSummary = result.monthlySubBusinessTypeSummaries[processedMonthKey][sub_business_type];
      monthlySubBusinessTypeSummary.totalOrders++;
      monthlySubBusinessTypeSummary.totalInvoice += order.total_invoice || 0;
      monthlySubBusinessTypeSummary.orders.push(order);
      monthlySubBusinessTypeSummary.activeMonths.add(processedMonthKey);

      if (order.payment_type === "COD") {
        monthlySubBusinessTypeSummary.totalCOD += order.total_invoice || 0;
      } else if (order.payment_type === "TOP") {
        monthlySubBusinessTypeSummary.totalTOP += order.total_invoice || 0;
      }

      if (order.status_payment === "LUNAS") {
        monthlySubBusinessTypeSummary.totalLunas += order.total_invoice || 0;
      } else {
        monthlySubBusinessTypeSummary.totalBelumLunas += order.total_invoice || 0;
      }

      if (order.profit > 0) {
        monthlySubBusinessTypeSummary.totalProfit += order.profit;
      }

      // Process overall segment summaries (across all months)
      if (!result.segmentSummaries[business_type]) {
        result.segmentSummaries[business_type] = {
          name: business_type,
          totalOrders: 0,
          totalInvoice: 0,
          totalProfit: 0,
          totalCOD: 0,
          totalTOP: 0,
          totalLunas: 0,
          totalBelumLunas: 0,
          orders: [],
          activeMonths: new Set(),
        };
      }

      const segmentSummary = result.segmentSummaries[business_type];
      segmentSummary.totalOrders++;
      segmentSummary.totalInvoice += order.total_invoice || 0;
      segmentSummary.orders.push(order);
      segmentSummary.activeMonths.add(processedMonthKey);

      if (order.payment_type === "COD") {
        segmentSummary.totalCOD += order.total_invoice || 0;
      } else if (order.payment_type === "TOP") {
        segmentSummary.totalTOP += order.total_invoice || 0;
      }

      if (order.status_payment === "LUNAS") {
        segmentSummary.totalLunas += order.total_invoice || 0;
      } else {
        segmentSummary.totalBelumLunas += order.total_invoice || 0;
      }

      if (order.profit > 0) {
        segmentSummary.totalProfit += order.profit;
      }

      // Process overall sub-business type summaries (across all months)
      if (!result.subBusinessTypeSummaries[sub_business_type]) {
        result.subBusinessTypeSummaries[sub_business_type] = {
          name: sub_business_type,
          totalOrders: 0,
          totalInvoice: 0,
          totalProfit: 0,
          totalCOD: 0,
          totalTOP: 0,
          totalLunas: 0,
          totalBelumLunas: 0,
          orders: [],
          activeMonths: new Set(),
        };
      }

      const subBusinessTypeSummary = result.subBusinessTypeSummaries[sub_business_type];
      subBusinessTypeSummary.totalOrders++;
      subBusinessTypeSummary.totalInvoice += order.total_invoice || 0;
      subBusinessTypeSummary.orders.push(order);
      subBusinessTypeSummary.activeMonths.add(processedMonthKey);

      if (order.payment_type === "COD") {
        subBusinessTypeSummary.totalCOD += order.total_invoice || 0;
      } else if (order.payment_type === "TOP") {
        subBusinessTypeSummary.totalTOP += order.total_invoice || 0;
      }

      if (order.status_payment === "LUNAS") {
        subBusinessTypeSummary.totalLunas += order.total_invoice || 0;
      } else {
        subBusinessTypeSummary.totalBelumLunas += order.total_invoice || 0;
      }

      if (order.profit > 0) {
        subBusinessTypeSummary.totalProfit += order.profit;
      }

      // Initialize monthly category summaries if not exists
      if (!result.monthlyCategorySummaries[processedMonthKey]) {
        result.monthlyCategorySummaries[processedMonthKey] = {};
      }

              // Process category data for monthly summaries
        order.detail_order?.forEach((item) => {
          if (!item) return;

          const category = item.type_category || "UNCATEGORIZED";
          
          if (!result.monthlyCategorySummaries[processedMonthKey][category]) {
            result.monthlyCategorySummaries[processedMonthKey][category] = {
              totalInvoice: 0,
              quantity: 0,
              totalPrice: 0,
              itemCount: 0,
              gross_profit: 0,
            };
          }

          const monthlyCategorySummary = result.monthlyCategorySummaries[processedMonthKey][category];
          monthlyCategorySummary.totalInvoice += Number(item.total_invoice) || 0;
          monthlyCategorySummary.quantity += Number(item.order_quantity) || 1;
          monthlyCategorySummary.totalPrice += Number(item.price) || 0;
          monthlyCategorySummary.itemCount += 1;
          
          // Calculate profit contribution for this item
          if (order.profit > 0) {
            const itemInvoice = Number(item.total_invoice) || 0;
            const orderInvoice = order.total_invoice || 0;
            const profitProportion = orderInvoice > 0 ? itemInvoice / orderInvoice : 0;
            monthlyCategorySummary.gross_profit += order.profit * profitProportion;
          }
        });

        // Process product data for monthly summaries
        order.detail_order?.forEach((item) => {
          if (!item) return;

          const productId = item.product_id;
          
          // Initialize monthly product summaries if not exists
          if (!result.monthlyProductSummaries[processedMonthKey]) {
            result.monthlyProductSummaries[processedMonthKey] = {};
          }

          if (!result.monthlyProductSummaries[processedMonthKey][productId]) {
            result.monthlyProductSummaries[processedMonthKey][productId] = {
              name: item.product_name || "",
              totalInvoice: 0,
              quantity: 0,
              price: Number(item.price) || 0,
              difPrice: 1,
              profit: 0,
              totalQuantity: 0,
              totalProfit: 0,
              margin: 0,
              orders: [],
              monthlyData: [],
            };
          }

          const monthlyProductSummary = result.monthlyProductSummaries[processedMonthKey][productId];
          monthlyProductSummary.totalInvoice += Number(item.total_invoice) || 0;
          monthlyProductSummary.quantity += Number(item.order_quantity) || 1;
          monthlyProductSummary.orders.push(order);

          if (order.profit > 0) {
            monthlyProductSummary.profit += Number(order.profit);
          }
        });
    });





    // Calculate store status for each store after all orders are processed
    Object.keys(result.storeSummaries).forEach((userId) => {
      const store = result.storeSummaries[userId];
      const { status, lastOrderDate } = calculateStoreStatus(store.orders);
      store.storeStatus = status;
      store.lastOrderDate = lastOrderDate;
    });

    // Calculate final metrics for most recent month
    result.thisMonthMetrics.totalStores = mostRecentMonthStores.size;
    result.thisMonthMetrics.activationRate =
      (mostRecentMonthStores.size / Object.keys(result.storeSummaries).length) *
      100;

    return result;
  };

  return { processData };
};

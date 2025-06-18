import { OrderData } from "@/store/apps/Invoice/invoiceSlice";
import { ProcessedData } from "./types";

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

export const useInvoiceData = () => {
  const processChartData = (
    orders: OrderData[]
  ): Array<{
    date: string;
    month: string;
    totalInvoice: number;
    totalProfit: number;
  }> => {
    // Group orders by month
    const monthlyData = orders.reduce(
      (acc, order) => {
        const monthKey = order.month;

        if (!acc[monthKey]) {
          acc[monthKey] = {
            date: order.order_date,
            month: monthKey,
            totalInvoice: 0,
            totalProfit: 0,
            orderCount: 0,
          };
        }

        acc[monthKey].totalInvoice += order.total_invoice;
        if (order.profit > 0) {
          acc[monthKey].totalProfit += order.profit;
        }

        acc[monthKey].orderCount += 1;

        return acc;
      },
      {} as Record<
        string,
        {
          date: string;
          month: string;
          totalInvoice: number;
          totalProfit: number;
          orderCount: number;
        }
      >
    );

    // Convert to array and calculate average profit per order
    return Object.values(monthlyData).map((data) => ({
      date: data.date,
      month: data.month,
      totalInvoice: data.totalInvoice,
      totalProfit: data.totalProfit,
    }));
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

    // Process unique orders
    uniqueOrders.forEach((order) => {
      const processedMonthKey = order.month;

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

      // Initialize monthly store count if not exists
      if (!result.monthlyStoreCounts[processedMonthKey]) {
        result.monthlyStoreCounts[processedMonthKey] = new Set<string>();
      }

      // Initialize monthly order count if not exists
      if (!result.monthlyOrderCounts[processedMonthKey]) {
        result.monthlyOrderCounts[processedMonthKey] = 0;
      }

      // Add store to monthly count
      result.monthlyStoreCounts[processedMonthKey].add(order.user_id);

      // Increment monthly order count
      result.monthlyOrderCounts[processedMonthKey]++;

      // Calculate most recent month's metrics
      if (processedMonthKey === mostRecentMonth) {
        mostRecentMonthStores.add(order.user_id);
        result.thisMonthMetrics.totalOrders++;
        result.thisMonthMetrics.totalInvoice += order.total_invoice;

        // Calculate profit for this order
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
              price: item.price || 0,
              difPrice: 1,
              profit: 0,
            };
          }

          if (
            item.price !== result.productSummaries[item.product_id].price &&
            item.price
          ) {
            result.productSummaries[item.product_id].price += item.price;
            result.productSummaries[item.product_id].difPrice += 1;
          }

          if (order.profit > 0) {
            result.productSummaries[item.product_id].profit += order.profit;
          }

          result.productSummaries[item.product_id].totalInvoice +=
            item.total_invoice || 0;
          result.productSummaries[item.product_id].quantity +=
            item.quantity || 1;
        });

        // Process area data for most recent month
        const area = order.area;
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

        // Process segment data for most recent month
        const business_type = order.business_type || "OTHER";
        const sub_business_type = order.sub_business_type || "OTHER";

        // Process business type (segment) data
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

        // Process sub-business type data
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

        const subBusinessTypeSummary =
          result.subBusinessTypeSummaries[sub_business_type];
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
      const userId = order.user_id;
      const storeName = order.store_name;

      if (!result.storeSummaries[userId]) {
        result.storeSummaries[userId] = {
          storeName: storeName || "",
          userId: userId,
          totalInvoice: 0,
          totalProfit: 0,
          orderCount: 0,
          activeMonths: new Set(),
          averageOrderValue: 0,
          orders: [],
        };
      }

      result.storeSummaries[userId].totalInvoice += order.total_invoice || 0;
      if (order.profit > 0) {
        result.storeSummaries[userId].totalProfit += order.profit;
      }

      result.storeSummaries[userId].orderCount++;
      result.storeSummaries[userId].activeMonths.add(processedMonthKey);
      result.storeSummaries[userId].averageOrderValue =
        result.storeSummaries[userId].totalInvoice /
        result.storeSummaries[userId].orderCount;
      result.storeSummaries[userId].orders.push(order);

      // Process hub-specific data
      const hub = order.process_hub;
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

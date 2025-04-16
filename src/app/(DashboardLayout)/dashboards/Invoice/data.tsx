import { OrderData } from "@/store/apps/Invoice/invoiceSlice";
import { ProcessedData } from "./types";

export const useInvoiceData = () => {
  const processData = (orders: OrderData[]): ProcessedData => {
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
        overallTOP: 0,
        overallCOD: 0,
        overallProfit: 0,
        overallLunas: 0,
        overallBelumLunas: 0,
        thisMonthMetrics: {
          totalOrders: 0,
          totalStores: 0,
          totalInvoice: 0,
          totalProfit: 0,
          activationRate: 0
        },
        monthlyStoreCounts: {},
        monthlyOrderCounts: {}
      };
    }

    const result: ProcessedData = {
      overallTotalInvoice: 0,
      overallTotalPembayaran: 0,
      totalOrderCount: orders.length,
      hubSummaries: {},
      productSummaries: {},
      categorySummaries: {},
      storeSummaries: {},
      areaSummaries: {},
      overallTOP: 0,
      overallCOD: 0,
      overallProfit: 0,
      overallLunas: 0,
      overallBelumLunas: 0,
      thisMonthMetrics: {
        totalOrders: 0,
        totalStores: 0,
        totalInvoice: 0,
        totalProfit: 0,
        activationRate: 0
      },
      monthlyStoreCounts: {},
      monthlyOrderCounts: {}
    };

    // Find the most recent month in the data
    let mostRecentMonth = '';
    let mostRecentMonthStores = new Set<string>();

    orders.forEach(order => {
      const orderDate = new Date(order.order_date);
      const orderMonth = orderDate.getMonth();
      const orderYear = orderDate.getFullYear();
      const processedMonthKey = `${orderYear}-${String(orderMonth + 1).padStart(2, '0')}`;

      // Update most recent month if this order is more recent
      if (!mostRecentMonth || processedMonthKey > mostRecentMonth) {
        mostRecentMonth = processedMonthKey;
        mostRecentMonthStores = new Set<string>();
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
        result.thisMonthMetrics.totalInvoice += order.total_invoice || 0;
        
        // Calculate profit for this order
        let orderProfit = 0;
        order.detail_order?.forEach(item => {
          if (!item) return;
          const price = (item.buy_price || 0) * (item.order_quantity || 0);
          let profit = (item.total_invoice || 0) - price;
          if (profit < 0) profit = 0;
          orderProfit += profit;
        });
        result.thisMonthMetrics.totalProfit += orderProfit;
      }

      // Add to overall totals
      result.overallTotalInvoice += order.total_invoice || 0;
      result.overallTotalPembayaran += order.total_pembayaran || 0;

      if(order.status_payment == "LUNAS") {
        result.overallLunas += order.total_invoice || 0;
      } else if (order.status_payment == "WAITING VALIDATION BY FINANCE") {
        result.overallLunas += order.total_invoice || 0;
      } else if (order.status_payment == "BELUM LUNAS") {
        result.overallBelumLunas += order.total_invoice || 0;
      } else if (order.status_payment == "PARTIAL") {
        result.overallBelumLunas += order.total_invoice || 0;
      }

      if (order.payment_type === "COD") {
        result.overallCOD += order.total_invoice || 0;
      } else if (order.payment_type === "TOP") {
        result.overallTOP += order.total_invoice || 0;
      }

      let gross_profit = 0;
      

  

      // Process product each invoice
      order.detail_order?.forEach(item => {
        if (!item) return;

        if (!result.productSummaries[item.product_id]) {
          result.productSummaries[item.product_id] = {
            name: item.product_name || '',
            totalInvoice: 0,
            quantity: 0,
            price: item.price || 0,
            difPrice: 1,
            profit: 0,
          };
        }

        if (item.price !== result.productSummaries[item.product_id].price && item.price) {
          result.productSummaries[item.product_id].price += item.price;
          result.productSummaries[item.product_id].difPrice += 1;
        }

        const price = (item.buy_price || 0) * (item.order_quantity || 0);
        let profit = (item.total_invoice || 0) - price;

        if (profit < 0) {
          profit = 0;
        }
        
        gross_profit += profit;
        
        result.productSummaries[item.product_id].totalInvoice += item.total_invoice || 0;
        result.productSummaries[item.product_id].profit += profit;
        
        if (item.quantity) {
          result.productSummaries[item.product_id].quantity += item.quantity;
        } else {
          result.productSummaries[item.product_id].quantity += 1;
        }
        
        // Process category data
        if (item.category) {
          if (!result.categorySummaries[item.category]) {
            result.categorySummaries[item.category] = {
              totalInvoice: 0,
              gross_profit: 0,
              quantity: 0,
              totalPrice: 0,
              itemCount: 0
            };
          }
          
          result.categorySummaries[item.category].totalInvoice += item.total_invoice || 0;
          result.categorySummaries[item.category].quantity += item.quantity || 1;
          result.categorySummaries[item.category].gross_profit += profit;
          if (item.price) {
            result.categorySummaries[item.category].totalPrice += item.price;
            result.categorySummaries[item.category].itemCount += 1;
          }
        }
      });

      // Process area data
      let area = order.area;
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

      if (order.payment_type === 'COD') {
        areaSummary.totalCOD += order.total_invoice || 0;
      } else if (order.payment_type === 'TOP') {
        areaSummary.totalTOP += order.total_invoice || 0;
      }

      if (order.status_payment === 'LUNAS') {
        areaSummary.totalLunas += order.total_invoice || 0;
      } else {
        areaSummary.totalBelumLunas += order.total_invoice || 0;
      }

      areaSummary.totalProfit += gross_profit

      // Process store-specific data
      const userId = order.user_id;
      const storeName = order.store_name;
      const activeMonthKey = new Date(order.order_date).toISOString().slice(0, 7); // YYYY-MM format

      if (!result.storeSummaries[userId]) {
        result.storeSummaries[userId] = {
          storeName: storeName || '',
          userId: userId,
          totalInvoice: 0,
          totalProfit: 0,
          orderCount: 0,
          activeMonths: new Set(),
          averageOrderValue: 0,
          orders: []
        };
      }

      result.storeSummaries[userId].totalInvoice += order.total_invoice || 0;
      result.storeSummaries[userId].totalProfit += gross_profit;
      result.storeSummaries[userId].orderCount++;
      result.storeSummaries[userId].activeMonths.add(activeMonthKey);
      result.storeSummaries[userId].averageOrderValue = 
        result.storeSummaries[userId].totalInvoice / result.storeSummaries[userId].orderCount;
      result.storeSummaries[userId].orders.push(order);

      // Process hub-specific data
      const hub = order.process_hub;
      if (!result.hubSummaries[hub]) {
        result.hubSummaries[hub] = {
          totalInvoice: 0,
          totalProfit: 0,
          totalPembayaran: 0,
          orderCount: 0
        };
      }

      result.hubSummaries[hub].totalInvoice += order.total_invoice || 0;
      result.hubSummaries[hub].totalProfit += gross_profit;
      result.hubSummaries[hub].totalPembayaran += order.total_pembayaran || 0;
      result.hubSummaries[hub].orderCount++;

      result.overallProfit += gross_profit;
    });

    // Calculate most recent month's metrics
    result.thisMonthMetrics.totalStores = mostRecentMonthStores.size;
    result.thisMonthMetrics.activationRate = mostRecentMonthStores.size / Object.keys(result.storeSummaries).length * 100;

    return result;
  };

  return { processData };
};
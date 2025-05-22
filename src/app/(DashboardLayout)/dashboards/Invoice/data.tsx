import { OrderData } from "@/store/apps/Invoice/invoiceSlice";
import { ProcessedData } from "./types";

export const calculateDueDateStatus = (dueDate: string, paymentStatus: string): 'Current' | 'Below 14 DPD' | '14 DPD' | '30 DPD' | '60 DPD' | 'Lunas' => {
  if (paymentStatus === 'LUNAS') return 'Lunas';
  
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Current';
  if (diffDays < 14) return 'Below 14 DPD';
  if (diffDays < 30) return '14 DPD';
  if (diffDays < 60) return '30 DPD';
  return '60 DPD';
};

export const useInvoiceData = () => {
  const processData = (orders: OrderData[], targetMonth: number, targetYear: number): ProcessedData => {
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
          activationRate: 0,
          totalLunas: 0,
          totalBelumLunas: 0,
          totalCOD: 0,
          totalTOP: 0
        },
        monthlyStoreCounts: {},
        monthlyOrderCounts: {},
        dueDateStatusCounts: {
          current: 0,
          below14DPD: 0,
          dpd14: 0,
          dpd30: 0,
          dpd60: 0,
          lunas: 0
        },
        paymentStatusMetrics: {}
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
        activationRate: 0,
        totalLunas: 0,
        totalBelumLunas: 0,
        totalCOD: 0,
        totalTOP: 0
      },
      monthlyStoreCounts: {},
      monthlyOrderCounts: {},
      dueDateStatusCounts: {
        current: 0,
        below14DPD: 0,
        dpd14: 0,
        dpd30: 0,
        dpd60: 0,
        lunas: 0
      },
      paymentStatusMetrics: {}
    };

    // Find the most recent month in the data
    let mostRecentMonth = '';
    let mostRecentMonthStores = new Set<string>();

    // Use the target month and year passed from Dashboard
    const intendedMonth = targetMonth;
    const intendedYear = targetYear;
    const intendedMonthKey = `${intendedYear}-${String(intendedMonth + 1).padStart(2, '0')}`;

    orders.forEach(order => {  
      const processedMonthKey = order.month;

      // Process payment status metrics
      const status = order.status_payment;
      if (!result.paymentStatusMetrics[status]) {
        result.paymentStatusMetrics[status] = {
          totalOrders: 0,
          totalInvoice: 0,
          totalProfit: 0
        };
      }
      result.paymentStatusMetrics[status].totalOrders += 1;
      result.paymentStatusMetrics[status].totalInvoice += order.total_invoice || 0;
      result.paymentStatusMetrics[status].totalProfit += order.profit || 0;

      // Update most recent month if this order is more recent
      if (!mostRecentMonth || processedMonthKey > mostRecentMonth) {
        mostRecentMonth = processedMonthKey;
        mostRecentMonthStores = new Set<string>();
        // Reset summaries when we find a new most recent month
        result.productSummaries = {};
        result.areaSummaries = {};
        result.dueDateStatusCounts = {
          current: 0,
          below14DPD: 0,
          dpd14: 0,
          dpd30: 0,
          dpd60: 0,
          lunas: 0
        };
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
        if (order.profit > 0) {
          result.thisMonthMetrics.totalProfit += order.profit;
        }
        

        if (order.status_payment == "LUNAS") {
          result.thisMonthMetrics.totalLunas += order.total_invoice || 0;
        } else if (order.status_payment == "WAITING VALIDATION BY FINANCE") {
          result.thisMonthMetrics.totalBelumLunas += order.total_invoice || 0;
        } else if (order.status_payment == "BELUM LUNAS") {
          result.thisMonthMetrics.totalBelumLunas += order.total_invoice || 0;
        } else if (order.status_payment == "PARTIAL") {
          result.thisMonthMetrics.totalBelumLunas += order.total_invoice || 0;
        }

        if (order.payment_type === "COD") {
          result.thisMonthMetrics.totalCOD += order.total_invoice || 0;
        } else if (order.payment_type === "TOP") {
          result.thisMonthMetrics.totalTOP += order.total_invoice || 0;
        }
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

      if (processedMonthKey === mostRecentMonth) {
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
          if (order.profit > 0 ) {
            gross_profit += order.profit;
            result.productSummaries[item.product_id].profit += order.profit;
          }
          
          result.productSummaries[item.product_id].totalInvoice += item.total_invoice || 0;
          
          
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
            result.categorySummaries[item.category].gross_profit += order.profit;
            if (item.price) {
              result.categorySummaries[item.category].totalPrice += item.price;
              result.categorySummaries[item.category].itemCount += 1;
            }
          }
        });

        console.log(mostRecentMonth)

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

        // DUE DATE STATUS COUNTING
        const dueDateStatus = calculateDueDateStatus(order.payment_due_date, order.status_payment);

        switch (dueDateStatus) {
          case 'Lunas':
            result.dueDateStatusCounts.lunas++;
            break;
          case 'Current':
            result.dueDateStatusCounts.current++;
            break;
          case 'Below 14 DPD':
            result.dueDateStatusCounts.below14DPD++;
            break;
          case '14 DPD':
            result.dueDateStatusCounts.dpd14++;
            break;
          case '30 DPD':
            result.dueDateStatusCounts.dpd30++;
            break;
          case '60 DPD':
            result.dueDateStatusCounts.dpd60++;
            break;
        }
      } 

      // Process store-specific data
      const userId = order.user_id;
      const storeName = order.store_name;
      const activeMonthKey = order.month; // YYYY-MM format

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
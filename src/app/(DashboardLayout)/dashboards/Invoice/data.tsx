import { OrderData } from "@/store/apps/Invoice/invoiceSlice";
import { ProcessedData } from "./types";


export const useInvoiceData = () => {
  const processData = (orders: OrderData[]): ProcessedData => {
    const result: ProcessedData = {
      overallTotalInvoice: 0,
      overallTotalPembayaran: 0,
      totalOrderCount: orders.length,
      hubSummaries: {},
      productSummaries: {},
      categorySummaries: {},
      storeSummaries: {},
      overallTOP: 0,
      overallCOD: 0,
      overallProfit: 0,
    };

    orders.forEach(order => {
      // Add to overall totals
      result.overallTotalInvoice += order.total_invoice;
      result.overallTotalPembayaran += order.total_pembayaran;

      if (order.payment_type == "COD") {
        result.overallCOD += order.total_invoice
      }else if (order.payment_type == "TOP") {
        result.overallTOP += order.total_invoice
      }

      let gross_profit = 0;
      

  

      // Process product each invoice
      order.detail_order.forEach(item => {
        if (!result.productSummaries[item.product_id]) {
          result.productSummaries[item.product_id] = {
            name: item.product_name,
            totalInvoice: 0,
            quantity: 0,
            price: item.price,
            difPrice: 1,
          };
        }
        if (item.price != result.productSummaries[item.product_id].price && item.price) {
          result.productSummaries[item.product_id].price += item.price
          result.productSummaries[item.product_id].difPrice += 1
        }

        const price = item.buy_price * item.order_quantity
        let profit = item.total_invoice - price

        if (profit < 0) {
          // console.log(`Order_id: ${order.order_id} Total Invoice: ${item.total_invoice}, Buy Price: ${item.buy_price}, Quantity: ${item.quantity}, Profit: ${profit}`);
          profit = 0
        }
        
        gross_profit += profit
      
        
        result.productSummaries[item.product_id].totalInvoice += item.total_invoice;
       

      
        
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
          
          result.categorySummaries[item.category].totalInvoice += item.total_invoice;
          result.categorySummaries[item.category].quantity += item.quantity || 1;
          result.categorySummaries[item.category].gross_profit += profit;
          if (item.price) {
            result.categorySummaries[item.category].totalPrice += item.price;
            result.categorySummaries[item.category].itemCount += 1;
          }
        }
      });

      // Process store-specific data
      const storeName = order.store_name;
      const orderMonth = new Date(order.order_date).toISOString().slice(0, 7); // YYYY-MM format

      if (!result.storeSummaries[storeName]) {
        result.storeSummaries[storeName] = {
          totalInvoice: 0,
          totalProfit: 0,
          orderCount: 0,
          activeMonths: new Set(),
          averageOrderValue: 0
        };
      }

      result.storeSummaries[storeName].totalInvoice += order.total_invoice;
      result.storeSummaries[storeName].totalProfit += gross_profit;
      result.storeSummaries[storeName].orderCount++;
      result.storeSummaries[storeName].activeMonths.add(orderMonth);
      result.storeSummaries[storeName].averageOrderValue = 
        result.storeSummaries[storeName].totalInvoice / result.storeSummaries[storeName].orderCount;

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


      result.hubSummaries[hub].totalInvoice += order.total_invoice;
      result.hubSummaries[hub].totalProfit += gross_profit;
      result.hubSummaries[hub].totalPembayaran += order.total_pembayaran;
      result.hubSummaries[hub].orderCount++;

      result.overallProfit += gross_profit;
    });


    return result;
  };

  return { processData };
};
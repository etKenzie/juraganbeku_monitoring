import { OrderData } from "@/store/apps/Invoice/invoiceSlice";

interface HubSummary {
  totalInvoice: number;
  totalPembayaran: number;
  orderCount: number;
}

interface ProcessedData {
  overallTotalInvoice: number;
  overallTotalPembayaran: number;
  totalOrderCount: number;
  hubSummaries: { [key: string]: HubSummary };
}

export const useInvoiceData = () => {
  const processData = (orders: OrderData[]): ProcessedData => {
    const result: ProcessedData = {
      overallTotalInvoice: 0,
      overallTotalPembayaran: 0,
      totalOrderCount: orders.length,
      hubSummaries: {}
    };

    orders.forEach(order => {
      // Add to overall totals
      result.overallTotalInvoice += order.total_invoice;
      result.overallTotalPembayaran += order.total_pembayaran;

      // Process hub-specific data
      const hub = order.process_hub;
      if (!result.hubSummaries[hub]) {
        result.hubSummaries[hub] = {
          totalInvoice: 0,
          totalPembayaran: 0,
          orderCount: 0
        };
      }

      result.hubSummaries[hub].totalInvoice += order.total_invoice;
      result.hubSummaries[hub].totalPembayaran += order.total_pembayaran;
      result.hubSummaries[hub].orderCount++;
    });

    return result;
  };

  return { processData };
};
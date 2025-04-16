import { OrderData } from "@/store/apps/Invoice/invoiceSlice";

export interface HubSummary {
    totalInvoice: number;
    totalPembayaran: number;
    totalProfit: number;
    orderCount: number;
  }
  
export interface ProductSummary {
name: string;
totalInvoice: number;
quantity: number;
price: number;
difPrice: number;
profit: number;
}



interface CategorySummary {
  totalInvoice: number;
  quantity: number;
  totalPrice: number;
  itemCount: number;
  gross_profit: number;
}

export interface AreaData {
  name: string;
  totalOrders: number;
  totalInvoice: number;
  totalProfit: number;
  totalCOD: number;
  totalTOP: number;
  totalLunas: number;
  totalBelumLunas: number;
  orders: OrderData[];
}

export interface ProcessedData {
  overallTotalInvoice: number;
  overallTotalPembayaran: number;
  totalOrderCount: number;
  hubSummaries: { [key: string]: HubSummary };
  productSummaries: { [key: string]: ProductSummary };
  categorySummaries: { [key: string]: CategorySummary };
  storeSummaries: { [key: string]: StoreSummary };
  areaSummaries: { [key: string]: AreaData };
  overallTOP: number;
  overallCOD: number;
  overallProfit: number;
  overallLunas: number;
  overallBelumLunas: number;
  thisMonthMetrics: {
    totalOrders: number;
    totalStores: number;
    totalInvoice: number;
    totalProfit: number;
    activationRate: number;
  };
  monthlyStoreCounts: { [key: string]: Set<string> };
  monthlyOrderCounts: { [key: string]: number };
}

export interface StoreSummary {
  storeName: string;
  userId: string;
  totalInvoice: number;
  totalProfit: number;
  orderCount: number;
  activeMonths: Set<string>;
  averageOrderValue: number;
  orders: OrderData[];
}
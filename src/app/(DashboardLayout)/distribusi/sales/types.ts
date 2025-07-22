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
  segmentSummaries: { [key: string]: AreaData & { activeMonths: Set<string> } };
  subBusinessTypeSummaries: { [key: string]: AreaData & { activeMonths: Set<string> } };
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
    totalLunas: number;
    totalBelumLunas: number;
    totalCOD: number;
    totalTOP: number;
  };
  monthlyStoreCounts: { [key: string]: Set<string> };
  monthlyOrderCounts: { [key: string]: number };
  weeklyData: { [key: string]: { totalInvoice: number; totalProfit: number } }; // New field for weekly data
  dueDateStatusCounts: {
    current: number;
    below14DPD: number;
    dpd14: number;
    dpd30: number;
    dpd60: number;
    lunas: number;
  };
  paymentStatusMetrics: { [key: string]: {
    totalOrders: number;
    totalInvoice: number;
    totalProfit: number;
  }};
  chartData: Array<{
    date: string;
    month: string;
    totalInvoice: number;
    totalProfit: number;
  }>;
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
  storeStatus: "Active" | "D1" | "D2" | "D3" | "Inactive";
  lastOrderDate?: string;
}
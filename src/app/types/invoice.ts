export interface StoreSummary {
  storeName: string;
  orderCount: number;
  totalInvoice: number;
  totalProfit: number;
  averageOrderValue: number;
  activeMonths: Set<string>;
  orders: OrderData[];
}

export interface ProductSummary {
  productName: string;
  totalOrders: number;
  totalRevenue: number;
  averagePrice: number;
}

export interface AreaSummary {
  areaName: string;
  totalStores: number;
  totalOrders: number;
  totalInvoice: number;
  totalProfit: number;
}

export interface ProcessedData {
  storeSummaries: Record<string, StoreSummary>;
  productSummaries: Record<string, {
    name: string;
    totalInvoice: number;
    quantity: number;
    price: number;
    difPrice: number;
    profit: number;
  }>;
  areaSummaries: Record<string, AreaSummary>;
  overallTotalInvoice: number;
  overallTotalPembayaran: number;
  overallProfit: number;
  overallLunas: number;
  overallBelumLunas: number;
  overallCOD: number;
  overallTOP: number;
  totalOrderCount: number;
  thisMonthMetrics: {
    totalOrders: number;
    totalStores: number;
    totalInvoice: number;
    totalProfit: number;
    totalLunas: number;
    totalBelumLunas: number;
    totalCOD: number;
    totalTOP: number;
    activationRate: number;
  };
  monthlyStoreCounts: Record<string, Set<string>>;
  monthlyOrderCounts: Record<string, number>;
  dueDateStatusCounts: {
    current: number;
    below14DPD: number;
    dpd14: number;
    dpd30: number;
    dpd60: number;
    lunas: number;
  };
}

export interface OrderData {
  id: string;
  user_id: string;
  order_date: string;
  total_invoice: number;
  total_profit: number;
  payment_status: 'Lunas' | 'Belum Lunas';
  payment_method: 'COD' | 'TOP';
  area: string;
  due_date_status: 'Current' | 'Below 14 DPD' | '14 DPD' | '30 DPD' | '60 DPD' | 'Above 60 DPD';
  // ... other existing fields ...
} 
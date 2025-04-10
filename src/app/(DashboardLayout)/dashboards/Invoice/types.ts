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
price: number
difPrice: number
}



interface CategorySummary {
  totalInvoice: number;
  quantity: number;
  totalPrice: number;
  itemCount: number;
  gross_profit: number;
}

export interface ProcessedData {
overallTotalInvoice: number;
overallTotalPembayaran: number;
totalOrderCount: number;
hubSummaries: {
  [key: string]: {
    totalInvoice: number;
    totalProfit: number;
    totalPembayaran: number;
    orderCount: number;
  };
};
categorySummaries: {
  [key: string]: {
    totalInvoice: number;
    gross_profit: number;
    quantity: number;
    totalPrice: number;
    itemCount: number;
  };
};
productSummaries: {
  [key: string]: {
    name: string;
    totalInvoice: number;
    quantity: number;
    price: number;
    difPrice: number;
  };
};
storeSummaries: {
  [key: string]: {
    totalInvoice: number;
    totalProfit: number;
    orderCount: number;
    activeMonths: Set<string>;
    averageOrderValue: number;
  };
};
overallTOP: number;
overallCOD: number;
overallProfit: number;
}
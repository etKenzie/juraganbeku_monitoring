import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { getCookie } from "cookies-next";
import axios from "../../../utils/axios";
import { AppDispatch } from "../../store";

const ORDER_DASHBOARD_URL = `https://dev.tokopandai.id/api/order/dashboard`;

// Combined interfaces
interface DashboardData {
  id: number;
  store: string;
  createdAt: Date;
  [key: string]: any;
}

interface GeraiData {
  id: number;
  nama_gerai: string;
  kode_gerai: string;
  [key: string]: any;
}

interface OrderDetail {
  id: string;
  order_code: string;
  product_id: string;
  sku: string;
  price: number;
  order_quantity: number;
  total_invoice: number;
  quantity: number | null;
  variant_name: string;
  product_variant_id: string;
  variant: string;
  value: number;
  order_date: string;
  status: string;
  nama_lengkap: string;
  nama_toko: string;
  segment: string;
  area: string;
  area_id: string;
  reseller_code: string;
  alamat: string;
  product_name: string;
  brands: string;
  category: string;
  dt_code: string;
  hub: string;
  principle_id: string;
  principle: string;
  area_name: string;
  serve_price: number | null;
  buy_price: number;
}

export interface OrderData {
  order_id: string;
  order_code: string;
  reseller_name: string;
  store_name: string;
  user_id: string;
  process_hub: string;
  total_invoice: number;
  total_pembayaran: number;
  payment_type: string;
  status_order: string;
  status_payment: string;
  order_date: string;
  area: string;
  detail_order: OrderDetail[];
}

export interface StateType {
  dashboardData: DashboardData[];
  geraiData: GeraiData[];
  loading: boolean;
  error: string | null;
  totalItems: number;
  meta: { totalItems: number } | null;
  orders: OrderData[];
}

const initialState: StateType = {
  dashboardData: [],
  geraiData: [],
  loading: false,
  error: null,
  totalItems: 0,
  meta: null,
  orders: [],
};

const invoiceSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    startLoading(state) {
      state.loading = true;
      state.error = null;
    },
    hasError(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    // getDashboardData(
    //   state,
    //   action: PayloadAction<{
    //     dashboardData: DashboardData[];
    //     totalItems: number;
    //   }>
    // ) {
    //   state.loading = false;
    //   state.dashboardData = action.payload.dashboardData;
    //   state.totalItems = action.payload.totalItems;
    // },
    // getGeraiData(
    //   state,
    //   action: PayloadAction<{
    //     data: GeraiData[];
    //     meta: { totalItems: number };
    //   }>
    // ) {
    //   state.geraiData = action.payload.data;
    //   state.meta = action.payload.meta;
    // },
    getOrdersSuccess(state, action: PayloadAction<OrderData[]>) {
      state.loading = false;
      state.orders = action.payload;
    },
  },
});

export const { 
  startLoading, 
  hasError, 
//   getDashboardData, 
//   getGeraiData,
  getOrdersSuccess 
} = invoiceSlice.actions;

interface OrderQuery {
  startDate?: string;
  endDate?: string;
  sortTime?: 'desc' | 'asc';
  area?: string;
}

export const fetchOrders = (params: OrderQuery) => async (dispatch: AppDispatch) => {
  dispatch(startLoading());
  try {
    const AUTH_TOKEN = getCookie("token");

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.append(key, value.toString());
    });

    const request = `${ORDER_DASHBOARD_URL}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`
    console.log(request);

    const response = await axios.get(
      request,
      {
        // headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
      }
    );

    if (response.data.code === 200) {
      dispatch(getOrdersSuccess(response.data.data));
    } else {
      dispatch(hasError(response.data.message || "Failed to fetch orders"));
    }
  } catch (error: any) {
    dispatch(hasError(error.message || "Failed to fetch orders"));
    throw new Error("AUTH_ERROR");
  }
};

export default invoiceSlice.reducer;

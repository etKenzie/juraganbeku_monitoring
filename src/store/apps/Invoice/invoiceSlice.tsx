import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { getCookie } from "cookies-next";
import axios from "../../../utils/axios";
import { AppDispatch } from "../../store";

const ORDER_DASHBOARD_URL = `https://dev.tokopandai.id/api/order/dashboard`;
const ORDER_NOO_URL = "https://dev.tokopandai.id/api/order/stores-order-once";
const ACTIVE_USERS_URL = "https://dev.tokopandai.id/api/order/active-user";
const UPDATE_ORDER_ITEMS_URL =
  "https://dev.tokopandai.id/api/order/order-items";

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
  order_item_id: string;
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
  type_category: string;
  sub_category: string;
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
  reseller_code: string;
  order_status: string;
  phone_number: string;
  order_date: string;
  payment_due_date: string;
  reseller_name: string;
  store_name: string;
  status_order: string;
  status_payment: string;
  payment_type: string;
  total_invoice: number;
  faktur_date: string;
  agent_name: string;
  total_pembayaran: number;
  user_id: string;
  detail_order: OrderDetail[];
  area: string;
  process_hub: string;
  profit: number;
  month: string;
  business_type: string;
  sub_business_type: string;
  // ... other existing fields ...
}

export interface StoreData {
  user_id: string;
  reseller_name: string;
  store_name: string;
  reseller_code: string;
  phone_number: string;
  segment: string;
  business_type: string;
  sub_business_type: string;
  first_active: string;
  period_month: string;
  first_order_month: string;
}

export interface StateType {
  dashboardData: DashboardData[];
  geraiData: GeraiData[];
  loading: boolean;
  error: string | null;
  totalItems: number;
  meta: { totalItems: number } | null;
  orders: OrderData[];
  nooData: OrderData[];
  storeData: StoreData[];
  pendingRequests: number;
}

const initialState: StateType = {
  dashboardData: [],
  geraiData: [],
  loading: false,
  error: null,
  totalItems: 0,
  meta: null,
  orders: [],
  nooData: [],
  storeData: [],
  pendingRequests: 0,
};

const invoiceSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    startLoading(state) {
      state.pendingRequests += 1;
      state.loading = true;
      state.error = null;
    },
    endLoading(state) {
      state.pendingRequests -= 1;
      if (state.pendingRequests === 0) {
        state.loading = false;
      }
    },
    hasError(state, action: PayloadAction<string>) {
      state.pendingRequests -= 1;
      if (state.pendingRequests === 0) {
        state.loading = false;
      }
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
      state.orders = action.payload;
    },
    getNOOSuccess(state, action: PayloadAction<OrderData[]>) {
      state.nooData = action.payload;
    },
    getStoreDataSuccess(state, action: PayloadAction<StoreData[]>) {
      state.storeData = action.payload;
    },
  },
});

export const {
  startLoading,
  endLoading,
  hasError,
  //   getDashboardData,
  //   getGeraiData,
  getOrdersSuccess,
  getNOOSuccess,
  getStoreDataSuccess,
} = invoiceSlice.actions;

interface OrderQuery {
  startDate?: string;
  endDate?: string;
  sortTime?: "desc" | "asc";
  month?: string;
  area?: string;
  segment?: string;
  payment?: string;
}

export const fetchOrders =
  (params: OrderQuery) => async (dispatch: AppDispatch) => {
    dispatch(startLoading());
    try {
      const AUTH_TOKEN = getCookie("token");

      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value.toString());
      });

      const request = `${ORDER_DASHBOARD_URL}${
        searchParams.toString() ? `?${searchParams.toString()}` : ""
      }`;
      console.log(request);

      const response = await axios.get(request, {
        // headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
      });

      if (response.data.code === 200) {
        dispatch(getOrdersSuccess(response.data.data));
        dispatch(endLoading());
      } else {
        dispatch(hasError(response.data.message || "Failed to fetch orders"));
      }
    } catch (error: any) {
      dispatch(hasError(error.message || "Failed to fetch orders"));
      throw new Error("AUTH_ERROR");
    }
  };

export const fetchNOO =
  (params: OrderQuery) => async (dispatch: AppDispatch) => {
    dispatch(startLoading());
    try {
      const AUTH_TOKEN = getCookie("token");

      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value.toString());
      });

      const request = `${ORDER_NOO_URL}${
        searchParams.toString() ? `?${searchParams.toString()}` : ""
      }`;
      // console.log(request);

      const response = await axios.get(request, {
        // headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
      });

      if (response.data.code === 200) {
        dispatch(getNOOSuccess(response.data.data));
        dispatch(endLoading());
      } else {
        dispatch(hasError(response.data.message || "Failed to fetch NOO data"));
      }
    } catch (error: any) {
      dispatch(hasError(error.message || "Failed to fetch NOO data"));
      throw new Error("AUTH_ERROR");
    }
  };

interface UpdateOrderItemPayload {
  details: Array<{
    order_item_id: string;
    new_buy_price: number;
  }>;
}

export const updateOrderItems =
  (payload: UpdateOrderItemPayload) => async (dispatch: AppDispatch) => {
    dispatch(startLoading());
    try {
      const AUTH_TOKEN = getCookie("token");

      const response = await axios.patch(UPDATE_ORDER_ITEMS_URL, payload, {
        // headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
      });
      // console.log(response);

      if (response.data.code === 200) {
        dispatch(endLoading());
        return response.data;
      } else {
        dispatch(
          hasError(response.data.message || "Failed to update order items")
        );
        throw new Error(
          response.data.message || "Failed to update order items"
        );
      }
    } catch (error: any) {
      dispatch(hasError(error.message || "Failed to update order items"));
      throw error;
    }
  };

export const fetchStoreData = (params?: { area?: string, month?: string }) => async (dispatch: AppDispatch) => {
  dispatch(startLoading());
  try {
    const AUTH_TOKEN = getCookie("token");

    const searchParams = new URLSearchParams();
    searchParams.append("limit", "10000");
    searchParams.append("page", "1");
    searchParams.append("sortBy", "desc");
    
      if (params?.area) {
        searchParams.append("area", params.area);
      }
      if (params?.month) {
        searchParams.append("month", params.month);
      }

    const request = `${ACTIVE_USERS_URL}?${searchParams.toString()}`;

    const response = await axios.get(request, {
      // headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
    });

    if (response.data.code === 200) {
      dispatch(getStoreDataSuccess(response.data.data.data));
      dispatch(endLoading());
    } else {
      dispatch(hasError(response.data.message || "Failed to fetch store data"));
    }
  } catch (error: any) {
    dispatch(hasError(error.message || "Failed to fetch store data"));
    throw new Error("AUTH_ERROR");
  }
};

export default invoiceSlice.reducer;

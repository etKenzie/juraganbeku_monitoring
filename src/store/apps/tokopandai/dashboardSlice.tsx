import axios from "../../../utils/axios";
import { createSlice } from "@reduxjs/toolkit";
import { AppDispatch } from "../../store";
import type { PayloadAction } from "@reduxjs/toolkit";
import { getCookie } from "cookies-next";

const VISIT_URL = `${process.env.NEXT_PUBLIC_VISIT_URL}/mistery-shopper`;
const GERAI_URL = `${process.env.NEXT_PUBLIC_VISIT_URL}/data-gerai`;

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

interface StateType {
  dashboardData: DashboardData[];
  geraiData: GeraiData[];
  loading: boolean;
  error: string | null;
  totalItems: number;
  meta: { totalItems: number } | null;
}

const initialState: StateType = {
  dashboardData: [],
  geraiData: [],
  loading: false,
  error: null,
  totalItems: 0,
  meta: null,
};

const dashboardSlice = createSlice({
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
      state.dashboardData = [];
    },
    getDashboardData(
      state,
      action: PayloadAction<{
        dashboardData: DashboardData[];
        totalItems: number;
      }>
    ) {
      state.loading = false;
      state.dashboardData = action.payload.dashboardData;
      //   state.totalItems = action.payload.totalItems;
    },
    getGeraiData(
      state,
      action: PayloadAction<{
        data: GeraiData[];
        meta: { totalItems: number };
      }>
    ) {
      state.geraiData = action.payload.data;
      state.meta = action.payload.meta;
    },
  },
});

export const { startLoading, hasError, getDashboardData, getGeraiData } = dashboardSlice.actions;

// Separate query interfaces
interface DashboardQuery {
  limit?: number;
  startDate?: string;
  endDate?: string;
  area?: string;
  all?: boolean;
}

interface GeraiQuery {
  search?: string;
  limit?: number;
  area?: string;
  ms_type?: string;
}

export const fetchDashboardData = (params: DashboardQuery) => async (dispatch: AppDispatch) => {
  dispatch(startLoading());
  try {
    const AUTH_TOKEN = getCookie("token");
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.append(key, value.toString());
    });

    const response = await axios.get(`${VISIT_URL}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`, {
      headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
    });

    const filteredData = response.data.data.filter((item: { cm_status: number }) => item.cm_status === 1);

    dispatch(
      getDashboardData({
        dashboardData: filteredData,
        totalItems: filteredData.length,
      })
    );

    return filteredData;
  } catch (error: any) {
    dispatch(hasError(error.message || "Failed to fetch dashboard data"));
    throw new Error("AUTH_ERROR");
  }
};

export const fetchGeraiData = (params: GeraiQuery) => async (dispatch: AppDispatch) => {
  try {
    const AUTH_TOKEN = getCookie("token");

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.append(key, value.toString());
    });

    const response = await axios.get(`${GERAI_URL}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`, {
      headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
    });

    dispatch(
      getGeraiData({
        data: response.data.data,
        meta: response.data.meta,
      })
    );
  } catch (error: any) {
    dispatch(hasError(error.message || "Failed to fetch gerai data"));
    throw new Error("AUTH_ERROR");
    // if (error.response?.status === 401 || error.response?.status === 403) {
    //   throw new Error("AUTH_ERROR");
    // }
  }
};

export default dashboardSlice.reducer;

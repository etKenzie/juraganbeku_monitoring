import axios from "../../../utils/axios";
import { createSlice } from "@reduxjs/toolkit";
import { AppDispatch } from "../../store";
import type { PayloadAction } from "@reduxjs/toolkit";
import { getCookie } from "cookies-next";
import { Product } from "@/app/(DashboardLayout)/types/apps/visit";

// URL API backend
const BASE_URL = `${process.env.NEXT_PUBLIC_VISIT_URL}/mistery-shopper`;
const AUTH_TOKEN = getCookie("token");

interface StateType {
  products: Product[];
  loading: boolean;
  error: string | null;
  totalCount: number;
}

// Initial state
const initialState: StateType = {
  products: [],
  loading: false,
  error: null,
  totalCount: 0,
};

// Create slice
const productSlice = createSlice({
  name: "products",
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
    getProducts(state, action: PayloadAction<{ products: Product[]; totalCount: number }>) {
      state.loading = false;
      state.products = action.payload.products;
      state.totalCount = action.payload.totalCount;
    },
    editProduct(state, action: PayloadAction<Product>) {
      const updatedProduct = action.payload;
      const index = state.products.findIndex((product) => product.id === updatedProduct.id);
      if (index !== -1) {
        state.products[index] = updatedProduct;
      }
    },
  },
});

// Export actions
export const { startLoading, hasError, getProducts, editProduct } = productSlice.actions;

export const fetchProducts =
  (search: string, page: number, rowsPerPage: number, sort: string, order: string, startDate: string, endDate: string, setIsNotFound: (val: boolean) => void) => async (dispatch: AppDispatch) => {
    dispatch(startLoading());
    try {
      const token = getCookie("token");

      if (!token) {
        throw new Error("Token not found");
      }

      const response = await axios.get(`${BASE_URL}?page=${page + 1}&limit=${rowsPerPage}&search=${search}&sort=${sort}&order=${order}&startDate=${startDate}&endDate=${endDate}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        const { data, meta } = response.data;

        setIsNotFound(data.length === 0);

        dispatch(
          getProducts({
            products: data,
            totalCount: meta.totalItems,
          })
        );
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error: any) {
      console.error("Error fetching products:", error);
      setIsNotFound(true);
      dispatch(hasError(error.message || "Failed to fetch products"));
    }
  };

export const updateProduct = (product: Product) => async (dispatch: AppDispatch) => {
  dispatch(startLoading());

  try {
    const token = getCookie("token");

    if (!token) {
      throw new Error("Token not found");
    }

    const formData = new FormData();

    Object.entries(product).forEach(([key, value]) => {
      if (value instanceof File) {
        formData.append(key, value);
      } else if (value !== undefined && value !== null) {
        formData.append(key, value as string);
      }
    });

    const response = await axios.put(`${BASE_URL}/${product.id}`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    if (response.status === 200) {
      dispatch(editProduct(response.data));
    } else {
      throw new Error(`Unexpected response status: ${response.status}`);
    }
  } catch (error: any) {
    console.error("Error updating product:", error);
    dispatch(hasError(error.message || "Failed to update product"));
  }
};

export default productSlice.reducer;

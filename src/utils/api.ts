import axios from "axios";
import { getCookie, setCookie, deleteCookie } from "cookies-next";
import Router from "next/router";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_VISIT_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 403) {
      const refreshToken = getCookie("refresh_token");

      if (refreshToken) {
        try {
          const res = await axios.post(`${process.env.NEXT_PUBLIC_VISIT_URL}/auth/refresh-token`, { refreshToken });

          // set token baru ke cookies
          setCookie("token", res.data.accessToken);
          error.config.headers.Authorization = `Bearer ${res.data.accessToken}`;

          // re-peat request yang gagal
          return axios(error.config);
        } catch (refreshError) {
          console.error("Refresh token failed, logging out...", refreshError);

          // if refresh token gagal, hapus semua cookies & redirect ke login
          deleteCookie("token");
          deleteCookie("refresh_token");
          deleteCookie("brand_id");
          localStorage.clear();

          Router.push("/login");
        }
      } else {
        console.log("No refresh token found, redirecting to login...");
        deleteCookie("token");
        deleteCookie("brand_id");
        localStorage.clear();
        Router.push("/login");
      }
    }

    return Promise.reject(error);
  }
);

export default api;

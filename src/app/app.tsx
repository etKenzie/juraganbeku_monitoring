"use client";
import React from "react";
import Head from "next/head";
import { getCookie } from "cookies-next";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import RTL from "@/app/(DashboardLayout)/layout/shared/customizer/RTL";
import { ThemeSettings } from "@/utils/theme/Theme";
import { useSelector } from "react-redux";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import { AppState } from "@/store/store";
import "@/utils/i18n";
import "@/app/api/index";

const getFavicon = (brandId: number) => {
  const brandIcons: Record<number, string> = {
    1: "/favicon/haus.ico",
    2: "/favicon/jiwa.ico",
    3: "/favicon/hangry.ico",
    4: "/favicon/darmi.ico",
  };
  return brandIcons[brandId] || "/favicon/jiwa.ico";
};

const MyApp = ({ children }: { children: React.ReactNode }) => {
  const theme = ThemeSettings();
  const customizer = useSelector((state: AppState) => state.customizer);

  const brandId = Number(getCookie("brand_id")) || 0;
  const favicon = getFavicon(brandId);

  return (
    <>
      {/* Dynamic Favicon */}
      <Head>
        <link rel="icon" href={favicon} type="image/x-icon" />
      </Head>

      <AppRouterCacheProvider options={{ enableCssLayer: true }}>
        <ThemeProvider theme={theme}>
          <RTL direction={customizer.activeDir}>
            <CssBaseline />
            {children}
          </RTL>
        </ThemeProvider>
      </AppRouterCacheProvider>
    </>
  );
};

export default MyApp;

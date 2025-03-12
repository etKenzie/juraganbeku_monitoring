"use client";
import React, { useEffect } from "react";

import { getCookie } from "cookies-next";

import { useRouter } from "next/navigation";
import Loading from "@/app/(DashboardLayout)/loading";

import TokopandaiDashboard from "./dashboards/tokopandai/Dashboard";
import InvoiceDashboard from "./dashboards/Invoice/Dashboard"


export default function DashboardPage() {
  // add data on peak hours. Average line length based on date. 12 - 4. download image functionality.
  // dont include data for toilet/food for those without toilet/food
  // A1018  tunjukin struk info
  // type A yang jual makanan, type B hanya minimum
  // store type 1 hanya drink and service, type 2 ada drink service food, store type 3
  // daily score updates
  // liat brp liat toko

  // const router = useRouter();
  // const brandId = getCookie("brand_id");

  // useEffect(() => {
  //   // Redirect to login if no brand_id cookie exists
  //   if (!brandId) {
  //     router.push("/auth/auth2/login");
  //     return;
  //   }
  // }, [brandId, router]);

  // if (!brandId) {
  //   return <Loading />;
  // }

  // Return the appropriate dashboard based on brand_id
  // switch (brandId) {
  //   case "1":
  //     return <TokopandaiDashboard />;
  //   case "2":
  //     return <JanjijiwaDashboard />;
  //   case "3":
  //     return <HangryDashboard />;
  //   case "4":
  //     return <DarmiDashboard />;
  //   case "5":
  //     return <AmorDashboard />;
  //   case "7":
  //     return <HausEbikeDashboard />
  //   case "8":
  //     return <RoempiDashboard />;
  //   default:
  //     // Handle unknown brand_id
  //     router.push("/auth/auth2/login");
  //     return <Loading />;
  // }

  return <InvoiceDashboard />
}

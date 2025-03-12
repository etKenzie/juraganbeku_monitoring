"use client";

import PageContainer from "@/app/components/container/PageContainer";
import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";
import React from "react";
import ApexColumn from "@/app/components/charts/ApexColumn";
import ColumnChartCategories from "../../charts/ColumnChartCategories";

const BCrumb = [
  {
    to: "/",
    title: "Home",
  },
  {
    title: "Column Chart",
  },
];

const ColumnCategories = () => {
  return (
    <PageContainer title="Column Chart" description="this is Column Chart">
      {/* breadcrumb */}
      {/* <Breadcrumb title="Column Chart" items={BCrumb} /> */}
      {/* end breadcrumb */}
      <ColumnChartCategories />
    </PageContainer>
  );
};

export default ColumnCategories;

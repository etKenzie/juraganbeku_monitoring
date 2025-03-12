import PageContainer from "@/app/components/container/PageContainer";
import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";

import React from "react";
import ApexLine from "@/app/components/charts/ApexLine";
import LineChartMonthScore from "../../charts/LineChartMonthScore";
import LineChartMonthVisit from "../../charts/LineChartMonthVisit";

const BCrumb = [
  {
    to: "/",
    title: "Home",
  },
  {
    title: "Monthly Score Average",
  },
];

const LineMonthVisit = () => {
  return (
    <PageContainer
      title="Jumlah Toko yang Dikunkungi per Bulan"
      description="this is Line Chart"
    >
      {/* breadcrumb */}
      {/* <Breadcrumb title="Line Chart" items={BCrumb} /> */}
      {/* end breadcrumb */}
      <LineChartMonthVisit />
    </PageContainer>
  );
};

export default LineMonthVisit;

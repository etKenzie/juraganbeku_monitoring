import PageContainer from "@/app/components/container/PageContainer";
import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";

import React from "react";
import ApexLine from "@/app/components/charts/ApexLine";
import LineChartMonthScore from "../../charts/LineChartMonthScore";
import { Box } from "@mui/material";

const BCrumb = [
  {
    to: "/",
    title: "Home",
  },
  {
    title: "Monthly Score Average",
  },
];

type Data = {
  averageScore: number;
  averageToilet: number;
  averageFood: number;
  averageDrink: number;
  averageService: number;
  count: number;
};

type LineMonthScoreProps = {
  data: Record<string, Data>;
};

const LineMonthScore: React.FC<LineMonthScoreProps> = ({ data }) => {
  return (
    <PageContainer title="Score Average" description="this is Line Chart">
      {/* breadcrumb */}
      {/* <Breadcrumb title="Line Chart" items={BCrumb} /> */}
      {/* end breadcrumb */}
      <LineChartMonthScore data={data} />
    </PageContainer>
  );
};

export default LineMonthScore;

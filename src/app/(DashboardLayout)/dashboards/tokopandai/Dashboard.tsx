"use client";
import React from "react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "@/store/hooks";
import { RootState } from "@/store/store";
import { useDashboardData } from "@/app/(DashboardLayout)/dashboards/tokopandai/data";
import {
  fetchDashboardData,
  fetchGeraiData,
} from "@/store/apps/tokopandai/dashboardSlice";

import { getCookie } from "cookies-next";
import PageContainer from "@/app/components/container/PageContainer";
// components
import ItemCards from "@/app/components/dashboards/tokopandai/ItemCards";
import Welcome from "@/app/(DashboardLayout)/layout/shared/welcome/Welcome";

import TopStores from "@/app/components/dashboards/tokopandai/TopStores";
import LineMonthScore from "@/app/components/dashboards/tokopandai/LineMonthScore";
import ColumnCardVisited from "@/app/components/dashboards/tokopandai/ColumnCardVisited";
import { Grid, Box, TextField, MenuItem, Button } from "@mui/material";
import { useRouter } from "next/navigation";
import Loading from "@/app/(DashboardLayout)/loading";
import ColumnChartAreas from "@/app/components/dashboards/tokopandai/ColumnChartAreas";
import AverageScore from "@/app/components/dashboards/tokopandai/AverageScore";
import ItemCards2 from "@/app/components/dashboards/tokopandai/ItemCards2";
import VisitedStores from "@/app/components/dashboards/tokopandai/VisitedStores";
import AverageStaff from "@/app/components/dashboards/tokopandai/AverageStaff";
import AverageLineLength from "@/app/components/dashboards/tokopandai/AverageLineLength";
import AverageEntry from "@/app/components/dashboards/tokopandai/AverageEntry";
import AverageService from "@/app/components/dashboards/tokopandai/AverageService";
import SummaryCards from "@/app/components/dashboards/tokopandai/SummaryCards";

export default function Dashboard() {
  // add data on peak hours. Average line length based on date. 12 - 4. download image functionality.
  // dont include data for toilet/food for those without toilet/food
  // A1018  tunjukin struk info
  // type A yang jual makanan, type B hanya minimum
  // store type 1 hanya drink and service, type 2 ada drink service food, store type 3
  // daily score updates
  // liat brp liat toko

  const target = 90;

  const router = useRouter();
  const { processData } = useDashboardData();
  const dispatch = useDispatch();
  const { dashboardData, geraiData, totalItems, meta, loading } = useSelector(
    (state: RootState) => state.dashboardReducer
  );

  const [startDate, setStartDate] = useState("2024-01-01");
  const [endDate, setEndDate] = useState("2024-12-31");
  const [area, setArea] = useState("");
  const [searchGerai, setSearchGerai] = useState("");

  const [areas, setAreas] = useState<string[]>([""]);

  useEffect(() => {
    handleApplyFilters();
    // Initial gerai fetch
    // dispatch(fetchGeraiData({ search: "haus" }))
  }, []);

  const handleApplyFilters = async () => {
    try {
      await dispatch(
        fetchDashboardData({
          limit: 10000,
          startDate,
          endDate,
          area,
        })
      );

      const start = new Date(startDate);
      const maxEndDate = new Date(
        start.getFullYear(),
        start.getMonth() + 13,
        0
      );
      const selectedEndDate = new Date(endDate);

      if (selectedEndDate > maxEndDate) {
        setEndDate(maxEndDate.toISOString().split("T")[0]);
        alert("End Date adjusted to not exceed 12 months from Start Date.");
      }

      // await dispatch(fetchGeraiData({ ms_type: "haus", area: area }));
    } catch (error) {
      if (error instanceof Error && error.message === "AUTH_ERROR") {
        // console.log(error);
        router.push("/auth/auth2/login");
      }
    }
  };

  // const handleGeraiSearch = (search: string) => {
  //   setSearchGerai(search);
  //   dispatch(fetchGeraiData({ search }));
  // };

  // Show loading screen while data is being fetched
  if (loading || !dashboardData.length) {
    return <Loading />;
  }

  if (dashboardData.length == 0) {
    handleApplyFilters();
  }
  console.log(dashboardData);

  const { monthlyData, storeData, areaData, averageValues, questionStats } =
    processData(dashboardData, areas);

  return (
    <PageContainer title="Dashboard" description="this is Dashboard">
      {/* Filter Section */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box display="flex" gap={2} alignItems="center" width="100%">
          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ flexBasis: "20%", flexGrow: 1 }}
          />
          <TextField
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ flexBasis: "20%", flexGrow: 1 }}
          />
          <TextField
            label="Select Area"
            select
            value={area}
            onChange={(e) => setArea(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ flexBasis: "30%", flexGrow: 1 }}
          >
            <MenuItem value="">All Areas</MenuItem> {/* "All Areas" option */}
            {areas
              .filter((areaOption) => areaOption !== "") // Avoid duplicate "All Areas"
              .map((areaOption) => (
                <MenuItem key={areaOption} value={areaOption}>
                  {areaOption}
                </MenuItem>
              ))}
          </TextField>
          <Button
            variant="contained"
            color="primary"
            onClick={handleApplyFilters}
            sx={{ flexBasis: "20%", flexGrow: 1 }}
          >
            Apply Filters
          </Button>
        </Box>
      </Box>

      {/* Dashboard Content */}
      <Grid container spacing={3}>
        {/* <ItemCards
          monthlyData={monthlyData}
          storeData={storeData}
          areaData={areaData}
          totalStores={meta?.totalItems || 0}
          averageValues={averageValues}
        /> */}

        <Grid item xs={12} sm={6} md={2}>
          <AverageScore averageScore={averageValues.score} target={target} />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <VisitedStores
            storeData={storeData}
            totalStores={meta?.totalItems || 0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <AverageStaff averageScore={averageValues.crew} />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <AverageLineLength averageScore={averageValues.line} />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <AverageEntry averageScore={averageValues.entry} />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <AverageService averageScore={averageValues.greeting} />
        </Grid>

        <Grid item xs={12} lg={8}>
          <LineMonthScore data={monthlyData} />
        </Grid>
        <Grid item xs={12} lg={4}>
          <ColumnCardVisited data={monthlyData} totalItems={totalItems || 0} />
        </Grid>

        <Grid item xs={12}>
          <SummaryCards questionStats={questionStats} />
        </Grid>
        {/* <Grid item xs={12} lg={12}>
          <ItemCards2 averageValues={averageValues} />
        </Grid> */}
        {/* <Grid item xs={12} lg={12}>
          <ItemCards
            monthlyData={monthlyData}
            storeData={storeData}
            areaData={areaData}
            totalStores={meta?.totalItems || 0}
          />
        </Grid> */}
        <Grid item xs={12} lg={12}>
          <ColumnChartAreas
            areaData={Object.keys(areaData).length === 1 ? storeData : areaData}
            isArea={Object.keys(areaData).length === 1 ? false : true}
          />
        </Grid>

        {Object.keys(areaData).length !== 1 && (
          <Grid item xs={12} lg={12}>
            <TopStores data={storeData} />
          </Grid>
        )}
      </Grid>

      {/* <Welcome /> */}
    </PageContainer>
  );
}

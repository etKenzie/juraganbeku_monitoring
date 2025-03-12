import dynamic from "next/dynamic";
import React from "react";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { useTheme } from "@mui/material/styles";
import DashboardCard from "../../shared/DashboardCard";
import SkeletonEmployeeSalaryCard from "../skeleton/EmployeeSalaryCard";
import {
  Box,
  useMediaQuery,
  Dialog,
  DialogContent,
  Typography,
  Grid,
  Paper,
  Divider,
  Stack,
  Select,
  MenuItem,
} from "@mui/material";
import LineMonthScore from "./LineMonthScore";
import { StoreData, StoreEntry } from "@/app/(DashboardLayout)/models/types";

type AreaData = {
  averageScore: number;
  averageToilet: number;
  averageFood: number;
  averageDrink: number;
  averageService: number;
};

type NumericKeys<T> = {
  [K in keyof T]: T[K] extends number ? K : never;
}[keyof T];

type NumericSortKey = NumericKeys<AreaData>;

interface AreaChartProps {
  isLoading?: boolean;
  areaData: Record<string, AreaData>;
  isArea: boolean;
}

const ProcessEntry = (entries: StoreEntry[]) => {
  const monthlyData: Record<string, any> = {};

  entries.forEach((entry) => {
    const month = new Date(entry.date).toLocaleString("default", {
      month: "short",
    });

    if (!monthlyData[month]) {
      monthlyData[month] = {
        averageScore: 0,
        averageToilet: 0,
        averageFood: 0,
        averageDrink: 0,
        averageService: 0,
        count: 0,
      };
    }

    const data = monthlyData[month];
    data.count += 1;
    data.averageScore += (entry.score - data.averageScore) / data.count;
    data.averageToilet += (entry.toilet - data.averageToilet) / data.count;
    data.averageFood += (entry.food - data.averageFood) / data.count;
    data.averageDrink += (entry.drink - data.averageDrink) / data.count;
    data.averageService += (entry.service - data.averageService) / data.count;
  });

  Object.entries(monthlyData).forEach(([month, values]) => {
    monthlyData[month] = {
      ...values,
      averageScore: values.averageScore * 100,
      averageToilet: values.averageToilet * 100,
      averageFood: values.averageFood * 100,
      averageDrink: values.averageDrink * 100,
      averageService: values.averageService * 100,
    };
  });

  return monthlyData;
};

const ColumnChartAreas = ({ isLoading, areaData, isArea }: AreaChartProps) => {
  const theme = useTheme();
  const [selectedArea, setSelectedArea] = React.useState<any>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [sortKey, setSortKey] = React.useState<NumericSortKey>("averageScore");

  const handleBarClick = (event: any, chartContext: any, config: any) => {
    const areaName = areas[config.dataPointIndex];
    const areaDetails = areaData[areaName];
    setSelectedArea({ name: areaName, ...areaDetails });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedArea(null);
  };

  // Sort areas based on selected key
  const sortedAreas = Object.entries(areaData)
    .sort(([, a], [, b]) => b[sortKey] - a[sortKey])
    .map(([key]) => key);

  const areas = sortedAreas;
  const scores = areas.map((area) => areaData[area][sortKey]);

  // Calculate average score across all areas
  const averageScore =
    scores.reduce((acc, curr) => acc + curr, 0) / scores.length;

  const getBarColor = (score: number) => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const isSmallScreen = useMediaQuery(theme.breakpoints.down("lg")); // Adjust "lg" if needed

  const borderColor = theme.palette.mode === "dark" ? "#fff" : "#111"; // Adjusting color based on theme
  const optionscolumnchart: any = {
    chart: {
      type: "bar",
      fontFamily: "'Plus Jakarta Sans', sans-serif;",
      foreColor: theme.palette.mode === "dark" ? "#adb0bb" : "#111",
      toolbar: {
        show: false,
      },
      height: 280,
      events: {
        dataPointSelection: handleBarClick,
      },
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: "45%",
        distributed: true,
        endingShape: "rounded",
        cursor: "pointer",
      },
    },
    colors: scores.map(getBarColor),
    states: {
      hover: {
        filter: {
          type: "darken", // Change to "darken" if needed
          value: 0.1, // Adjust this value to make it less white
        },
      },
      active: {
        filter: {
          type: "none",
        },
      },
    },
    dataLabels: {
      // enabled: false,
      formatter: (val: number) => `${val.toFixed(0)}`,
      style: {
        fontSize: "12px",
        colors: [theme.palette.mode === "dark" ? "#fff" : "#111"],
      },
    },
    legend: {
      show: false,
    },
    grid: {
      show: false,
    },
    xaxis: {
      categories: areas,
      labels: {
        show: !isSmallScreen, // Hide x-axis labels
        style: {
          fontSize: "12px",
          colors: theme.palette.mode === "dark" ? "#adb0bb" : "#111",
        },
      },
    },
    yaxis: {
      max: 100,
      tickAmount: 5,
      labels: {
        // show: false,
        formatter: (val: number) => `${val.toFixed(0)}`,
        style: {
          colors: theme.palette.mode === "dark" ? "#adb0bb" : "#111",
        },
      },
    },
    annotations: {
      yaxis: [
        {
          y: averageScore,
          borderColor: borderColor,
          borderWidth: 2,
          strokeDashArray: 0,
          label: {
            borderColor: borderColor,
            style: {
              color: "#fff",
              background: borderColor,
            },
          },
        },
      ],
    },
    tooltip: {
      theme: theme.palette.mode,
      style: {
        fontSize: "12px",
      },
      y: {
        formatter: (val: number) => `${val.toFixed(1)}`,
      },
    },
  };

  const seriescolumnchart = [
    {
      name: "Score",
      data: scores,
    },
  ];

  const title = isArea ? "Area Performance" : "Store Performance";

  const insightText = (
    <span>
      Average score of{" "}
      <strong style={{ color: theme.palette.primary.main }}>
        {averageScore.toFixed(1)}
      </strong>{" "}
      with{" "}
      <strong style={{ color: theme.palette.primary.main }}>
        {scores.filter((score) => score < 80).length}
      </strong>{" "}
      scoring below target of 80
    </span>
  );

  const subtitle = isArea ? (
    insightText
  ) : (
    <span>
      Average store score of{" "}
      <strong style={{ color: theme.palette.primary.main }}>
        {averageScore.toFixed(1)}
      </strong>{" "}
      with{" "}
      <strong style={{ color: theme.palette.primary.main }}>
        {scores.filter((score) => score < 80).length}
      </strong>{" "}
      scoring below target of 80
    </span>
  );

  return (
    <>
      {isLoading ? (
        <SkeletonEmployeeSalaryCard />
      ) : (
        <DashboardCard
          title={title}
          subtitle={subtitle}
          action={
            <Select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as NumericSortKey)}
              size="small"
            >
              <MenuItem value="averageScore">Nilai</MenuItem>
              <MenuItem value="averageToilet">Toilet</MenuItem>
              <MenuItem value="averageFood">Food</MenuItem>
              <MenuItem value="averageDrink">Drink</MenuItem>
              <MenuItem value="averageService">Service</MenuItem>
            </Select>
          }
        >
          <Box height="300px">
            <Chart
              options={optionscolumnchart}
              series={seriescolumnchart}
              type="bar"
              height={280}
              width={"100%"}
            />
          </Box>
        </DashboardCard>
      )}

      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
      >
        <DialogContent
          sx={{
            backgroundColor: "#f5f5f5",
            padding: 4,
          }}
        >
          <Paper
            elevation={3}
            sx={{
              padding: 3,
              borderRadius: 2,
              marginBottom: 4,
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: "bold",
                marginBottom: 2,
                textAlign: "center",
              }}
            >
              {selectedArea?.name || "Area Name"}
            </Typography>

            {/* Scores and Details */}
            <Grid container spacing={4}>
              {/* Details Section */}
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  Details
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {selectedArea?.kode_gerai && (
                  <Typography>Kode Gerai: {selectedArea.kode_gerai}</Typography>
                )}

                {selectedArea?.area && (
                  <Typography>Lokasi: {selectedArea.area}</Typography>
                )}
                <Typography>
                  Jumlah Kunjungan: {selectedArea?.visits}
                </Typography>
              </Grid>
              {/* Scores Section */}
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  Scores
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography>
                  Nilai: {selectedArea?.averageScore.toFixed(1)}
                </Typography>
                <Typography>
                  Toilet: {selectedArea?.averageToilet.toFixed(1)}
                </Typography>
                <Typography>
                  Food: {selectedArea?.averageFood.toFixed(1)}
                </Typography>
                <Typography>
                  Drink: {selectedArea?.averageDrink.toFixed(1)}
                </Typography>
                <Typography>
                  Service: {selectedArea?.averageService.toFixed(1)}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {selectedArea?.entries && (
            <Paper
              elevation={3}
              sx={{
                padding: 3,
                borderRadius: 2,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: "bold",
                  marginBottom: 2,
                }}
              >
                Performance Over Time
              </Typography>
              <LineMonthScore data={ProcessEntry(selectedArea.entries)} />
            </Paper>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ColumnChartAreas;

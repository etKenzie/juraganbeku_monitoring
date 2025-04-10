"use client";
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { useTheme } from "@mui/material/styles";
import { Stack, Typography, Avatar, Box } from "@mui/material";
import { IconArrowDownRight, IconArrowUpLeft } from "@tabler/icons-react";
import DashboardCard from "../../shared/DashboardCard";
import SkeletonCustomersCard from "../skeleton/CustomersCard";

interface CustomersCardProps {
  isLoading?: boolean;
  averageScore: number;
  target?: number;
  title?: string;
  subtitle?: string;
  time?: boolean;
}

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const AverageScore = ({
  isLoading,
  averageScore,
  target,
  title = "Average Score",
  subtitle,
  time,
}: CustomersCardProps) => {
  // Theme colors
  const theme = useTheme();
  const primary = theme.palette.primary.light;
  const secondarylight = theme.palette.secondary.light;

  let average = Math.round(averageScore * 1000) / 10;

  average = average / 100;

  // Determine if above target
  const isAboveTarget = target !== undefined && average >= target;
  const difference =
    target !== undefined ? Math.round(Math.abs(average - target) * 10) / 10 : 0;

  // Arrow Icon and Colors
  const ArrowIcon = isAboveTarget ? IconArrowUpLeft : IconArrowDownRight;
  const iconColor = isAboveTarget
    ? theme.palette.success.light
    : theme.palette.error.light;
  const arrowStyle = isAboveTarget
    ? { color: "#39B69A" }
    : { color: "#FA896B" };

  return (
    <>
      {isLoading ? (
        <SkeletonCustomersCard />
      ) : (
        <DashboardCard height="100%">
          <>
            {/* Title */}
            <Typography variant="subtitle2" color="textSecondary">
              {title}
            </Typography>

            {/* Score */}
            <Typography variant="h2">
              {time ? formatTime(average) : average.toFixed(1)}
            </Typography>

            {/* Subtitle (optional) */}
            {subtitle && (
              <Stack direction="row" spacing={1} mt={1} alignItems="center">
                <Typography variant="subtitle2" color="textSecondary">
                  {subtitle}
                </Typography>
              </Stack>
            )}

            {/* Only show if target exists */}
            {target !== undefined && (
              <Stack direction="row" spacing={1} mt={1} alignItems="center">
                <Avatar sx={{ bgcolor: iconColor, width: 24, height: 24 }}>
                  <ArrowIcon width={20} style={arrowStyle} />
                </Avatar>

                <Typography
                  variant="subtitle2"
                  fontWeight="600"
                  style={arrowStyle}
                >
                  {difference}
                </Typography>
                <Typography variant="subtitle2" color="textSecondary">
                  from target
                </Typography>
              </Stack>
            )}
          </>
        </DashboardCard>
      )}
    </>
  );
};

export default AverageScore;

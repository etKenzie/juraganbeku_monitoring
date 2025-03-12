"use client";
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import { useTheme } from "@mui/material/styles";
import { Stack, Typography, Box, Dialog, DialogTitle, DialogContent, List, ListItem, ListItemText, IconButton } from "@mui/material";
import { IconArrowDownRight, IconArrowUpLeft, IconDownload } from "@tabler/icons-react";
import DashboardCard from "../../shared/DashboardCard";
import SkeletonCustomersCard from "../skeleton/CustomersCard";
import React from "react";
import { Questions } from "@/app/(DashboardLayout)/dashboards/janjijiwa/types";

// import handlePDFDownload from "../janjijiwa/DisplayStore";

interface CustomersCardProps {
  isLoading?: boolean;
  averageScore: number;
  gerai: Questions[];
}

const KasihStruk = ({ isLoading, averageScore, gerai }: CustomersCardProps) => {
  const theme = useTheme();
  const [modalOpen, setModalOpen] = React.useState(false);

  const handleClick = () => {
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
  };

  console.log(gerai);

  // chart color
  const secondarylight = theme.palette.secondary.light;

  // chart
  const optionscolumnchart: any = {
    chart: {
      type: "area",
      fontFamily: "'Plus Jakarta Sans', sans-serif;",
      foreColor: "#adb0bb",
      toolbar: {
        show: false,
      },
      height: 80,
      sparkline: {
        enabled: true,
      },
      group: "sparklines",
    },
    stroke: {
      curve: "smooth",
      width: 2,
    },
    fill: {
      colors: [secondarylight],
      type: "solid",
      opacity: 0.05,
    },
    markers: {
      size: 0,
    },
    tooltip: {
      theme: theme.palette.mode === "dark" ? "dark" : "light",
      x: {
        show: false,
      },
    },
  };
  //   const seriescolumnchart = [
  //     {
  //       name: "",
  //       color: secondary,
  //       data: [30, 25, 35, 20, 30, 40],
  //     },
  //   ];

  return (
    <>
      {isLoading ? (
        <SkeletonCustomersCard />
      ) : (
        <DashboardCard height="100%">
          <>
            <Box
              sx={{
                cursor: "pointer",
                "&:hover": {
                  opacity: 0.8,
                },
              }}
              onClick={handleClick}>
              <Typography variant="subtitle2" color="textSecondary">
                Lupa Struk
              </Typography>
              <Typography variant="h2">{averageScore.toFixed(1)}%</Typography>
              <Stack direction="row" spacing={1} mt={1} alignItems="center">
                <Typography variant="subtitle2" color="textSecondary">
                  Click to see stores
                </Typography>
              </Stack>
            </Box>
          </>
        </DashboardCard>
      )}

      <Dialog open={modalOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h4" sx={{ mb: 2 }}>
            Stores that Forgot to Give Receipt
          </Typography>
        </DialogTitle>
        <DialogContent>
          <List>
            {gerai.map((entry, index) => (
              <ListItem key={index} divider={index !== gerai.length - 1}>
                <ListItemText primary={<Typography variant="body1">{entry.store}</Typography>} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default KasihStruk;

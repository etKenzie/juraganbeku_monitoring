"use client";
import Image from "next/image";
import { Box, CardContent, Grid, Typography } from "@mui/material";

type AverageValues = {
  crew: number;
  greeting: number;
  entry: number;
  line: number;
};

type ItemProps = {
  averageValues: AverageValues;
};

const ItemCards2: React.FC<ItemProps> = ({ averageValues }) => {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const itemcards = [
    {
      icon: "/images/svgs/icon-crew.svg",
      title: "Average Crew",
      digits: averageValues.crew.toFixed(1),
      bgcolor: "warning",
    },
    {
      icon: "/images/svgs/icon-time.svg",
      title: "Entry to Service",
      digits: formatTime(averageValues.entry),
      bgcolor: "warning",
    },
    {
      icon: "/images/svgs/icon-time.svg",
      title: "Greeting to Service",
      digits: formatTime(averageValues.greeting),
      bgcolor: "warning",
    },
    {
      icon: "/images/svgs/icon-queue.svg",
      title: "Average Line Length",
      digits: averageValues.line.toFixed(1),
      bgcolor: "warning",
    },
  ];

  return (
    <Grid container spacing={3}>
      {itemcards.map((topcard, i) => (
        <Grid item xs={12} sm={6} md={3} key={i}>
          <Box bgcolor={topcard.bgcolor + ".light"} textAlign="center">
            <CardContent>
              <Image
                src={topcard.icon}
                alt={topcard.title}
                width={50}
                height={50}
              />
              <Typography
                color={topcard.bgcolor + ".main"}
                mt={1}
                variant="subtitle1"
                fontWeight={600}
              >
                {topcard.title}
              </Typography>
              <Typography
                color={topcard.bgcolor + ".main"}
                variant="h4"
                fontWeight={600}
              >
                {topcard.digits}
              </Typography>
            </CardContent>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
};

export default ItemCards2;

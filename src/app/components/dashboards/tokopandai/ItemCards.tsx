"use client";
import Image from "next/image";
import { Box, CardContent, Grid, Typography } from "@mui/material";

import Percent from "../../../../../public/images/svgs/icon-percent.svg";

type MonthlyData = {
  averageScore: number;
  averageToilet: number;
  averageFood: number;
  averageDrink: number;
  averageService: number;
  count: number;
};

type StoreData = {
  averageScore: number;
  averageToilet: number;
  averageFood: number;
  averageDrink: number;
  averageService: number;
  area: string;
  visits: number;
  name: string;
};

type AreaData = {
  averageScore: number;
  averageToilet: number;
  averageFood: number;
  averageDrink: number;
  averageService: number;
  visits: number;
};

type AverageValues = {
  crew: number;
  greeting: number;
  entry: number;
  line: number;
};

type ItemProps = {
  monthlyData: Record<string, MonthlyData>;
  storeData: Record<string, StoreData>;
  areaData: Record<string, AreaData>;
  totalStores: number;
  averageValues: AverageValues;
};

const ItemCards: React.FC<ItemProps> = ({
  monthlyData,
  storeData,
  areaData,
  totalStores,
  averageValues,
}) => {
  const categories = Object.keys(monthlyData);
  const mostRecentMonth = categories[categories.length - 1];
  // Calculate average score across all months
  const totalScore = Object.values(monthlyData).reduce(
    (sum, data) => sum + data.averageScore,
    0
  );
  const averageScore = totalScore / Object.values(monthlyData).length;

  const mostRecentData = monthlyData[mostRecentMonth];

  // Find highest scoring category
  let highestCategoryName = "";
  if (mostRecentData) {
    const scores = {
      Drink: Math.round(mostRecentData.averageDrink * 1000) / 1000,
      Food: Math.round(mostRecentData.averageFood * 1000) / 1000,
      Service: Math.round(mostRecentData.averageService * 1000) / 1000,
      Toilet: Math.round(mostRecentData.averageToilet * 1000) / 1000,
    };

    const highestCategory = Object.entries(scores).reduce(
      (highest, [category, score]) => {
        return score > highest.score ? { category, score } : highest;
      },
      { category: "", score: -Infinity }
    );

    highestCategoryName = highestCategory.category;
  }

  // Find highest scoring area using areaData
  const highestScoringArea = Object.entries(areaData).reduce(
    (highest, [area, data]) => {
      return data.averageScore > highest.score
        ? { area, score: data.averageScore }
        : highest;
    },
    { area: "", score: 0 }
  );

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const itemcards = [
    {
      icon: Percent,
      title: "Average Score",
      digits: (Math.round(averageScore * 100) / 100).toString(),
      bgcolor: "primary",
    },
    {
      icon: "/images/svgs/icon-store2.svg",
      title: "Visited Stores",
      digits: `${Object.keys(
        storeData
      ).length.toString()} / ${totalStores.toString()}`,
      bgcolor: "primary",
    },
    // {
    //   icon: "/images/svgs/icon-category.svg",
    //   title: "Kategori Terbaik",
    //   digits: highestCategoryName,
    //   bgcolor: "primary",
    // },
    // {
    //   icon: "/images/svgs/icon-location.svg",
    //   title: "Area Terbaik",
    //   digits: `${highestScoringArea.area}`,
    //   bgcolor: "primary",
    // },
    {
      icon: "/images/svgs/icon-staff.svg",
      title: "Average Staff",
      digits: averageValues.crew.toFixed(1),
      bgcolor: "primary",
    },
    {
      icon: "/images/svgs/icon-queue.svg",
      title: "Average Line Length",
      digits: averageValues.line.toFixed(1),
      bgcolor: "primary",
    },
    {
      icon: "/images/svgs/icon-entry.svg",
      title: "Entry to Service",
      digits: formatTime(averageValues.entry),
      bgcolor: "primary",
    },
    {
      icon: "/images/svgs/icon-time.svg",
      title: "Greeting to Service",
      digits: formatTime(averageValues.greeting),
      bgcolor: "primary",
    },
  ];

  const MyIcon = ({ color = "black" }) => (
    <svg width="50" height="50" viewBox="0 0 24 24" fill={color}>
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
    </svg>
  );

  return (
    <Grid container spacing={3}>
      {itemcards.map((topcard, i) => (
        <Grid item xs={12} sm={6} md={2} key={i}>
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

export default ItemCards;

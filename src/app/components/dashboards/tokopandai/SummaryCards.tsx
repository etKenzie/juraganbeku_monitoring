import React from "react";
import { Grid, Typography, Box, Divider } from "@mui/material";
import DashboardCard from "../../shared/DashboardCard";

type QuestionStats = {
  [key: string]: {
    averageScore: number;
  };
};

interface SummaryCardsProps {
  questionStats: QuestionStats;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ questionStats }) => {
  const getQuestionText = (questionId: string): string => {
    const questionMappings: { [key: string]: string } = {
      // Drink Questions (A1001-A1008)
      A1001: "Taste of Drink",
      A1002: "Appearance and Color",
      A1003: "Texture of Drink",
      A1004: "Straw and Variant Check",
      A1005: "Seal Integrity",
      A1006: "Variant Sticker",
      A1007: "Foreign Objects",
      A1008: "Freshness and Odor",

      // Service Questions (A1009-A1039)
      A1009: "Greeting",
      A1010: "Clarity of Voice",
      A1011: "Smile and Attitude",
      A1012: "Customer Interaction",
      A1013: "Order Confirmation",
      A1014: "Up Selling",
      A1015: "Order Repeat",
      A1016: "Payment Method Inquiry",
      A1017: "Staff Uniform",
      A1018: "Receipt Given",
      A1019: "Transaction Closure",
      A1020: "Name Call",
      A1021: "Order Repeat by Crew",
      A1022: "Crew Uniform",
      A1023: "Farewell Message",
      A1024: "Terrace Floor Cleanliness",
      A1025: "Parking Area Trash Bins",
      A1026: "Drink Sign Cleanliness",
      A1027: "Lobby Floor Cleanliness",
      A1028: "Seat and Table Cleanliness",
      A1029: "Store Odor",
      A1030: "Room Temperature Comfort",
      A1031: "Music Volume",
      A1032: "Menu Display Cleanliness",
      A1033: "Wall Mural/Cleanliness",
      A1034: "Lighting Functionality",
      A1035: "Air Conditioning Functionality",
      A1036: "Crew Accessories",
      A1037: "Team Collaboration",
      A1038: "Customer Service Responsiveness",
      A1039: "Professionalism and Courtesy",

      // Food Questions (B1001-B1008)
      B1001: "Taste Quality",
      B1002: "Appearance and Color",
      B1003: "Topping Quality",
      B1004: "Texture Quality",
      B1005: "Sauce/Gravy Consistency",
      B1006: "Container Seal Integrity",
      B1007: "Foreign Object Free",
      B1008: "Freshness and Odor",

      // Toilet Questions (C1001-C1006)
      C1001: "Toilet Door Functionality",
      C1002: "Toilet Floor Cleanliness",
      C1003: "Toilet Odor",
      C1004: "Toilet Flush Functionality",
      C1005: "Toilet Equipment Storage",
      C1006: "Sink Functionality",
    };

    return questionMappings[questionId] || questionId;
  };

  const getCategoryStats = (
    prefix: string,
    startIndex: number,
    endIndex: number
  ) => {
    const categoryQuestions = Object.entries(questionStats)
      .filter(([key]) => {
        const questionNumber = parseInt(key.slice(1));
        return (
          key.startsWith(prefix) &&
          questionNumber >= startIndex &&
          questionNumber <= endIndex
        );
      })
      .map(([key, stats]) => ({
        id: key,
        score: stats.averageScore,
      }));

    if (categoryQuestions.length === 0) return null;

    const avgScore =
      categoryQuestions.reduce((acc, q) => acc + q.score, 0) /
      categoryQuestions.length;

    // Sort questions by score
    const sortedQuestions = [...categoryQuestions].sort(
      (a, b) => b.score - a.score
    );

    return {
      averageScore: avgScore,
      strengths: sortedQuestions.slice(0, 2), // Top 2 highest scores
      weaknesses: sortedQuestions.slice(-2).reverse(), // Bottom 2 lowest scores
    };
  };

  const categories = [
    { prefix: "A", name: "Service", startIndex: 1009, endIndex: 1039 },
    { prefix: "B", name: "Food", startIndex: 1001, endIndex: 1008 },
    { prefix: "A", name: "Drink", startIndex: 1001, endIndex: 1008 },
    { prefix: "C", name: "Toilet", startIndex: 1001, endIndex: 1006 },
  ];

  return (
    <Grid container spacing={3}>
      {categories.map((category) => {
        const stats = getCategoryStats(
          category.prefix,
          category.startIndex,
          category.endIndex
        );
        if (!stats) return null;

        return (
          <Grid item xs={12} sm={6} md={3} key={category.name}>
            <DashboardCard
              title={`${category.name}`}
              subtitle={`Average Score: ${(stats.averageScore * 100).toFixed(
                1
              )}%`}
            >
              <>
                <Typography variant="h6" color="success.main" gutterBottom>
                  Strengths
                </Typography>
                {stats.strengths.map((question, index) => (
                  <Box key={index} mb={1}>
                    <Typography variant="body2" gutterBottom>
                      {getQuestionText(question.id)}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      display="block"
                      gutterBottom
                    >
                      {question.id} - {(question.score * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                ))}

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" color="error" gutterBottom>
                  Weaknesses
                </Typography>
                {stats.weaknesses.map((question, index) => (
                  <Box key={index} mb={1}>
                    <Typography variant="body2" gutterBottom>
                      {getQuestionText(question.id)}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      display="block"
                      gutterBottom
                    >
                      {question.id} - {(question.score * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                ))}
              </>
            </DashboardCard>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default SummaryCards;

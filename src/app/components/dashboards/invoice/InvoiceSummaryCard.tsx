"use client";
import { formatCurrency, formatLargeNumber } from "@/app/utils/formatNumber";
import { Box, Typography } from "@mui/material";

interface InvoiceSummaryCardProps {
  title: string;
  value: number;
  isCurrency?: boolean;
  onClick?: () => void;
}

const InvoiceSummaryCard = ({
  title,
  value,
  isCurrency = false,
  onClick,
}: InvoiceSummaryCardProps) => {
  const formattedValue = isCurrency ? formatCurrency(value) : formatLargeNumber(value);

  return (
    <Box
      onClick={onClick}
      sx={{
        p: 3,
        bgcolor: "background.paper",
        borderRadius: 2,
        boxShadow: 1,
        height: "100%",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s ease-in-out",
        "&:hover": onClick ? {
          boxShadow: 3,
          transform: "translateY(-2px)",
        } : {},
      }}
    >
      <Typography variant="subtitle2" color="textSecondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h4" component="div">
        {formattedValue}
      </Typography>
    </Box>
  );
};

export default InvoiceSummaryCard; 
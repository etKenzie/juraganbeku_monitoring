"use client";
import { Typography, Box } from "@mui/material";
import { formatLargeNumber, formatCurrency } from "@/app/utils/formatNumber";

interface InvoiceSummaryCardProps {
  title: string;
  value: number;
  isCurrency?: boolean;
}

const InvoiceSummaryCard = ({
  title,
  value,
  isCurrency = false,
}: InvoiceSummaryCardProps) => {
  const formattedValue = isCurrency ? formatCurrency(value) : formatLargeNumber(value);

  return (
    <Box
      sx={{
        p: 3,
        bgcolor: "background.paper",
        borderRadius: 2,
        boxShadow: 1,
        height: "100%",
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
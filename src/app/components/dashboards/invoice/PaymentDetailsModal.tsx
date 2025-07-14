"use client";
import { formatCurrency } from "@/app/utils/formatNumber";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    Typography,
} from "@mui/material";
import React from "react";

interface PaymentDetailsModalProps {
  open: boolean;
  onClose: () => void;
  paymentData: {
    // totalInvoice: number;
    totalLunas: number;
    totalBelumLunas: number;
    totalCOD: number;
    totalTOP: number;
  };
}

const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({
  open,
  onClose,
  paymentData,
}) => {
  const paymentItems = [
    // {
    //   title: "Total Invoice",
    //   value: paymentData.totalInvoice,
    //   color: "primary.main",
    // },
    {
      title: "Total Lunas",
      value: paymentData.totalLunas,
      color: "success.main",
    },
    {
      title: "Total Belum Lunas",
      value: paymentData.totalBelumLunas,
      color: "error.main",
    },
    {
      title: "Total COD",
      value: paymentData.totalCOD,
      color: "info.main",
    },
    {
      title: "Total TOP",
      value: paymentData.totalTOP,
      color: "warning.main",
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle>Payment Details</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          {paymentItems.map((item) => (
            <Grid item xs={12} sm={6} key={item.title}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: "background.paper",
                  borderRadius: 1,
                  border: 1,
                  borderColor: "divider",
                  textAlign: "center",
                }}
              >
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  {item.title}
                </Typography>
                <Typography
                  variant="h6"
                  component="div"
                  sx={{ color: item.color, fontWeight: "bold" }}
                >
                  {formatCurrency(item.value)}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentDetailsModal; 
import { ProductSummary } from "@/app/(DashboardLayout)/distribusi/sales/types";
import { formatCurrency } from "@/app/utils/formatNumber";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    Paper,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    Typography
} from "@mui/material";
import React, { useEffect, useState } from "react";
import InvoiceLineChart from "./InvoiceLineChart";

interface ProductDetailsModalProps {
  open: boolean;
  onClose: () => void;
  product: ProductSummary & { productId: string };
}

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  open,
  onClose,
  product,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [chartData, setChartData] = useState<
    Array<{
      date: string;
      month: string;
      totalInvoice: number;
      totalProfit: number;
    }>
  >([]);

  useEffect(() => {
    if (product?.monthlyData) {
      setChartData(product.monthlyData);
    }
  }, [product]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (!product) {
    console.warn("ProductDetailsModal: No product data provided");
    return null;
  }

  // Use pre-calculated values from data processing
  const totalQuantity = product.totalQuantity || 0;
  const totalProfit = product.totalProfit || 0;
  const margin = product.margin || 0;
  const averagePrice = product.price / product.difPrice;


  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: "80vh",
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle>{product.name} - Product Details</DialogTitle>
      <DialogContent>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="Overview" />
          <Tab label="Orders" />
        </Tabs>

        {activeTab === 0 && (
          <Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Product Summary
                  </Typography>
                  <Typography>Product ID: {product.productId}</Typography>
                                     <Typography>Total Quantity Sold: {totalQuantity}</Typography>
                   <Typography>
                     Total Invoice: {formatCurrency(product.totalInvoice)}
                   </Typography>
                   <Typography>
                     Total Profit: {formatCurrency(totalProfit)}
                   </Typography>
                   <Typography>
                     Average Price: {formatCurrency(averagePrice)}
                   </Typography>
                   <Typography>
                     Margin: {margin.toFixed(2)}%
                   </Typography>
                  <Typography>
                    Price Variations: {product.difPrice}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <InvoiceLineChart data={chartData} timePeriod="Monthly" />
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}

        {activeTab === 1 && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order Date</TableCell>
                  <TableCell>Order Code</TableCell>
                  <TableCell>Store Name</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Unit Price</TableCell>
                  <TableCell>Total Invoice</TableCell>
                  <TableCell>Profit Contribution</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {product.orders?.map((order) => {
                  const productItems = order.detail_order?.filter(
                    (item) => item?.product_id === product.productId
                  ) || [];
                  
                  return productItems.map((item, index) => {
                    const itemInvoice = Number(item?.total_invoice) || 0;
                    const orderProfit = order.profit || 0;
                    const orderInvoice = order.total_invoice || 0;
                    const profitProportion = orderInvoice > 0 ? itemInvoice / orderInvoice : 0;
                    const profitContribution = orderProfit * profitProportion;

                    return (
                      <TableRow key={`${order.order_id}-${index}`}>
                        <TableCell>
                          {new Date(order.order_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{order.order_code}</TableCell>
                        <TableCell>{order.store_name}</TableCell>
                        <TableCell>{item?.order_quantity || 0}</TableCell>
                        <TableCell>{formatCurrency(Number(item?.price) || 0)}</TableCell>
                        <TableCell>{formatCurrency(itemInvoice)}</TableCell>
                        <TableCell>{formatCurrency(profitContribution)}</TableCell>
                      </TableRow>
                    );
                  });
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductDetailsModal; 
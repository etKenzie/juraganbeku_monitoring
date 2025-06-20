"use client";
import { calculateDueDateStatus } from "@/app/(DashboardLayout)/dashboards/Invoice/data";
import DownloadButton from "@/app/components/common/DownloadButton";
import { formatCurrency } from "@/app/utils/formatNumber";
import { OrderData, updateOrderItems } from "@/store/apps/Invoice/invoiceSlice";
import { AppDispatch } from "@/store/store";
import CancelIcon from "@mui/icons-material/Cancel";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Modal,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { useDispatch } from "react-redux";

type Order = "asc" | "desc";

type SortableField =
  | keyof OrderData
  | "order_date"
  | "profit"
  | "due_date_status";

interface HeadCell {
  id: SortableField;
  label: string;
  numeric: boolean;
}

const headCells: HeadCell[] = [
  { id: "order_code", label: "Order Code", numeric: false },
  { id: "order_date", label: "Order Date", numeric: false },
  { id: "month", label: "Month", numeric: false },
  { id: "payment_due_date", label: "Due Date", numeric: false },
  { id: "reseller_name", label: "Reseller Name", numeric: false },
  { id: "store_name", label: "Store Name", numeric: false },
  { id: "status_order", label: "Status Order", numeric: false },
  { id: "status_payment", label: "Status Payment", numeric: false },
  { id: "payment_type", label: "Payment Type", numeric: false },
  { id: "due_date_status", label: "Due Date Status", numeric: false },
  { id: "total_invoice", label: "Total Invoice", numeric: true },
  { id: "profit", label: "Profit", numeric: true },
];

interface OrdersTableProps {
  orders: OrderData[];
  title?: string;
  exportOrderDetails?: boolean;
}

const OrdersTable = ({ orders: initialOrders, title, exportOrderDetails = true }: OrdersTableProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const [orders, setOrders] = useState<OrderData[]>(initialOrders);
  const [orderBy, setOrderBy] = useState<SortableField>("order_date");
  const [order, setOrder] = useState<Order>("desc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusOrderFilter, setStatusOrderFilter] = useState<string>("");
  const [statusPaymentFilter, setStatusPaymentFilter] = useState<string>("");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>("");
  const [dueDateStatusFilter, setDueDateStatusFilter] = useState<string>("");
  const [monthFilter, setMonthFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [editingBuyPrices, setEditingBuyPrices] = useState<{
    [key: string]: number;
  }>({});
  const [isEditing, setIsEditing] = useState(false);
  const [tagFilter, setTagFilter] = useState<string>("");

  const handleRequestSort = (property: SortableField) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // Convert to WIB (UTC+7)
    // const wibDate = new Date(date.getTime() + (7 * 60 * 60 * 1000));

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
      // hour12: false
    });
  };

  const calculateOrderProfit = (order: OrderData) => {
    let totalProfit = 0;
    order.detail_order?.forEach((item) => {
      if (!item) return;
      const price = (item.buy_price || 0) * (item.order_quantity || 0);
      let profit = (item.total_invoice || 0) - price;

      totalProfit += profit;
    });
    return totalProfit;
  };

  const getOrderTags = (order: OrderData) => {
    const tags: string[] = [];
    const profit = calculateOrderProfit(order);
    if (profit < 0) {
      tags.push("NEGATIVE_PROFIT");
    }
    return tags;
  };

  const hasZeroBuyPrice = (order: OrderData) => {
    return order.detail_order?.some(
      (item) =>
        item.buy_price === 0 &&
        item.product_name !== "BIAYA ADMINISTRASI" &&
        item.product_name !== "BIAYA DELIVERY"
    );
  };

  const searchFields = (order: OrderData, query: string): boolean => {
    if (!query) return true;

    const searchableFields = [
      order.order_code,
      order.reseller_name,
      order.store_name,
      order.status_order,
      order.status_payment,
      order.payment_type,
      order.month,
      order.business_type,
      order.sub_business_type,
      calculateDueDateStatus(order.payment_due_date, order.status_payment),
      formatCurrency(order.total_invoice),
      formatCurrency(order.profit),
    ];

    return searchableFields.some((field) =>
      field?.toString().toLowerCase().includes(query.toLowerCase())
    );
  };

  const filteredOrders = orders.filter((order) => {
    // Exclude CANCEL BY ADMIN orders by default
    if (order.status_order === "CANCEL BY ADMIN") return false;

    // Apply filters
    if (statusOrderFilter && order.status_order !== statusOrderFilter)
      return false;
    if (statusPaymentFilter && order.status_payment !== statusPaymentFilter)
      return false;
    if (paymentTypeFilter && order.payment_type !== paymentTypeFilter)
      return false;
    if (
      dueDateStatusFilter &&
      calculateDueDateStatus(order.payment_due_date, order.status_payment) !==
        dueDateStatusFilter
    )
      return false;
    if (monthFilter && order.month !== monthFilter) return false;

    // Tag filtering
    if (tagFilter) {
      const hasNegativeProfit = order.profit < 0;
      const hasZeroBuyPrice = order.detail_order?.some(
        (item) => item.buy_price === 0
      );

      if (tagFilter === "NEGATIVE_PROFIT" && !hasNegativeProfit) return false;
      if (tagFilter === "ZERO_BUY_PRICE" && !hasZeroBuyPrice) return false;
    }

    // Search functionality
    if (searchQuery) {
      return searchFields(order, searchQuery);
    }

    return true;
  });

  const uniqueStatusOrders = Array.from(
    new Set(orders.map((order) => order.status_order))
  );
  const uniqueStatusPayments = Array.from(
    new Set(orders.map((order) => order.status_payment))
  );
  const uniquePaymentTypes = Array.from(
    new Set(orders.map((order) => order.payment_type))
  );
  const uniqueMonths = Array.from(new Set(orders.map((order) => order.month)));
  const uniqueDueDateStatuses = [
    "Current",
    "Below 14 DPD",
    "14 DPD",
    "30 DPD",
    "60 DPD",
    "Lunas",
  ];

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    if (orderBy === "order_date") {
      aValue = new Date(a.order_date).getTime();
      bValue = new Date(b.order_date).getTime();
    } else if (orderBy === "profit") {
      aValue = calculateOrderProfit(a);
      bValue = calculateOrderProfit(b);
    } else {
      aValue = a[orderBy as keyof OrderData];
      bValue = b[orderBy as keyof OrderData];
    }

    if (order === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
    }
  });

  const handleRowClick = (order: OrderData) => {
    setSelectedOrder(order);
    // Initialize editingBuyPrices with current buy prices
    const initialBuyPrices: { [key: string]: number } = {};
    order.detail_order?.forEach((item) => {
      if (item.order_item_id) {
        initialBuyPrices[item.order_item_id] = item.buy_price || 0;
      }
    });
    setEditingBuyPrices(initialBuyPrices);
    setIsEditing(false);
  };

  const handleBuyPriceChange = (orderItemId: string, newPrice: number) => {
    setEditingBuyPrices((prev) => ({
      ...prev,
      [orderItemId]: newPrice,
    }));
  };

  const handleSaveBuyPrices = async () => {
    if (!selectedOrder) return;

    const details = Object.entries(editingBuyPrices).map(
      ([order_item_id, new_buy_price]) => ({
        order_item_id,
        new_buy_price,
      })
    );

    try {
      await dispatch(updateOrderItems({ details }));

      // Update only the profit in the table row
      const updatedOrders = orders.map((order) => {
        if (order.order_id === selectedOrder.order_id) {
          const newProfit =
            selectedOrder.detail_order?.reduce((total, item) => {
              const buyPrice =
                editingBuyPrices[item.order_item_id] ?? item.buy_price ?? 0;
              const price = buyPrice * (item.order_quantity || 0);
              let profit = (item.total_invoice || 0) - price;
              if (profit < 0) profit = 0;
              return total + profit;
            }, 0) || 0;

          return {
            ...order,
            profit: newProfit,
          };
        }
        return order;
      });

      setOrders(updatedOrders);
      setIsEditing(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error("Failed to update buy prices:", error);
    }
  };

  const handleCancelEdit = () => {
    if (!selectedOrder) return;
    // Reset to original buy prices
    const originalBuyPrices: { [key: string]: number } = {};
    selectedOrder.detail_order?.forEach((item) => {
      if (item.order_item_id) {
        originalBuyPrices[item.order_item_id] = item.buy_price || 0;
      }
    });
    setEditingBuyPrices(originalBuyPrices);
    setIsEditing(false);
  };

  const getOrderTagsString = (order: OrderData) => {
    const tags: string[] = [];
    if (order.profit < 0) {
      tags.push("Negative Profit");
    }
    if (hasZeroBuyPrice(order)) {
      tags.push("Zero Buy Price");
    }
    return tags.join(", ");
  };

  const prepareDataForExport = (orders: OrderData[]) => {
    const rows: any[] = [];
    orders.forEach((order) => {
      if (exportOrderDetails && order.detail_order && order.detail_order.length > 0) {
        order.detail_order.forEach((item, idx) => {
          rows.push({
            order_code: idx === 0 ? order.order_code : '',
            reseller_name: idx === 0 ? order.reseller_name : '',
            store_name: idx === 0 ? order.store_name : '',
            segment: idx === 0 ? order.business_type : '',
            area: idx === 0 ? order.area : '',
            reseller_code: idx === 0 ? order.reseller_code : '',
            phone_number: idx === 0 ? order.phone_number : '',
            status_order: idx === 0 ? order.status_order : '',
            status_payment: idx === 0 ? order.status_payment : '',
            payment_type: idx === 0 ? order.payment_type : '',
            order_date: idx === 0 ? order.order_date : '',
            faktur_date: idx === 0 ? order.faktur_date : '',
            payment_due_date: idx === 0 ? order.payment_due_date : '',
            month: idx === 0 ? order.month : '',
            due_date_status: idx === 0 ? calculateDueDateStatus(order.payment_due_date, order.status_payment) : '',
            total_invoice: idx === 0 ? order.total_invoice : '',
            agent_name: idx === 0 ? order.agent_name : '',
            profit: idx === 0 ? order.profit : '',
            Tags: idx === 0 ? getOrderTagsString(order) : '',
            // Order item details
            product_name: item.product_name,
            quantity: item.order_quantity,
            buy_price: item.buy_price,
            item_total_invoice: item.total_invoice,
          });
        });
      } else {
        // Only export order-level info
        rows.push({
          order_code: order.order_code,
          reseller_name: order.reseller_name,
          store_name: order.store_name,
          segment: order.business_type,
          area: order.area,
          reseller_code: order.reseller_code,
          phone_number: order.phone_number,
          status_order: order.status_order,
          status_payment: order.status_payment,
          payment_type: order.payment_type,
          order_date: order.order_date,
          faktur_date: order.faktur_date,
          payment_due_date: order.payment_due_date,
          month: order.month,
          due_date_status: calculateDueDateStatus(order.payment_due_date, order.status_payment),
          total_invoice: order.total_invoice,
          agent_name: order.agent_name,
          profit: order.profit,
          Tags: getOrderTagsString(order),
        });
      }
    });
    return rows;
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
          mt: 4,
        }}
      >
        <Typography variant="h6">{title || "Orders Table"}</Typography>
        <DownloadButton
          data={prepareDataForExport(filteredOrders)}
          filename="orders"
          sheetName="Orders"
          variant="outlined"
          size="small"
        />
      </Box>
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <FormControl fullWidth>
            <InputLabel>Status Order</InputLabel>
            <Select
              value={statusOrderFilter}
              label="Status Order"
              onChange={(e) => setStatusOrderFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {uniqueStatusOrders.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={2}>
          <FormControl fullWidth>
            <InputLabel>Status Payment</InputLabel>
            <Select
              value={statusPaymentFilter}
              label="Status Payment"
              onChange={(e) => setStatusPaymentFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {uniqueStatusPayments.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={2}>
          <FormControl fullWidth>
            <InputLabel>Payment Type</InputLabel>
            <Select
              value={paymentTypeFilter}
              label="Payment Type"
              onChange={(e) => setPaymentTypeFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {uniquePaymentTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={2}>
          <FormControl fullWidth>
            <InputLabel>Month</InputLabel>
            <Select
              value={monthFilter}
              label="Month"
              onChange={(e) => setMonthFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {uniqueMonths.map((month) => (
                <MenuItem key={month} value={month}>
                  {month}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={2}>
          <FormControl fullWidth>
            <InputLabel>Due Date Status</InputLabel>
            <Select
              value={dueDateStatusFilter}
              label="Due Date Status"
              onChange={(e) => setDueDateStatusFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {uniqueDueDateStatuses.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={2}>
          <FormControl fullWidth>
            <InputLabel>Tags</InputLabel>
            <Select
              value={tagFilter}
              label="Tags"
              onChange={(e) => setTagFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="NEGATIVE_PROFIT">Negative Profit</MenuItem>
              <MenuItem value="ZERO_BUY_PRICE">Zero Buy Price</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {headCells.map((headCell) => (
                <TableCell
                  key={headCell.id}
                  align={headCell.numeric ? "right" : "left"}
                  sortDirection={orderBy === headCell.id ? order : false}
                >
                  <TableSortLabel
                    active={orderBy === headCell.id}
                    direction={orderBy === headCell.id ? order : "asc"}
                    onClick={() => handleRequestSort(headCell.id)}
                  >
                    {headCell.label}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell>Tags</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedOrders
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((order, index) => (
                <TableRow
                  key={`${order.order_id}-${order.order_code}-${index}`}
                  onClick={() => handleRowClick(order)}
                  sx={{
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
                  }}
                >
                  <TableCell>{order.order_code}</TableCell>
                  <TableCell>{formatDate(order.order_date)}</TableCell>
                  <TableCell>{order.month}</TableCell>
                  <TableCell>{formatDate(order.payment_due_date)}</TableCell>
                  <TableCell>{order.reseller_name}</TableCell>
                  <TableCell>{order.store_name}</TableCell>
                  <TableCell>{order.status_order}</TableCell>
                  <TableCell>{order.status_payment}</TableCell>
                  <TableCell>{order.payment_type}</TableCell>
                  <TableCell>
                    {calculateDueDateStatus(
                      order.payment_due_date,
                      order.status_payment
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(order.total_invoice)}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(order.profit)}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      {getOrderTags(order).map((tag, tagIndex) => (
                        <Typography
                          key={`${order.order_id}-tag-${tagIndex}`}
                          sx={{
                            backgroundColor: "error.main",
                            color: "white",
                            px: 0.5,
                            py: 0.25,
                            borderRadius: 0.5,
                            fontSize: "0.7rem",
                            minWidth: "24px",
                            textAlign: "center",
                          }}
                          title="Negative Profit"
                        >
                          NP
                        </Typography>
                      ))}
                      {hasZeroBuyPrice(order) && (
                        <Typography
                          key={`${order.order_id}-zbp`}
                          sx={{
                            backgroundColor: "warning.main",
                            color: "white",
                            px: 0.5,
                            py: 0.25,
                            borderRadius: 0.5,
                            fontSize: "0.7rem",
                            minWidth: "24px",
                            textAlign: "center",
                          }}
                          title="Zero Buy Price"
                        >
                          ZBP
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredOrders.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Order Details Modal */}
      <Modal
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        aria-labelledby="order-details-modal"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "80%",
            maxWidth: 1000,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            maxHeight: "80vh",
            overflow: "auto",
          }}
        >
          {selectedOrder && (
            <>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography variant="h6">
                  Order Details - {selectedOrder.order_code}
                </Typography>
                <Box>
                  {!isEditing ? (
                    <Button
                      startIcon={<EditIcon />}
                      onClick={() => setIsEditing(true)}
                      variant="outlined"
                    >
                      Edit Buy Prices
                    </Button>
                  ) : (
                    <Box>
                      <Button
                        startIcon={<SaveIcon />}
                        onClick={handleSaveBuyPrices}
                        variant="contained"
                        color="primary"
                        sx={{ mr: 1 }}
                      >
                        Save
                      </Button>
                      <Button
                        startIcon={<CancelIcon />}
                        onClick={handleCancelEdit}
                        variant="outlined"
                        color="error"
                      >
                        Cancel
                      </Button>
                    </Box>
                  )}
                </Box>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product Name</TableCell>
                      <TableCell>SKU</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Total Invoice</TableCell>
                      <TableCell>Buy Price</TableCell>
                      <TableCell>Brand</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Tags</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedOrder.detail_order?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell>{item.sku}</TableCell>
                        <TableCell>{item.order_quantity}</TableCell>
                        <TableCell>{formatCurrency(item.price)}</TableCell>
                        <TableCell>
                          {formatCurrency(item.total_invoice)}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <TextField
                              type="number"
                              value={editingBuyPrices[item.order_item_id] || 0}
                              onChange={(e) =>
                                handleBuyPriceChange(
                                  item.order_item_id,
                                  Number(e.target.value)
                                )
                              }
                              size="small"
                              InputProps={{
                                inputProps: { min: 0 },
                              }}
                            />
                          ) : (
                            formatCurrency(item.buy_price || 0)
                          )}
                        </TableCell>
                        <TableCell>{item.brands}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>
                          {item.buy_price === 0 && (
                            <Typography
                              sx={{
                                backgroundColor: "warning.main",
                                color: "white",
                                px: 0.5,
                                py: 0.25,
                                borderRadius: 0.5,
                                fontSize: "0.7rem",
                                minWidth: "24px",
                                textAlign: "center",
                                display: "inline-block",
                              }}
                              title="Zero Buy Price"
                            >
                              ZBP
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Box>
      </Modal>
    </Box>
  );
};

export default OrdersTable;

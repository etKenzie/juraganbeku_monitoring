"use client";

import * as React from "react";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { Product } from "../../../(DashboardLayout)/types/apps/visit";
import {
  Alert,
  alpha,
  Chip,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  SelectChangeEvent,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { useSelector, useDispatch } from "@/store/hooks";
import { fetchProducts, updateProduct } from "@/store/apps/visit/visitSlice";
import { RootState } from "@/store/store";
import DownloadCard from "@/app/components/shared/DownloadCard";
import { IconDotsVertical, IconPencil, IconSearch, IconTrash } from "@tabler/icons-react";
import { debounce, set } from "lodash";
import { Field, FieldProps, Form, Formik } from "formik";
import moment from "moment";
import { getCookie } from "cookies-next";
import { getInitialValues } from "@/utils/brands/brandUtils";
import { handleSingleDownloadHangry, handleSingleDownloadJiwa, handleSingleDownloadDarmi, handleSingleDownloadHausGerai } from "@/utils/downloadPdf/pdfUtils";
import { handleDownloadExcelDarmi, handleDownloadExcelHangry, handleDownloadExcelHausGerai, handleDownloadExcelJiwa } from "@/utils/downloadExcel";
import FileUpload from "./FileUpload";
import SwitchField from "./SwitchField";
import RadioField from "./RadioFieldHangry";
import DateField from "./DatePicker";
import { format } from "date-fns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker/DatePicker";
import DateFilter from "./DatePickerFilter";
import { start } from "repl";
import RadioFieldJiwa from "./RadioFieldJiwa";
import DateTimeField from "./DateTimeList";
import ChecklistField from "./ChecklistBox";

const AreaSelectField = ({ field, form }: any) => {
  const areas = ["BOGOR", "JAKARTA", "SURABAYA"];

  return (
    <FormControl fullWidth margin="normal" error={form.touched.area && !!form.errors.area}>
      <InputLabel>Area</InputLabel>
      <Select {...field} label="Area" value={field.value || ""} onChange={(e) => form.setFieldValue(field.name, e.target.value)}>
        {areas.map((area) => (
          <MenuItem key={area} value={area}>
            {area}
          </MenuItem>
        ))}
      </Select>
      {form.touched.area && form.errors.area && <FormHelperText>{form.errors.area}</FormHelperText>}
    </FormControl>
  );
};

interface EnhancedTableToolbarProps {
  numSelected: number;
  handleSearch: React.ChangeEvent<HTMLInputElement> | any;
  search: string;
  placeholder: string;
}

const EnhancedTableToolbar = (props: EnhancedTableToolbarProps) => {
  const { numSelected, handleSearch, search, placeholder } = props;

  return (
    <Toolbar
      sx={{
        pl: { sm: 2 },
        pr: { xs: 1, sm: 1 },
        ...(numSelected > 0 && {
          bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity),
        }),
      }}>
      {numSelected > 0 ? (
        <Typography sx={{ flex: "1 1 100%" }} color="inherit" variant="subtitle2" component="div">
          {numSelected} selected
        </Typography>
      ) : (
        <Box sx={{ flex: "1 1 100%" }}>
          <TextField
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconSearch size="1.1rem" />
                </InputAdornment>
              ),
            }}
            placeholder={placeholder || "Search Item"}
            size="small"
            onChange={handleSearch}
            value={search}
          />
        </Box>
      )}

      {numSelected > 0 ? (
        <Tooltip title="Delete">
          <IconButton>
            <IconTrash width="18" />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip title="Filter list">
          <IconButton>{/* <DateRangePicker localeText={{ start: "Check-in", end: "Check-out" }} /> */}</IconButton>
        </Tooltip>
      )}
    </Toolbar>
  );
};

const ProductTableList = () => {
  const theme = useTheme();
  const borderColor = theme.palette.divider;

  const { totalCount, products } = useSelector((state: RootState) => state.productReducer);
  const [controller, setController] = React.useState({
    page: 0,
    rowsPerPage: 10,
  });
  const [search, setSearch] = React.useState("");
  const [filteredRows, setFilteredRows] = React.useState<Product[]>([]);
  const [selected, setSelected] = React.useState<readonly string[]>([]);
  const [order, setOrder] = React.useState<"asc" | "desc">("asc");
  const [sort, setSort] = React.useState<string>("id");
  const [filter, setFilter] = React.useState("");
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedData, setSelectedData] = React.useState<Product | null>(null);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [alertMessage, setAlertMessage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<any[]>([]);
  const selectedDataRef = React.useRef<Product | null>(null);
  const [startDate, setStartDate] = React.useState<string | null>(null);
  const [endDate, setEndDate] = React.useState<string | null>(null);

  const [queryParams, setQueryParams] = React.useState<{ startDate?: string | null; endDate?: string | null }>({});
  const [isNotFound, setIsNotFound] = React.useState(false);

  const brandId = Number(getCookie("brand_id"));
  const roleId = Number(localStorage.getItem("role_id"));

  const dispatch = useDispatch();

  React.useEffect(() => {
    dispatch(fetchProducts(search, controller.page, controller.rowsPerPage, sort, order, queryParams.startDate || "", queryParams.endDate || "", setIsNotFound));
  }, [dispatch, search, order, controller.page, controller.rowsPerPage, queryParams]);

  React.useEffect(() => {
    // Map data dari Redux ke format `filteredRows`
    setFilteredRows(
      products.map((row) => ({
        ...row,
        nama_agent: row.nama_agent,
        kode_gerai: row.kode_gerai,
        area: row.area,
        menu: row.menu,
        percentage: row.percentage,
        createdAt: row.createdAt,
        menu_makanan: row.menu_makanan,
        menu_minuman: row.menu_minuman,
        nama_staff: row.nama_staff,
      }))
    );
  }, [products]);

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setController({
      page: 0,
      rowsPerPage: parseInt(event.target.value, 10),
    });
  };

  const handleSingleDownload = (data: any, brandId: number) => {
    switch (brandId) {
      case 1: // Janji Jiwa
        return handleSingleDownloadHausGerai(data, setLoading);
      case 2: // Janji Jiwa
        return handleSingleDownloadJiwa(data, setLoading);
      case 3: // Hangry
        return handleSingleDownloadHangry(data, setLoading);
      case 4: // Janji Jiwa
        return handleSingleDownloadDarmi(data, setLoading);
      default:
        console.error("Unknown brandId:", brandId);
        return;
    }
  };

  const handlePageChange = (event: unknown, newPage: number) => {
    console.log("New page:", newPage);
    setController((prev) => ({ ...prev, page: newPage }));
  };

  const debouncedSearch = debounce((value: string) => {
    console.log("Searching for:", value);
  }, 500);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearch(value);

    setController((prev) => ({
      ...prev,
      page: 0,
    }));

    debouncedSearch(value);
  };

  const handleSort = (column: string) => {
    if (sort === column) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSort(column);
      setOrder("asc");
    }
  };

  const handleSortId = () => {
    // setSort("id");
    setOrder("asc");
  };

  const handleSortAscCreatedAt = () => {
    setSort("createdAt");
    setOrder("asc");
  };

  const handleSortDescCreatedAt = () => {
    setSort("createdAt");
    setOrder("desc");
  };

  const handleSortBest = () => {
    setSort("percentage_service");
    setOrder("desc");
  };

  const handleSortWorst = () => {
    setSort("percentage_service");
    setOrder("asc");
  };

  const handleChange = (event: SelectChangeEvent) => {
    const selectedValue = event.target.value;
    setFilter(selectedValue);
  };

  const handleFilterByDate = (date: string | null, type: "start" | "end") => {
    if (type === "start") {
      setStartDate(date);
    } else {
      setEndDate(date);

      setController((prev) => ({ ...prev, page: 0 }));

      setQueryParams((prev) => ({
        ...prev,
        startDate: startDate || "", // Gunakan nilai startDate terbaru
        endDate: date || "",
      }));
    }
  };

  const handleClearDate = () => {
    setStartDate(null);
    setEndDate(null);

    setQueryParams((prev) => {
      const updatedParams = { ...prev };
      delete updatedParams.startDate;
      delete updatedParams.endDate;
      return updatedParams;
    });

    // 🔹 Fetch ulang tanpa filter tanggal (seperti fetch awal)
    dispatch(fetchProducts(search, controller.page, controller.rowsPerPage, sort, order, "", "", setIsNotFound));
  };

  // Buka menu
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, data: any) => {
    console.log("Data passed to menu:", data); // Debug log
    setAnchorEl(event.currentTarget);
    setSelectedData(data); // Simpan data yang diklik
  };

  // Tutup menu
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleOpenEditModal = (data: Product) => {
    console.log("Data passed to edit modal:", data);
    selectedDataRef.current = data;
    setShowEditModal(true);
    setAnchorEl(null);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setSelectedData(null);
  };

  const handleSubmitFormik = async (values: Product, { setSubmitting }: any) => {
    try {
      console.log("Submitted data:", values); // Debug log

      const updatedValues = {
        ...values,
        createdAt: moment(values.createdAt).format("YYYY-MM-DD HH:mm:ss"),
        kemas_p2: typeof values.kemas_p2 === "string" ? values.kemas_p2 : String(values.kemas_p2 || ""),
        porsi_p2: typeof values.porsi_p2 === "string" ? values.porsi_p2 : String(values.porsi_p2 || ""),
        kematangan_p2: typeof values.kematangan_p2 === "string" ? values.kematangan_p2 : String(values.kematangan_p2 || ""),
        kesegaran_p2: typeof values.kesegaran_p2 === "string" ? values.kesegaran_p2 : String(values.kesegaran_p2 || ""),
        tekstur_p2: typeof values.tekstur_p2 === "string" ? values.tekstur_p2 : String(values.tekstur_p2 || ""),
      };

      // Dispatch action untuk mengupdate produk
      await dispatch(updateProduct(updatedValues));

      dispatch(fetchProducts(search, controller.page, controller.rowsPerPage, sort, order, startDate || "", endDate || "", setIsNotFound));
      setAlertMessage("Data updated successfully");
      setShowEditModal(false); // Tutup modal setelah data diperbarui
    } catch (error) {
      console.error("Error updating product:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckboxChange = (formik: any, field: string, value: string) => {
    formik.setFieldValue(field, value); // Gantilah langsung dengan string baru
  };

  const handleDelete = async (data: Product) => {
    if (!selectedData) {
      console.error("No product selected for deletion");
      return;
    }

    try {
      // Remove 'percentage' from the data before updating
      const { percentage, createdAt, ...updatedProduct } = selectedData;

      const productToUpdate = {
        ...updatedProduct,
        cm_status: 2,
        updatedAt: moment().format("YYYY-MM-DD HH:mm:ss"),
      };
      await dispatch(updateProduct(productToUpdate));

      setAlertMessage("Data moved to draft");
      selectedDataRef.current = data;

      dispatch(fetchProducts(search, controller.page, controller.rowsPerPage, sort, order, startDate || "", endDate || "", setIsNotFound));
    } catch (error) {
      console.error("Error updating product status:", error);
      setAlertMessage("Failed to move product to draft");
    } finally {
      setAnchorEl(null);
      setSelectedData(null);
    }
  };

  React.useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => {
        setAlertMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alertMessage]);

  const getKodeLabel = (brandId: number) => {
    switch (brandId) {
      case 1:
        return "Kode Gerai";
      case 2:
        return "Kode Jilid";
      case 3:
        return "Kode Gerai";
      default:
        return "Kode";
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0:
        return { label: "New", bg: "grey.300", text: "white.700" };
      case 1:
        return { label: "Active", bg: "success.light", text: "success.dark" };
      case 2:
        return { label: "Deleted", bg: "error.light", text: "error.main" };
      default:
        return { label: "Unknown", bg: "grey.100", text: "grey.800" };
    }
  };

  const handleDownloadExcel = async () => {
    switch (brandId) {
      case 1:
        await handleDownloadExcelHausGerai(queryParams.startDate || undefined, queryParams.endDate || undefined);
        break;
      case 2:
        await handleDownloadExcelJiwa(queryParams.startDate || undefined, queryParams.endDate || undefined);
        break;
      case 3:
        await handleDownloadExcelHangry(queryParams.startDate || undefined, queryParams.endDate || undefined);
        break;
      case 4:
        await handleDownloadExcelDarmi(queryParams.startDate || undefined, queryParams.endDate || undefined);
        break;
      default:
        console.error("Brand ID tidak dikenali.");
    }
  };

  return (
    <DownloadCard title="Filter Table" onDownload={handleDownloadExcel}>
      <Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
          <Box>
            <EnhancedTableToolbar numSelected={selected.length} search={search} handleSearch={(event: any) => handleSearch(event)} placeholder="Search here" />
            <Typography variant="caption" gutterBottom sx={{ display: "block", mx: 2, marginTop: -1, fontStyle: "italic", opacity: 0.4, fontSize: "11px" }}>
              * Cari berdasarkan Kode Gerai, Nama Store, Area, Nama Agent
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 1,
              marginRight: 2,
            }}>
            {/* <FormControl sx={{ mx: 2, minWidth: 120 }} size="small">
              <InputLabel id="demo-select-small-label">Filter</InputLabel>
              <Select labelId="demo-select-small-label" id="demo-select-small" value={filter} label="Filter" onChange={handleChange}>
                <MenuItem value="" onClick={handleSortId}>
                  <em>None</em>
                </MenuItem>
                <MenuItem value="Terbaru" onClick={handleSortDescCreatedAt}>
                  Latest
                </MenuItem>
                <MenuItem value="Terlama" onClick={handleSortAscCreatedAt}>
                  Oldest
                </MenuItem>
                <MenuItem value="Tertinggi" onClick={handleSortBest}>
                  Best
                </MenuItem>
                <MenuItem value="Terendah" onClick={handleSortWorst}>
                  Worst
                </MenuItem>
              </Select>
            </FormControl> */}
            <DateFilter label="Select Start Date" value={startDate} onChange={(date) => handleFilterByDate(date, "start")} />
            <DateFilter label="Select End Date" value={endDate} onChange={(date) => handleFilterByDate(date, "end")} />

            {startDate && endDate && (
              <Button onClick={handleClearDate} variant="outlined" color="secondary" size="small">
                Clear
              </Button>
            )}
          </Box>
        </Box>

        <Paper variant="outlined" sx={{ mx: 2, mt: 1, border: `1px solid ${borderColor}` }}>
          {alertMessage && <Alert severity={alertMessage.includes("Failed") ? "error" : "success"}>{alertMessage}</Alert>}
          <TableContainer>
            <Table sx={{ minWidth: 750 }}>
              <TableHead>
                <TableRow>
                  {/* Table Headers */}
                  <TableCell onClick={() => handleSort("id")} sx={{ cursor: "pointer" }}>
                    No
                  </TableCell>
                  <TableCell>Nama Agent</TableCell>
                  <TableCell>{getKodeLabel(brandId)}</TableCell>
                  <TableCell>Store</TableCell>
                  <TableCell>Area</TableCell>
                  {roleId === 1 ? <TableCell>Status</TableCell> : null}
                  {roleId === 1 ? <TableCell>Date</TableCell> : null}
                  <TableCell>Action</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isNotFound ? (
                  <TableRow>
                    <TableCell colSpan={12} style={{ textAlign: "center" }}>
                      <Typography variant="h6" color="error">
                        Data not found on this date range
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} style={{ textAlign: "center" }}>
                      <Typography variant="h6">No data available</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((data, index) => (
                    <TableRow key={data.id}>
                      <TableCell>{index + 1 + controller.page * controller.rowsPerPage}</TableCell>
                      <TableCell>
                        <Typography sx={{ width: "150px" }}>{data.nama_agent}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ width: "150px" }}>{data.kode_gerai}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ width: "150px" }}>{data.store_name || data.store}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ width: "150px" }}>{data.area}</Typography>
                      </TableCell>
                      {roleId === 1 ? (
                        <TableCell>
                          <Chip
                            sx={{
                              bgcolor: getStatusColor(data.cm_status).bg,
                              color: getStatusColor(data.cm_status).text,
                              borderRadius: "6px",
                              width: 80,
                            }}
                            size="medium"
                            label={getStatusColor(data.cm_status).label}
                            style={{ marginRight: "50px" }}
                          />
                        </TableCell>
                      ) : null}
                      {roleId === 1 ? (
                        <TableCell>
                          <Typography sx={{ width: "120px" }}>{data.createdAt ? format(new Date(data.createdAt), "dd-MM-yyyy") : "-"}</Typography>
                        </TableCell>
                      ) : null}
                      <TableCell>
                        <Button onClick={() => handleSingleDownload(data, brandId)} sx={{ width: "150px" }} disabled={loading}>
                          Download PDF
                        </Button>
                      </TableCell>
                      <TableCell>
                        {/* dots icon start */}
                        {/* if role id != 1 hide edit dots icon */}
                        {roleId === 1 ? (
                          <Box>
                            <IconButton aria-label="more" aria-controls="long-menu" aria-haspopup="true" onClick={(event) => handleOpenMenu(event, data)}>
                              <IconDotsVertical size="1rem" />
                            </IconButton>
                            <Menu
                              id="long-menu"
                              anchorEl={anchorEl}
                              keepMounted
                              open={Boolean(anchorEl)}
                              onClose={handleCloseMenu}
                              sx={{
                                "& .MuiPaper-root": {
                                  boxShadow: "none",
                                  border: "1px solid",
                                  borderColor: (theme) => theme.palette.divider,
                                },
                              }}>
                              <MenuItem onClick={() => handleOpenEditModal(data)}>
                                <ListItemIcon>
                                  <IconPencil size="1.2rem" />
                                </ListItemIcon>
                                <ListItemText>Edit</ListItemText>
                              </MenuItem>
                              <MenuItem onClick={() => handleDelete(data)}>
                                <ListItemIcon>
                                  <IconTrash size="1.2rem" />
                                </ListItemIcon>
                                <ListItemText>Delete</ListItemText>
                              </MenuItem>
                            </Menu>
                          </Box>
                        ) : null}
                        {/* dots icon end */}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Modal Edit Start */}
        <Dialog open={showEditModal} onClose={handleCloseEditModal}>
          <DialogTitle>Edit Data</DialogTitle>
          <DialogContent>
            <Formik initialValues={getInitialValues(selectedData, brandId) as Product} onSubmit={handleSubmitFormik}>
              {({ isSubmitting, errors, touched, values }) => (
                <Form>
                  {/* <Field name="store" as={TextField} fullWidth margin="normal" label="Store" /> */}

                  {brandId === 4 && (
                    <>
                      <DateField name="createdAt" label="Tanggal Dibuat (DD-MM-YYYY)" />
                      <Field
                        name="kode_gerai"
                        as={TextField}
                        fullWidth
                        margin="normal"
                        label="Kode Gerai"
                        value={values.kode_gerai} // Langsung ambil dari database
                        onChange={handleChange} // Biar user tetap bisa edit normal
                        error={touched.kode_gerai && !!errors.kode_gerai}
                        helperText={touched.kode_gerai && errors.kode_gerai}
                      />
                      <Field name="store_name" as={TextField} fullWidth margin="normal" label="Store Name" />
                      <Field name="area_manager" as={TextField} fullWidth margin="normal" label="Manager Area" />
                      <Field name="menu" as={TextField} fullWidth margin="normal" label="Menu" />
                      <Field name="crewc" as={TextField} fullWidth margin="normal" label="Nama Crew yang menjadi cashier" />
                      <Field name="crewp" as={TextField} fullWidth margin="normal" label="Nama Crew yang meracik product" />
                      <Field name="crews" as={TextField} fullWidth margin="normal" label="Nama Crew yang menyerahkan product" />
                      <Field name="total_crew" as={TextField} fullWidth margin="normal" label="Ada berapa jumlah crew yang bertugas" />
                      <Field name="time_exp" as={TextField} fullWidth margin="normal" label="Total Experience Time" />
                      <Field name="time_ser" as={TextField} fullWidth margin="normal" label="Service Time" />
                      <Field name="antrian" as={TextField} fullWidth margin="normal" label="Queue" />
                      <Field name="kepuasan" as={TextField} fullWidth margin="normal" label="Kepuasan" />
                      <RadioFieldJiwa
                        name="pkem1"
                        label="Produk dilengkapi dengan sedotan yang sesuai dengan varian yang dipesan?"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="pkem2"
                        label="Produk diseal dengan baik"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="pfs1"
                        label="Produk bebas dari benda asing"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="pfs2"
                        label="Produk tidak terasa basi atau berbau"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="pkp1"
                        label="Apakah seluruh menu dalam daftar tersedia?"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="scas1"
                        label="Greetings awal"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="scas2"
                        label="Suara dairysta terdengar dengan jelas"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="scas3"
                        label="Dairysta senyum saat menyapa customer"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="scas4"
                        label="Penyebutan produk best seller/rekomendasi"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="scas5"
                        label="Penawaran promo yang sedang berlangsung"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="scas6"
                        label="Penawaran upsize cup"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="scas7"
                        label="Penawaran tambahan produk lainnya"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="scas8"
                        label="Penawaran topping"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="scas9"
                        label="Menanyakan gula dan es batu"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="scas10"
                        label="Penawaran tropicana slim"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="scas11"
                        label="Penawaran tas tenteng"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="scas12"
                        label="Mengkonfirmasi pesanan customer "
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="scas13"
                        label="Penawaran membership"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="scas14"
                        label="Menerima pembayaran dengan pecahan 50.000/100.000"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="scas15"
                        label="Menggunakan money detector"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="scas16"
                        label="Struk diberikan ke customer"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="scas17"
                        label="Menginformasikan promo struk"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="scas18"
                        label="Mengarahkan customer ke bagian pick up"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="scas19"
                        label="Menutup transaksi dengan mengucapkan 'terima kasih'"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="spro1"
                        label="Dairysta yag meracik menggunakan handglove"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="spro2"
                        label="Penulisan keterangan rasa dan lainnya di cup"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="spro3"
                        label="Dairysta yang meracik merasakan susu di gelas sloki"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="spro4"
                        label="Urutan penyajian di dalam cup benar"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="sser1"
                        label="Pengecekan cup (dibalikkan)"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="sser2"
                        label="Penyebutan nomor antrian"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="sser3"
                        label="Pengecekan kembali kesesuaian pesanan"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="sser4"
                        label="Dairysta senyum saat memberikan pesanan"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="sser5"
                        label="Greetings akhir"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="sser6"
                        label="Dairysta yang menyerahkan menggunakan handglove"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="speo1"
                        label="Rambut Rapi"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="speo2"
                        label="Memakai Sepatu"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="speo3"
                        label="Memakai Topi"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="speo4"
                        label="Memakai Celemek"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="speo5"
                        label="Memakai ikat pinggang"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="speo6"
                        label="Memakai Pin Di Sebelah Kanan"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="speo7"
                        label="Memakai Id Card Di Sebelah Kiri"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="speo8"
                        label="Baju dimasukkan kecuali batik"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="tto1"
                        label="Display menu terpasang dengan baik"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="tto2"
                        label="Banner promo terpasang dengan baik"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="tto3"
                        label="Papan tanda terpasang jelas dan baik"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="tto4"
                        label="Informasi kebijakan halal terlihat dengan jelas"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="tto5"
                        label="Informasi 'Pembelian tanpa struk, Gratis' terlihat dengan jelas"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="tto6"
                        label="Informasi QR keluhan customer terlihat dengan jelas"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="tto7"
                        label="Informasi QR membership"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="tto8"
                        label="Media pada akrilik tidak kosong"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="tto9"
                        label="Semua pencahayaan beroperasi dengan baik"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="tto10"
                        label="Video pada TV berjalan"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="clc1"
                        label="Display menu bersih"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="clc2"
                        label="Akrilik Bersih"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="clc3"
                        label="Banner promo bersih"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="clc4"
                        label="Papan tanda bersih"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="clc5"
                        label="Lampu bersih"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="clc6"
                        label="Tampilan sisi luar outlet bersih (Fasad)"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="clc7"
                        label="Tempat sampah kecil bersih dan tidak bau"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="clc8"
                        label="Isi tempat sampah kecil"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="clc9"
                        label="Neon box bersih"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="clc10"
                        label="Signage bersih"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="clc11"
                        label="Lantai dalam outlet kering dan bersih"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="clc12"
                        label="Meja kerja bersih"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="clc13"
                        label="Meja kerja bebas dari perlengkapan pribadi"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="clc14"
                        label="Isi tempat sampah dalam outlet"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="clc15"
                        label="Tempat sampah dalam outlet tertutup"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="clc16"
                        label="Sink bersih dan tidak berkerak "
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="clc17"
                        label="Outlet bebas dari bau tidak sedap"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="clc18"
                        label="Outlet bebas hama"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="clc19"
                        label="Alat kebersihan bersih dan tersimpan rapi"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="clc20"
                        label="Kebersihan Lantai Tunggu (Sitting Area)"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <Field name="img_petugas" component={FileUpload} label="Struk Pembelian" />
                      <Field name="img_product" component={FileUpload} label="Foto Produk" />
                      <Field name="img_dll" component={FileUpload} label="Foto Lainnya" />
                      <Field name="catatan" as={TextField} fullWidth margin="normal" label="CATATAN / TEMUAN " multiline row={6} />
                      <Field name="penjelasan_comp" as={TextField} fullWidth margin="normal" label="PENJELASAN COMPLAINT" multiline row={6} />
                      <Field name="rekomendasi" as={TextField} fullWidth margin="normal" label="REKOMENDASI" multiline row={6} />
                      <Field name="nik_agent" as={TextField} fullWidth margin="normal" label="NIK Agent" />
                      <Field name="nama_agent" as={TextField} fullWidth margin="normal" label="Nama Agent" />
                      <Field name="nominal_struk" as={TextField} fullWidth margin="normal" label="Nominal Struk" />
                      <Field name="cm_status" component={SwitchField} label="cm status" />
                    </>
                  )}

                  {brandId === 3 && (
                    <>
                      <Field name="jam_pemesanan" as={TextField} fullWidth margin="normal" label="Jam Pemesanan" />
                      <Field name="jam_pada_bill" as={TextField} fullWidth margin="normal" label="Jam Service Dimulai" />
                      <Field name="jam_penerimaan_makanan" as={TextField} fullWidth margin="normal" label="Jam Produk Diterima" />
                      <RadioField name="kurang_dari_10menit" label="Apakah produk diterima kurang dari 10 menit (terhitung dari jam pada bill hingga diterima?)" />
                      <RadioField name="kasir_p1" label="Apakah Kasir menyapa costumer yang datang dengan ramah?" />
                      <RadioField name="kemas_p1" label="Apakah pengemasan produk sudah sesuai?" />
                      {values.kemas_p1 === "No" && (
                        <>
                          <ChecklistField
                            name="kemas_p2"
                            label="Mohon jelaskan masalah yang Anda alami:"
                            options={[
                              "Packaging tidak di cable tisk",
                              "Tidak diberikan Flyer",
                              "Tidak diberikan Hang Tag",
                              "Susunan produk tidak sesuai",
                              "Tidak terdapat Struk",
                              "Tidak terdapat HCU",
                            ]}
                          />
                          <Field name="kemas_p2" as={TextField} fullWidth margin="normal" label="List masalah yang  dialami" multiline row={4} disabled />
                          <Field name="kemas_comment" as={TextField} fullWidth margin="normal" label="Penjelasan Lain" />
                          <Field name="kemas_image" component={FileUpload} label="Kemasan Image" />
                        </>
                      )}
                      <RadioField name="crew_p1" label="Apakah crew menggunakan seragam sesuai dengan SOP (pakaian & hairnet)?" />

                      <RadioField name="porsi_p1" label="Apakah porsi yang anda terima lengkap & sesuai?" />
                      {values.porsi_p1 === "No" && (
                        <>
                          <ChecklistField
                            name="porsi_p2"
                            label="Mohon jelaskan masalah yang Anda alami:"
                            options={[
                              "Produk kurang/tertinggal",
                              "Produk/Flavor salah/tertukar",
                              "Jumlah pcs salah",
                              "ice level tidak sesuai",
                              "notes/request tidak dipenuhi",
                              "masalah alat makan",
                              "other",
                            ]}
                          />
                          <Field name="porsi_p2" as={TextField} fullWidth margin="normal" label="List masalah yang  dialami" multiline row={4} disabled />
                          <Field name="porsi_comment" as={TextField} fullWidth margin="normal" label="Penjelasan Lain" />
                          <Field name="porsi_image" component={FileUpload} label="Porsi Image" />
                        </>
                      )}
                      <RadioField name="rasa_product_p1" label="Apakah rasa dari produk sesuai?" />
                      {values.rasa_product_p1 === "No" && (
                        <>
                          <ChecklistField
                            name="rasa_product_p2"
                            label="Mohon jelaskan masalah yang Anda alami:"
                            options={[
                              "Bumbu/sauce kurang/tidak merata",
                              "Bumbu/sauce tidak meresap",
                              "Rasa berubah/tidak sesuai",
                              "Tawar",
                              "Pahit",
                              "Terlalu manis",
                              "kurang manis",
                              "Terlalu asam",
                              "Kurang asam",
                              "Terlalu asin",
                              "Kurang asin",
                              "Terlalu pedas",
                              "kurang pedas",
                              "other",
                            ]}
                          />
                          <Field name="rasa_product_p2" as={TextField} fullWidth margin="normal" label="List masalah yang  dialami" multiline row={4} disabled />
                          <Field name="rasa_product_comment" as={TextField} fullWidth margin="normal" label="Penjelasan Lain" />
                          <Field name="rasa_product_image" component={FileUpload} label="Rasa Product Image" />
                        </>
                      )}
                      <RadioField name="tekstur_p1" label="Apakah tekstur dari produk sesuai?" />
                      {values.tekstur_p1 === "No" && (
                        <>
                          <ChecklistField
                            name="tekstur_p2"
                            label="Mohon jelaskan masalah yang Anda alami:"
                            options={[
                              "Kulit pada daging botak/lepas/mengelupas/terbuka",
                              "Terlalu berminyak",
                              "soggy/tidak crispy",
                              "produk hancur/pecah",
                              "terlalu keras",
                              "terlalu lembek",
                              "terlalu kasar/padat",
                              "terlalu halus/patah/putus",
                              "terlalu kering",
                              "terlalu basah/cair/encer",
                              "tekstur berubah/tidak sesuai",
                              "other",
                            ]}
                          />
                          <Field name="tekstur_p2" as={TextField} fullWidth margin="normal" label="List masalah yang  dialami" multiline row={4} disabled />
                          <Field name="tekstur_comment" as={TextField} fullWidth margin="normal" label="Penjelasan Lain" />
                          <Field name="tekstur_image" component={FileUpload} label="Tekstur Image" />
                        </>
                      )}
                      <RadioField name="kesegaran_makanan_p1" label="Apakah semua produk yang diterima dalam keadaan fresh (segar)?" />
                      {values.kesegaran_makanan_p1 === "No" && (
                        <>
                          <ChecklistField
                            name="kesegaran_makanan_p2"
                            label="Mohon jelaskan masalah yang Anda alami:"
                            options={["asam/basi", "bau tidak sedap", "rusak/berlendir/bergetah", "expired", "seperti dimasak ulang", "produk layu/seperti sudah lama", "produk dingin", "other"]}
                          />
                          <Field name="kesegaran_makanan_p2" as={TextField} fullWidth margin="normal" label="List masalah yang  dialami" multiline row={4} disabled />
                          <Field name="kesegaran_makanan_comment" as={TextField} fullWidth margin="normal" label="Penjelasan Lain" />
                          <Field name="kesegaran_makanan_image" component={FileUpload} label="Kesegaran Image" />
                        </>
                      )}
                      <RadioField name="kematangan_product_p1" label="Apakah semua produk yang diterima matang sempurna?" />
                      {values.kematangan_product_p1 === "No" && (
                        <>
                          <ChecklistField name="kematangan_product_p2" label="Mohon jelaskan masalah yang Anda alami:" options={["tidak/kurang matang", "terlalu matang/gosong"]} />
                          <Field name="kematangan_product_p2" as={TextField} fullWidth margin="normal" label="List masalah yang  dialami" multiline row={4} disabled />
                          <Field name="kematangan_product_comment" as={TextField} fullWidth margin="normal" label="Penjelasan Lain" />
                          <Field name="kematangan_product_image" component={FileUpload} label="Kematangan Image" />
                        </>
                      )}

                      <RadioFieldJiwa
                        name="tingkat_kepuasan"
                        label="Berapakah tingkat kepuasan anda terhadap produk ini?"
                        options={[
                          { value: 1, label: "Sangat Buruk" },
                          // { value: 2, label: "Buruk" },
                          { value: 3, label: "Oke" },
                          // { value: 4, label: "Puas" },
                          { value: 5, label: "Puas Banget (Perfect)" },
                        ]}
                      />
                      <Field name="comment" as={TextField} fullWidth margin="normal" label="Feedback/masukan terkait produk" multiline row={6} />

                      <Field
                        name="kode_gerai"
                        as={TextField}
                        fullWidth
                        margin="normal"
                        label="Kode Gerai"
                        error={touched.kode_gerai && !!errors.kode_gerai}
                        helperText={touched.kode_gerai && errors.kode_gerai}
                      />
                      <Field name="nama_agent" as={TextField} fullWidth margin="normal" label="Nama Agent" />
                      <Field name="store_name" as={TextField} fullWidth margin="normal" label="Store Name" />
                      <Field name="area" as={TextField} fullWidth margin="normal" label="Area" />
                      <Field name="product" as={TextField} fullWidth margin="normal" label="Produk apa yang sedang kamu nilai" />
                      <Field name="foto_product" component={FileUpload} label="Foto Produk" />
                      <Field name="foto_bill" component={FileUpload} label="Foto Bill" />
                      <Field name="foto_bill_aplikasi" component={FileUpload} label="Foto Bill Aplikasi" />

                      <Field name="nominal" as={TextField} fullWidth margin="normal" label="Nominal Pembelian" />
                      <Field name="nominal_aplikasi" as={TextField} fullWidth margin="normal" label="Nominal Aplikasi" />

                      <Field name="cm_status" component={SwitchField} label="cm status" />
                    </>
                  )}

                  {brandId === 2 && (
                    <>
                      <DateField name="createdAt" label="Tanggal Dibuat (DD-MM-YYYY)" />
                      <Field
                        name="kode_gerai"
                        as={TextField}
                        fullWidth
                        margin="normal"
                        label="Kode Gerai"
                        value={values.kode_gerai} // Langsung ambil dari database
                        onChange={handleChange} // Biar user tetap bisa edit normal
                        error={touched.kode_gerai && !!errors.kode_gerai}
                        helperText={touched.kode_gerai && errors.kode_gerai}
                      />
                      <Field name="store_name" as={TextField} fullWidth margin="normal" label="Store Name" />
                      <Field name="total_crew" as={TextField} fullWidth margin="normal" label="Total Crew" />
                      <Field name="nama_staff" as={TextField} fullWidth margin="normal" label="Staff Name" />
                      <Field name="menu_makanan" as={TextField} fullWidth margin="normal" label="Menu Makanan" />
                      <Field name="menu_minuman" as={TextField} fullWidth margin="normal" label="Menu Minuman" />
                      <Field name="antrian" as={TextField} fullWidth margin="normal" label="Antrian" />
                      {/* <Field name="time_1">
                        {({ field, form }: { field: any; form: any }) => (
                          <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <TimePicker
                              label="Select Time"
                              value={field.value ? parse(field.value, "HH:mm:ss", new Date()) : null}
                              onChange={(time) => {
                                const formattedTime = time ? format(time, "HH:mm:ss") : "";
                                form.setFieldValue("time_1", formattedTime);
                              }}
                              renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
                            />
                          </LocalizationProvider>
                        )}
                      </Field> */}
                      {/* https://tpn1-order.tokopandai.id/img/haus/194_202501161552_msjiwa_struk.jpg */}
                      <Field name="time_1" as={TextField} fullWidth margin="normal" label="Waktu Pelayanan" />
                      <Field name="time_2" as={TextField} fullWidth margin="normal" label="Waktu Service" />
                      <DateTimeField name="waktu_masuk" label="Jam Pemesanan" />
                      <DateTimeField name="waktu_dilayani" label="Jam Service Dimulai" />
                      <DateTimeField name="waktu_terima_produk" label="Jam Produk Diterima" />

                      <RadioFieldJiwa
                        name="lingkeb_1"
                        label="Apakah Signage dan Jilid toko menyala dan lengkap?"
                        options={[
                          { value: 1, label: "Tidak ada" },
                          { value: 3, label: "Sebagian" },
                          { value: 5, label: "Ya, Semua" },
                        ]}
                      />
                      {[1, 3].includes(Number(values.lingkeb_1)) && (
                        <>
                          <Field name="lingkeb_1_note" as={TextField} fullWidth margin="normal" label="Penjelasan Lain" />
                          <Field name="lingkeb_1_img" component={FileUpload} label="Foto" />
                        </>
                      )}
                      <RadioFieldJiwa
                        name="lingkeb_2"
                        label="Apakah semua TV menyala dan content sesuai standard"
                        options={[
                          { value: 1, label: "Tidak ada" },
                          { value: 3, label: "Sebagian" },
                          { value: 5, label: "Ya, Semua" },
                        ]}
                      />
                      {[1, 2, 3].includes(Number(values.lingkeb_2)) && (
                        <>
                          <Field name="lingkeb_2_note" as={TextField} fullWidth margin="normal" label="Penjelasan Lain" />
                          <Field name="lingkeb_2_img" component={FileUpload} label="Foto" />
                        </>
                      )}
                      <RadioFieldJiwa
                        name="lingkeb_3"
                        label="Nilai kebersihan toko saat Anda tiba"
                        options={[
                          { value: 1, label: "Sangat Kotor" },
                          { value: 2, label: "Cukup Kotor" },
                          { value: 3, label: "Netral" },
                          { value: 4, label: "Bersih" },
                          { value: 5, label: "Sangat Bersih" },
                        ]}
                      />
                      {[1, 2, 3].includes(Number(values.lingkeb_3)) && (
                        <>
                          <Field name="lingkeb_3_note" as={TextField} fullWidth margin="normal" label="Penjelasan Lain" />
                          <Field name="lingkeb_3_img" component={FileUpload} label="Foto" />
                        </>
                      )}
                      <RadioFieldJiwa
                        name="lingkeb_4"
                        label="Bagaimana Anda menilai kebersihan lantai?"
                        options={[
                          { value: 1, label: "Sangat Kotor" },
                          { value: 2, label: "Cukup Kotor" },
                          { value: 3, label: "Netral" },
                          { value: 4, label: "Bersih" },
                          { value: 5, label: "Sangat Bersih" },
                        ]}
                      />
                      {[1, 2, 3].includes(Number(values.lingkeb_4)) && (
                        <>
                          <Field name="lingkeb_4_note" as={TextField} fullWidth margin="normal" label="Penjelasan Lain" />
                          <Field name="lingkeb_4_img" component={FileUpload} label="Foto" />
                        </>
                      )}
                      <RadioFieldJiwa
                        name="lingkeb_5"
                        label="Bagaimana Anda menilai kerapihan meja kursi?"
                        options={[
                          { value: 1, label: "Sangat Berantakan" },
                          { value: 2, label: "Berantakan" },
                          { value: 3, label: "Netral" },
                          { value: 4, label: "Rapih" },
                          { value: 5, label: "Sangat Rapih" },
                        ]}
                      />
                      {[1, 2, 3].includes(Number(values.lingkeb_5)) && (
                        <>
                          <Field name="lingkeb_5_note" as={TextField} fullWidth margin="normal" label="Penjelasan Lain" />
                          <Field name="lingkeb_5_img" component={FileUpload} label="Foto" />
                        </>
                      )}
                      <RadioFieldJiwa
                        name="lingkeb_6"
                        label="Bagaimana Anda menilai kerapihan Marketing Props (Informasi Promo, NPL, Banner, dll.)?"
                        options={[
                          { value: 1, label: "Sangat Berantakan" },
                          { value: 2, label: "Berantakan" },
                          { value: 3, label: "Netral" },
                          { value: 4, label: "Rapih" },
                          { value: 5, label: "Sangat Rapih" },
                        ]}
                      />
                      {[1, 2, 3].includes(Number(values.lingkeb_6)) && (
                        <>
                          <Field name="lingkeb_6_note" as={TextField} fullWidth margin="normal" label="Penjelasan Lain" />
                          <Field name="lingkeb_6_img" component={FileUpload} label="Foto" />
                        </>
                      )}
                      <RadioFieldJiwa
                        name="lingkeb_7"
                        label="Apakah toilet dan tempat cuci tangan bersih"
                        options={[
                          { value: 1, label: "Sangat Kotor" },
                          { value: 2, label: "Kotor" },
                          { value: 3, label: "Netral" },
                          { value: 4, label: "Bersih" },
                          { value: 5, label: "Sangat Bersih" },
                        ]}
                      />
                      {[1, 2, 3].includes(Number(values.lingkeb_7)) && (
                        <>
                          <Field name="lingkeb_7_note" as={TextField} fullWidth margin="normal" label="Penjelasan Lain" />
                          <Field name="lingkeb_7_img" component={FileUpload} label="Foto" />
                        </>
                      )}
                      <RadioFieldJiwa
                        name="lingkeb_8"
                        label="Apakah toilet dilengkapi dengan perlengkapan yang diperlukan?"
                        options={[
                          { value: 1, label: "Tidak ada Perlengkapan" },
                          { value: 2, label: "Kurang Lengkap" },
                          { value: 3, label: "Netral" },
                          { value: 4, label: "Lengkap" },
                          { value: 5, label: "Sangat Lengkap" },
                        ]}
                      />
                      {[1, 2, 3].includes(Number(values.lingkeb_8)) && (
                        <>
                          <Field name="lingkeb_8_note" as={TextField} fullWidth margin="normal" label="Penjelasan Lain" />
                          <Field name="lingkeb_8_img" component={FileUpload} label="Foto" />
                        </>
                      )}
                      <RadioFieldJiwa
                        name="lingkeb_9"
                        label="Bagaimana Anda menilai pencahayaan di toko"
                        options={[
                          { value: 1, label: "Sangat Buruk" },
                          { value: 2, label: "Buruk" },
                          { value: 3, label: "Netral" },
                          { value: 4, label: "Baik" },
                          { value: 5, label: "Sangat Baik" },
                        ]}
                      />
                      {[1, 2, 3].includes(Number(values.lingkeb_9)) && (
                        <>
                          <Field name="lingkeb_9_note" as={TextField} fullWidth margin="normal" label="Penjelasan Lain" />
                          <Field name="lingkeb_9_img" component={FileUpload} label="Foto" />
                        </>
                      )}
                      <RadioFieldJiwa
                        name="lingkeb_10"
                        label="Bagaimana volume suara musik di toko?"
                        options={[
                          { value: 1, label: "Terlalu Besar/Tidak Menyala" },
                          { value: 3, label: "Netral" },
                          { value: 5, label: "Menyala dan Pas" },
                        ]}
                      />
                      {[1, 2, 3].includes(Number(values.lingkeb_10)) && (
                        <>
                          <Field name="lingkeb_10_note" as={TextField} fullWidth margin="normal" label="Penjelasan Lain" />
                        </>
                      )}
                      <RadioFieldJiwa
                        name="lingkeb_11"
                        label="Seberapa nyaman suhu di toko?"
                        options={[
                          { value: 1, label: "Panas" },
                          { value: 2, label: "Tidak Nyaman" },
                          { value: 3, label: "Netral" },
                          { value: 4, label: "Nyaman" },
                          { value: 5, label: "Sangat Nyaman" },
                        ]}
                      />
                      {[1, 2, 3].includes(Number(values.lingkeb_11)) && (
                        <>
                          <Field name="lingkeb_11_note" as={TextField} fullWidth margin="normal" label="Penjelasan Lain" />
                        </>
                      )}
                      <RadioFieldJiwa
                        name="pel_1"
                        label="Berapa lama waktu yang diperlukan untuk Anda disalami saat memasuki toko?"
                        options={[
                          { value: 1, label: "Tidak Disalami" },
                          { value: 3, label: "1 - 2 Menit" },
                          { value: 5, label: "Langsung" },
                        ]}
                      />
                      {[1, 2, 3].includes(Number(values.pel_1)) && (
                        <>
                          <Field name="pel_1_note" as={TextField} fullWidth margin="normal" label="Penjelasan Lain" />
                        </>
                      )}
                      <RadioFieldJiwa
                        name="pel_2"
                        label="Bagaimana Anda menilai keramahan staf yang menyapa Anda?"
                        options={[
                          { value: 1, label: "Tidak Ramah" },
                          { value: 3, label: "Netral" },
                          { value: 5, label: "Ramah" },
                        ]}
                      />
                      {[1, 2, 3].includes(Number(values.pel_2)) && (
                        <>
                          <Field name="pel_2_note" as={TextField} fullWidth margin="normal" label="Penjelasan Lain" />
                        </>
                      )}
                      <RadioFieldJiwa
                        name="pel_3"
                        label="Bagaimana Anda menilai penampilan staf yang sedang bekerja?"
                        options={[
                          { value: 1, label: "Sangat Tidak Rapih" },
                          { value: 2, label: "Tidak Rapih" },
                          { value: 3, label: "Netral" },
                          { value: 4, label: "Rapih" },
                          { value: 5, label: "Sangat Rapih" },
                        ]}
                      />
                      {[1, 2, 3].includes(Number(values.pel_3)) && (
                        <>
                          <Field name="pel_3_note" as={TextField} fullWidth margin="normal" label="Penjelasan Lain" />
                        </>
                      )}
                      <RadioFieldJiwa
                        name="pel_4"
                        label="Bagaimana Anda menilai standard kerapihan seragam staf yang sedang bekerja?"
                        options={[
                          { value: 1, label: "Tidak Sesuai Standard" },
                          { value: 5, label: "Semua Sesuai Standard" },
                        ]}
                      />
                      {[1, 2, 3].includes(Number(values.pel_4)) && (
                        <>
                          <Field name="pel_4_note" as={TextField} fullWidth margin="normal" label="Penjelasan Lain" />
                        </>
                      )}
                      <RadioFieldJiwa
                        name="pel_5"
                        label="Apakah kasir mengulangi pesanan anda dengan lengkap dan akurat?"
                        options={[
                          { value: 1, label: "Tidak" },
                          { value: 5, label: "Ya" },
                        ]}
                      />
                      {[1, 2, 3].includes(Number(values.pel_5)) && (
                        <>
                          <Field name="pel_5_note" as={TextField} fullWidth margin="normal" label="Penjelasan Lain" />
                        </>
                      )}
                      <RadioFieldJiwa
                        name="pel_6"
                        label="Apakah kasir menawarkan aplikasi?"
                        options={[
                          { value: 1, label: "Tidak" },
                          { value: 5, label: "Ya" },
                        ]}
                      />
                      {[1, 2, 3].includes(Number(values.pel_6)) && (
                        <>
                          <Field name="pel_6_note" as={TextField} fullWidth margin="normal" label="Penjelasan Lain" />
                        </>
                      )}
                      <RadioFieldJiwa
                        name="pel_7"
                        label="Apakah kasir melakukan upselling: menawarkan promo/upsize/topping/dll ?"
                        options={[
                          { value: 1, label: "Tidak" },
                          { value: 5, label: "Ya" },
                        ]}
                      />
                      {[1, 2, 3].includes(Number(values.pel_7)) && (
                        <>
                          <Field name="pel_7_note" as={TextField} fullWidth margin="normal" label="Penjelasan Lain" />
                        </>
                      )}
                      <RadioFieldJiwa
                        name="pel_8"
                        label="Apakah kasir memberikan struk sesuai pesanan?"
                        options={[
                          { value: 1, label: "Tidak" },
                          { value: 5, label: "Ya" },
                        ]}
                      />
                      {[1, 2, 3].includes(Number(values.pel_8)) && (
                        <>
                          <Field name="pel_8_note" as={TextField} fullWidth margin="normal" label="Penjelasan Lain" />
                        </>
                      )}
                      <RadioFieldJiwa
                        name="pel_9"
                        label="Seberapa paham kasir tentang menu?"
                        options={[
                          { value: 1, label: "Tidak Paham" },
                          { value: 3, label: "Netral" },
                          { value: 5, label: "Paham" },
                        ]}
                      />
                      {[1, 2, 3].includes(Number(values.pel_9)) && (
                        <>
                          <Field name="pel_9_note" as={TextField} fullWidth margin="normal" label="Penjelasan Lain" />
                        </>
                      )}
                      <RadioFieldJiwa
                        name="pel_10"
                        label="Apakah kasir mengucapkan terima kasih setelah transaksi?"
                        options={[
                          { value: 1, label: "Tidak" },
                          { value: 5, label: "Ya" },
                        ]}
                      />
                      {Number(values.pel_10) === 1 && (
                        <>
                          <Field name="pel_10_note" as={TextField} fullWidth margin="normal" label="Penjelasan Lain" />
                        </>
                      )}
                      <RadioFieldJiwa
                        name="kec_1"
                        label="Berapa lama waktu yang dibutuhkan untuk menyelesaikan pesanan Anda (1 minuman dan 1 makanan) setelah struk dikeluarkan?"
                        options={[
                          { value: 1, label: "Lebih dari 15 menit" },
                          { value: 2, label: "12 - 15 menit" },
                          { value: 3, label: "11 menit" },
                          { value: 4, label: "9 - 10 menit" },
                          { value: 5, label: "≤ 8 Menit" },
                        ]}
                      />
                      {[1, 2, 3].includes(Number(values.kec_1)) && (
                        <>
                          <Field name="kec_1_note" as={TextField} fullWidth margin="normal" label="Penjelasan Lain" />
                        </>
                      )}
                      <RadioFieldJiwa
                        name="kec_2"
                        label="Seberapa akurat spesifikasi minuman Anda (kustomisasi minuman)?"
                        options={[
                          { value: 1, label: "Tidak Akurat" },
                          { value: 5, label: "Akurat" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="kec_3"
                        label="Seberapa akurat spesifikasi makanan Anda?"
                        options={[
                          { value: 1, label: "Tidak Akurat" },
                          { value: 5, label: "Akurat" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="kec_4"
                        label="Apakah staff memanggil nama Anda ketika memberikan pesanan?"
                        options={[
                          { value: 1, label: "Tidak" },
                          { value: 5, label: "Ya" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="kual_1"
                        label="Bagaimana Anda menilai rasa kopi/minuman Anda?"
                        options={[
                          { value: 1, label: "Sangat Buruk" },
                          { value: 2, label: "Buruk" },
                          { value: 3, label: "Netral" },
                          { value: 4, label: "Baik" },
                          { value: 5, label: "Sangat Baik" },
                        ]}
                      />
                      {[1, 2, 3].includes(Number(values.kual_1)) && (
                        <>
                          <Field name="kual_1_note" as={TextField} fullWidth margin="normal" label="Penjelasan Lain" />
                          <Field name="kual_1_img" component={FileUpload} label="Foto" />
                        </>
                      )}
                      <RadioFieldJiwa
                        name="kual_2"
                        label="Apakah kopi disajikan pada suhu yang tepat sesuai pesanan? (Panas / Dingin)"
                        options={[
                          { value: 1, label: "Tidak" },
                          { value: 5, label: "Ya" },
                        ]}
                      />
                      {Number(values.kual_2) === 1 && (
                        <>
                          <Field name="kual_2_note" as={TextField} fullWidth margin="normal" label="Penjelasan Lain" />
                          <Field name="kual_2_img" component={FileUpload} label="Foto" />
                        </>
                      )}
                      <RadioFieldJiwa
                        name="kual_3"
                        label="Apakah presentasi produk Minuman yang disajikan tidak berantakan?"
                        options={[
                          { value: 1, label: "Ya, Berantakan" },
                          { value: 5, label: "Tidak Berantakan" },
                        ]}
                      />
                      {Number(values.kual_3) === 1 && (
                        <>
                          <Field name="kual_3_note" as={TextField} fullWidth margin="normal" label="Penjelasan Lain" />
                          <Field name="kual_3_img" component={FileUpload} label="Foto" />
                        </>
                      )}
                      <RadioFieldJiwa
                        name="kual_4"
                        label="Apakah ada label order pada minuman yang disajikan?"
                        options={[
                          { value: 1, label: "Tidak Ada" },
                          { value: 5, label: "Ada" },
                        ]}
                      />
                      {Number(values.kual_3) === 1 && (
                        <>
                          <Field name="kual_3_note" as={TextField} fullWidth margin="normal" label="Penjelasan Lain" />
                          <Field name="kual_3_img" component={FileUpload} label="Foto" />
                        </>
                      )}
                      <RadioFieldJiwa
                        name="kual_5"
                        label="Bagaimana Anda menilai rasa makanan Anda?"
                        options={[
                          { value: 1, label: "Sangat Buruk" },
                          { value: 2, label: "Buruk" },
                          { value: 3, label: "Netral" },
                          { value: 4, label: "Baik" },
                          { value: 5, label: "Sangat Baik" },
                        ]}
                      />
                      {[1, 2, 3].includes(Number(values.kual_5)) && (
                        <>
                          <Field name="kual_5_note" as={TextField} fullWidth margin="normal" label="Penjelasan Lain" />
                          <Field name="kual_5_img" component={FileUpload} label="Foto" />
                        </>
                      )}
                      <RadioFieldJiwa
                        name="kual_6"
                        label="Apakah makanan disajikan pada suhu dan tekstur yang tepat?"
                        options={[
                          { value: 1, label: "Tidak" },
                          { value: 5, label: "Ya" },
                        ]}
                      />
                      {Number(values.kual_6) === 1 && (
                        <>
                          <Field name="kual_6_note" as={TextField} fullWidth margin="normal" label="Penjelasan Lain" />
                          <Field name="kual_6_img" component={FileUpload} label="Foto" />
                        </>
                      )}
                      <RadioFieldJiwa
                        name="kual_7"
                        label="Apakah presentasi produk Makanan yang disajikan tidak berantakan?"
                        options={[
                          { value: 1, label: "Ya, Berantakan" },
                          { value: 5, label: "Tidak Berantakan" },
                        ]}
                      />
                      {Number(values.kual_7) === 1 && (
                        <>
                          <Field name="kual_7_note" as={TextField} fullWidth margin="normal" label="Penjelasan Lain" />
                        </>
                      )}
                      <RadioFieldJiwa
                        name="kual_8"
                        label="Apakah ada label order pada makanan yang disajikan?"
                        options={[
                          { value: 1, label: "Tidak Ada" },
                          { value: 5, label: "Ada" },
                        ]}
                      />
                      {Number(values.kual_8) === 1 && (
                        <>
                          <Field name="kual_8_note" as={TextField} fullWidth margin="normal" label="Penjelasan Lain" />
                        </>
                      )}
                      <RadioFieldJiwa
                        name="peng_1"
                        label="Apakah staff mengucapkan 'terima kasih janji datang kembali' ketika Anda meninggalkan toko?"
                        options={[
                          { value: 1, label: "Tidak" },
                          { value: 5, label: "Ya" },
                        ]}
                      />
                      {Number(values.peng_1) === 1 && (
                        <>
                          <Field name="peng_1_note" as={TextField} fullWidth margin="normal" label="Penjelasan Lain" />
                          <Field name="peng_1_img" component={FileUpload} label="Foto" />
                        </>
                      )}
                      <RadioFieldJiwa
                        name="peng_2"
                        label="Seberapa puas Anda dengan pengalaman Anda secara keseluruhan di toko ini?"
                        options={[
                          { value: 1, label: "Sangat Tidak Puas" },
                          { value: 2, label: "Tidak Puas" },
                          { value: 3, label: "Netral" },
                          { value: 4, label: "Puas" },
                          { value: 5, label: "Sangat Puas" },
                        ]}
                      />
                      {[1, 2, 3].includes(Number(values.peng_2)) && (
                        <>
                          <Field name="peng_2_note" as={TextField} fullWidth margin="normal" label="Penjelasan Lain" />
                          <Field name="peng_2_img" component={FileUpload} label="Foto" />
                        </>
                      )}
                      <RadioFieldJiwa
                        name="peng_3"
                        label="Seberapa besar kemungkinan Anda untuk kembali ke toko ini?"
                        options={[
                          { value: 1, label: "Sangat Tidak Mungkin" },
                          { value: 2, label: "Tidak Mungkin" },
                          { value: 3, label: "Netral" },
                          { value: 4, label: "Mungkin" },
                          { value: 5, label: "Sangat Mungkin" },
                        ]}
                      />
                      {[1, 2, 3].includes(Number(values.peng_3)) && (
                        <>
                          <Field name="peng_3_note" as={TextField} fullWidth margin="normal" label="Penjelasan Lain" />
                          <Field name="peng_3_img" component={FileUpload} label="Foto" />
                        </>
                      )}
                      <RadioFieldJiwa
                        name="peng_4"
                        label="Seberapa besar kemungkinan Anda untuk merekomendasikan toko ini kepada orang lain?"
                        options={[
                          { value: 1, label: "Sangat Tidak Mungkin" },
                          { value: 2, label: "Tidak Mungkin" },
                          { value: 3, label: "Netral" },
                          { value: 4, label: "Mungkin" },
                          { value: 5, label: "Sangat Mungkin" },
                        ]}
                      />
                      {[1, 2, 3].includes(Number(values.peng_4)) && (
                        <>
                          <Field name="peng_4_note" as={TextField} fullWidth margin="normal" label="Penjelasan Lain" />
                          <Field name="peng_4_img" component={FileUpload} label="Foto" />
                        </>
                      )}

                      <RadioFieldJiwa
                        name="hc"
                        label="Apakah crew merespons komplain dengan baik?"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <Field name="summary_1" as={TextField} fullWidth margin="normal" label="Apa yang paling Anda sukai dari kunjungan Anda?" multiline row={6} />
                      <Field name="summary_2" as={TextField} fullWidth margin="normal" label="Apa yang perlu diperbaiki?" multiline row={6} />
                      <Field name="summary_3" as={TextField} fullWidth margin="normal" label="Ada komentar atau saran lainnya?" multiline row={6} />
                      <Field name="nik_agent" as={TextField} fullWidth margin="normal" label="NIK Agent" />
                      <Field name="nama_agent" as={TextField} fullWidth margin="normal" label="Nama Agent" />
                      <Field name="nominal_struk" as={TextField} fullWidth margin="normal" label="Nominal Struk" />
                      <Field name="image_struk" component={FileUpload} label="Struk Pembelian" />
                      <Field name="image_product" component={FileUpload} label="Foto Produk" />
                      <Field name="image_td" component={FileUpload} label="Foto Tempat Duduk" />
                      <Field name="image_lainnya" component={FileUpload} label="Foto Lainnya" />
                      <Field name="cm_status" component={SwitchField} label="cm status" />
                    </>
                  )}

                  {brandId === 1 && (
                    <>
                      <DateField name="createdAt" label="Tanggal Dibuat (DD-MM-YYYY)" />
                      <Field name="nama_agent" as={TextField} fullWidth margin="normal" label="Nama Agent" />
                      <Field
                        name="kode_gerai"
                        as={TextField}
                        fullWidth
                        margin="normal"
                        label="Kode Gerai"
                        value={values.kode_gerai} // Langsung ambil dari database
                        onChange={handleChange} // Biar user tetap bisa edit normal
                        error={touched.kode_gerai && !!errors.kode_gerai}
                        helperText={touched.kode_gerai && errors.kode_gerai}
                      />
                      <Field name="store_name" as={TextField} fullWidth margin="normal" label="Store Name" />
                      <Field name="store_type" as={TextField} fullWidth margin="normal" label="Store Type" />
                      <Field name="menu" as={TextField} fullWidth margin="normal" label="Product" />
                      <Field name="area" as={TextField} fullWidth margin="normal" label="Area" />

                      <RadioFieldJiwa
                        name="A1001"
                        label="Apakah rasa produk sesuai? (Kurang manis, Terlalu manis, atau Hambar)"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="A1002"
                        label="Apakah tampilan / Warna produk sesuai?"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="A1003"
                        label="Apakah tekstur sesuai dengan produk?"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="A1004"
                        label="Apakah produk dilengkapi sedotan dan sesuai varian yang dipesan?"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="A1005"
                        label="Apakah produk diseal dengan baik?"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="A1006"
                        label="Apakah produk ditempel sticker varian produk?"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="A1007"
                        label="Apakah produk bebas dari benda asing?"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="A1008"
                        label="Apakah produk tidak terasa basi atau berbau?"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="A1009"
                        label="Apakah cashier menyapa customer yang datang?"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="A1010"
                        label="Apakah suara cashier terdengar dengan jelas?"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="A1011"
                        label="Apakah Cashier melayani dengan senyum?"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="A1012"
                        label="Apakah cashier menanyakan nama customer?"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="A1013"
                        label="Apakah cashier menanyakan orderan customer?"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="A1014"
                        label="Apakah cashier melakukan up selling dengan menawarkan promo yang berlangsung?"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="A1015"
                        label="Apakah cashier menyebutkan ulang pesanan customer?"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="A1016"
                        label="Apakah cashier menanyakan metode pembayaran?"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="A1017"
                        label="Apakah cashier menggunakan Topi & Apron? (Hijab: Tanpa Topi) (Non Hijab: Dengan Topi)"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="A1018"
                        label="Apakah cashier memberikan struk?"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="A1019"
                        label="Apakah cashier menutup transaksi dengan meminta customer untuk menunggu dan mengucapkan terima kasih?"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="A1020"
                        label="Apakah crew store memanggil nama customer dengan jelas? (bukan nomor struk)"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="A1021"
                        label="Apakah crew store menyebutkan kembali orderan?"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="A1022"
                        label="Apakah crew store menggunakan Topi & Apron? (Hijab: Tanpa Topi) (Non Hijab: Menggunakan Topi)"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="A1023"
                        label="Apakah crew store mengucapkan terima kasih dan salam perpisahan (Hati-Hati di Jalan, Jika Haus Datang Kembali)?"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="A1024"
                        label="Apakah area lantai teras bersih dari sampah?"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="A1025"
                        label="Apakah area parkir terdapat tempat sampah?"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="A1026"
                        label="Apakah sign haus dalam kondisi bersih?"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="A1027"
                        label="Apakah lantai lobby bagian dalam store, dalam keadaan bersih?"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="A1028"
                        label="Apakah kursi dan meja dalam kondisi bersih dari sisa makanan?"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="A1029"
                        label="Apakah ruangan store bebas dari Bau atau Aroma tidak sedap?"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="A1030"
                        label="Apakah Suhu ruangan sudah nyaman menurut anda?"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="A1031"
                        label="Apakah musik sesuai dengan volume yang baik?"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="A1032"
                        label="Apakah Display Menu dalam kondisi baik dan bersih?"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="A1033"
                        label="Apakah Mural Dinding / Akrilik POP dalam kondisi baik dan bersih?"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="A1034"
                        label="Apakah semua pencahayaan bersih, beroperasi dengan baik?"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="A1035"
                        label="Apakah AC bersih dan beroperasi dengan baik?"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="A1036"
                        label="Apakah crew tidak memakai aksesoris? (cincin/gelang)"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="A1037"
                        label="Apakah Kerjasama antar team terlihat saat bekerja?"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="A1038"
                        label="Apakah crew dengan sigap melayani customer?"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="A1039"
                        label="Apakah karyawan berperilaku profesional, sopan dan santun?"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="B1001"
                        label="Apakah rasa produk sesuai? (Kurang manis, Terlalu manis, atau Hambar)"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="B1002"
                        label="Apakah Tampilan / Warna produk sesuai? (Terlalu Pekat, Terlalu Pucat)"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="B1003"
                        label="Apakah diberi topping sesuai standar?"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="B1004"
                        label="Apakah tekstur sesuai dengan standar? (Terlalu Keras, Terlalu Kenyal)"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="B1005"
                        label="Apakah tekstur Kuah/saus sesuai dengan standar? (Terlalu Kental, Terlalu Cair)"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="B1006"
                        label="Apakah lid penutup tertutup dengan rapat?"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="B1007"
                        label="Apakah produk bebas dari benda asing?"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />
                      <RadioFieldJiwa
                        name="B1008"
                        label="Apakah produk tidak terasa basi atau berbau?"
                        options={[
                          { value: 1, label: "Ya" },
                          { value: 0, label: "Tidak" },
                        ]}
                      />

                      <Field name="Z1001" as={TextField} fullWidth margin="normal" label="Ada berapa jumlah crew yang bertugas?" />
                      <Field
                        name="Z1002"
                        as={TextField}
                        fullWidth
                        margin="normal"
                        label="Berapa lama waktu yang dibutuhkan oleh customer dari mulai masuk store, mengantri sampai dengan mendapatkan produk?"
                      />
                      <Field
                        name="Z1003"
                        as={TextField}
                        fullWidth
                        margin="normal"
                        label="Berapa lama waktu yang dibutuhkan oleh customer dari mulai digreeting oleh kasir sampai dengan mendapatkan produk?"
                      />
                      <Field name="Z1004" as={TextField} fullWidth margin="normal" label="Ada berapa jumlah antrian yang ada?" />
                      <Field name="summary" as={TextField} fullWidth margin="normal" label="Memo" multiline row={6} />
                      <Field name="nominal_struk" as={TextField} fullWidth margin="normal" label="Nominal Struk" />
                      <Field name="image_product" component={FileUpload} label="Foto Produk" />
                      <Field name="image_struk" component={FileUpload} label="Struk Pembelian" />
                      <Field name="image_lainnya" component={FileUpload} label="Foto Lainnya" />
                      <Field name="cm_status" component={SwitchField} label="cm status" />
                    </>
                  )}

                  <DialogActions>
                    <Button onClick={handleCloseEditModal} color="primary">
                      Cancel
                    </Button>
                    <Button type="submit" color="primary" variant="contained" disabled={isSubmitting}>
                      Save
                    </Button>
                  </DialogActions>
                </Form>
              )}
            </Formik>
          </DialogContent>
        </Dialog>
        {/* Modal Edit Ends */}

        {/* Form Table Start */}
        {totalCount > controller.rowsPerPage && (
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={totalCount}
            rowsPerPage={controller.rowsPerPage}
            page={controller.page}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        )}
      </Box>
    </DownloadCard>
  );
};

export default ProductTableList;

"use client";
import * as React from "react";
import { alpha, useTheme } from "@mui/material/styles";
import { format } from "date-fns";
import { jsPDF } from "jspdf";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import TextField from "@mui/material/TextField";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { visuallyHidden } from "@mui/utils";
import { useSelector, useDispatch } from "@/store/hooks";
import { fetchProducts } from "@/store/apps/visit/visitSlice";
import CustomSwitch from "../../../forms/theme-elements/CustomSwitch";
import { IconDotsVertical, IconDownload, IconSearch, IconTrash, IconX } from "@tabler/icons-react";
import { ProductType } from "../../../../(DashboardLayout)/types/apps/eCommerce";
import DownloadCard from "@/app/components/shared/DownloadCard";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress } from "@mui/material";
import { RootState } from "@/store/store";

function descendingComparator(a: ProductType, b: ProductType, orderBy: string) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

type Order = "asc" | "desc";

function getComparator(order: string, orderBy: string) {
  return order === "desc" ? (a: ProductType, b: ProductType) => descendingComparator(a, b, orderBy) : (a: ProductType, b: ProductType) => -descendingComparator(a, b, orderBy);
}

const stableSort = <T extends ProductType>(array: T[], comparator: (a: T, b: T) => number): T[] => {
  const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) {
      return order;
    }
    return a[1] - b[1];
  });

  return stabilizedThis.map((el) => el[0]);
};

interface HeadCell {
  disablePadding: boolean;
  id: string;
  label: string;
  numeric: boolean;
}

const headCells: readonly HeadCell[] = [
  {
    id: "id",
    numeric: false,
    disablePadding: false,
    label: "ID",
  },
  {
    id: "nama_agent",
    numeric: false,
    disablePadding: false,
    label: "Nama Agent",
  },
  {
    id: "kode_gerai",
    numeric: false,
    disablePadding: false,
    label: "Kode Gerai",
  },

  {
    id: "store",
    numeric: false,
    disablePadding: false,
    label: "Store",
  },
  {
    id: "area",
    numeric: false,
    disablePadding: false,
    label: "Area",
  },
  {
    id: "menu",
    numeric: false,
    disablePadding: false,
    label: "Menu",
  },
  {
    id: "percentage_service",
    numeric: false,
    disablePadding: false,
    label: "Percentage Service",
  },
  {
    id: "percentage_toilet",
    numeric: false,
    disablePadding: false,
    label: "Percetage Toilet",
  },
  {
    id: "percentage_food",
    numeric: false,
    disablePadding: false,
    label: "Percetage Food",
  },
  {
    id: "createdAt",
    numeric: false,
    disablePadding: false,
    label: "Date",
  },
  {
    id: "image_product",
    numeric: false,
    disablePadding: false,
    label: "Foto Produk",
  },
  {
    id: "image_struk",
    numeric: false,
    disablePadding: false,
    label: "Foto Struk",
  },
  {
    id: "action",
    numeric: false,
    disablePadding: false,
    label: "Action",
  },
];

interface EnhancedTableProps {
  onRequestSort: (event: React.MouseEvent<unknown>, property: any) => void;
  order: Order;
  orderBy: string;
  rowCount: number;
}

function EnhancedTableHead(props: EnhancedTableProps) {
  const { order, orderBy, rowCount, onRequestSort } = props;
  const createSortHandler = (property: any) => (event: React.MouseEvent<unknown>) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <TableCell key={headCell.id} align={headCell.numeric ? "right" : "left"} padding={headCell.disablePadding ? "none" : "normal"} sortDirection={orderBy === headCell.id ? order : false}>
            <TableSortLabel active={orderBy === headCell.id} direction={orderBy === headCell.id ? order : "asc"} onClick={createSortHandler(headCell.id)}>
              {headCell.label}
              {orderBy === headCell.id ? (
                <Box component="span" sx={visuallyHidden}>
                  {order === "desc" ? "sorted descending" : "sorted ascending"}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

interface EnhancedTableToolbarProps {
  numSelected: number;
  handleSearch: React.ChangeEvent<HTMLInputElement> | any;
  search: string;
}

const EnhancedTableToolbar = (props: EnhancedTableToolbarProps) => {
  const { numSelected, handleSearch, search } = props;

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
            placeholder="Search Items"
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
  const [order, setOrder] = React.useState<Order>("asc");
  const [orderBy, setOrderBy] = React.useState<any>("nama_agent");
  const [selected, setSelected] = React.useState<readonly string[]>([]);
  const { totalCount } = useSelector((state: RootState) => state.productReducer);
  const [page, setPage] = React.useState(0);
  const [dense, setDense] = React.useState(false);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [open, setOpen] = React.useState(false);
  const [openStruk, setOpenStruk] = React.useState(false);
  const [imageSrc, setImageSrc] = React.useState("");

  const handleClickOpenStruk = (src: string) => {
    setImageSrc(src);
    setOpenStruk(true);
  };

  const handleClickOpen = (src: string) => {
    setImageSrc(src);
    setOpen(true);
  };

  const handleCloseStruk = () => {
    setOpenStruk(false);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const dispatch = useDispatch();

  // React.useEffect(() => {
  //   console.log("Fetching data for page", page + 1);
  //   dispatch(fetchProducts(page + 1));
  // }, [dispatch, page]);

  const getProducts: ProductType[] = useSelector((state: any) => state.productReducer.products);
  console.log("Fetched products in Redux:", getProducts);

  // Pastikan tidak ada duplikasi state `rows` dan hanya menggunakan `getProducts` untuk penanganan sorting, pencarian, dan filtering.
  const [search, setSearch] = React.useState("");
  const [filteredRows, setFilteredRows] = React.useState<ProductType[]>(getProducts);

  // Update `filteredRows` saat `getProducts` berubah atau ada perubahan pencarian
  React.useEffect(() => {
    let rows = getProducts;
    if (search) {
      rows = getProducts.filter((row) => row.nama_agent.toLowerCase().includes(search) || row.area?.toString().toLowerCase().includes(search) || row.kode_gerai?.toString().toLowerCase().includes(search));
    }
    setFilteredRows(rows);
    console.log("Filtered Rows Updated:", rows); // Log untuk memastikan filteredRows sudah benar
  }, [getProducts, search]);

  // Handle pencarian
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.toLowerCase();
    setSearch(value);
  };

  // This is for the sorting
  const handleRequestSort = (event: React.MouseEvent<unknown>, property: any) => {
    console.log("Sorting by:", property);
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  // const handleChangePage = (event: unknown, newPage: number) => {
  //   console.log("Page Changed:", newPage);
  //   setPage(newPage);
  //   dispatch(fetchProducts(newPage + 1));
  // };

  // const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const newRowsPerPage = parseInt(event.target.value, 10);
  //   setRowsPerPage(newRowsPerPage);
  //   setPage(0); // Reset ke halaman pertama
  //   dispatch(fetchProducts(0)); // Panggil fetch dengan limit yang baru
  // };

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows = rowsPerPage - Math.min(rowsPerPage, filteredRows.length - page * rowsPerPage);

  const handleChangeDense = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDense(event.target.checked);
  };

  const theme = useTheme();
  const borderColor = theme.palette.divider;

  const handleDownload = () => {
    const headers = ["Title", "Date", "Status", "Price"];

    // Map rows data to match CSV structure
    const csvRows = filteredRows.map((row: { nama_agent: any; created: string | number | Date; stock: any; price: any }) => [
      `"${row.nama_agent}"`,
      // `"${format(new Date(row.created), "E, MMM d yyyy")}"`,
      // `"${row.stock ? "InStock" : "Out of Stock"}"`,
      // `"${row.price}"`,
    ]);

    // Combine headers and rows into CSV content
    const csvContent = [headers.join(","), ...csvRows.map((e: any[]) => e.join(","))].join("\n");

    // Create a Blob for CSV content and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "data.csv"); // CSV file name
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const loadImageToBase64 = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = url;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpeg"));
      };
      img.onerror = (error) => reject(error);
    });
  };

  const handleSingleDownload = async (row: ProductType) => {
    const doc = new jsPDF();

    // Set judul PDF
    doc.setFontSize(16);
    doc.text("Data Detail", 10, 10);

    // Isi data dari row
    const data = [
      { label: "Nama Agent", value: row.nama_agent },
      { label: "Kode Gerai", value: row.kode_gerai },
      { label: "Store", value: row.store },
      { label: "Area", value: row.area },
      { label: "Menu", value: row.menu.split(",").join("\n") },
      { label: "Service (%)", value: row.percentage_service },
      { label: "Toilet (%)", value: row.percentage_toilet },
      { label: "Food (%)", value: row.percentage_food },
      { label: "Date", value: new Date(row.createdAt).toLocaleDateString() },
    ];

    let yPosition = 20;
    data.forEach((item) => {
      doc.setFontSize(12);
      doc.text(`${item.label}:`, 10, yPosition);
      doc.text(item.value || "-", 60, yPosition);
      yPosition += 10;
    });

    if (row.image_product) {
      try {
        const productBase64 = await loadImageToBase64(row.image_product);
        doc.addImage(productBase64, "JPG", 10, yPosition, 50, 50);
        yPosition += 60;
      } catch (error) {
        console.error("Failed to load image:", error);
      }
    }

    if (row.image_struk) {
      try {
        const strukBase64 = await loadImageToBase64(row.image_struk);
        doc.addImage(strukBase64, "JPG", 10, yPosition, 50, 50);
        yPosition += 60;
      } catch (error) {
        console.error("Failed to load image:", error);
      }
    }

    // Unduh PDF
    doc.save(`${row.nama_agent}_${row.kode_gerai}_${row.store}.pdf`);
  };

  const convertToPercentage = (value: string) => {
    if (!value.includes("/")) return "Invalid data"; // Validasi data

    const [numerator, denominator] = value.split("/").map(Number); // Pisahkan dan ubah ke angka
    if (denominator === 0) return "Invalid denominator"; // Validasi untuk pembagian dengan nol

    const percentage = (numerator / denominator) * 100;
    return `${percentage.toFixed(2)}%`; // Tambahkan simbol persen dan format
  };

  return (
    <DownloadCard title="Filter Table" onDownload={handleDownload}>
      <EnhancedTableToolbar numSelected={selected.length} search={search} handleSearch={(event: any) => handleSearch(event)} />
      <Box>
        <Box>
          <Paper variant="outlined" sx={{ mx: 2, mt: 1, border: `1px solid ${borderColor}` }}>
            <TableContainer>
              <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle" size={dense ? "small" : "medium"}>
                <EnhancedTableHead order={order} orderBy={orderBy} onRequestSort={handleRequestSort} rowCount={totalCount} />
                <TableBody>
                  {filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((data) => {
                    console.log("Filtered Rows Before Map:", filteredRows);
                    console.log("Rendering Data Map:", data);
                    return (
                      <TableRow key={data.id}>
                        <TableCell>
                          <Typography>{data.id}</Typography>
                        </TableCell>

                        <TableCell>
                          <Typography sx={{ width: "100px" }}>{data.nama_agent}</Typography>
                        </TableCell>

                        <TableCell>
                          <Typography sx={{ width: "100px" }}>{data.kode_gerai}</Typography>
                        </TableCell>

                        <TableCell>
                          <Typography sx={{ width: "100px" }}>{data.store}</Typography>
                        </TableCell>

                        <TableCell>
                          <Typography>{data.area}</Typography>
                        </TableCell>

                        <TableCell>
                          <Typography sx={{ width: "200px" }}>
                            {data.menu.split(",").map((item, index) => (
                              <span key={index}>
                                {item.trim()}
                                {index < data.menu.split(",").length - 1 && <br />}
                              </span>
                            ))}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography sx={{ width: "150px" }}>{convertToPercentage(data.percentage_service)}</Typography>
                        </TableCell>

                        <TableCell>
                          <Typography sx={{ width: "150px" }}>{convertToPercentage(data.percentage_toilet)}</Typography>
                        </TableCell>

                        <TableCell>
                          <Typography sx={{ width: "150px" }}>{convertToPercentage(data.percentage_food)}</Typography>
                        </TableCell>

                        <TableCell>
                          <Typography sx={{ width: "150px" }}>{format(new Date(data.createdAt), "E, d MMM yyyy")}</Typography>
                        </TableCell>

                        <TableCell>
                          <Box
                            component="img"
                            sx={{
                              height: 233,
                              width: 180,
                              maxHeight: { xs: 233, md: 167 },
                              maxWidth: { xs: 350, md: 250 },
                            }}
                            alt="The house from the offer."
                            src={data.image_product}
                            onClick={() => handleClickOpen(data.image_product)}
                          />
                        </TableCell>

                        <TableCell>
                          <Box
                            component="img"
                            sx={{
                              height: 233,
                              width: 180,
                              maxHeight: { xs: 233, md: 167 },
                              maxWidth: { xs: 350, md: 250 },
                            }}
                            alt="The house from the offer."
                            src={data.image_struk}
                            onClick={() => handleClickOpenStruk(data.image_struk)}
                          />
                        </TableCell>

                        <TableCell>
                          <Button onClick={() => handleSingleDownload(data)}>
                            <Typography sx={{ width: "150px" }}>Download PDF</Typography>
                          </Button>
                        </TableCell>

                        <Dialog open={openStruk} onClose={handleCloseStruk} maxWidth="md" fullWidth BackdropProps={{ style: { backgroundColor: "transparent" } }}>
                          <DialogTitle>
                            {data.store}
                            <IconButton edge="end" color="inherit" onClick={handleCloseStruk} aria-label="close" sx={{ position: "absolute", right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}>
                              <IconX />
                            </IconButton>
                          </DialogTitle>
                          <DialogContent>
                            <Box component="img" sx={{ width: "100%", height: "auto", objectFit: "contain" }} alt="Popup Image" src={imageSrc} />
                          </DialogContent>
                          <DialogActions>{/* <IconButton onClick={handleCloseStruk}>Close</IconButton> */}</DialogActions>
                        </Dialog>

                        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth BackdropProps={{ style: { backgroundColor: "transparent" } }}>
                          <DialogTitle>
                            {data.store}
                            <IconButton edge="end" color="inherit" onClick={handleClose} aria-label="close">
                              <IconX />
                            </IconButton>
                          </DialogTitle>
                          <DialogContent>
                            <Box component="img" sx={{ width: "100%", height: "auto", objectFit: "contain" }} alt="Popup Image" src={imageSrc} />
                          </DialogContent>
                          <DialogActions>{/* <IconButton onClick={handleClose}>Close</IconButton> */}</DialogActions>
                        </Dialog>
                      </TableRow>
                    );
                  })}
                  {emptyRows > 0 && (
                    <TableRow style={{ height: (dense ? 33 : 53) * emptyRows }}>
                      <TableCell colSpan={6} />
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            {/* <TablePagination
              rowsPerPageOptions={[5, 10, 25, 100, 500, 750]}
              component="div"
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            /> */}
          </Paper>
          <Box ml={2}>
            <FormControlLabel control={<CustomSwitch checked={dense} onChange={handleChangeDense} />} label="Dense padding" />
          </Box>
        </Box>
      </Box>
    </DownloadCard>
  );
};

export default ProductTableList;

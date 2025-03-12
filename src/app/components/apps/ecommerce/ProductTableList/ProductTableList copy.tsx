"use client";

import * as React from "react";
import { format } from "date-fns";
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
import axios from "axios";
import { ProductType } from "../../../../(DashboardLayout)/types/apps/eCommerce";

const ProductTableList = () => {
  const [products, setProducts] = React.useState<ProductType[]>([]);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [search, setSearch] = React.useState("");
  const [imageSrc, setImageSrc] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [openStruk, setOpenStruk] = React.useState(false);
  const [totalCount, setTotalCount] = React.useState(0); // Track the total number of products

  const BASE_URL = `${process.env.NEXT_PUBLIC_VISIT_URL}/mistery-shopper/pages`;
  const AUTH_TOKEN = process.env.NEXT_PUBLIC_VISIT_TOKEN;

  // Function to fetch products using axios
  const fetchProducts = async (page: number) => {
    try {
      const response = await axios.get(`${BASE_URL}?page=${page + 1}`, {
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`,
        },
      });
      setProducts(response.data.data);
      setTotalCount(response.data.totalCount); // Assuming `totalCount` is returned in the response
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  React.useEffect(() => {
    fetchProducts(page); // Fetch products when the page is changed
  }, [page]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value.toLowerCase());
  };

  const filteredRows = products.filter((row) => {
    return row.nama_agent.toLowerCase().includes(search) || row.area?.toString().toLowerCase().includes(search) || row.kode_gerai?.toString().toLowerCase().includes(search);
  });

  const handleClickOpen = (src: string) => {
    setImageSrc(src);
    setOpen(true);
  };

  const handleClickOpenStruk = (src: string) => {
    setImageSrc(src);
    setOpenStruk(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleCloseStruk = () => {
    setOpenStruk(false);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to the first page when rows per page change
  };

  return (
    <Box>
      <Paper variant="outlined">
        <TableContainer>
          <Table sx={{ minWidth: 750 }}>
            <TableHead>
              <TableRow>
                {/* Table Headers */}
                <TableCell>ID</TableCell>
                <TableCell>Nama Agent</TableCell>
                <TableCell>Kode Gerai</TableCell>
                <TableCell>Store</TableCell>
                <TableCell>Area</TableCell>
                <TableCell>Menu</TableCell>
                <TableCell>Percentage Service</TableCell>
                <TableCell>Percentage Toilet</TableCell>
                <TableCell>Percentage Food</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Foto Produk</TableCell>
                <TableCell>Foto Struk</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((data) => (
                <TableRow key={data.id}>
                  <TableCell>{data.id}</TableCell>
                  <TableCell>{data.nama_agent}</TableCell>
                  <TableCell>{data.kode_gerai}</TableCell>
                  <TableCell>{data.store}</TableCell>
                  <TableCell>{data.area}</TableCell>
                  <TableCell>{data.menu}</TableCell>
                  <TableCell>{data.percentage_service}</TableCell>
                  <TableCell>{data.percentage_toilet}</TableCell>
                  <TableCell>{data.percentage_food}</TableCell>
                  <TableCell>{format(new Date(data.createdAt), "E, d MMM yyyy")}</TableCell>
                  <TableCell>
                    <Box component="img" sx={{ height: 233, width: 180, objectFit: "contain" }} alt="Foto Produk" src={data.image_product} onClick={() => handleClickOpen(data.image_product)} />
                  </TableCell>
                  <TableCell>
                    <Box component="img" sx={{ height: 233, width: 180, objectFit: "contain" }} alt="Foto Struk" src={data.image_struk} onClick={() => handleClickOpenStruk(data.image_struk)} />
                  </TableCell>
                  <TableCell>
                    <Button>Download PDF</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Foto Produk</DialogTitle>
        <DialogContent>
          <Box component="img" sx={{ width: "100%", height: "auto", objectFit: "contain" }} src={imageSrc} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openStruk} onClose={handleCloseStruk} maxWidth="md" fullWidth>
        <DialogTitle>Foto Struk</DialogTitle>
        <DialogContent>
          <Box component="img" sx={{ width: "100%", height: "auto", objectFit: "contain" }} src={imageSrc} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStruk}>Close</Button>
        </DialogActions>
      </Dialog>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 100, 500, 750]}
        component="div"
        count={totalCount} // Use the total count from the response
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  );
};

export default ProductTableList;

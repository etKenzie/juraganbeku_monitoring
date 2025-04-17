"use client";
import DownloadButton from "@/app/components/common/DownloadButton";
import { supabase } from "@/lib/supabaseClient";
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
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
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import AddLeadDialog from "./AddLeadDialog";
import FollowUpsDialog from "./FollowUpsDialog";

interface Lead {
  id: number;
  source: string;
  date_added: string;
  company_name: string;
  area: string;
  phone: string;
  contact_person: string;
  category: string;
  branch_count: number;
  deadline: string;
  memo: string;
  found_by: string;
}

type Order = "asc" | "desc";

type SortableField = keyof Lead;

interface HeadCell {
  id: SortableField;
  label: string;
  numeric: boolean;
}

const headCells: HeadCell[] = [
  { id: "company_name", label: "Company Name", numeric: false },
  { id: "contact_person", label: "Contact Person", numeric: false },
  { id: "phone", label: "Phone", numeric: false },
  { id: "area", label: "Area", numeric: false },
  { id: "category", label: "Category", numeric: false },
  { id: "branch_count", label: "Branches", numeric: true },
  { id: "source", label: "Source", numeric: false },
  { id: "found_by", label: "Found By", numeric: false },
  { id: "date_added", label: "Entry Date", numeric: false },
  { id: "deadline", label: "Deadline", numeric: false },
  { id: "memo", label: "Memo", numeric: false },
];

interface LeadsTableProps {
  leads: Lead[];
}

const LeadsTable = ({ leads }: LeadsTableProps) => {
  const [orderBy, setOrderBy] = useState<SortableField>("date_added");
  const [order, setOrder] = useState<Order>("desc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [areaFilter, setAreaFilter] = useState<string>("");
  const [foundByFilter, setFoundByFilter] = useState<string>("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [followUpsOpen, setFollowUpsOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | undefined>(undefined);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const handleRequestSort = (property: SortableField) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'HOT':
        return 'error';
      case 'WARM':
        return 'warning';
      case 'COLD':
        return 'info';
      default:
        return 'default';
    }
  };

  const foundByOptions = ['HARITZ', 'ZAHRO', 'MARDI', 'ADRIL', 'KENZIE'];

  const filteredLeads = leads.filter((lead) => {
    if (categoryFilter && lead.category !== categoryFilter) return false;
    if (areaFilter && lead.area !== areaFilter) return false;
    if (foundByFilter && lead.found_by !== foundByFilter) return false;
    return true;
  });

  const uniqueCategories = Array.from(new Set(leads.map((lead) => lead.category)));
  const uniqueAreas = Array.from(new Set(leads.map((lead) => lead.area)));

  const sortedLeads = [...filteredLeads].sort((a, b) => {
    let aValue: any = a[orderBy];
    let bValue: any = b[orderBy];

    if (orderBy === "date_added" || orderBy === "deadline") {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    if (order === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
    }
  });

  const handleDeleteLead = async (leadId: number) => {
    try {
      // First delete all follow-ups for this lead
      const { error: followUpsError } = await supabase
        .from('follow_ups')
        .delete()
        .eq('lead_id', leadId);

      if (followUpsError) throw followUpsError;

      // Then delete the lead
      const { error: leadError } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (leadError) throw leadError;

      // Refresh the leads list
      window.location.reload();
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  const handleEditLead = async (updatedLead: Lead | Omit<Lead, 'id'>) => {
    try {
      if (!('id' in updatedLead)) {
        throw new Error('Cannot edit lead without ID');
      }

      const { error } = await supabase
        .from('leads')
        .update(updatedLead)
        .eq('id', updatedLead.id);

      if (error) throw error;
      setEditingLead(undefined);
      window.location.reload();
    } catch (error) {
      console.error('Error updating lead:', error);
    }
  };

  const handleAddLead = async (newLead: Lead | Omit<Lead, 'id'>) => {
    try {
      if ('id' in newLead) {
        // This is an edit operation
        const { error } = await supabase
          .from('leads')
          .update(newLead)
          .eq('id', newLead.id);

        if (error) throw error;
      } else {
        // This is an add operation
        const { error } = await supabase
          .from('leads')
          .insert([newLead]);

        if (error) throw error;
      }
      
      // Refresh the page after successful operation
      window.location.reload();
    } catch (error) {
      console.error('Error saving lead:', error);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Leads</Typography>
        <DownloadButton
          data={filteredLeads}
          filename="leads"
          sheetName="Leads"
          variant="outlined"
          size="small"
        />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setAddDialogOpen(true)}
        >
          Add New Lead
        </Button>
      </Box>
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryFilter}
              label="Category"
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {uniqueCategories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Area</InputLabel>
            <Select
              value={areaFilter}
              label="Area"
              onChange={(e) => setAreaFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {uniqueAreas.map((area) => (
                <MenuItem key={area} value={area}>
                  {area}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Found By</InputLabel>
            <Select
              value={foundByFilter}
              label="Found By"
              onChange={(e) => setFoundByFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {foundByOptions.map((name) => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
              ))}
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
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedLeads
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((lead) => (
                <TableRow 
                  key={lead.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedLead(lead);
                    setFollowUpsOpen(true);
                  }}
                >
                  <TableCell>{lead.company_name}</TableCell>
                  <TableCell>{lead.contact_person}</TableCell>
                  <TableCell>{lead.phone}</TableCell>
                  <TableCell>{lead.area}</TableCell>
                  <TableCell>
                    <Chip
                      label={lead.category}
                      color={getCategoryColor(lead.category)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">{lead.branch_count}</TableCell>
                  <TableCell>{lead.source}</TableCell>
                  <TableCell>{lead.found_by}</TableCell>
                  <TableCell>{formatDate(lead.date_added)}</TableCell>
                  <TableCell>{lead.deadline ? formatDate(lead.deadline) : '-'}</TableCell>
                  <TableCell>{lead.memo || '-'}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent row click event
                          setEditingLead(lead);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent row click event
                          handleDeleteLead(lead.id);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredLeads.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {selectedLead && (
        <FollowUpsDialog
          open={followUpsOpen}
          onClose={() => {
            setFollowUpsOpen(false);
            setSelectedLead(null);
          }}
          lead={selectedLead}
        />
      )}

      <AddLeadDialog
        open={addDialogOpen || !!editingLead}
        onClose={() => {
          setAddDialogOpen(false);
          setEditingLead(undefined);
        }}
        onAdd={editingLead ? handleEditLead : handleAddLead}
        initialData={editingLead}
      />
    </Box>
  );
};

export default LeadsTable; 
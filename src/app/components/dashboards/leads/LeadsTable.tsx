"use client";
import DownloadButton from "@/app/components/common/DownloadButton";
import { Lead, LeadStatus } from "@/app/types/leads";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Delete as DeleteIcon, Edit as EditIcon, Search as SearchIcon } from "@mui/icons-material";
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    Grid,
    IconButton,
    InputAdornment,
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
    TextField,
    Typography
} from "@mui/material";
import React, { useState } from "react";
import AddLeadDialog from "./AddLeadDialog";
import FollowUpsDialog from "./FollowUpsDialog";

type Order = "asc" | "desc";

type SortableField = keyof Lead;

interface HeadCell {
  id: SortableField;
  label: string;
  numeric: boolean;
}

const headCells: HeadCell[] = [
  { id: "brand_name", label: "Brand Name", numeric: false },
  { id: "company_name", label: "Company Name", numeric: false },
  { id: "contact_person", label: "Contact Person", numeric: false },
  { id: "phone", label: "Phone", numeric: false },
  { id: "email", label: "Email", numeric: false },
  { id: "area", label: "Area", numeric: false },
  { id: "source", label: "Source", numeric: false },
  { id: "lead_category", label: "Category", numeric: false },
  { id: "lead_status", label: "Status", numeric: false },
  { id: "branch_count", label: "Branch Count", numeric: true },
  { id: "service", label: "Services", numeric: false },
  { id: "outlet_type", label: "Outlet Types", numeric: false },
  { id: "priority", label: "Priority", numeric: true },
  { id: "found_by", label: "Found By", numeric: false },
  { id: "date_added", label: "Entry Date", numeric: false },
  { id: "deadline", label: "Deadline", numeric: false },
  { id: "memo", label: "Memo", numeric: false },
];

interface LeadsTableProps {
  leads: Lead[];
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
}

const serviceOptions = ["Cash Pick Up", "Misteri Shopper", "Store Monitoring", "Akumaju"];
const outletTypeOptions = ["outlet", "bike", "cloud kitchen"];
const foundByOptions = ['HARITZ', 'ZAHRO', 'MARDI', 'ADRIL', 'KENZIE'];

const LeadsTable = ({ leads, onEdit, onDelete }: LeadsTableProps) => {
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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedOutletType, setSelectedOutletType] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<string>("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "">("");

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
      case 'Hot':
        return 'error';
      case 'Warm':
        return 'warning';
      case 'Cold':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: LeadStatus) => {
    switch (status) {
      case 'CLOSED':
        return 'error';
      case 'CURRENT':
        return 'warning';
      case 'SUCCESS':
        return 'success';
      default:
        return 'default';
    }
  };

  const handleStatusChange = async (lead: Lead, newStatus: LeadStatus) => {
    try {
      const updatedLead = { ...lead, lead_status: newStatus };
      await handleEditLead(updatedLead);
    } catch (error) {
      console.error('Error updating lead status:', error);
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (lead.brand_name?.toLowerCase() || '').includes(searchTermLower) ||
      (lead.contact_person?.toLowerCase() || '').includes(searchTermLower) ||
      (lead.phone?.toLowerCase() || '').includes(searchTermLower) ||
      (lead.email?.toLowerCase() || '').includes(searchTermLower) ||
      (lead.area?.toLowerCase() || '').includes(searchTermLower);

    const matchesService = selectedService ? lead.service?.includes(selectedService) : true;
    const matchesOutletType = selectedOutletType ? lead.outlet_type?.includes(selectedOutletType) : true;
    const matchesPriority = selectedPriority ? lead.priority === selectedPriority : true;
    const matchesCategory = categoryFilter ? lead.lead_category === categoryFilter : true;
    const matchesArea = areaFilter ? lead.area === areaFilter : true;
    const matchesFoundBy = foundByFilter ? lead.found_by?.includes(foundByFilter) : true;
    const matchesStatus = statusFilter ? lead.lead_status === statusFilter : true;

    return matchesSearch && 
           matchesService && 
           matchesOutletType && 
           matchesPriority && 
           matchesCategory && 
           matchesArea && 
           matchesFoundBy &&
           matchesStatus;
  });

  const uniqueAreas = leads.reduce<string[]>((acc, lead) => {
    if (!acc.includes(lead.area)) {
      acc.push(lead.area);
    }
    return acc;
  }, []);

  const uniqueCategories = ['Hot', 'Warm', 'Cold'];

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

  const handleDeleteLead = async (leadId: string) => {
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

  const handleDeleteClick = (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation();
    setLeadToDelete(lead);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (leadToDelete) {
      onDelete(leadToDelete.id.toString());
      setDeleteConfirmOpen(false);
      setLeadToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setLeadToDelete(null);
  };

  const { role } = useAuth();

  // Calculate current leads count
  const currentLeadsCount = leads.filter(lead => lead.lead_status === 'CURRENT').length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, mt: 4}}>
        <Box>
          <Typography variant="h6">Leads Table</Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
            Current Active Leads: {currentLeadsCount}
          </Typography>
        </Box>
        <DownloadButton
          data={filteredLeads}
          filename="leads"
          sheetName="Leads"
          variant="outlined"
          size="small"
        />
      </Box>
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth>
            <InputLabel>Service</InputLabel>
            <Select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              label="Service"
            >
              <MenuItem value="">All Services</MenuItem>
              {serviceOptions.map((service) => (
                <MenuItem key={service} value={service}>
                  {service}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth>
            <InputLabel>Outlet Type</InputLabel>
            <Select
              value={selectedOutletType}
              onChange={(e) => setSelectedOutletType(e.target.value)}
              label="Outlet Type"
            >
              <MenuItem value="">All Types</MenuItem>
              {outletTypeOptions.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              label="Priority"
            >
              <MenuItem value="">All Priorities</MenuItem>
              <MenuItem value="1">1</MenuItem>
              <MenuItem value="2">2</MenuItem>
              <MenuItem value="3">3</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={3}>
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
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value as LeadStatus | "")}
              size="small"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="CLOSED">Closed</MenuItem>
              <MenuItem value="CURRENT">Current</MenuItem>
              <MenuItem value="SUCCESS">Success</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={() => setAddDialogOpen(true)}
          >
            Add New Lead
          </Button>
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
              {role === "admin" && <TableCell>Actions</TableCell>}
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
                  <TableCell>{lead.brand_name}</TableCell>
                  <TableCell>{lead.company_name}</TableCell>
                  <TableCell>{lead.contact_person}</TableCell>
                  <TableCell>{lead.phone}</TableCell>
                  <TableCell>{lead.email}</TableCell>
                  <TableCell>{lead.area}</TableCell>
                  <TableCell>{lead.source}</TableCell>
                  <TableCell>
                    <Chip
                      label={lead.lead_category}
                      size="small"
                      color={getCategoryColor(lead.lead_category)}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={lead.lead_status}
                      size="small"
                      color={getStatusColor(lead.lead_status)}
                    />
                  </TableCell>
                  <TableCell align="right">{lead.branch_count}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                      {lead.service.map((service) => (
                        <Chip key={service} label={service} size="small" />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                      {lead.outlet_type.map((type) => (
                        <Chip key={type} label={type} size="small" />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label={`${lead.priority}`}
                      size="small"
                      color={
                        lead.priority === "1"
                          ? "error"
                          : lead.priority === "2"
                          ? "warning"
                          : "success"
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                      {lead.found_by.map((source) => (
                        <Chip key={source} label={source} size="small" />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>{formatDate(lead.date_added)}</TableCell>
                  <TableCell>{lead.deadline ? formatDate(lead.deadline) : '-'}</TableCell>
                  <TableCell>{lead.memo}</TableCell>
                  {role === 'admin' && (
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingLead(lead);
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => handleDeleteClick(e, lead)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  )}
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

      <Dialog
        open={deleteConfirmOpen}
        onClose={handleCancelDelete}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography id="delete-dialog-description">
            Are you sure you want to delete the lead for {leadToDelete?.company_name}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

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
"use client";
import { FollowUp, Lead } from "@/app/types/leads";
import { supabase } from "@/lib/supabaseClient";
import {
  Box,
  Chip,
  FormControl,
  Grid,
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
  TextField,
  Typography
} from "@mui/material";
import { useEffect, useState } from "react";
import FollowUpsDialog from "./FollowUpsDialog";

interface FollowUpsTableProps {
  onEdit?: (followUp: FollowUp) => void;
  onDelete?: (id: number) => void;
}

const FollowUpsTable = ({ onEdit, onDelete }: FollowUpsTableProps) => {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [leads, setLeads] = useState<Record<string, Lead>>({});
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [followedByFilter, setFollowedByFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Get unique followed by names from all follow-ups
  const uniqueFollowedByNames = Array.from(
    new Set(
      followUps.flatMap(followUp => followUp.followed_by)
    )
  ).sort();

  const fetchFollowUps = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('follow_ups')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setFollowUps(data || []);

      // Fetch all unique lead IDs
      const leadIds = Array.from(new Set(data?.map(fu => fu.lead_id) || []));
      
      // Fetch leads data for all follow-ups
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .in('id', leadIds);

      if (leadsError) throw leadsError;

      // Create a map of lead_id to lead data
      const leadsMap = (leadsData || []).reduce((acc, lead) => {
        acc[lead.id] = lead;
        return acc;
      }, {} as Record<string, Lead>);

      setLeads(leadsMap);
    } catch (err) {
      console.error('Error fetching follow-ups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'tersambung':
      case 'tersambung via WA':
      case 'tersambung via LinkedIn':
      case 'Tersambung via DM':
        return 'success';
      case 'Tidak Dijawab':
        return 'warning';
      case 'Tidak Aktif':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleRowClick = (followUp: FollowUp) => {
    const lead = leads[followUp.lead_id];
    if (lead) {
      setSelectedLead(lead);
      setDialogOpen(true);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredFollowUps = followUps.filter(followUp => {
    const matchesFollowedBy = followedByFilter 
      ? followUp.followed_by.includes(followedByFilter)
      : true;

    const followUpDate = new Date(followUp.date);
    const matchesStartDate = startDate 
      ? followUpDate >= new Date(startDate)
      : true;
    const matchesEndDate = endDate
      ? followUpDate <= new Date(endDate)
      : true;

    return matchesFollowedBy && matchesStartDate && matchesEndDate;
  });

  if (loading) {
    return <Typography>Loading follow-ups...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Follow-ups</Typography>
      
      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Followed By</InputLabel>
            <Select
              value={followedByFilter}
              label="Followed By"
              onChange={(e) => setFollowedByFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              {uniqueFollowedByNames.map((name) => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Brand Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Order Status</TableCell>
              <TableCell>Followed By</TableCell>
              <TableCell>Memo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredFollowUps
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((followUp) => (
                <TableRow 
                  key={followUp.id}
                  onClick={() => handleRowClick(followUp)}
                  sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
                >
                  <TableCell>{new Date(followUp.date).toLocaleDateString()}</TableCell>
                  <TableCell>{leads[followUp.lead_id]?.brand_name || 'Unknown'}</TableCell>
                  <TableCell>
                    <Chip
                      label={followUp.status}
                      color={getStatusColor(followUp.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={leads[followUp.lead_id]?.lead_status || 'N/A'}
                      color={leads[followUp.lead_id]?.lead_status === 'SUCCESS' ? 'success' : 
                             leads[followUp.lead_id]?.lead_status === 'CURRENT' ? 'warning' : 
                             leads[followUp.lead_id]?.lead_status === 'CLOSED' ? 'error' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                      {followUp.followed_by.map((name) => (
                        <Chip key={name} label={name} size="small" />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>{followUp.memo}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredFollowUps.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            '.MuiTablePagination-select': {
              paddingRight: '32px'
            },
            '.MuiTablePagination-selectLabel': {
              margin: 0
            },
            '.MuiTablePagination-displayedRows': {
              margin: 0
            }
          }}
        />
      </TableContainer>

      {selectedLead && (
        <FollowUpsDialog
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            setSelectedLead(null);
          }}
          lead={selectedLead}
        />
      )}
    </Box>
  );
};

export default FollowUpsTable; 
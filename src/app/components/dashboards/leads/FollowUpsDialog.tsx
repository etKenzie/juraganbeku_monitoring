"use client";
import { FollowUp, FollowUpStatus, Lead } from "@/app/types/leads";
import { supabase } from "@/lib/supabaseClient";
import { Delete as DeleteIcon, Edit as EditIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
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
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

interface FollowUpsDialogProps {
  open: boolean;
  onClose: () => void;
  lead: Lead;
}

const followUpStatuses: FollowUpStatus[] = [
  "tersambung",
  "tersambung via WA",
  "tersambung via LinkedIn",
  "Tidak Dijawab",
  "Tidak Aktif",
  "Tersambung via DM"
];

const foundByOptions = ['HARITZ', 'ZAHRO', 'MARDI', 'ADRIL', 'KENZIE'];

const FollowUpsDialog = ({ open, onClose, lead }: FollowUpsDialogProps) => {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [newFollowUp, setNewFollowUp] = useState<Omit<FollowUp, 'id' | 'lead_id' | 'created_at' | 'updated_at'>>({
    date: new Date().toISOString().split('T')[0],
    status: "tersambung",
    memo: "",
    followed_by: []
  });
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null);

  const fetchFollowUps = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('follow_ups')
        .select('*')
        .eq('lead_id', lead.id)
        .order('date', { ascending: false });

      if (error) throw error;
      setFollowUps(data || []);
    } catch (err) {
      console.error('Error fetching follow-ups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchFollowUps();
    }
  }, [open, lead.id]);

  const handleAddFollowUp = async () => {
    try {
      const { error } = await supabase
        .from('follow_ups')
        .insert([{
          ...newFollowUp,
          lead_id: lead.id
        }]);

      if (error) throw error;

      // Refresh follow-ups
      const { data, error: fetchError } = await supabase
        .from('follow_ups')
        .select('*')
        .eq('lead_id', lead.id)
        .order('date', { ascending: false });

      if (fetchError) throw fetchError;
      setFollowUps(data || []);
      setNewFollowUp({
        date: new Date().toISOString().split('T')[0],
        status: "tersambung",
        memo: "",
        followed_by: []
      });
    } catch (err) {
      console.error('Error adding follow-up:', err);
    }
  };

  const handleDeleteFollowUp = async (followUpId: number) => {
    try {
      const { error } = await supabase
        .from('follow_ups')
        .delete()
        .eq('id', followUpId);

      if (error) throw error;
      fetchFollowUps();
    } catch (error) {
      console.error('Error deleting follow-up:', error);
    }
  };

  const handleEditFollowUp = async () => {
    if (!editingFollowUp) return;

    try {
      const { error } = await supabase
        .from('follow_ups')
        .update({
          date: editingFollowUp.date,
          status: editingFollowUp.status,
          memo: editingFollowUp.memo,
        })
        .eq('id', editingFollowUp.id);

      if (error) throw error;
      setEditingFollowUp(null);
      fetchFollowUps();
    } catch (error) {
      console.error('Error updating follow-up:', error);
    }
  };

  const handleDeleteLead = async () => {
    try {
      // First delete all follow-ups for this lead
      const { error: followUpsError } = await supabase
        .from('follow_ups')
        .delete()
        .eq('lead_id', lead.id);

      if (followUpsError) throw followUpsError;

      // Then delete the lead
      const { error: leadError } = await supabase
        .from('leads')
        .delete()
        .eq('id', lead.id);

      if (leadError) throw leadError;

      onClose();
    } catch (error) {
      console.error('Error deleting lead and follow-ups:', error);
    }
  };

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

  const handleCheckboxChange = (field: 'followed_by', value: string) => {
    if (editingFollowUp) {
      const currentValues = editingFollowUp[field] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      setEditingFollowUp({ ...editingFollowUp, [field]: newValues });
    } else {
      const currentValues = newFollowUp[field] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      setNewFollowUp({ ...newFollowUp, [field]: newValues });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">Lead Details</Typography>
            <Typography variant="subtitle1">{lead.brand_name}</Typography>
          </Box>
          {/* <Button
            variant="contained"
            color="error"
            onClick={handleDeleteLead}
            startIcon={<DeleteIcon />}
          >
            Delete Lead
          </Button> */}
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>Lead Information</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography><strong>Brand Name:</strong> {lead.brand_name}</Typography>
              <Typography><strong>Company Name:</strong> {lead.company_name}</Typography>
              <Typography><strong>Contact Person:</strong> {lead.contact_person}</Typography>
              <Typography><strong>Phone:</strong> {lead.phone}</Typography>
              <Typography><strong>Area:</strong> {lead.area}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography><strong>Source:</strong> {lead.source}</Typography>
              <Typography><strong>Category:</strong> {lead.lead_category}</Typography>
              <Typography><strong>Branch Count:</strong> {lead.branch_count}</Typography>
              <Typography><strong>Services:</strong> {lead.service.join(', ')}</Typography>
              <Typography><strong>Outlet Types:</strong> {lead.outlet_type.join(', ')}</Typography>
              <Typography><strong>Found By:</strong> {lead.found_by.join(', ')}</Typography>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            {editingFollowUp ? 'Edit Follow-up' : 'Add New Follow-up'}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Date"
              type="date"
              value={editingFollowUp ? editingFollowUp.date : newFollowUp.date}
              onChange={(e) => {
                if (editingFollowUp) {
                  setEditingFollowUp({ ...editingFollowUp, date: e.target.value });
                } else {
                  setNewFollowUp({ ...newFollowUp, date: e.target.value });
                }
              }}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={editingFollowUp ? editingFollowUp.status : newFollowUp.status}
                label="Status"
                onChange={(e) => {
                  if (editingFollowUp) {
                    setEditingFollowUp({ ...editingFollowUp, status: e.target.value as FollowUpStatus });
                  } else {
                    setNewFollowUp({ ...newFollowUp, status: e.target.value as FollowUpStatus });
                  }
                }}
              >
                {followUpStatuses.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl component="fieldset">
              <FormLabel component="legend">Followed By</FormLabel>
              <FormGroup>
                {foundByOptions.map(name => (
                  <FormControlLabel
                    key={name}
                    control={
                      <Checkbox
                        checked={(editingFollowUp ? editingFollowUp.followed_by : newFollowUp.followed_by).includes(name)}
                        onChange={() => handleCheckboxChange('followed_by', name)}
                      />
                    }
                    label={name}
                  />
                ))}
              </FormGroup>
            </FormControl>
            <TextField
              label="Memo"
              value={editingFollowUp ? editingFollowUp.memo : newFollowUp.memo}
              onChange={(e) => {
                if (editingFollowUp) {
                  setEditingFollowUp({ ...editingFollowUp, memo: e.target.value });
                } else {
                  setNewFollowUp({ ...newFollowUp, memo: e.target.value });
                }
              }}
              multiline
              rows={3}
              fullWidth
            />
            {editingFollowUp ? (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleEditFollowUp}
                >
                  Save Changes
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setEditingFollowUp(null)}
                >
                  Cancel
                </Button>
              </Box>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleAddFollowUp}
              >
                Add Follow-up
              </Button>
            )}
          </Box>
        </Box>

        <Typography variant="h6" gutterBottom>Follow-up History</Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Followed By</TableCell>
                <TableCell>Memo</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {followUps.map((followUp) => (
                <TableRow key={followUp.id}>
                  <TableCell>{new Date(followUp.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={followUp.status}
                      color={getStatusColor(followUp.status)}
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
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => setEditingFollowUp(followUp)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteFollowUp(followUp.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default FollowUpsDialog; 
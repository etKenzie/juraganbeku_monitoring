"use client";
import { supabase } from "@/lib/supabaseClient";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

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
  feedback: string;
  found_by: string;
}

interface AddLeadDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd?: (lead: Lead | Omit<Lead, 'id'>) => void;
  initialData?: Lead;
}

const leadCategories = ['BELUM', 'HOT', 'WARM', 'COLD'];
const foundByOptions = ['HARITZ', 'ZAHRO', 'MARDI', 'ADRIL', 'KENZIE'];

const AddLeadDialog = ({ open, onClose, onAdd, initialData }: AddLeadDialogProps) => {
  const [lead, setLead] = useState<Omit<Lead, 'id'>>({
    company_name: '',
    contact_person: '',
    phone: '',
    area: '',
    category: '',
    branch_count: 0,
    source: '',
    found_by: '',
    date_added: new Date().toISOString().split('T')[0],
    deadline: '',
    feedback: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof Lead, string>>>({});

  const validateForm = () => {
    const newErrors: Partial<Record<keyof Lead, string>> = {};
    
    if (!lead.company_name.trim()) {
      newErrors.company_name = 'Company name is required';
    }
    if (!lead.contact_person.trim()) {
      newErrors.contact_person = 'Contact person is required';
    }
    if (!lead.category) {
      newErrors.category = 'Category is required';
    }
    if (!lead.found_by) {
      newErrors.found_by = 'Found by is required';
    }
    if (!lead.deadline) {
      newErrors.deadline = 'Deadline is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (initialData) {
      const { id, ...leadData } = initialData;
      setLead(leadData);
    } else {
      setLead({
        company_name: '',
        contact_person: '',
        phone: '',
        area: '',
        category: '',
        branch_count: 0,
        source: '',
        found_by: '',
        date_added: new Date().toISOString().split('T')[0],
        deadline: '',
        feedback: '',
      });
    }
  }, [initialData]);

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      if (onAdd) {
        if (initialData) {
          onAdd({ ...lead, id: initialData.id });
        } else {
          onAdd(lead);
        }
      } else {
        const { error } = await supabase
          .from('leads')
          .insert([lead]);

        if (error) throw error;
      }
      onClose();
    } catch (error) {
      console.error('Error saving lead:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {initialData ? 'Edit Lead' : 'Add New Lead'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Company Name *"
            value={lead.company_name}
            onChange={(e) => setLead({ ...lead, company_name: e.target.value })}
            error={!!errors.company_name}
            helperText={errors.company_name}
            fullWidth
          />
          <TextField
            label="Contact Person *"
            value={lead.contact_person}
            onChange={(e) => setLead({ ...lead, contact_person: e.target.value })}
            error={!!errors.contact_person}
            helperText={errors.contact_person}
            fullWidth
          />
          <TextField
            label="Phone Number"
            value={lead.phone}
            onChange={(e) => setLead({ ...lead, phone: e.target.value })}
            fullWidth
          />
          <TextField
            label="Area"
            value={lead.area}
            onChange={(e) => setLead({ ...lead, area: e.target.value })}
            fullWidth
          />
          <FormControl fullWidth error={!!errors.category}>
            <InputLabel>Category *</InputLabel>
            <Select
              value={lead.category}
              label="Category *"
              onChange={(e) => setLead({ ...lead, category: e.target.value })}
            >
              {leadCategories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
            {errors.category && <Typography color="error" variant="caption">{errors.category}</Typography>}
          </FormControl>
          <TextField
            label="Number of Branches"
            type="number"
            value={lead.branch_count}
            onChange={(e) => setLead({ ...lead, branch_count: parseInt(e.target.value) })}
            fullWidth
          />
          <TextField
            label="Lead Source"
            value={lead.source}
            onChange={(e) => setLead({ ...lead, source: e.target.value })}
            fullWidth
          />
          <FormControl fullWidth error={!!errors.found_by}>
            <InputLabel>Found By *</InputLabel>
            <Select
              value={lead.found_by}
              label="Found By *"
              onChange={(e) => setLead({ ...lead, found_by: e.target.value })}
            >
              {foundByOptions.map((name) => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
              ))}
            </Select>
            {errors.found_by && <Typography color="error" variant="caption">{errors.found_by}</Typography>}
          </FormControl>
          <TextField
            label="Deadline *"
            type="date"
            value={lead.deadline}
            onChange={(e) => setLead({ ...lead, deadline: e.target.value })}
            error={!!errors.deadline}
            helperText={errors.deadline}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="Feedback"
            value={lead.feedback}
            onChange={(e) => setLead({ ...lead, feedback: e.target.value })}
            multiline
            rows={3}
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          {initialData ? 'Save Changes' : 'Add Lead'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddLeadDialog; 
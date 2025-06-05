"use client";
import { Lead } from "@/app/types/leads";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material/Select";
import { useEffect, useState } from "react";

interface AddLeadDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (lead: Omit<Lead, 'id'>) => Promise<void>;
  initialData?: Lead;
}

const serviceOptions = ['Cash Pick Up', 'Misteri Shopper', 'Store Monitoring', 'Akumaju'];
const outletTypeOptions = ['outlet', 'bike', 'cloud kitchen'];
const foundByOptions = ['HARITZ', 'ZAHRO', 'MARDI', 'ADRIL', 'KENZIE'];

const leadCategoryOptions = ['Hot', 'Warm', 'Cold'] as const;
const sourceOptions = [
  'LinkedIn',
  'Instagram',
  'Google',
  'Referal',
  'Website Company',
  'A&B Association',
  'Pameran Franchise'
] as const;

const AddLeadDialog = ({ open, onClose, onAdd, initialData }: AddLeadDialogProps) => {
  const [formData, setFormData] = useState<Omit<Lead, 'id'>>(() => ({
    source: initialData?.source || '',
    company_name: initialData?.company_name || '',
    brand_name: initialData?.brand_name || '',
    contact_person: initialData?.contact_person || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    area: initialData?.area || '',
    lead_category: initialData?.lead_category || '',
    branch_count: initialData?.branch_count || 0,
    service: initialData?.service || [],
    outlet_type: initialData?.outlet_type || [],
    priority: initialData?.priority || '1',
    found_by: initialData?.found_by || [],
    memo: initialData?.memo || '',
    date_added: initialData?.date_added || new Date().toISOString().split('T')[0],
    deadline: initialData?.deadline || '',
    lead_status: initialData?.lead_status || 'CURRENT',
    order_status: initialData?.order_status || 'CURRENT'
  }));

  // Reset form data when initialData changes
  useEffect(() => {
    setFormData({
      source: initialData?.source || '',
      company_name: initialData?.company_name || '',
      brand_name: initialData?.brand_name || '',
      contact_person: initialData?.contact_person || '',
      phone: initialData?.phone || '',
      email: initialData?.email || '',
      area: initialData?.area || '',
      lead_category: initialData?.lead_category || '',
      branch_count: initialData?.branch_count || 0,
      service: initialData?.service || [],
      outlet_type: initialData?.outlet_type || [],
      priority: initialData?.priority || '1',
      found_by: initialData?.found_by || [],
      memo: initialData?.memo || '',
      date_added: initialData?.date_added || new Date().toISOString().split('T')[0],
      deadline: initialData?.deadline || '',
      lead_status: initialData?.lead_status || 'CURRENT',
      order_status: initialData?.order_status || 'CURRENT'
    });
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (field: 'service' | 'outlet_type' | 'found_by', value: string) => {
    setFormData(prev => {
      const currentValues = prev[field] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return {
        ...prev,
        [field]: newValues
      };
    });
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value >= 1 && value <= 3) {
      setFormData(prev => ({
        ...prev,
        priority: value.toString()
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure lead_status is set
    const formDataWithStatus = {
      ...formData,
      lead_status: formData.lead_status || 'CURRENT' // Default to CURRENT if not set
    };

    if (initialData) {
      // For editing, include the ID
      onAdd({ ...formDataWithStatus, id: initialData.id } as Lead);
    } else {
      // For new leads, just pass the form data
      onAdd(formDataWithStatus);
    }
  };

  


  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{initialData ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Brand Name"
                name="brand_name"
                value={formData.brand_name}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Company Name"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Person"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Area"
                name="area"
                value={formData.area}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Source</InputLabel>
                <Select
                  label="Source"
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  required
                >
                  {sourceOptions.map(source => (
                    <MenuItem key={source} value={source}>{source}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Lead Category</InputLabel>
                <Select
                  label="Lead Category"
                  name="lead_category"
                  value={formData.lead_category}
                  onChange={handleChange}
                  required
                >
                  {leadCategoryOptions.map(category => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Branch Count"
                name="branch_count"
                type="number"
                value={formData.branch_count}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  label="Priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="1">1</MenuItem>
                  <MenuItem value="2">2</MenuItem>
                  <MenuItem value="3">3</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Services</FormLabel>
                <FormGroup>
                  {serviceOptions.map(service => (
                    <FormControlLabel
                      key={service}
                      control={
                        <Checkbox
                          checked={formData.service.includes(service)}
                          onChange={() => handleCheckboxChange('service', service)}
                        />
                      }
                      label={service}
                    />
                  ))}
                </FormGroup>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Outlet Types</FormLabel>
                <FormGroup>
                  {outletTypeOptions.map(type => (
                    <FormControlLabel
                      key={type}
                      control={
                        <Checkbox
                          checked={formData.outlet_type.includes(type)}
                          onChange={() => handleCheckboxChange('outlet_type', type)}
                        />
                      }
                      label={type}
                    />
                  ))}
                </FormGroup>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Found By</FormLabel>
                <FormGroup>
                  {foundByOptions.map(name => (
                    <FormControlLabel
                      key={name}
                      control={
                        <Checkbox
                          checked={formData.found_by.includes(name)}
                          onChange={() => handleCheckboxChange('found_by', name)}
                        />
                      }
                      label={name}
                    />
                  ))}
                </FormGroup>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Memo"
                name="memo"
                value={formData.memo}
                onChange={handleChange}
                multiline
                rows={4}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date Added"
                name="date_added"
                type="date"
                value={formData.date_added}
                onChange={handleChange}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Deadline"
                name="deadline"
                type="date"
                value={formData.deadline}
                onChange={handleChange}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Lead Status</InputLabel>
                <Select
                  label="Lead Status"
                  name="lead_status"
                  value={formData.lead_status}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="CLOSED">Closed</MenuItem>
                  <MenuItem value="CURRENT">Current</MenuItem>
                  <MenuItem value="SUCCESS">Success</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <DialogActions>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {initialData ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddLeadDialog; 
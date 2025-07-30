"use client";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Typography
} from '@mui/material';
import React, { useState } from 'react';

interface PDFDateSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (selectedDate: string, selectedDueDate: string) => void;
  defaultDate?: string;
  defaultDueDate?: string;
  companyName: string;
  invoiceCount: number;
}

const PDFDateSelectionModal: React.FC<PDFDateSelectionModalProps> = ({
  open,
  onClose,
  onConfirm,
  defaultDate = '',
  defaultDueDate = '',
  companyName,
  invoiceCount
}) => {
  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [selectedDueDate, setSelectedDueDate] = useState(defaultDueDate);

  const handleConfirm = () => {
    if (selectedDate && selectedDueDate) {
      onConfirm(selectedDate, selectedDueDate);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedDate(defaultDate);
    setSelectedDueDate(defaultDueDate);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Generate PDF Invoice
      </DialogTitle>
      <DialogContent>
        <Box mb={2}>
          <Typography variant="body2" color="textSecondary">
            Generate PDF for {companyName} with {invoiceCount} invoice records
          </Typography>
        </Box>
        <Box display="flex" flexDirection="column" gap={2}>
          <TextField
            fullWidth
            type="date"
            label="Invoice Date"
            InputLabelProps={{ shrink: true }}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            required
          />
          <TextField
            fullWidth
            type="date"
            label="Due Date"
            InputLabelProps={{ shrink: true }}
            value={selectedDueDate}
            onChange={(e) => setSelectedDueDate(e.target.value)}
            required
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button 
          onClick={handleConfirm} 
          variant="contained"
          disabled={!selectedDate || !selectedDueDate}
        >
          Generate PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PDFDateSelectionModal; 
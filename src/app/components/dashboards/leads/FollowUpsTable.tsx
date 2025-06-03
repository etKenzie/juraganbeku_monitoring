"use client";
import { FollowUp, Lead } from "@/app/types/leads";
import { supabase } from "@/lib/supabaseClient";
import {
    Box,
    Chip,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
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

  if (loading) {
    return <Typography>Loading follow-ups...</Typography>;
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Follow-ups</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Brand Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Followed By</TableCell>
              <TableCell>Memo</TableCell>
              {/* <TableCell>Actions</TableCell> */}
            </TableRow>
          </TableHead>
          <TableBody>
            {followUps.map((followUp) => (
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
                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                    {followUp.followed_by.map((name) => (
                      <Chip key={name} label={name} size="small" />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>{followUp.memo}</TableCell>
                {/* <TableCell>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.(followUp);
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.(followUp.id);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell> */}
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
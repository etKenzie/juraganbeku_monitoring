"use client";
import PageContainer from "@/app/components/container/PageContainer";
import AddLeadDialog from "@/app/components/dashboards/leads/AddLeadDialog";
import LeadsTable from "@/app/components/dashboards/leads/LeadsTable";
import { Lead } from "@/app/types/leads";
import { supabase } from "@/lib/supabaseClient";
import { Box, Typography } from "@mui/material";
import { useEffect, useState } from "react";

const LeadsPage = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      console.log('Fetching leads from Supabase...');
      
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('date_added', { ascending: false });

      if (error) {
        console.error('Error fetching leads:', error);
        setError(error.message);
        return;
      }

      console.log('Fetched leads:', data);
      setLeads(data || []);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('Initializing leads page...');
    fetchLeads();
  }, []);

  const handleAddLead = async (newLead: Omit<Lead, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert([{
          ...newLead,
          date_added: new Date().toISOString().split('T')[0]
        }]);

      if (error) throw error;
      setOpen(false);
      fetchLeads();
    } catch (err) {
      console.error('Error adding lead:', err);
    }
  };

  const handleEditLead = async (lead: Lead) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update(lead)
        .eq('id', lead.id);
      
      if (error) throw error;
      fetchLeads();
    } catch (err) {
      console.error('Error updating lead:', err);
    }
  };

  const handleDeleteLead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      fetchLeads();
    } catch (err) {
      console.error('Error deleting lead:', err);
    }
  };

  if (loading) {
    return (
      <PageContainer title="Leads Management" description="Manage your leads">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Typography>Loading leads...</Typography>
        </Box>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer title="Leads Management" description="Manage your leads">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Typography color="error">Error: {error}</Typography>
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Leads Management" description="Manage your leads">
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4">Leads</Typography>
          {/* <Button variant="contained" color="primary" onClick={() => setOpen(true)}>
            Add New Lead
          </Button> */}
        </Box>

        <LeadsTable 
          leads={leads} 
          onEdit={handleEditLead}
          onDelete={handleDeleteLead}
        />
        <AddLeadDialog 
          open={open} 
          onClose={() => setOpen(false)} 
          onAdd={handleAddLead} 
        />
      </Box>
    </PageContainer>
  );
};

export default LeadsPage;

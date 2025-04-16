"use client";
import PageContainer from "@/app/components/container/PageContainer";
import AddLeadDialog from "@/app/components/dashboards/leads/AddLeadDialog";
import LeadsTable from "@/app/components/dashboards/leads/LeadsTable";
import { supabase } from "@/lib/supabaseClient";
import { Box, Typography } from "@mui/material";
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
      console.log('Adding new lead:', newLead);
      const { data, error } = await supabase
        .from('leads')
        .insert([newLead]);

      if (error) {
        console.error('Error adding lead:', error);
        setError(error.message);
        return;
      }

      console.log('Successfully added lead:', data);
      setOpen(false);
      fetchLeads();
    } catch (err) {
      console.error('Unexpected error while adding lead:', err);
      setError('An unexpected error occurred while adding the lead');
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

        <LeadsTable leads={leads} />
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

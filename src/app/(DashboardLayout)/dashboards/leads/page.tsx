"use client";
import PageContainer from "@/app/components/container/PageContainer";
import AddLeadDialog from "@/app/components/dashboards/leads/AddLeadDialog";
import FollowUpsTable from "@/app/components/dashboards/leads/FollowUpsTable";
import LeadsTable from "@/app/components/dashboards/leads/LeadsTable";
import MonthlyFollowUpsChart from "@/app/components/dashboards/leads/MonthlyFollowUpsChart";
import MonthlyLeadsChart from "@/app/components/dashboards/leads/MonthlyLeadsChart";
import OrderStatusChart from "@/app/components/dashboards/leads/OrderStatusChart";
import { FollowUp, Lead } from "@/app/types/leads";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Box, Grid, Typography } from "@mui/material";
import { useEffect, useState } from "react";

const LeadsPage = () => {
  const { role } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasAccess = ["leads", "admin"].some(r => role?.includes(r));

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

  const fetchFollowUps = async () => {
    try {
      const { data, error } = await supabase
        .from('follow_ups')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setFollowUps(data || []);
    } catch (err) {
      console.error('Error fetching follow-ups:', err);
    }
  };

  useEffect(() => {
    console.log('Initializing leads page...');
    fetchLeads();
    fetchFollowUps();
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
      {!hasAccess ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="60vh"
        >
          <Typography variant="h5" color="error">
            You don't have access to this page.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          width: '100%',
          overflow: 'hidden'
        }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mb: 3,
            width: '100%'
          }}>
            <Typography variant="h4">Leads</Typography>
          </Box>

          {/* Charts Section */}
          <Grid container spacing={3} sx={{ mb: 3, width: '100%' }}>
            <Grid item xs={12}>
              <OrderStatusChart data={leads} />
            </Grid>
            <Grid item xs={12}>
              <MonthlyLeadsChart data={leads} />
            </Grid>
            <Grid item xs={12}>
              <MonthlyFollowUpsChart data={followUps} />
            </Grid>
          </Grid>

          {/* Table Section */}
          <Box sx={{ 
            flex: 1,
            width: '100%',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            gap: 3
          }}>
            <FollowUpsTable />
            <LeadsTable 
              leads={leads} 
              onEdit={handleEditLead}
              onDelete={handleDeleteLead}
            />
          </Box>

          <AddLeadDialog 
            open={open} 
            onClose={() => setOpen(false)} 
            onAdd={handleAddLead} 
          />
        </Box>
      )}
    </PageContainer>
  );
};

export default LeadsPage;

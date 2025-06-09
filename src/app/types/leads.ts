export type LeadStatus = 'CLOSED' | 'CURRENT' | 'SUCCESS';

export interface Lead {
  id: string;
  brand_name: string;
  company_name: string;
  contact_person: string;
  phone: string;
  email: string;
  area: string;
  source: string;
  lead_category: string;
  lead_status: LeadStatus;
  branch_count: number;
  service: string[];
  outlet_type: string[];
  priority: string;
  found_by: string[];
  memo: string;
  date_added: string;
  deadline: string;
}

export interface FollowUp {
  id: number;
  lead_id: number;
  date: string;
  status: string;
  memo: string;
  followed_by: string[];
  created_at: string;
  updated_at: string;
}

export type FollowUpStatus = 
  | "tersambung" 
  | "tersambung via WA" 
  | "tersambung via LinkedIn" 
  | "Tidak Dijawab" 
  | "Tidak Aktif" 
  | "Tersambung via DM"; 
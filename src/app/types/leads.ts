export type LeadStatus = 'CLOSED' | 'CURRENT' | 'SUCCESS';

export interface Lead {
  id: number;
  source: string;
  company_name: string;
  contact_person: string;
  area: string;
  phone: string;
  email: string;
  lead_category: string;
  branch_count: number;
  deadline: string;
  memo: string;
  date_added: string;
  found_by: string[];
  service: string[];
  outlet_type: string[];
  priority: string;
  brand_name: string;
  lead_status: LeadStatus;
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
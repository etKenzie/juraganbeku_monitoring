import { supabase } from '@/lib/supabaseClient';

export interface InvoiceRecord {
  id?: string;
  start_date: string;
  end_date: string;
  due_date: string;
  date: string;
  company: string;
  invoice_no: string;
  table_data: {
    headers: string[];
    rows: string[][];
  };
  created_at?: string;
  updated_at?: string;
}

export class InvoiceDatabaseService {
  /**
   * Insert a new invoice record into the database
   */
  static async createInvoice(invoiceData: Omit<InvoiceRecord, 'id' | 'created_at' | 'updated_at'>): Promise<InvoiceRecord | null> {
    try {
      console.log('=== Inserting Invoice to Database ===');
      console.log('Invoice Data:', invoiceData);
      
      const { data, error } = await supabase
        .from('invoices')
        .insert([invoiceData])
        .select()
        .single();

      if (error) {
        console.error('Error inserting invoice:', error);
        throw error;
      }

      console.log('Successfully inserted invoice:', data);
      return data;
    } catch (err) {
      console.error('Unexpected error inserting invoice:', err);
      throw err;
    }
  }

  /**
   * Fetch all invoices from the database
   */
  static async fetchInvoices(): Promise<InvoiceRecord[]> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching invoices:', error);
        throw error;
      }

      return data || [];
    } catch (err) {
      console.error('Unexpected error fetching invoices:', err);
      throw err;
    }
  }

  /**
   * Fetch invoices by company
   */
  static async fetchInvoicesByCompany(company: string): Promise<InvoiceRecord[]> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('company', company)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching invoices by company:', error);
        throw error;
      }

      return data || [];
    } catch (err) {
      console.error('Unexpected error fetching invoices by company:', err);
      throw err;
    }
  }

  /**
   * Update an existing invoice record
   */
  static async updateInvoice(id: string, invoiceData: Partial<InvoiceRecord>): Promise<InvoiceRecord | null> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .update(invoiceData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating invoice:', error);
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Unexpected error updating invoice:', err);
      throw err;
    }
  }

  /**
   * Delete an invoice record
   */
  static async deleteInvoice(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting invoice:', error);
        throw error;
      }
    } catch (err) {
      console.error('Unexpected error deleting invoice:', err);
      throw err;
    }
  }

  /**
   * Check for overlapping invoice periods for a specific company
   */
  static async checkOverlappingPeriods(
    company: string, 
    startDate: string, 
    endDate: string, 
    excludeInvoiceId?: string
  ): Promise<InvoiceRecord[]> {
    try {
        let query = supabase
        .from('invoices')
        .select('*')
        .eq('company', company)
        .filter('start_date', 'lte', endDate)
        .filter('end_date', 'gte', startDate);
      

      if (excludeInvoiceId) {
        query = query.neq('id', excludeInvoiceId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error checking overlapping periods:', error);
        throw error;
      }

      return data || [];
    } catch (err) {
      console.error('Unexpected error checking overlapping periods:', err);
      throw err;
    }
  }
} 
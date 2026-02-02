
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { UserInfo, MailingListEntry, DBContractAudit } from '../types';

export type SyncMode = 'cloud' | 'local' | 'error';

class StorageService {
  private mode: SyncMode = isSupabaseConfigured ? 'cloud' : 'local';

  get currentMode(): SyncMode {
    return this.mode;
  }

  /**
   * Saves a new entry to the Creative Database (Mailing List).
   */
  async persistMailingList(entry: MailingListEntry): Promise<boolean> {
    if (this.mode === 'cloud' || isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('creative_database')
          .upsert(entry, { onConflict: 'email' });

        if (error) throw error;
        return true;
      } catch (err: any) {
        console.error("Mailing List Sync Error:", err.message);
        return false;
      }
    }
    return false;
  }

  /**
   * Upserts client info.
   */
  async persistClient(userInfo: UserInfo): Promise<{ id: string; mode: SyncMode }> {
    if (this.mode === 'cloud' || isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('clients')
          .upsert({
            full_name: userInfo.name,
            email: userInfo.email,
            whatsapp: userInfo.whatsapp
          }, { onConflict: 'email' })
          .select()
          .single();

        if (error) throw error;
        this.mode = 'cloud';
        return { id: data.id, mode: 'cloud' };
      } catch (err: any) {
        console.error("Supabase Error:", err.message);
      }
    }

    const clients = JSON.parse(localStorage.getItem('khalwale_clients') || '[]');
    let client = clients.find((c: any) => c.email === userInfo.email);
    
    if (!client) {
      client = {
        id: crypto.randomUUID(),
        full_name: userInfo.name,
        email: userInfo.email,
        whatsapp: userInfo.whatsapp,
        created_at: new Date().toISOString()
      };
      clients.push(client);
      localStorage.setItem('khalwale_clients', JSON.stringify(clients));
    }
    
    return { id: client.id, mode: 'local' };
  }

  /**
   * Saves contract audit.
   */
  async persistAudit(clientId: string, contractName: string, analysis: string): Promise<SyncMode> {
    if (this.mode === 'cloud' || isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('contract_audits')
          .insert({
            client_id: clientId,
            contract_name: contractName,
            analysis_summary: analysis,
            risk_score: 75
          });

        if (error) throw error;
        this.mode = 'cloud';
        return 'cloud';
      } catch (err: any) {
        console.error("Audit Sync Error:", err.message);
      }
    }

    const audits = JSON.parse(localStorage.getItem('khalwale_audits') || '[]');
    audits.push({
      id: crypto.randomUUID(),
      client_id: clientId,
      contract_name: contractName,
      analysis_summary: analysis,
      created_at: new Date().toISOString()
    });
    localStorage.setItem('khalwale_audits', JSON.stringify(audits));
    
    return 'local';
  }

  /**
   * Fetches past audits only if Email AND WhatsApp match the record.
   */
  async fetchAuditsBySecurityPair(email: string, whatsapp: string): Promise<DBContractAudit[]> {
    if (!isSupabaseConfigured) {
      // Local check
      const clients = JSON.parse(localStorage.getItem('khalwale_clients') || '[]');
      const client = clients.find((c: any) => c.email === email && c.whatsapp === whatsapp);
      if (!client) return [];
      
      const audits = JSON.parse(localStorage.getItem('khalwale_audits') || '[]');
      return audits.filter((a: any) => a.client_id === client.id);
    }

    try {
      // Get the client matching both identifiers
      const { data: client, error: clientErr } = await supabase
        .from('clients')
        .select('id')
        .eq('email', email)
        .eq('whatsapp', whatsapp)
        .single();

      if (clientErr || !client) return [];

      // Fetch all audits for that verified ID
      const { data: audits, error: auditErr } = await supabase
        .from('contract_audits')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });

      if (auditErr) throw auditErr;
      return audits || [];
    } catch (err) {
      console.error("Secure Archive Access Denied:", err);
      return [];
    }
  }
}

export const storageService = new StorageService();

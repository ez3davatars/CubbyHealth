import { supabase } from './supabase';

export interface PartnerCompany {
  id: string;
  name: string;
  description: string;
  category: string;
  affiliate_url: string;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
}

export async function getActivePartners(): Promise<PartnerCompany[]> {
  const { data, error } = await supabase
    .from('partner_companies')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching partners:', error);
    return [];
  }

  return data || [];
}

export async function getAllPartners(): Promise<PartnerCompany[]> {
  const { data, error } = await supabase
    .from('partner_companies')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all partners:', error);
    return [];
  }

  return data || [];
}

export async function createPartner(partner: Omit<PartnerCompany, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('partner_companies')
    .insert([partner])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePartner(id: string, updates: Partial<PartnerCompany>) {
  const { data, error } = await supabase
    .from('partner_companies')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePartner(id: string) {
  const { error } = await supabase
    .from('partner_companies')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export function trackAffiliateClick(partnerId: string, affiliateUrl: string) {
  // Open the affiliate URL immediately for the fastest user experience
  window.open(affiliateUrl, '_blank');

  // Track the click asynchronously without blocking
  const clickData = {
    company_id: partnerId,
    user_agent: navigator.userAgent,
    referrer: document.referrer || null,
    session_id: getOrCreateSessionId()
  };

  const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-click`;

  // Use fetch with keepalive to ensure tracking completes even if page unloads
  // This doesn't block the window.open() call above
  fetch(edgeFunctionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify(clickData),
    keepalive: true // Ensures request completes even if page unloads
  }).catch(error => {
    console.error('Failed to track click:', error);
  });
}

function getOrCreateSessionId(): string {
  let sessionId = sessionStorage.getItem('affiliate_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('affiliate_session_id', sessionId);
  }
  return sessionId;
}

export async function getClickStats() {
  const { data, error } = await supabase
    .from('affiliate_clicks')
    .select(`
      company_id,
      clicked_at,
      user_agent,
      referrer,
      ip_address,
      partner_companies!affiliate_clicks_company_id_fkey (
        name
      )
    `)
    .order('clicked_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching click stats:', error);
    return [];
  }

  return data || [];
}

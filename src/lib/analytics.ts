import { supabase } from './supabase';

export interface AnalyticsOverview {
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  totalCommission: number;
  conversionRate: number;
  averageOrderValue: number;
}

export interface PartnerStats {
  partner_id: string;
  partner_name: string;
  clicks: number;
  conversions: number;
  revenue: number;
  commission: number;
  conversion_rate: number;
}

export interface TimeSeriesData {
  date: string;
  clicks: number;
  conversions: number;
  revenue: number;
}

export interface ConversionRecord {
  id: string;
  partner_id: string;
  partner_name?: string;
  conversion_value: number;
  commission_amount: number;
  conversion_type: string;
  status: string;
  converted_at: string;
  notes?: string;
}

export interface ClickRecord {
  id: string;
  partner_id: string;
  partner_name: string;
  clicked_at: string;
  user_agent?: string;
  referer?: string;
  ip_address?: string;
  session_id?: string;
}

export async function getAnalyticsOverview(
  startDate?: string,
  endDate?: string
): Promise<AnalyticsOverview> {
  let clicksQuery = supabase
    .from('affiliate_clicks')
    .select('*', { count: 'exact', head: true });

  let conversionsQuery = supabase
    .from('affiliate_conversions')
    .select('conversion_value, commission_amount, status');

  if (startDate) {
    clicksQuery = clicksQuery.gte('clicked_at', startDate);
    conversionsQuery = conversionsQuery.gte('converted_at', startDate);
  }

  if (endDate) {
    clicksQuery = clicksQuery.lte('clicked_at', endDate);
    conversionsQuery = conversionsQuery.lte('converted_at', endDate);
  }

  const { count: totalClicks } = await clicksQuery;
  const { data: conversions } = await conversionsQuery;

  const confirmedConversions = conversions?.filter(c => c.status === 'confirmed') || [];
  const totalConversions = confirmedConversions.length;
  const totalRevenue = confirmedConversions.reduce((sum, c) => sum + parseFloat(c.conversion_value?.toString() || '0'), 0);
  const totalCommission = confirmedConversions.reduce((sum, c) => sum + parseFloat(c.commission_amount?.toString() || '0'), 0);
  const conversionRate = totalClicks ? (totalConversions / totalClicks) * 100 : 0;
  const averageOrderValue = totalConversions ? totalRevenue / totalConversions : 0;

  return {
    totalClicks: totalClicks || 0,
    totalConversions,
    totalRevenue,
    totalCommission,
    conversionRate,
    averageOrderValue
  };
}

export async function getPartnerStats(
  startDate?: string,
  endDate?: string
): Promise<PartnerStats[]> {
  let clicksQuery = supabase
    .from('affiliate_clicks')
    .select('company_id, partner_companies(name)');

  let conversionsQuery = supabase
    .from('affiliate_conversions')
    .select('company_id, conversion_value, commission_amount, status, partner_companies(name)');

  if (startDate) {
    clicksQuery = clicksQuery.gte('clicked_at', startDate);
    conversionsQuery = conversionsQuery.gte('converted_at', startDate);
  }

  if (endDate) {
    clicksQuery = clicksQuery.lte('clicked_at', endDate);
    conversionsQuery = conversionsQuery.lte('converted_at', endDate);
  }

  const { data: clicks } = await clicksQuery;
  const { data: conversions } = await conversionsQuery;

  const partnerMap = new Map<string, PartnerStats>();

  clicks?.forEach((click: any) => {
    const partnerId = click.company_id;
    if (!partnerMap.has(partnerId)) {
      partnerMap.set(partnerId, {
        partner_id: partnerId,
        partner_name: click.partner_companies?.name || 'Unknown',
        clicks: 0,
        conversions: 0,
        revenue: 0,
        commission: 0,
        conversion_rate: 0
      });
    }
    const stats = partnerMap.get(partnerId)!;
    stats.clicks += 1;
  });

  conversions?.forEach((conversion: any) => {
    if (conversion.status !== 'confirmed') return;

    const partnerId = conversion.company_id;
    if (!partnerMap.has(partnerId)) {
      partnerMap.set(partnerId, {
        partner_id: partnerId,
        partner_name: conversion.partner_companies?.name || 'Unknown',
        clicks: 0,
        conversions: 0,
        revenue: 0,
        commission: 0,
        conversion_rate: 0
      });
    }
    const stats = partnerMap.get(partnerId)!;
    stats.conversions += 1;
    stats.revenue += parseFloat(conversion.conversion_value?.toString() || '0');
    stats.commission += parseFloat(conversion.commission_amount?.toString() || '0');
  });

  const statsArray = Array.from(partnerMap.values());
  statsArray.forEach(stats => {
    stats.conversion_rate = stats.clicks ? (stats.conversions / stats.clicks) * 100 : 0;
  });

  return statsArray.sort((a, b) => b.clicks - a.clicks);
}

export async function getTimeSeriesData(
  days: number = 30
): Promise<TimeSeriesData[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString();

  const { data: clicks } = await supabase
    .from('affiliate_clicks')
    .select('clicked_at')
    .gte('clicked_at', startDateStr)
    .order('clicked_at');

  const { data: conversions } = await supabase
    .from('affiliate_conversions')
    .select('converted_at, conversion_value, status')
    .gte('converted_at', startDateStr)
    .order('converted_at');

  const dateMap = new Map<string, TimeSeriesData>();

  for (let i = 0; i <= days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    const dateStr = date.toISOString().split('T')[0];
    dateMap.set(dateStr, {
      date: dateStr,
      clicks: 0,
      conversions: 0,
      revenue: 0
    });
  }

  clicks?.forEach((click: any) => {
    const dateStr = new Date(click.clicked_at).toISOString().split('T')[0];
    const data = dateMap.get(dateStr);
    if (data) data.clicks += 1;
  });

  conversions?.forEach((conversion: any) => {
    if (conversion.status !== 'confirmed') return;
    const dateStr = new Date(conversion.converted_at).toISOString().split('T')[0];
    const data = dateMap.get(dateStr);
    if (data) {
      data.conversions += 1;
      data.revenue += parseFloat(conversion.conversion_value?.toString() || '0');
    }
  });

  return Array.from(dateMap.values());
}

export async function getRecentConversions(limit: number = 10): Promise<ConversionRecord[]> {
  const { data, error } = await supabase
    .from('affiliate_conversions')
    .select(`
      id,
      company_id,
      conversion_value,
      commission_amount,
      conversion_type,
      status,
      created_at,
      notes,
      partner_companies!affiliate_conversions_company_id_fkey (
        name
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching conversions:', error);
    return [];
  }

  return data.map((conv: any) => ({
    id: conv.id,
    partner_id: conv.company_id,
    partner_name: conv.partner_companies?.name || 'Unknown',
    conversion_value: parseFloat(conv.conversion_value || '0'),
    commission_amount: parseFloat(conv.commission_amount || '0'),
    conversion_type: conv.conversion_type || 'sale',
    status: conv.status,
    converted_at: conv.created_at,
    notes: conv.notes
  }));
}

export async function createConversion(conversion: {
  company_id: string;
  click_id?: string;
  conversion_value: number;
  commission_amount: number;
  conversion_type: string;
  status?: string;
  notes?: string;
}) {
  const { data, error } = await supabase
    .from('affiliate_conversions')
    .insert([{
      ...conversion,
      status: conversion.status || 'confirmed'
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateConversionStatus(
  conversionId: string,
  status: 'pending' | 'confirmed' | 'cancelled'
) {
  const { error } = await supabase
    .from('affiliate_conversions')
    .update({ status })
    .eq('id', conversionId);

  if (error) throw error;
}

export async function getDetailedClicks(
  startDate?: string,
  endDate?: string,
  partnerId?: string
): Promise<ClickRecord[]> {
  let query = supabase
    .from('affiliate_clicks')
    .select(`
      id,
      company_id,
      clicked_at,
      user_agent,
      referer,
      ip_address,
      session_id,
      partner_companies!affiliate_clicks_company_id_fkey (
        name
      )
    `)
    .order('clicked_at', { ascending: false });

  if (startDate) {
    query = query.gte('clicked_at', startDate);
  }

  if (endDate) {
    query = query.lte('clicked_at', endDate);
  }

  if (partnerId) {
    query = query.eq('company_id', partnerId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching clicks:', error);
    return [];
  }

  return data.map((click: any) => ({
    id: click.id,
    partner_id: click.company_id,
    partner_name: click.partner_companies?.name || 'Unknown',
    clicked_at: click.clicked_at,
    user_agent: click.user_agent,
    referer: click.referer,
    ip_address: click.ip_address,
    session_id: click.session_id
  }));
}

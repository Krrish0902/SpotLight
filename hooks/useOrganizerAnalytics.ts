import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface OrganizerAnalyticsState {
  isLoading: boolean;
  error: string | null;
  period: number;
  setPeriod: (p: number) => void;
  selectedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;
  refresh: () => Promise<void>;
  
  salesVelocity: any | null;
  ticketTypeTrend: any[] | null;
  trafficSources: any[] | null;
  activeEventsCount: number;
  totalTickets: number;
}

export function useOrganizerAnalytics(organizerId: string): OrganizerAnalyticsState {
  const [period, setPeriod] = useState<number>(30);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Partial<OrganizerAnalyticsState>>({});

  const fetch = useCallback(async () => {
    if (!organizerId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [velocity, ticketTrend, traffic, generalAnalytics] = await Promise.all([
        supabase.rpc('get_organizer_sales_velocity', { p_organizer_id: organizerId, p_event_id: selectedEventId || null }),
        supabase.rpc('get_organizer_ticket_type_trend', { p_organizer_id: organizerId, p_event_id: selectedEventId || null, p_days: period }),
        supabase.rpc('get_organizer_traffic_sources', { p_organizer_id: organizerId, p_days: period }),
        supabase.rpc('get_organizer_analytics', { p_organizer_id: organizerId })
      ]);

      setData({
        salesVelocity: velocity.data?.[0] ?? null,
        ticketTypeTrend: ticketTrend.data ?? [],
        trafficSources: traffic.data ?? [],
        activeEventsCount: generalAnalytics.data?.[0]?.total_events ?? 0,
        totalTickets: generalAnalytics.data?.[0]?.tickets_sold ?? 0,
      });
    } catch (err: any) {
      setError(err.message ?? 'Failed to load organizer analytics');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [organizerId, selectedEventId, period]);

  // Initial fetch
  useEffect(() => { fetch(); }, [fetch]);

  // Background polling for sales velocity every 60s
  useEffect(() => {
    if (!organizerId) return;
    const interval = setInterval(() => {
      supabase.rpc('get_organizer_sales_velocity', { p_organizer_id: organizerId, p_event_id: selectedEventId || null })
        .then(({ data }) => {
          if (data?.[0]) setData(prev => ({ ...prev, salesVelocity: data[0] }));
        });
    }, 60000);
    return () => clearInterval(interval);
  }, [organizerId, selectedEventId]);

  return {
    isLoading, error, period, setPeriod, 
    selectedEventId, setSelectedEventId,
    refresh: fetch,
    activeEventsCount: 0,
    totalTickets: 0,
    ...(data as any)
  };
}

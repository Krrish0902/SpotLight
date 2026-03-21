import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface AdminAnalyticsState {
  isLoading: boolean;
  error: string | null;
  period: number;
  setPeriod: (p: number) => void;
  refresh: () => Promise<void>;
  
  retention: any[] | null;
  waterfall: any[] | null;
  general: any | null;
}

export function useAdminAnalytics(): AdminAnalyticsState {
  const [period, setPeriod] = useState<number>(30);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Partial<AdminAnalyticsState>>({});

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [retentionRes, waterfallRes, generalRes] = await Promise.all([
        supabase.rpc('get_platform_cohort_retention', { p_weeks: 8 }),
        supabase.rpc('get_platform_revenue_waterfall', { p_days: period }),
        supabase.rpc('get_admin_analytics') // From old basic implementation
      ]);

      setData({
        retention: retentionRes.data ?? [],
        waterfall: waterfallRes.data ?? [],
        general: generalRes.data?.[0] ?? null,
      });
    } catch (err: any) {
      setError(err.message ?? 'Failed to load admin analytics');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => { fetch(); }, [fetch]);

  return {
    isLoading, error, period, setPeriod, refresh: fetch,
    retention: null, waterfall: null, general: null,
    ...(data as any)
  };
}

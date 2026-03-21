import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export type AnalyticsPeriod = 7 | 30 | 60 | 90
export type Period = AnalyticsPeriod

export interface ArtistAnalyticsData {
  reachTrend: any;
  dailyTrend: any[];
  heatmap: any[];
  geo: any[];
  funnel: any[];
  contentPerformance: any[];
  followerReachSplit: any;
  followAttribution: any[];
  repeatViewerRate: any[];
  avgRetentionCurve: any[];
  benchmarks: any;
  audienceDemographics: any[];
  newFollowerDemographics: any[];
  anomalies: any[];
  churnRiskCount: number;
  reviewTrend: any[];
  searchDiscovery: any;
  likeTiming: any[];
  contestPerformance: any[];
}

export function useArtistAnalytics(artistId: string) {
  const [period, setPeriod] = useState<AnalyticsPeriod>(30)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<Partial<ArtistAnalyticsData>>({})

  const fetch = useCallback(async () => {
    if (!artistId) return
    setIsLoading(true); setError(null)
    try {
      const [
        reachTrend, dailyTrend, heatmap, geo, funnel,
        content, followerSplit, followAttr, repeatRate,
        retentionCurve, engBench, convBench,
        audienceDemog, newFollowerDemog, anomalies,
        churnRisk, reviewTrend, searchDiscovery, likeTiming, contestPerf
      ] = await Promise.all([
        supabase.rpc('get_artist_reach_trend',           { p_artist_id: artistId, p_days: period }),
        supabase.rpc('get_artist_daily_trend',           { p_artist_id: artistId, p_days: period }),
        supabase.rpc('get_artist_activity_heatmap',      { p_artist_id: artistId }),
        supabase.rpc('get_artist_geo_breakdown',         { p_artist_id: artistId, p_days: period }),
        supabase.rpc('get_artist_funnel',                { p_artist_id: artistId, p_days: period }),
        supabase.rpc('get_artist_content_performance',   { p_artist_id: artistId }),
        supabase.rpc('get_artist_follower_reach_split',  { p_artist_id: artistId, p_days: period }),
        supabase.rpc('get_artist_follow_attribution',    { p_artist_id: artistId, p_days: period }),
        supabase.rpc('get_artist_repeat_viewer_rate',    { p_artist_id: artistId }),
        supabase.rpc('get_artist_avg_retention_curve',   { p_artist_id: artistId }),
        supabase.rpc('get_artist_benchmark_comparison',  { p_artist_id: artistId, p_metric: 'engagement_rate' }),
        supabase.rpc('get_artist_benchmark_comparison',  { p_artist_id: artistId, p_metric: 'booking_conversion_rate' }),
        supabase.rpc('get_artist_audience_demographics', { p_artist_id: artistId }),
        supabase.rpc('get_artist_new_follower_demographics', { p_artist_id: artistId, p_days: period }),
        supabase.rpc('get_artist_anomalies',             { p_artist_id: artistId }),
        supabase.rpc('get_artist_churn_risk_count',      { p_artist_id: artistId }),
        supabase.rpc('get_artist_review_trend',          { p_artist_id: artistId }),
        supabase.rpc('get_artist_search_discovery',      { p_artist_id: artistId, p_days: period }),
        supabase.rpc('get_artist_like_timing',           { p_artist_id: artistId }),
        supabase.rpc('get_artist_contest_performance',   { p_artist_id: artistId }),
      ])
      setData({
        reachTrend: reachTrend.data?.[0] ?? null,
        dailyTrend: dailyTrend.data ?? [],
        heatmap: heatmap.data ?? [],
        geo: geo.data ?? [],
        funnel: funnel.data ?? [],
        contentPerformance: content.data ?? [],
        followerReachSplit: followerSplit.data?.[0] ?? null,
        followAttribution: followAttr.data ?? [],
        repeatViewerRate: repeatRate.data ?? [],
        avgRetentionCurve: retentionCurve.data ?? [],
        benchmarks: {
          engagement_rate: engBench.data?.[0] ?? null,
          booking_conversion_rate: convBench.data?.[0] ?? null,
        },
        audienceDemographics: audienceDemog.data ?? [],
        newFollowerDemographics: newFollowerDemog.data ?? [],
        anomalies: anomalies.data ?? [],
        churnRiskCount: churnRisk.data?.[0]?.at_risk_count ?? 0,
        reviewTrend: reviewTrend.data ?? [],
        searchDiscovery: searchDiscovery.data?.[0] ?? null,
        likeTiming: likeTiming.data ?? [],
        contestPerformance: contestPerf.data ?? [],
      })
    } catch (e: any) {
      setError(e.message)
    } finally {
      setIsLoading(false)
    }
  }, [artistId, period])

  useEffect(() => { fetch() }, [fetch])

  return { isLoading, error, period, setPeriod, refresh: fetch, ...(data as ArtistAnalyticsData) }
}

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabase';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import { Users, DollarSign, Calendar, TrendingUp, ArrowUpRight, ArrowDownRight, RefreshCw, AlertCircle, Activity } from 'lucide-react';

const PERIOD_OPTIONS = [
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
];

const ROLE_COLORS = ['#818CF8', '#34D399', '#60A5FA', '#FBBF24'];

const TOOLTIP_STYLE = {
  backgroundColor: '#0D1117',
  borderColor: 'rgba(255,255,255,0.08)',
  color: '#fff',
  borderRadius: 10,
  fontSize: 12,
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
};

export default function Analytics() {
  const [data, setData] = useState<any>(null);
  const [retentionData, setRetentionData] = useState<any[]>([]);
  const [waterfallData, setWaterfallData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState(30);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [generalRes, retentionRes, waterfallRes] = await Promise.all([
        supabase.rpc('get_admin_analytics'),
        supabase.rpc('get_platform_cohort_retention', { p_weeks: 8 }),
        supabase.rpc('get_platform_revenue_waterfall', { p_days: period })
      ]);
      if (generalRes.error) throw generalRes.error;
      setData(generalRes.data?.[0]);
      setRetentionData(retentionRes.data || []);
      setWaterfallData(waterfallRes.data || []);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message ?? 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalytics(); }, [period]);

  const roleData = useMemo(() => {
    if (!data?.role_counts) return [];
    return Object.entries(data.role_counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));
  }, [data?.role_counts]);

  const activityData = useMemo(() => {
    if (!data?.daily_activity) return [];
    return data.daily_activity.map((item: any) => ({
      date: new Date(item.date).toLocaleDateString(undefined, { weekday: 'short' }),
      views: item.views
    }));
  }, [data?.daily_activity]);

  const weeklySignupsData = useMemo(() => {
    if (!data?.weekly_signups) return [];
    return data.weekly_signups.map((item: any) => ({
      week: new Date(item.week).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      artists: item.artists ?? 0,
      organizers: item.organizers ?? 0,
      fans: item.fans ?? 0,
    }));
  }, [data?.weekly_signups]);

  const cohortsMap = useMemo(() => {
    const map = new Map<string, number[]>();
    retentionData.forEach(d => {
      const key = d.cohort_week;
      if (!map.has(key)) map.set(key, Array(8).fill(0));
      const arr = map.get(key)!;
      if (d.week_number >= 0 && d.week_number <= 7) arr[d.week_number] = Number(d.retained_pct);
    });
    return map;
  }, [retentionData]);
  const sortedCohorts = Array.from(cohortsMap.keys()).sort((a, b) => b.localeCompare(a));

  const latestViews = activityData[activityData.length - 1]?.views ?? 0;
  const prevViews = activityData[activityData.length - 2]?.views ?? 0;
  const viewsTrend = prevViews > 0 ? ((latestViews - prevViews) / prevViews) * 100 : null;

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
          <div className="absolute inset-0 rounded-full border-2 border-t-indigo-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        </div>
        <p className="text-white/40 text-sm tracking-wide">Loading platform analytics…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
          <AlertCircle size={32} className="text-rose-400" />
        </div>
        <p className="text-white font-semibold">Failed to load analytics</p>
        <p className="text-white/40 text-sm text-center max-w-sm">{error}</p>
        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all"
        >
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-[0.12em] text-white/30 uppercase mb-1.5">Platform</p>
          <h2 className="text-3xl font-black text-white tracking-tight">Analytics</h2>
          {lastUpdated && (
            <p className="text-xs text-white/25 mt-1.5 flex items-center gap-1.5">
              <Activity size={10} />
              Updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white/[0.04] border border-white/[0.07] rounded-2xl p-1 gap-1">
            {PERIOD_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  period === opt.value
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="p-2.5 text-white/30 hover:text-white hover:bg-white/[0.06] rounded-xl transition-all disabled:opacity-30"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Users"
          value={data?.total_users?.toLocaleString() ?? '—'}
          sub={`${data?.total_artists ?? 0} artists · ${data?.total_organizers ?? 0} organizers`}
          icon={<Users size={18} />}
          accent="#818CF8"
          trend={null}
        />
        <KpiCard
          title="Platform Revenue"
          value={`$${(data?.platform_revenue || 0).toLocaleString()}`}
          icon={<DollarSign size={18} />}
          accent="#34D399"
          trend={null}
        />
        <KpiCard
          title="Active Events"
          value={data?.active_events?.toLocaleString() ?? '—'}
          sub={`${data?.tickets_sold ?? 0} tickets sold`}
          icon={<Calendar size={18} />}
          accent="#60A5FA"
          trend={null}
        />
        <KpiCard
          title="Daily Views"
          value={latestViews?.toLocaleString() ?? '—'}
          trend={viewsTrend}
          icon={<TrendingUp size={18} />}
          accent="#FBBF24"
        />
      </div>

      {/* Activity + Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 hover:border-white/[0.12] transition-colors">
          <SectionHeader title="Platform Activity" sub="Daily video views across the platform" />
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818CF8" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#818CF8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} width={36} />
                <RechartsTooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: '#818CF8' }} cursor={{ stroke: 'rgba(255,255,255,0.08)' }} />
                <Area type="monotone" dataKey="views" stroke="#818CF8" fill="url(#areaGrad)" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#818CF8', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 hover:border-white/[0.12] transition-colors">
          <SectionHeader title="User Distribution" sub="Breakdown by role" />
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={roleData} cx="50%" cy="50%" innerRadius={52} outerRadius={72} paddingAngle={5} dataKey="value" strokeWidth={0}>
                  {roleData.map((_: any, i: number) => (
                    <Cell key={i} fill={ROLE_COLORS[i % ROLE_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-2.5 mt-3">
            {roleData.map((entry: any, i: number) => (
              <div key={entry.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ROLE_COLORS[i % ROLE_COLORS.length] }} />
                  <span className="text-sm text-white/50">{entry.name}</span>
                </div>
                <span className="text-sm font-bold text-white">{Number(entry.value).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Signups */}
      {weeklySignupsData.length > 0 && (
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 hover:border-white/[0.12] transition-colors">
          <SectionHeader title="Weekly User Growth" sub="New signups per week by role" />
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklySignupsData} barGap={3} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="week" stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} width={32} />
                <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', paddingTop: 12 }} />
                <Bar dataKey="artists" name="Artists" fill="#818CF8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="organizers" name="Organizers" fill="#60A5FA" radius={[4, 4, 0, 0]} />
                <Bar dataKey="fans" name="Fans" fill="#34D399" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Retention + Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Cohort Retention */}
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 overflow-x-auto hover:border-white/[0.12] transition-colors">
          <SectionHeader title="Cohort Retention" sub="% of users active N weeks after signup" />
          <div className="min-w-[500px]">
            <div className="flex mb-3 text-[10px] font-bold tracking-wide text-white/25 uppercase">
              <div className="w-20 shrink-0">Cohort</div>
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="flex-1 text-center">W{i}</div>
              ))}
            </div>
            {sortedCohorts.length === 0 ? (
              <p className="text-white/20 text-sm py-6 text-center">No retention data yet.</p>
            ) : (
              <div className="space-y-1.5">
                {sortedCohorts.map(key => {
                  const arr = cohortsMap.get(key)!;
                  return (
                    <div key={key} className="flex items-center gap-0">
                      <div className="w-20 shrink-0 text-[11px] font-medium text-white/35">
                        {new Date(key).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                      {arr.map((val, idx) => {
                        const i = Math.max(0.05, val / 100);
                        // gradient: indigo → violet → magenta
                        const r = Math.round(99 + (236 - 99) * i);
                        const g = Math.round(102 + (72 - 102) * i);
                        const b = Math.round(241 + (153 - 241) * i);
                        return (
                          <div
                            key={idx}
                            className="flex-1 h-8 mx-px rounded flex items-center justify-center text-[10px] font-bold transition-all"
                            style={{
                              backgroundColor: `rgba(${r},${g},${b},${Math.max(0.08, i * 0.9)})`,
                              color: val > 30 ? '#fff' : 'rgba(255,255,255,0.3)'
                            }}
                          >
                            {val > 0 ? `${val.toFixed(0)}%` : '—'}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Revenue Waterfall */}
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 hover:border-white/[0.12] transition-colors">
          <SectionHeader title="Revenue Breakdown" sub={`Last ${period} days`} />
          {waterfallData.length === 0 ? (
            <p className="text-white/20 text-sm py-6 text-center">No revenue data yet.</p>
          ) : (
            <div className="space-y-4 mt-2">
              {waterfallData.map((item, idx) => {
                const isNeg = item.amount_cents < 0;
                const isTotal = item.category === 'Net revenue' || item.category === 'Gross ticket sales';
                const money = `$${(Math.abs(item.amount_cents) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
                const barPct = waterfallData[0]?.amount_cents
                  ? Math.min(100, (Math.abs(item.amount_cents) / waterfallData[0].amount_cents) * 100)
                  : 0;
                return (
                  <div key={idx} className={isTotal ? 'pt-4 border-t border-white/[0.06]' : ''}>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-sm ${isTotal ? 'font-bold text-white' : 'text-white/50'}`}>{item.category}</span>
                      <span className={`text-sm font-bold tabular-nums ${
                        item.category === 'Net revenue' ? 'text-emerald-400' : isNeg ? 'text-rose-400' : 'text-white/80'
                      }`}>
                        {isNeg ? '−' : ''}{money}
                      </span>
                    </div>
                    {!isTotal && (
                      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${barPct}%`,
                            background: isNeg
                              ? 'linear-gradient(90deg,#f43f5e,#fb7185)'
                              : 'linear-gradient(90deg,#6366f1,#818cf8)',
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-bold text-white tracking-tight">{title}</h3>
      {sub && <p className="text-xs text-white/30 mt-0.5">{sub}</p>}
    </div>
  );
}

function KpiCard({ title, value, sub, trend, icon, accent }: {
  title: string;
  value: string | number;
  sub?: string;
  trend?: number | null;
  icon: React.ReactNode;
  accent: string;
}) {
  const hasTrend = trend != null;
  const isUp = (trend ?? 0) >= 0;

  return (
    <div
      className="relative bg-white/[0.03] border rounded-2xl p-5 hover:bg-white/[0.05] transition-all overflow-hidden group"
      style={{ borderColor: `${accent}22` }}
    >
      {/* Colored top accent strip */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
        style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
      />

      <div className="flex items-start justify-between mb-4">
        <div className="p-2 rounded-xl" style={{ backgroundColor: `${accent}18`, color: accent }}>
          {icon}
        </div>
        {hasTrend && (
          <div className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
            isUp
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}>
            {isUp ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
            {Math.abs(trend!).toFixed(1)}%
          </div>
        )}
      </div>

      <p className="text-[10px] font-bold tracking-[0.08em] text-white/35 uppercase mb-2">{title}</p>
      <p
        className="text-3xl font-black tracking-tight leading-none"
        style={{
          color: '#fff',
          textShadow: `0 0 24px ${accent}50`,
        }}
      >
        {value}
      </p>
      {sub && <p className="text-[11px] text-white/25 mt-2 leading-relaxed">{sub}</p>}
    </div>
  );
}

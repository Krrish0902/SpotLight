import { supabase } from './supabase';

function moderationRowTime(row: { created_at?: string; resolved_at?: string }): number {
  const c = new Date(row.created_at || 0).getTime();
  const r = row.resolved_at ? new Date(row.resolved_at).getTime() : 0;
  return Math.max(c, r);
}

/** Per-target latest moderation action by max(created_at, resolved_at). */
function latestModerationActionByTarget(
  rows: Array<{
    target_id?: string;
    resolution_action?: string;
    created_at?: string;
    resolved_at?: string;
  }>
): Map<string, string> {
  const best = new Map<string, { action: string; t: number }>();
  (rows || []).forEach((row) => {
    const id = String(row.target_id || '');
    if (!id) return;
    const t = moderationRowTime(row);
    const cur = best.get(id);
    if (!cur || t > cur.t) best.set(id, { action: String(row.resolution_action || ''), t });
  });
  const out = new Map<string, string>();
  best.forEach((v, k) => out.set(k, v.action));
  return out;
}

/**
 * SECURITY DEFINER RPC when deployed (see supabase/migrations). Returns null if the function is missing or errors.
 * Empty Map = RPC succeeded but no matching user rows.
 */
async function fetchStatusesFromRpc(userIds: string[]): Promise<Map<string, string> | null> {
  if (userIds.length === 0) return new Map();
  const { data, error } = await supabase.rpc('get_public_user_statuses', {
    p_user_ids: userIds,
  });
  if (error) {
    console.warn('[suspension] get_public_user_statuses:', error.message);
    return null;
  }
  const m = new Map<string, string>();
  (data as Array<{ user_id: string; account_status: string }> | null)?.forEach((row) => {
    if (row.user_id) m.set(row.user_id, row.account_status || 'active');
  });
  return m;
}

function normStatus(st: string | undefined): string | undefined {
  if (st === undefined || st === null) return undefined;
  const s = String(st).trim().toLowerCase();
  return s === '' ? undefined : s;
}

/**
 * Who should be treated as suspended in the app.
 * - users.status === 'active' => never suspended (wins over old report rows).
 * - users.status === 'suspended' => suspended.
 * - no visible users row => fall back to latest moderation action only.
 */
export async function getSuspendedUserIds(candidateIds: string[]): Promise<Set<string>> {
  const ids = [...new Set(candidateIds.filter(Boolean))];
  if (ids.length === 0) return new Set();

  const [rpcStatusById, { data: usersRows }, { data: modRows }] = await Promise.all([
    fetchStatusesFromRpc(ids),
    supabase.from('users').select('user_id, status').in('user_id', ids),
    supabase
      .from('reports')
      .select('target_id, resolution_action, created_at, resolved_at')
      .eq('report_type', 'profile')
      .eq('status', 'resolved')
      .in('resolution_action', ['suspend_account', 'unsuspend_account'])
      .in('target_id', ids),
  ]);

  const statusById = new Map<string, string | undefined>();
  if (rpcStatusById !== null) {
    rpcStatusById.forEach((st, uid) => statusById.set(uid, st));
  }
  (usersRows || []).forEach((u: any) => {
    if (!statusById.has(u.user_id)) {
      statusById.set(u.user_id, u.status ?? undefined);
    }
  });

  const latestAction = latestModerationActionByTarget(modRows || []);

  const suspended = new Set<string>();
  for (const id of ids) {
    const st = normStatus(statusById.get(id));
    if (st === 'active') continue;
    if (st === 'suspended') {
      suspended.add(id);
      continue;
    }
    if (latestAction.get(id) === 'suspend_account') {
      suspended.add(id);
    }
  }
  return suspended;
}

export async function isUserEffectivelySuspended(userId: string): Promise<boolean> {
  if (!userId) return false;
  const s = await getSuspendedUserIds([userId]);
  return s.has(userId);
}

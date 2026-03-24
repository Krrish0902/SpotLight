import { useEffect, useState } from 'react'
import { LogOut, CalendarDays, MapPin, Ticket } from 'lucide-react'
import { supabase } from '../supabase'

export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

interface Event {
  event_id: string
  organizer_id: string
  title: string
  description: string | null
  poster_url: string | null
  event_date: string
  location_name: string | null
  city: string | null
  ticket_price: number | null
  total_tickets: number | null
  available_tickets: number | null
  approval_status: ApprovalStatus
  is_deleted: boolean
  created_at: string
}

interface Props {
  onLogout: () => Promise<void>
}

export default function Events({ onLogout }: Props) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const q = supabase
        .from('events')
        .select('event_id, organizer_id, title, description, poster_url, event_date, location_name, city, ticket_price, total_tickets, available_tickets, approval_status, is_deleted, created_at')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

      const { data, error } = await q
      if (error) throw error
      setEvents(data ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const updateStatus = async (eventId: string, status: ApprovalStatus) => {
    setUpdating(eventId)
    try {
      const { error } = await supabase
        .from('events')
        .update({ approval_status: status })
        .eq('event_id', eventId)
      if (error) throw error
      setEvents((prev) =>
        prev.map((e) => (e.event_id === eventId ? { ...e, approval_status: status } : e))
      )
    } catch (err) {
      console.error(err)
    } finally {
      setUpdating(null)
    }
  }

  const filtered = events.filter((e) => filter === 'all' || e.approval_status === filter)

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <div style={{ padding: 24, maxWidth: 1020, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Moderation
            </p>
            <h2 style={{ margin: '4px 0 0', color: '#fff', fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em' }}>
              Event Approval Queue
            </h2>
          </div>
          <button
            onClick={onLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 14px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 12,
              color: '#c4c4c8',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
          {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 14px',
                borderRadius: 10,
                border: filter === f ? '1px solid rgba(34,211,238,0.35)' : '1px solid transparent',
                background: filter === f ? 'rgba(34,211,238,0.12)' : 'rgba(255,255,255,0.03)',
                color: filter === f ? '#E6FBFF' : '#8d8d95',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: filter === f ? 500 : 400,
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ color: '#71717a', fontSize: 14 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ color: '#71717a', fontSize: 14 }}>No events found</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((ev) => (
              <div
                key={ev.event_id}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 18,
                  border: '1px solid rgba(255,255,255,0.1)',
                  overflow: 'hidden',
                  display: 'grid',
                  gridTemplateColumns: '100px 1fr auto',
                  gap: 20,
                  alignItems: 'start',
                }}
              >
                <img
                  src={ev.poster_url || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=600&fit=crop'}
                  alt=""
                  style={{ width: 100, height: 140, objectFit: 'cover' }}
                />
                <div style={{ padding: '16px 0' }}>
                  <h3 style={{ margin: '0 0 6px', color: '#fafafa', fontSize: 17, fontWeight: 700 }}>{ev.title}</h3>
                  <p style={{ margin: '0 0 10px', color: '#71717a', fontSize: 13, lineHeight: 1.5 }}>
                    {ev.description || '—'}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12, color: '#71717a' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><CalendarDays size={12} color="#22D3EE" />{new Date(ev.event_date).toLocaleString()}</span>
                    {ev.location_name && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><MapPin size={12} color="#22D3EE" />{ev.location_name}</span>}
                    {ev.city && <span>{ev.city}</span>}
                    {ev.ticket_price != null && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Ticket size={12} color="#22D3EE" />${ev.ticket_price}</span>}
                    {ev.total_tickets != null && <span>{ev.total_tickets} cap</span>}
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: 4,
                        background:
                          ev.approval_status === 'approved'
                            ? 'rgba(34,197,94,0.15)'
                            : ev.approval_status === 'rejected'
                            ? 'rgba(239,68,68,0.15)'
                            : 'rgba(234,179,8,0.12)',
                        color:
                          ev.approval_status === 'approved'
                            ? '#22c55e'
                            : ev.approval_status === 'rejected'
                            ? '#ef4444'
                            : '#eab308',
                        fontWeight: 700,
                        fontSize: 11,
                      }}
                    >
                      {ev.approval_status}
                    </span>
                  </div>
                </div>
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 11, color: '#8f8f98' }}>Change status</span>
                  {(['approved', 'rejected', 'pending'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => updateStatus(ev.event_id, st)}
                      disabled={updating === ev.event_id || ev.approval_status === st}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 10,
                        border: 'none',
                        background:
                          st === 'approved'
                            ? 'rgba(34,197,94,0.15)'
                            : st === 'rejected'
                            ? 'rgba(239,68,68,0.15)'
                            : 'rgba(34,211,238,0.15)',
                        color: st === 'pending' ? '#A5F3FC' : '#fafafa',
                        cursor: updating === ev.event_id || ev.approval_status === st ? 'not-allowed' : 'pointer',
                        opacity: ev.approval_status === st ? 0.5 : 1,
                        fontSize: 12,
                        fontWeight: 700,
                        transition: 'opacity 0.15s',
                      }}
                    >
                      {updating === ev.event_id ? '…' : st}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

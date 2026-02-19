import { useEffect, useState } from 'react'
import { LogOut } from 'lucide-react'
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
    <div style={{ minHeight: '100vh' }}>
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: '1px solid rgba(148,163,184,0.2)',
      }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#f1f5f9' }}>
          Event Moderation
        </h1>
        <button
          onClick={onLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            background: 'transparent',
            border: '1px solid rgba(148,163,184,0.3)',
            borderRadius: 8,
            color: '#94a3b8',
            cursor: 'pointer',
          }}
        >
          <LogOut size={18} />
          Log out
        </button>
      </header>

      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid rgba(148,163,184,0.3)',
                background: filter === f ? 'rgba(168,85,247,0.25)' : 'transparent',
                color: filter === f ? '#c084fc' : '#94a3b8',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ color: '#94a3b8' }}>Loading events…</div>
        ) : filtered.length === 0 ? (
          <div style={{ color: '#94a3b8' }}>No events found</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtered.map((ev) => (
              <div
                key={ev.event_id}
                style={{
                  background: 'rgba(30,41,59,0.6)',
                  borderRadius: 12,
                  border: '1px solid rgba(148,163,184,0.15)',
                  overflow: 'hidden',
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr auto',
                  gap: 20,
                  alignItems: 'start',
                }}
              >
                <img
                  src={ev.poster_url || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=600&fit=crop'}
                  alt=""
                  style={{ width: 120, height: 160, objectFit: 'cover' }}
                />
                <div style={{ padding: '16px 0' }}>
                  <h3 style={{ margin: '0 0 8px', color: '#f1f5f9' }}>{ev.title}</h3>
                  <p style={{ margin: '0 0 8px', color: '#94a3b8', fontSize: 14 }}>
                    {ev.description || '—'}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 14, color: '#cbd5e1' }}>
                    <span>📅 {new Date(ev.event_date).toLocaleString()}</span>
                    {ev.location_name && <span>📍 {ev.location_name}</span>}
                    {ev.city && <span>{ev.city}</span>}
                    {ev.ticket_price != null && <span>${ev.ticket_price}</span>}
                    {ev.total_tickets != null && <span>Cap: {ev.total_tickets}</span>}
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 6,
                        background:
                          ev.approval_status === 'approved'
                            ? 'rgba(34,197,94,0.2)'
                            : ev.approval_status === 'rejected'
                            ? 'rgba(239,68,68,0.2)'
                            : 'rgba(234,179,8,0.2)',
                        color:
                          ev.approval_status === 'approved'
                            ? '#4ade80'
                            : ev.approval_status === 'rejected'
                            ? '#f87171'
                            : '#facc15',
                        fontWeight: 600,
                      }}
                    >
                      {ev.approval_status}
                    </span>
                  </div>
                </div>
                <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Change status</span>
                  {(['approved', 'rejected', 'pending'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => updateStatus(ev.event_id, st)}
                      disabled={updating === ev.event_id || ev.approval_status === st}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: 'none',
                        background:
                          st === 'approved'
                            ? 'rgba(34,197,94,0.3)'
                            : st === 'rejected'
                            ? 'rgba(239,68,68,0.3)'
                            : 'rgba(148,163,184,0.2)',
                        color: '#e2e8f0',
                        cursor: updating === ev.event_id || ev.approval_status === st ? 'not-allowed' : 'pointer',
                        opacity: ev.approval_status === st ? 0.6 : 1,
                        textTransform: 'capitalize',
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

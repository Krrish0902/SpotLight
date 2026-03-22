import { supabase } from './supabase'

let SESSION_ID: string | null = null
export function getSessionId(): string {
  if (!SESSION_ID) SESSION_ID = crypto.randomUUID()
  return SESSION_ID
}

export type AnalyticsSource = 'feed' | 'profile' | 'search' | 'external' | 'share'
export type ContentType = 'video' | 'profile' | 'event' | 'contest'
export type EventType =
  | 'video_view' | 'profile_view' | 'event_view'
  | 'like' | 'save' | 'comment' | 'share' | 'follow'
  | 'booking_request' | 'booking_confirmed'
  | 'contest_view'

export interface TrackEventOptions {
  event_type: EventType
  content_type?: ContentType
  target_user_id?: string
  target_video_id?: string  // videos.video_id
  target_event_id?: string  // events.event_id — USE THIS for event content, not target_video_id
  viewer_id?: string
  source?: AnalyticsSource
  watch_time_seconds?: number
  completion_pct?: number
  retention_buckets?: Record<string, boolean>
  source_video_id?: string  // which video triggered a follow
  like_at_second?: number
}

async function trackEvent(opts: TrackEventOptions): Promise<void> {
  supabase.functions.invoke('track-event', {
    body: { ...opts, session_id: getSessionId() }
  }).catch(() => {})  // fire-and-forget, never crash app
}

// Typed convenience wrappers
export const track = {

  videoView: (p: {
    artistId: string     // profiles.user_id / videos.artist_id
    videoId: string      // videos.video_id
    viewerId?: string
    watchSeconds: number
    completionPct: number
    retentionBuckets: Record<string, boolean>
    source?: AnalyticsSource
  }) => trackEvent({
    event_type: 'video_view', content_type: 'video',
    target_user_id: p.artistId,
    target_video_id: p.videoId,  // videos.video_id
    viewer_id: p.viewerId,
    source: p.source,
    watch_time_seconds: p.watchSeconds,
    completion_pct: p.completionPct,
    retention_buckets: p.retentionBuckets,
  }),

  profileView: (artistId: string, viewerId?: string, source?: AnalyticsSource) =>
    trackEvent({
      event_type: 'profile_view', content_type: 'profile',
      target_user_id: artistId, viewer_id: viewerId, source,
    }),

  eventView: (organizerId: string, eventId: string, viewerId?: string, source?: AnalyticsSource) =>
    trackEvent({
      event_type: 'event_view', content_type: 'event',
      target_user_id: organizerId,
      target_event_id: eventId,  // events.event_id — NOT target_video_id
      viewer_id: viewerId, source,
    }),

  like: (artistId: string, videoId: string, viewerId?: string, atSecond?: number) =>
    trackEvent({
      event_type: 'like', content_type: 'video',
      target_user_id: artistId,
      target_video_id: videoId,  // videos.video_id
      viewer_id: viewerId,
      like_at_second: atSecond,
    }),

  save: (artistId: string, videoId: string, viewerId?: string) =>
    trackEvent({
      event_type: 'save', content_type: 'video',
      target_user_id: artistId,
      target_video_id: videoId,
      source_video_id: videoId,
      viewer_id: viewerId,
    }),

  comment: (artistId: string, videoId: string, viewerId?: string) =>
    trackEvent({
      event_type: 'comment', content_type: 'video',
      target_user_id: artistId,
      target_video_id: videoId,
      viewer_id: viewerId,
    }),

  share: (artistId: string, videoId: string, viewerId?: string) =>
    trackEvent({
      event_type: 'share', content_type: 'video',
      target_user_id: artistId,
      target_video_id: videoId,
      viewer_id: viewerId,
    }),

  follow: (artistId: string, viewerId?: string, sourceVideoId?: string) =>
    trackEvent({
      event_type: 'follow', content_type: 'profile',
      target_user_id: artistId, viewer_id: viewerId,
      source_video_id: sourceVideoId,  // videos.video_id if currently viewing a video
    }),

  bookingRequest: (artistId: string, viewerId?: string) =>
    trackEvent({
      event_type: 'booking_request', content_type: 'profile',
      target_user_id: artistId, viewer_id: viewerId,
    }),

  contestView: (artistId: string, videoId: string, viewerId?: string) =>
    trackEvent({
      event_type: 'contest_view', content_type: 'contest',
      target_user_id: artistId,
      target_video_id: videoId,  // contest_submissions.video_id
      viewer_id: viewerId,
    }),
}

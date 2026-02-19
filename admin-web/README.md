# SpotLight Admin

Admin web app for moderating events. Lists all applied events and lets admins change their approval status (pending / approved / rejected).

## Setup

1. Copy `.env.example` to `.env` and set your Supabase URL and anon key (or use the same `.env` from the main app).
2. Run `npm install`, then `npm run dev`.
3. Log in with a user that has `role = 'admin'` in `public.users`.

## Run

```bash
npm install
npm run dev
```

## Migration

Apply migration `012_events_admin_policies.sql` so admins can read and update events. Organizers and other policies for events should remain as configured.

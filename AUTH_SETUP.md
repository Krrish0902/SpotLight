# Authentication Setup (Spotlight)

This project uses **Supabase** for authentication, matching the `spotlight.yml` tech stack.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In **Settings → API**, copy:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase URL and anon key:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Run the database migrations

In the Supabase dashboard, go to **SQL Editor** and run (in order):

1. `supabase/migrations/001_initial_auth.sql` – creates the `users` table.
2. `supabase/migrations/002_fix_users_rls.sql` – fixes the UPDATE policy (if needed).
3. `supabase/migrations/003_drop_auth_trigger.sql` – avoids 500 on signup (if needed).
4. `supabase/migrations/004_remove_password_hash.sql` – removes `password_hash` from users (if needed).
5. `supabase/migrations/005_create_profiles.sql` – creates the `profiles` table for profile setup.

## 4. Auth settings in Supabase

- **Authentication → Providers**: Enable **Email** (default).
- **Authentication → Email**: For local dev you can disable "Confirm email" if you want immediate sign-in without email verification.

## Auth flow

- **Sign Up**: Email + password → creates Supabase auth user → role set to `public` initially.
- **Role Selection**: User picks Artist or Organizer → role updated in `public.users`.
- **Profile Check**: After role selection, if user has no entry in `profiles` → Profile Setup screen.
- **Profile Setup**: User enters details → saved to `profiles` → dashboard.
- **Login**: Email + password → session restored → role and profile loaded.

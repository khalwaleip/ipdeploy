
# Khalwale & Co Advocates - IP Division App

## Project Setup Checklist

### 1. Mandatory Environment Variables
Ensure these are set in your **AI Studio Secrets** or your deployment environment:

*   **API_KEY**: Your Google Gemini API Key.
*   **SUPABASE_ANON_KEY**: 
    1. Go to **Supabase Dashboard** -> **Project Settings** -> **API**.
    2. Copy the **anon / public** key.
    3. **Verification:** It MUST start with `eyJ`.

### 2. Required Supabase Tables
For the app features (Archive, Mailing List, and Audit) to work, you must create these tables in your Supabase SQL Editor:

```sql
-- 1. Clients Table
create table clients (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  email text unique not null,
  whatsapp text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Contract Audits Table
create table contract_audits (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id) on delete cascade,
  contract_name text not null,
  analysis_summary text not null,
  risk_score integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Creative Database (Mailing List)
create table creative_database (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  email text unique not null,
  niche text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### 3. Edge Functions
If you are using the automated email brief feature:
*   Deploy the `send-brief` function located in `supabase/functions/`.
*   Set the `GMAIL_APP_PASSWORD` secret in your Supabase dashboard (**Settings** -> **Edge Functions**).

---
**Tech Stack:** React 19, Vite, Tailwind CSS, Supabase, Google Gemini 3.

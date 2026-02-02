-- 1. Enable the HTTP extension for webhooks
create extension if not exists "http" with schema "extensions";

-- 2. Create a function to trigger the send-brief edge function
create or replace function public.handle_new_audit_email()
returns trigger as $$
begin
  perform
    net.http_post(
      url := 'https://ucusxqmezxrfmjovkdqk.supabase.co/functions/v1/send-brief',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'email', (select email from clients where id = new.client_id),
        'name', (select full_name from clients where id = new.client_id),
        'caseId', new.id::text,
        'brief', new.analysis_summary
      )
    );
  return new;
end;
$$ language plpgsql security definer;

-- 3. Create the Trigger for Contract Audits
drop trigger if exists on_new_audit on public.contract_audits;
create trigger on_new_audit
  after insert on public.contract_audits
  for each row execute function public.handle_new_audit_email();

-- 4. Create a function for Mailing List Welcome Emails
create or replace function public.handle_welcome_email()
returns trigger as $$
begin
  perform
    net.http_post(
      url := 'https://ucusxqmezxrfmjovkdqk.supabase.co/functions/v1/send-brief',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'email', new.email,
        'name', new.full_name,
        'caseId', 'WELCOME',
        'brief', 'Welcome to the Khalwale & Co IP Division. We have successfully registered your creative profile in our elite database.'
      )
    );
  return new;
end;
$$ language plpgsql security definer;

-- 5. Create the Trigger for Mailing List
drop trigger if exists on_new_signup on public.creative_database;
create trigger on_new_signup
  after insert on public.creative_database
  for each row execute function public.handle_welcome_email();

-- Add column for FCM Token
alter table public.moradores 
add column if not exists fcm_token text;

-- Create index for faster lookups (optional but good)
create index if not exists idx_moradores_fcm_token on public.moradores(fcm_token);

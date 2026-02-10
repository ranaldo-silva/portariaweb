-- Add observacoes column to visitas table
alter table public.visitas 
add column if not exists observacoes text;

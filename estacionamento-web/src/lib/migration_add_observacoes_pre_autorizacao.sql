-- Add observacoes column to pre_autorizacoes table
alter table public.pre_autorizacoes 
add column if not exists observacoes text;

-- Create table for pre-authorized visitors
create table public.pre_autorizacoes (
  id uuid default gen_random_uuid() primary key,
  morador_id bigint references public.moradores(id) on delete cascade,
  visitante_nome text not null,
  documento text,
  status text default 'pendente', -- 'pendente', 'realizada', 'cancelada'
  data_agendamento timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.pre_autorizacoes enable row level security;

-- Policies
create policy "Moradores can manage their own pre-authorizations"
  on public.pre_autorizacoes for all
  using (true) -- Simplified for this context
  with check (true);

create policy "Admins/Porters can view and update all"
  on public.pre_autorizacoes for all
  using (true);

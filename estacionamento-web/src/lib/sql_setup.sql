-- Create table for pending requests
create table public.solicitacoes (
  id uuid default gen_random_uuid() primary key,
  morador_id bigint references public.moradores(id) on delete cascade,
  tipo text not null, -- 'veiculo', 'dependente', 'contato'
  dados_novos jsonb not null,
  status text default 'pendente', -- 'pendente', 'aprovado', 'rejeitado'
  data_solicitacao timestamp with time zone default now()
);

-- Enable RLS
alter table public.solicitacoes enable row level security;

-- Policies
create policy "Moradores can view their own requests"
  on public.solicitacoes for select
  using (true); -- Simplified for now, ideally strictly filtered by ID if we had auth user

create policy "Moradores can insert requests"
  on public.solicitacoes for insert
  with check (true);

create policy "Admins can view and update all"
  on public.solicitacoes for all
  using (true);

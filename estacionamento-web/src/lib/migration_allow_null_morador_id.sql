
-- Migration: Allow nullable morador_id in solicitacoes for new registrations
ALTER TABLE public.solicitacoes ALTER COLUMN morador_id DROP NOT NULL;

-- Optional: Add a check constraint if needed, but for MVP just nullable is fine.
-- We will use 'novo_cadastro' as the 'tipo' for these requests.

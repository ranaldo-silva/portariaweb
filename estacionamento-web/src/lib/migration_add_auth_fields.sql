-- Add CPF and Senha to Moradores for Custom Authentication
ALTER TABLE public.moradores 
ADD COLUMN IF NOT EXISTS cpf text,
ADD COLUMN IF NOT EXISTS senha text;

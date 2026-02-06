-- Migration: Add recipient name to packages
ALTER TABLE encomendas 
ADD COLUMN IF NOT EXISTS destinatario TEXT;

-- Update existing records to have a default value (optional, but good for UI consistency)
UPDATE encomendas 
SET destinatario = 'Titular' 
WHERE destinatario IS NULL;

-- Migration: Add withdrawal details column
ALTER TABLE encomendas 
ADD COLUMN IF NOT EXISTS retirado_por TEXT;

-- Update existing retired packages to have a placeholder if needed
UPDATE encomendas 
SET retirado_por = 'Token/Antigo' 
WHERE status = 'Retirado' AND retirado_por IS NULL;

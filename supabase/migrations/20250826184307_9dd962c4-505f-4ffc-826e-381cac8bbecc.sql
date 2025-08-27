-- Fix API tokens access logging constraint
-- The profile_access_log check constraint needs to include token-related access types

ALTER TABLE profile_access_log 
DROP CONSTRAINT profile_access_log_access_type_check;

ALTER TABLE profile_access_log 
ADD CONSTRAINT profile_access_log_access_type_check 
CHECK (access_type = ANY (ARRAY['view'::text, 'update'::text, 'cpf_view'::text, 'token_created'::text, 'token_updated'::text, 'token_deleted'::text]));
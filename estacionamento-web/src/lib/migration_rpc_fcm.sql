-- Function to securely set the FCM token for a user (bypassing RLS)
create or replace function set_fcm_token(p_user_id bigint, p_token text)
returns void
language plpgsql
security definer
as $$
begin
  update public.moradores
  set fcm_token = p_token
  where id = p_user_id;
end;
$$;

-- Function to securely read the FCM token (bypassing RLS)
create or replace function get_fcm_token(p_user_id bigint)
returns text
language plpgsql
security definer
as $$
declare
  v_token text;
begin
  select fcm_token into v_token
  from public.moradores
  where id = p_user_id;
  
  return v_token;
end;
$$;

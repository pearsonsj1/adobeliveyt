/*
  # Revoke public execute on upsert_video_index

  The upsert_video_index function is SECURITY DEFINER which means anyone
  who can call it gets elevated write access. Revoke execute from anon and
  authenticated — writes now go through an Edge Function that uses the
  service role key internally, so the public RPC endpoint is never needed.
*/

REVOKE EXECUTE ON FUNCTION upsert_video_index(jsonb) FROM anon, authenticated;

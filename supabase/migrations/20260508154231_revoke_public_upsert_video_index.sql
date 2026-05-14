/*
  # Revoke PUBLIC execute on upsert_video_index

  A prior migration revoked execute from the named anon and authenticated
  roles, but Postgres also has a PUBLIC grant on this function (set by
  default when the function was created). The PUBLIC grant covers every
  role, including anon and authenticated, which is why the security scanner
  still flags it. Revoking from PUBLIC closes the gap.

  The function is only ever called by the index-videos Edge Function, which
  authenticates with the service_role key — that grant is retained.
*/

REVOKE EXECUTE ON FUNCTION upsert_video_index(jsonb) FROM PUBLIC;

/*
  # Revoke public EXECUTE on upsert_video_index

  The upsert_video_index function is a SECURITY DEFINER function that should only
  be callable by the service role (used by edge functions), never by anon or
  authenticated users via the REST API.

  ## Changes
  - Revoke EXECUTE on upsert_video_index from anon role
  - Revoke EXECUTE on upsert_video_index from authenticated role
  - Grant EXECUTE only to service_role (already implicit, but made explicit)
*/

REVOKE EXECUTE ON FUNCTION public.upsert_video_index(videos jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.upsert_video_index(videos jsonb) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.upsert_video_index(videos jsonb) FROM public;

GRANT EXECUTE ON FUNCTION public.upsert_video_index(videos jsonb) TO service_role;

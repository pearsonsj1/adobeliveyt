/*
  # Restrict guide_clicks INSERT policy

  Replace the open `WITH CHECK (true)` policy with one that validates
  the inserted data. Since this is anonymous analytics there is no
  user-ownership concept, so we enforce structural constraints instead:
  - node_id must be a non-empty string no longer than 100 characters
  - choice_label must be a non-empty string no longer than 200 characters
  - session_id, destination_url, destination_label are length-capped

  This prevents abuse (spam, injection, oversized payloads) while still
  allowing any visitor to record a legitimate click event.
*/

DROP POLICY IF EXISTS "Anyone can insert guide click events" ON guide_clicks;

CREATE POLICY "Anyone can insert valid guide click events"
  ON guide_clicks FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(node_id) BETWEEN 1 AND 100
    AND char_length(choice_label) BETWEEN 1 AND 200
    AND char_length(coalesce(session_id, '')) <= 100
    AND char_length(coalesce(question, '')) <= 500
    AND char_length(coalesce(destination_url, '')) <= 500
    AND char_length(coalesce(destination_label, '')) <= 200
  );

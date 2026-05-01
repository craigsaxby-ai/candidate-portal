-- CP-6c: CV and qualifications upload support
-- Adds cv_url, cv_filename, and qualification_urls columns to candidate_profiles

ALTER TABLE candidate_profiles
  ADD COLUMN IF NOT EXISTS cv_url TEXT,
  ADD COLUMN IF NOT EXISTS cv_filename TEXT,
  ADD COLUMN IF NOT EXISTS qualification_urls TEXT[] DEFAULT '{}';

-- Storage bucket setup (run separately in Supabase dashboard if not auto-created via API):
-- INSERT INTO storage.buckets (id, name, public)
--   VALUES ('candidate-docs', 'candidate-docs', false)
--   ON CONFLICT DO NOTHING;
--
-- RLS policies for candidate-docs bucket (adjust as needed):
-- CREATE POLICY "Authenticated users can upload their own docs"
--   ON storage.objects FOR INSERT TO authenticated
--   WITH CHECK (bucket_id = 'candidate-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
--
-- CREATE POLICY "Users can view their own docs"
--   ON storage.objects FOR SELECT TO authenticated
--   USING (bucket_id = 'candidate-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
--
-- CREATE POLICY "Users can delete their own docs"
--   ON storage.objects FOR DELETE TO authenticated
--   USING (bucket_id = 'candidate-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

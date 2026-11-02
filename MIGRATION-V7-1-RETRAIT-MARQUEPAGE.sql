-- Facultatif mais nécessaire pour le bouton « Retirer » des lectures en cours.
-- Ne supprime aucun marque-page existant.
ALTER TABLE public.reading_bookmarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Bookmarks own delete" ON public.reading_bookmarks;
CREATE POLICY "Bookmarks own delete" ON public.reading_bookmarks
FOR DELETE TO authenticated USING (user_id = auth.uid());

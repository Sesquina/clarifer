CREATE TABLE IF NOT EXISTS public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (pre-auth form)
GRANT INSERT ON public.waitlist TO anon;
GRANT SELECT ON public.waitlist TO authenticated;

CREATE POLICY "Anyone can submit to waitlist"
ON public.waitlist FOR INSERT TO anon
WITH CHECK (true);

CREATE POLICY "Authenticated can read waitlist"
ON public.waitlist FOR SELECT TO authenticated
USING (true);

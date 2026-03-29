ALTER TABLE public.profiles
  ADD COLUMN discount_earned_at timestamp with time zone DEFAULT NULL,
  ADD COLUMN buffet_earned_at timestamp with time zone DEFAULT NULL;
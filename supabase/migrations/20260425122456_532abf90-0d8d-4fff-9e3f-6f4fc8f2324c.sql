ALTER TABLE public.profiles DISABLE TRIGGER enforce_profile_update;
ALTER TABLE public.profiles DISABLE TRIGGER enforce_profile_update_restrictions;
ALTER TABLE public.profiles DISABLE TRIGGER trg_restrict_profile_update;

UPDATE public.profiles
  SET total_points = total_points + 200
  WHERE user_id = '0884ef99-2414-45ea-a030-f1a1df7f82cb';

ALTER TABLE public.profiles ENABLE TRIGGER enforce_profile_update;
ALTER TABLE public.profiles ENABLE TRIGGER enforce_profile_update_restrictions;
ALTER TABLE public.profiles ENABLE TRIGGER trg_restrict_profile_update;
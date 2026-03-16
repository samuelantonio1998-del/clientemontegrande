
-- 1. Remove the permissive "Users can insert own transactions" policy
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;

-- 2. Remove the permissive "System can insert referrals" policy (handled by SECURITY DEFINER trigger)
DROP POLICY IF EXISTS "System can insert referrals" ON public.referrals;

-- 3. Change profiles INSERT policy from public to authenticated
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 4. Change profiles SELECT policy from public to authenticated
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. Change transactions SELECT policy from public to authenticated
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions"
  ON public.transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

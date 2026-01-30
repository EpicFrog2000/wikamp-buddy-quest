
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view game records" ON public.game_records;

CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view game records"
ON public.game_records
FOR SELECT
USING (auth.uid() IS NOT NULL);

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_points_non_negative 
CHECK (points >= 0);

CREATE OR REPLACE FUNCTION public.purchase_reward_atomic(
  _user_id uuid,
  _reward_id uuid
)
RETURNS TABLE(
  success boolean,
  new_balance integer,
  error_message text,
  reward_effect_type text,
  reward_effect_value integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cost integer;
  v_current_points integer;
  v_new_points integer;
  v_effect_type text;
  v_effect_value integer;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != _user_id THEN
    RETURN QUERY SELECT false, 0, 'Unauthorized'::text, NULL::text, NULL::integer;
    RETURN;
  END IF;

  SELECT r.cost, r.effect_type, r.effect_value, p.points
  INTO v_cost, v_effect_type, v_effect_value, v_current_points
  FROM public.rewards r
  CROSS JOIN public.profiles p
  WHERE r.id = _reward_id AND p.user_id = _user_id
  FOR UPDATE OF p;  
  IF v_cost IS NULL THEN
    RETURN QUERY SELECT false, COALESCE(v_current_points, 0), 'Reward not found'::text, NULL::text, NULL::integer;
    RETURN;
  END IF;
  
  IF v_current_points < v_cost THEN
    RETURN QUERY SELECT false, v_current_points, 'Insufficient points'::text, NULL::text, NULL::integer;
    RETURN;
  END IF;
  
  IF EXISTS (SELECT 1 FROM public.user_rewards WHERE user_id = _user_id AND reward_id = _reward_id) THEN
    RETURN QUERY SELECT false, v_current_points, 'Already purchased'::text, NULL::text, NULL::integer;
    RETURN;
  END IF;
  
  v_new_points := v_current_points - v_cost;
  UPDATE public.profiles SET points = v_new_points WHERE user_id = _user_id;
  
  INSERT INTO public.user_rewards (user_id, reward_id) VALUES (_user_id, _reward_id);
  
  RETURN QUERY SELECT true, v_new_points, 'Success'::text, v_effect_type, COALESCE(v_effect_value, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.purchase_reward_atomic TO authenticated;

CREATE OR REPLACE FUNCTION public.companion_action_atomic(
  _user_id uuid,
  _action text,
  _cost integer
)
RETURNS TABLE(
  success boolean,
  new_balance integer,
  error_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_points integer;
  v_new_points integer;
  v_stat_change integer;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != _user_id THEN
    RETURN QUERY SELECT false, 0, 'Unauthorized'::text;
    RETURN;
  END IF;

  IF _action NOT IN ('feed', 'play', 'rest') THEN
    RETURN QUERY SELECT false, 0, 'Invalid action'::text;
    RETURN;
  END IF;
  
  IF _cost < 0 OR _cost > 100 THEN
    RETURN QUERY SELECT false, 0, 'Invalid cost'::text;
    RETURN;
  END IF;

  SELECT points INTO v_current_points
  FROM public.profiles
  WHERE user_id = _user_id
  FOR UPDATE;
  
  IF v_current_points IS NULL THEN
    RETURN QUERY SELECT false, 0, 'Profile not found'::text;
    RETURN;
  END IF;
  
  IF v_current_points < _cost THEN
    RETURN QUERY SELECT false, v_current_points, 'Insufficient points'::text;
    RETURN;
  END IF;
  
  v_new_points := v_current_points - _cost;
  UPDATE public.profiles SET points = v_new_points WHERE user_id = _user_id;
  
  v_stat_change := 15; 
  IF _action = 'feed' THEN
    UPDATE public.companion_stats 
    SET hunger = LEAST(100, hunger + v_stat_change)
    WHERE user_id = _user_id;
  ELSIF _action = 'play' THEN
    UPDATE public.companion_stats 
    SET happiness = LEAST(100, happiness + v_stat_change)
    WHERE user_id = _user_id;
  ELSIF _action = 'rest' THEN
    UPDATE public.companion_stats 
    SET energy = LEAST(100, energy + v_stat_change)
    WHERE user_id = _user_id;
  END IF;
  
  RETURN QUERY SELECT true, v_new_points, 'Success'::text;
END;
$$;

GRANT EXECUTE ON FUNCTION public.companion_action_atomic TO authenticated;
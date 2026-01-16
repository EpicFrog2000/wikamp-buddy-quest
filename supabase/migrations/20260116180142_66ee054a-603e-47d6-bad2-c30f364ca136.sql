-- Fix Issue 1: PUBLIC_DATA_EXPOSURE
-- Restrict profiles and game_records to authenticated users only

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view game records" ON public.game_records;

-- Create restrictive policies requiring authentication
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view game records"
ON public.game_records
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Fix Issue 2: POINTS_RACE_CONDITION
-- Add constraint to prevent negative points
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_points_non_negative 
CHECK (points >= 0);

-- Create atomic purchase function to prevent race conditions
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
  -- Verify the calling user matches the user_id
  IF auth.uid() IS NULL OR auth.uid() != _user_id THEN
    RETURN QUERY SELECT false, 0, 'Unauthorized'::text, NULL::text, NULL::integer;
    RETURN;
  END IF;

  -- Get reward cost and current points with row lock
  SELECT r.cost, r.effect_type, r.effect_value, p.points
  INTO v_cost, v_effect_type, v_effect_value, v_current_points
  FROM public.rewards r
  CROSS JOIN public.profiles p
  WHERE r.id = _reward_id AND p.user_id = _user_id
  FOR UPDATE OF p;  -- Lock the profile row
  
  -- Check if reward exists
  IF v_cost IS NULL THEN
    RETURN QUERY SELECT false, COALESCE(v_current_points, 0), 'Reward not found'::text, NULL::text, NULL::integer;
    RETURN;
  END IF;
  
  -- Check sufficient balance
  IF v_current_points < v_cost THEN
    RETURN QUERY SELECT false, v_current_points, 'Insufficient points'::text, NULL::text, NULL::integer;
    RETURN;
  END IF;
  
  -- Check if already purchased
  IF EXISTS (SELECT 1 FROM public.user_rewards WHERE user_id = _user_id AND reward_id = _reward_id) THEN
    RETURN QUERY SELECT false, v_current_points, 'Already purchased'::text, NULL::text, NULL::integer;
    RETURN;
  END IF;
  
  -- Atomic update: deduct points
  v_new_points := v_current_points - v_cost;
  UPDATE public.profiles SET points = v_new_points WHERE user_id = _user_id;
  
  -- Insert purchase record
  INSERT INTO public.user_rewards (user_id, reward_id) VALUES (_user_id, _reward_id);
  
  RETURN QUERY SELECT true, v_new_points, 'Success'::text, v_effect_type, COALESCE(v_effect_value, 0);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.purchase_reward_atomic TO authenticated;

-- Create atomic companion action function
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
  -- Verify the calling user matches the user_id
  IF auth.uid() IS NULL OR auth.uid() != _user_id THEN
    RETURN QUERY SELECT false, 0, 'Unauthorized'::text;
    RETURN;
  END IF;

  -- Validate action and cost
  IF _action NOT IN ('feed', 'play', 'rest') THEN
    RETURN QUERY SELECT false, 0, 'Invalid action'::text;
    RETURN;
  END IF;
  
  IF _cost < 0 OR _cost > 100 THEN
    RETURN QUERY SELECT false, 0, 'Invalid cost'::text;
    RETURN;
  END IF;

  -- Get current points with row lock
  SELECT points INTO v_current_points
  FROM public.profiles
  WHERE user_id = _user_id
  FOR UPDATE;
  
  -- Check if profile exists
  IF v_current_points IS NULL THEN
    RETURN QUERY SELECT false, 0, 'Profile not found'::text;
    RETURN;
  END IF;
  
  -- Check sufficient balance
  IF v_current_points < _cost THEN
    RETURN QUERY SELECT false, v_current_points, 'Insufficient points'::text;
    RETURN;
  END IF;
  
  -- Atomic update: deduct points
  v_new_points := v_current_points - _cost;
  UPDATE public.profiles SET points = v_new_points WHERE user_id = _user_id;
  
  -- Update companion stats based on action
  v_stat_change := 15; -- Default stat change
  
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.companion_action_atomic TO authenticated;
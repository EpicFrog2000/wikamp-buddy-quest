-- Fix 1: Update has_role() function to restrict role checking to own user or admins
-- This prevents any authenticated user from enumerating other users' roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_calling_user_id uuid;
  v_is_admin boolean;
BEGIN
  -- Get the calling user's ID
  v_calling_user_id := auth.uid();
  
  -- If called from RLS policy context (no authenticated user), allow the check
  -- This is necessary for RLS policies to function correctly
  IF v_calling_user_id IS NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = _role
    );
  END IF;
  
  -- Allow users to check their own roles
  IF _user_id = v_calling_user_id THEN
    RETURN EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = _role
    );
  END IF;
  
  -- Check if calling user is admin (for checking other users' roles)
  v_is_admin := EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = v_calling_user_id AND role = 'admin'
  );
  
  -- Only admins can check other users' roles
  IF v_is_admin THEN
    RETURN EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = _role
    );
  END IF;
  
  -- Non-admin users cannot check other users' roles
  RETURN false;
END;
$$;

-- Fix 2: Update handle_new_user() function to sanitize user input
-- This prevents injection of malicious content, long strings, and control characters
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_name TEXT;
  v_email_username TEXT;
BEGIN
  -- Extract and validate name
  v_name := TRIM(COALESCE(NEW.raw_user_meta_data->>'name', ''));
  
  -- If empty, use email username as fallback
  IF LENGTH(v_name) = 0 THEN
    v_email_username := SPLIT_PART(NEW.email, '@', 1);
    v_name := COALESCE(NULLIF(v_email_username, ''), 'User');
  END IF;
  
  -- Enforce length limit (100 characters max)
  v_name := LEFT(v_name, 100);
  
  -- Remove control characters (x00-x1F, x7F except space, tab, newline)
  v_name := regexp_replace(v_name, E'[\\x00-\\x08\\x0B-\\x0C\\x0E-\\x1F\\x7F]', '', 'g');
  
  -- Remove potential HTML/script injection patterns (defense in depth)
  v_name := regexp_replace(v_name, '<[^>]*>', '', 'gi');
  
  -- Normalize whitespace (collapse multiple spaces, trim)
  v_name := regexp_replace(v_name, '\s+', ' ', 'g');
  v_name := TRIM(v_name);
  
  -- Final check - ensure not empty after cleaning
  IF LENGTH(v_name) = 0 THEN
    v_name := 'User';
  END IF;

  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, v_name);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  INSERT INTO public.game_records (user_id, game_name, high_score)
  VALUES 
    (NEW.id, 'icyTower', 0),
    (NEW.id, 'cupGame', 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add table-level constraints for defense in depth on profiles
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_name_length CHECK (
  length(name) >= 1 AND length(name) <= 100
);

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_name_no_control_chars CHECK (
  name !~ E'[\\x00-\\x08\\x0B-\\x0C\\x0E-\\x1F\\x7F]'
);
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
  v_calling_user_id := auth.uid();
  
  IF v_calling_user_id IS NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = _role
    );
  END IF;
  
  IF _user_id = v_calling_user_id THEN
    RETURN EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = _role
    );
  END IF;
  
  v_is_admin := EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = v_calling_user_id AND role = 'admin'
  );
  
  IF v_is_admin THEN
    RETURN EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = _role
    );
  END IF;
  
  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_name TEXT;
  v_email_username TEXT;
BEGIN
  v_name := TRIM(COALESCE(NEW.raw_user_meta_data->>'name', ''));
  
  IF LENGTH(v_name) = 0 THEN
    v_email_username := SPLIT_PART(NEW.email, '@', 1);
    v_name := COALESCE(NULLIF(v_email_username, ''), 'User');
  END IF;
  
  v_name := LEFT(v_name, 100);
  
  v_name := regexp_replace(v_name, E'[\\x00-\\x08\\x0B-\\x0C\\x0E-\\x1F\\x7F]', '', 'g');
  
  v_name := regexp_replace(v_name, '<[^>]*>', '', 'gi');
  
  v_name := regexp_replace(v_name, '\s+', ' ', 'g');
  v_name := TRIM(v_name);
  
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

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_name_length CHECK (
  length(name) >= 1 AND length(name) <= 100
);

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_name_no_control_chars CHECK (
  name !~ E'[\\x00-\\x08\\x0B-\\x0C\\x0E-\\x1F\\x7F]'
);
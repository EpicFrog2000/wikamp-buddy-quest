-- Create rewards table
CREATE TABLE public.rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  cost INTEGER NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'boost' CHECK (type IN ('attendance', 'cosmetic', 'boost')),
  effect_type TEXT CHECK (effect_type IN ('points_multiplier', 'companion_happiness', 'companion_hunger', 'companion_energy', 'bonus_points')),
  effect_value INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_rewards table to track purchases
CREATE TABLE public.user_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, reward_id)
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 10,
  category TEXT NOT NULL DEFAULT 'beginner' CHECK (category IN ('beginner', 'intermediate', 'advanced')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_tasks table to track completed tasks
CREATE TABLE public.user_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, task_id)
);

-- Create companion_stats table
CREATE TABLE public.companion_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  happiness INTEGER NOT NULL DEFAULT 80 CHECK (happiness >= 0 AND happiness <= 100),
  hunger INTEGER NOT NULL DEFAULT 60 CHECK (hunger >= 0 AND hunger <= 100),
  energy INTEGER NOT NULL DEFAULT 70 CHECK (energy >= 0 AND energy <= 100),
  last_decay_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companion_stats ENABLE ROW LEVEL SECURITY;

-- Rewards policies (all users can view, only admins can manage)
CREATE POLICY "Anyone can view rewards" ON public.rewards FOR SELECT USING (true);
CREATE POLICY "Admins can manage rewards" ON public.rewards FOR ALL USING (has_role(auth.uid(), 'admin'));

-- User rewards policies
CREATE POLICY "Users can view their own rewards" ON public.user_rewards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can purchase rewards" ON public.user_rewards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own rewards" ON public.user_rewards FOR UPDATE USING (auth.uid() = user_id);

-- Tasks policies (all users can view active, only admins can manage)
CREATE POLICY "Anyone can view active tasks" ON public.tasks FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage tasks" ON public.tasks FOR ALL USING (has_role(auth.uid(), 'admin'));

-- User tasks policies
CREATE POLICY "Users can view their completed tasks" ON public.user_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can complete tasks" ON public.user_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Companion stats policies
CREATE POLICY "Users can view their own companion stats" ON public.companion_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own companion stats" ON public.companion_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own companion stats" ON public.companion_stats FOR UPDATE USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE ON public.rewards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_companion_stats_updated_at BEFORE UPDATE ON public.companion_stats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default rewards
INSERT INTO public.rewards (name, description, cost, type, effect_type, effect_value) VALUES
  ('Dodatkowa obecność', 'Zapisz obecność za dowolne zajęcia', 100, 'attendance', 'bonus_points', 50),
  ('Złote ucho wiewiórki', 'Ekskluzywny dodatek - +10 szczęścia', 75, 'cosmetic', 'companion_happiness', 10),
  ('Bonus czasowy', '+20 punktów natychmiast', 50, 'boost', 'bonus_points', 20),
  ('Przedłużenie terminu', 'Dodatkowa energia dla wiewiórki +15', 120, 'attendance', 'companion_energy', 15),
  ('Kolorowa czapka', 'Stylowy dodatek - +15 szczęścia', 60, 'cosmetic', 'companion_happiness', 15),
  ('Super boost', 'Natychmiastowe +30 punktów', 80, 'boost', 'bonus_points', 30),
  ('Pełne nakarmienie', 'Głód wiewiórki +25', 40, 'boost', 'companion_hunger', 25),
  ('Energetyk', 'Energia wiewiórki +20', 35, 'boost', 'companion_energy', 20);

-- Insert default tasks (without "Zaloguj się do Wikamp")
INSERT INTO public.tasks (title, description, points, category) VALUES
  ('Przejdź do podglądu przedmiotu', 'Kliknij przycisk Podgląd przy dowolnym przedmiocie na stronie głównej', 15, 'beginner'),
  ('Przeglądnij kursy', 'Zobacz dostępne kursy i ich opisy', 15, 'beginner'),
  ('Ukończ pierwszą lekcję', 'Obejrzyj materiał z wybranego kursu', 25, 'intermediate'),
  ('Zrób test wiedzy', 'Sprawdź swoją wiedzę w quizie', 30, 'intermediate'),
  ('Udostępnij materiał', 'Podziel się interesującym materiałem ze znajomymi', 20, 'advanced'),
  ('Zagraj w mini grę', 'Zagraj przynajmniej raz w dowolną mini grę', 10, 'beginner'),
  ('Nakarm wiewiórkę', 'Nakarm swojego towarzysza przynajmniej raz', 10, 'beginner'),
  ('Zdobądź 50 punktów', 'Osiągnij łącznie 50 punktów', 25, 'intermediate'),
  ('Wygraj w grze kubków', 'Wygraj przynajmniej raz w grę trzech kubków', 20, 'intermediate'),
  ('Zajmij miejsce w top 3', 'Wejdź do top 3 w rankingu', 50, 'advanced');

-- Update handle_new_user to also create companion stats
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
    
  -- Create companion stats for new user
  INSERT INTO public.companion_stats (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
-- Esquema inicial para TimeQuest

-- Perfiles de usuario (Padres e Hijos)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('parent', 'child')),
  current_balance INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Catálogo de Misiones (Quests)
CREATE TABLE quests_catalog (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  token_reward INTEGER NOT NULL,
  category TEXT DEFAULT 'general',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Catálogo de Premios (Rewards)
CREATE TABLE rewards_catalog (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  cost_tokens INTEGER NOT NULL,
  time_minutes INTEGER,
  icon TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Sugerencias de los niños
CREATE TABLE suggestions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  child_id UUID REFERENCES profiles(id) NOT NULL,
  type TEXT CHECK (type IN ('task', 'reward')),
  content TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  parent_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Misiones Activas / Pendientes de aprobación
CREATE TABLE active_quests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  child_id UUID REFERENCES profiles(id) NOT NULL,
  quest_id UUID REFERENCES quests_catalog(id) NOT NULL,
  status TEXT CHECK (status IN ('in_progress', 'pending_approval', 'completed')) DEFAULT 'in_progress',
  proof_url TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Historial de Transacciones
CREATE TABLE transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  child_id UUID REFERENCES profiles(id) NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT CHECK (type IN ('earn', 'spend')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (Ejemplo: Todos pueden leer el catálogo, solo padres editan)
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Quests are viewable by everyone" ON quests_catalog FOR SELECT USING (true);
CREATE POLICY "Only parents can manage quests" ON quests_catalog FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'parent')
);

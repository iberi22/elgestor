-- Insertar cursos iniciales
INSERT INTO classes (name) VALUES
  ('Primero A'),
  ('Primero B'),
  ('Segundo A'),
  ('Segundo B'),
  ('Tercero A'),
  ('Tercero B'),
  ('Cuarto A'),
  ('Cuarto B'),
  ('Quinto A'),
  ('Quinto B'),
  ('Sexto A'),
  ('Sexto B')
ON CONFLICT (name) DO NOTHING;

-- Insertar cuota para el año actual
INSERT INTO fees (year, amount, due_date) VALUES
  (2024, 50000.00, '2024-12-31'),
  (2025, 55000.00, '2025-12-31')
ON CONFLICT (year) DO NOTHING;

-- Función para crear un perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'parent');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Políticas RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Políticas para students (padres ven sus hijos, admins ven todos)
CREATE POLICY "Parents can view their children" ON students
  FOR SELECT USING (
    auth.uid() = parent_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Parents can manage their children" ON students
  FOR ALL USING (
    auth.uid() = parent_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Políticas para payments (padres ven pagos de sus hijos, admins ven todos)
CREATE POLICY "Users can view payments for their children" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students
      WHERE students.id = payments.student_id
      AND students.parent_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage all payments" ON payments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Políticas para expenses (solo admins)
CREATE POLICY "Admins can manage expenses" ON expenses
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Políticas para events (todos pueden ver, solo admins pueden crear/editar)
CREATE POLICY "Everyone can view events" ON events
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage events" ON events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Políticas para event_recipients
CREATE POLICY "Everyone can view event recipients" ON event_recipients
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage event recipients" ON event_recipients
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Políticas para classes (todos pueden ver)
CREATE POLICY "Everyone can view classes" ON classes
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage classes" ON classes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Políticas para fees (todos pueden ver, solo admins pueden crear/editar)
CREATE POLICY "Everyone can view fees" ON fees
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage fees" ON fees
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
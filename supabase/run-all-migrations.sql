-- Script combinado para ejecutar todas las migraciones de Supabase
-- Ejecuta este script completo en el SQL Editor de tu dashboard de Supabase.

-- Migración 1: Esquema inicial
-- Creación de tablas principales y relaciones

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'parent'
);

CREATE TABLE classes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  parent_id UUID NOT NULL REFERENCES profiles(id),
  class_id INTEGER NOT NULL REFERENCES classes(id),
  full_name TEXT NOT NULL
);

CREATE TABLE fees (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL UNIQUE,
  amount NUMERIC(10, 2) NOT NULL,
  due_date DATE
);

CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  fee_id INTEGER NOT NULL REFERENCES fees(id),
  amount_paid NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_date TIMESTAMPTZ,
  transaction_id TEXT
);

CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  description TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  expense_date DATE NOT NULL
);

CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE event_recipients (
  event_id INTEGER REFERENCES events(id),
  class_id INTEGER REFERENCES classes(id),
  PRIMARY KEY (event_id, class_id)
);

-- Migración 2: Índices y restricciones
-- Optimización de consultas y reglas de integridad de datos

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_fee_id ON payments(fee_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);

CREATE INDEX IF NOT EXISTS idx_students_parent_id ON students(parent_id);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);

CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);

CREATE INDEX IF NOT EXISTS idx_event_recipients_event_id ON event_recipients(event_id);
CREATE INDEX IF NOT EXISTS idx_event_recipients_class_id ON event_recipients(class_id);

-- Restricciones adicionales
ALTER TABLE payments ADD CONSTRAINT check_payment_amount CHECK (amount_paid > 0);
ALTER TABLE fees ADD CONSTRAINT check_fee_amount CHECK (amount > 0);
ALTER TABLE expenses ADD CONSTRAINT check_expense_amount CHECK (amount > 0);

-- Función para actualizar el timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Agregar columna updated_at a las tablas principales
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE students ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE events ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Triggers para actualizar updated_at automáticamente
CREATE OR REPLACE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Migración 3: Datos iniciales y políticas de seguridad
-- Inserción de datos básicos, función de perfil de usuario y políticas RLS

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
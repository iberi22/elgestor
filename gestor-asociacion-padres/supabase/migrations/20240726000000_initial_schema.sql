-- Perfiles de usuario, extiende la tabla auth.users
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'parent' -- 'parent' o 'admin'
);

-- Cursos del colegio
CREATE TABLE classes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE -- ej. "Primero A"
);

-- Relaciona a los hijos de los padres con sus cursos
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  parent_id UUID NOT NULL REFERENCES profiles(id),
  class_id INTEGER NOT NULL REFERENCES classes(id),
  full_name TEXT NOT NULL
);

-- Define las cuotas por año
CREATE TABLE fees (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL UNIQUE,
  amount NUMERIC(10, 2) NOT NULL,
  due_date DATE
);

-- Registros de pagos de cuotas
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id),
  fee_id INTEGER NOT NULL REFERENCES fees(id),
  amount_paid NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid'
  payment_date TIMESTAMPTZ,
  transaction_id TEXT -- Para referencia del proveedor de pago
);

-- Registro de gastos de la asociación
CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  description TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  expense_date DATE NOT NULL
);

-- Eventos creados por el admin
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para gestionar a quién se notifica un evento
CREATE TABLE event_recipients (
  event_id INTEGER REFERENCES events(id),
  class_id INTEGER REFERENCES classes(id),
  PRIMARY KEY (event_id, class_id)
);
-- Si un evento no tiene entradas aquí, se asume que es para todos.
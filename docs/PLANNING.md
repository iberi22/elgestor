# PLANNING.md - Gestor Asociación de Padres

## 1. Visión del Proyecto (Purpose)

Crear una aplicación web (MVP) moderna, segura y fácil de usar para la Asociación de Padres de un colegio. El objetivo es centralizar y automatizar dos procesos clave: la recaudación de cuotas anuales y la comunicación de eventos, para mejorar la eficiencia administrativa y la participación de los padres.

## 2. Requerimientos del MVP

Extraídos del audio, los requerimientos esenciales son:

* **Módulo Financiero:**
  * **Cobro de Cuotas:** Los padres deben poder pagar la cuota anual a través de la aplicación.
  * **Gestión para el Contador:** El administrador (contador) necesita un panel para:
    * Ver un respaldo de todo el dinero recaudado.
    * Registrar los gastos ("lo cargado").
    * Consultar un balance simple (ingresos vs. gastos).

* **Módulo de Comunicación:**
  * **Creación de Eventos:** El administrador debe poder crear eventos (ej. reuniones) con fecha y detalles.
  * **Notificaciones Segmentadas:** Al crear un evento, el administrador debe poder elegir si la notificación se envía a todos los padres o solo a cursos específicos (ej. "Primero A", "Segundo B").
  * **Recordatorios Automáticos:** El sistema debe enviar recordatorios automáticos y periódicos para "presionar" la asistencia (ej. recordatorios a las 3 semanas, 1 semana, horas antes del evento).

* **Gestión de Usuarios:**
  * Los usuarios (padres) se registran y se asocian a uno o más cursos/grados.
  * Debe existir un rol de `Administrador` con permisos especiales.

## 3. Arquitectura y Stack Tecnológico (Tech Stack)

* **Framework Frontend:** [Next.js 15+](https://nextjs.org/) (con App Router).
* **Backend y Base de Datos:** [Supabase](https://supabase.com/).
  * **Auth:** Para gestionar usuarios y roles.
  * **PostgreSQL DB:** Para almacenar toda la información.
  * **Edge Functions:** Para la lógica de envío de notificaciones.
  * **Storage:** (Futuro) Para almacenar comprobantes de gastos.
* **Componentes UI:** [Shadcn/ui](https://ui.shadcn.com/) sobre Tailwind CSS.
* **Plataforma de Pagos:** [Stripe](https://stripe.com/) o [Mercado Pago](https://www.mercadopago.com/) por su facilidad de integración y popularidad en LATAM.
* **Despliegue (Deployment):** [Vercel](https://vercel.com/).
* **Notificaciones:**
  * **Email:** Integración con [Resend](https://resend.com/) o similar, invocado desde Edge Functions.
  * **Tareas Programadas (Cron Jobs):** Usando [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs) o `pg_cron` de Supabase para los recordatorios de eventos.

## 4. Modelo de Datos (Esquema Supabase)

```sql
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

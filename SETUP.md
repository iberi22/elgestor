# 🚀 Guía de Configuración - Gestor JDP

## ✅ Errores Solucionados

Se han solucionado los siguientes errores:
- ❌ `Module not found: Can't resolve '@supabase/ssr'` → ✅ Dependencia instalada
- ❌ Faltaban dependencias de UI → ✅ shadcn/ui configurado
- ❌ Configuración de Tailwind incompleta → ✅ Configuración completa
- ❌ Base de datos sin migraciones → ✅ Migraciones creadas

## 📋 Pasos para Configurar el Proyecto

### 1. Configurar Variables de Entorno

Crea el archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=TU_URL_DE_SUPABASE
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_ANON_KEY_DE_SUPABASE
```

**Para obtener estas credenciales:**
1. Ve a [Supabase](https://supabase.com)
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a **Settings > API**
4. Copia la **Project URL** y **anon public key**

### 2. Ejecutar las Migraciones de Base de Datos

#### Opción A: Usando el SQL Editor de Supabase
1. Ve al **SQL Editor** en tu dashboard de Supabase
2. Ejecuta las migraciones en este orden:

```sql
-- 1. Esquema inicial
-- Copia y ejecuta el contenido de: supabase/migrations/20240726000000_initial_schema.sql

-- 2. Índices y restricciones
-- Copia y ejecuta el contenido de: supabase/migrations/20240726000001_add_indexes_and_constraints.sql

-- 3. Datos iniciales y políticas
-- Copia y ejecuta el contenido de: supabase/migrations/20240726000002_seed_initial_data.sql
```

#### Opción B: Usando el CLI de Supabase
```bash
# Instalar CLI de Supabase (si no lo tienes)
npm install -g supabase

# Inicializar proyecto
supabase init

# Ejecutar migraciones
supabase db push
```

### 3. Verificar la Configuración

Ejecuta el script de verificación:
```powershell
.\setup-database.ps1
```

### 4. Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en: http://localhost:3000

## 🗂️ Estructura de Migraciones

### `20240726000000_initial_schema.sql`
- Tablas principales: `profiles`, `classes`, `students`, `fees`, `payments`, `expenses`, `events`, `event_recipients`
- Relaciones y claves foráneas

### `20240726000001_add_indexes_and_constraints.sql`
- Índices para optimizar consultas
- Restricciones de integridad
- Triggers para `updated_at`
- Columnas adicionales

### `20240726000002_seed_initial_data.sql`
- Datos iniciales (cursos, cuotas)
- Función para crear perfiles automáticamente
- Políticas de seguridad (RLS)
- Configuración de permisos

## 🔧 Dependencias Instaladas

### Principales
- `@supabase/supabase-js` - Cliente de Supabase
- `@supabase/ssr` - Autenticación SSR
- `@radix-ui/react-*` - Componentes de UI
- `lucide-react` - Iconos
- `class-variance-authority` - Utilidades de clases
- `clsx` y `tailwind-merge` - Utilidades de CSS

### Configuración
- `tailwind.config.ts` - Configuración de Tailwind
- `components.json` - Configuración de shadcn/ui
- `globals.css` - Variables CSS y estilos base

## 🎯 Funcionalidades Disponibles

### Para Padres
- ✅ Registro e inicio de sesión
- ✅ Dashboard personal
- ✅ Ver estado de cuotas
- ✅ Ver eventos del colegio
- ✅ Gestionar perfil

### Para Administradores
- ✅ Panel administrativo
- ✅ Gestión de pagos
- ✅ Gestión de gastos
- ✅ Creación de eventos
- ✅ Envío de notificaciones
- ✅ Resumen financiero

## 🚨 Solución de Problemas

### Error: "Cannot find module '@supabase/ssr'"
```bash
npm install @supabase/ssr
```

### Error: Variables de entorno no encontradas
Verifica que el archivo `.env.local` existe y tiene las credenciales correctas.

### Error: Base de datos no configurada
Ejecuta las migraciones en el orden especificado.

### Error: Componentes de UI no encontrados
```bash
npm install @radix-ui/react-slot @radix-ui/react-label
```

## 📞 Soporte

Si encuentras algún problema:
1. Verifica que todas las dependencias estén instaladas
2. Confirma que las variables de entorno estén configuradas
3. Ejecuta las migraciones en el orden correcto
4. Revisa los logs del servidor para errores específicos
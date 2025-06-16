# 🏫 Gestor Asociación de Padres - MVP

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

**✅ MVP COMPLETADO AL 95%** - Aplicación web moderna para la gestión de asociaciones de padres de colegios, con todas las funcionalidades principales implementadas y probadas.

## 🚀 Funcionalidades Implementadas

### 👥 Gestión de Usuarios
- ✅ Registro y autenticación con Supabase Auth
- ✅ Roles de usuario (Padre/Administrador)
- ✅ Perfiles de usuario con gestión de hijos y cursos
- ✅ Rutas protegidas con middleware

### 💰 Módulo Financiero
- ✅ **Vista Administrador:** Gestión de cuotas, registro de gastos, visualización de pagos, resumen financiero
- ✅ **Vista Padre:** Estado de cuotas por hijo, integración con pasarelas de pago, webhook para confirmación automática

### 📅 Módulo de Comunicación y Eventos
- ✅ **Vista Administrador:** Creación/edición de eventos, selección de destinatarios por curso, notificaciones automáticas
- ✅ **Vista Padre:** Visualización de próximos eventos filtrados por cursos de sus hijos

### 🔔 Sistema de Notificaciones
- ✅ Edge Function para envío de emails al crear eventos
- ✅ Cron job para recordatorios automáticos (21, 7, 1 días antes)
- ✅ Integración con Resend para envío de emails

## 🚀 Stack Tecnológico

* **Framework:** Next.js 15+ (App Router)
* **Backend & DB:** Supabase
* **UI:** Shadcn/ui & Tailwind CSS
* **Despliegue:** Vercel

## ⚙️ Instalación y Configuración

1. **Clonar el repositorio:**
    ```bash
    git clone https://github.com/iberi22/elgestor.git
    cd elgestor
    ```

2. **Instalar dependencias:**
    ```bash
    npm install
    ```

3. **Configurar variables de entorno:**
    ```bash
    cp .env.example .env.local
    ```

    Editar `.env.local` con tus credenciales de Supabase, Resend, etc.

4. **Iniciar el servidor de desarrollo:**
    ```bash
    npm run dev
    ```

Abre [http://localhost:3001](http://localhost:3001) en tu navegador para ver la aplicación.

## 🗄️ Base de Datos

**✅ La base de datos ya está completamente configurada** con:
- Todas las tablas creadas según el esquema en `docs/PLANNING.md`
- Datos de prueba insertados (clases, cuotas, gastos, eventos)
- Usuario administrador configurado

### Credenciales de Prueba
- **Email:** beri@beri.com
- **Rol:** Administrador

## 🚀 Despliegue

1. **Configurar en Vercel:**
    ```bash
    vercel
    ```

2. **Variables de entorno:** Agregar todas las variables del `.env.local` en Vercel

3. **Cron Jobs:** El archivo `vercel.json` ya está configurado para recordatorios automáticos

## 📋 Estado del Proyecto

**Única tarea pendiente:** Desplegar en Vercel (requiere configuración manual)

Todas las demás funcionalidades están implementadas y probadas.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

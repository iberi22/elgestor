# Gestor JDP - Software para Asociación de Padres

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

Aplicación web diseñada para simplificar la administración de la Asociación de Padres de un colegio. Este proyecto (MVP) se enfoca en la gestión de pagos de cuotas y la comunicación de eventos.

## ✨ Características Principales (MVP)

* **Portal de Pagos:** Permite a los padres pagar la cuota anual de forma segura a través de la plataforma.
* **Panel Administrativo:** Un dashboard para que el tesorero pueda:
  * Visualizar ingresos y registrar gastos.
  * Obtener un balance financiero en tiempo real.
* **Gestión de Eventos:**
  * Creación de eventos (reuniones, actividades, etc.).
  * Envío de notificaciones por email a todos los padres o a cursos específicos.
  * Recordatorios automáticos para maximizar la asistencia.
* **Diseño Responsivo:** Experiencia de usuario óptima tanto en escritorio como en dispositivos móviles.

## 🚀 Stack Tecnológico

* **Framework:** Next.js 15+ (App Router)
* **Backend & DB:** Supabase
* **UI:** Shadcn/ui & Tailwind CSS
* **Despliegue:** Vercel

## ⚙️ Cómo Empezar (Setup Local)

1. **Clonar el repositorio:**

    ```bash
    git clone https://github.com/tu-usuario/gestor-jdp.git
    cd gestor-jdp
    ```

2. **Instalar dependencias:**

    ```bash
    npm install
    ```

3. **Configurar variables de entorno:**
    * Crea un proyecto en [Supabase](https://supabase.com).
    * Ve a `Project Settings` > `API`.
    * Renombra el archivo `.env.local.example` a `.env.local`.
    * Copia tu `Project URL` y tu `anon public key` en el archivo `.env.local`:

    ```env
    NEXT_PUBLIC_SUPABASE_URL=TU_URL_DE_SUPABASE
    NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_ANON_KEY_DE_SUPABASE
    ```

4. **Ejecutar el script de la base de datos:**
    * Ve al `SQL Editor` en tu dashboard de Supabase.
    * Copia y ejecuta el código SQL que se encuentra en `PLANNING.md` para crear las tablas.

5. **Iniciar el servidor de desarrollo:**

    ```bash
    npm run dev
    ```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

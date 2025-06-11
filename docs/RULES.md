# RULES.md - Guía de Desarrollo y Colaboración

Este documento define las reglas, convenciones y el flujo de trabajo para el desarrollo de este proyecto. Su objetivo es asegurar la coherencia, calidad y mantenibilidad del código.

### 🔄 Conciencia y Contexto del Proyecto (Project Awareness & Context)

- **Siempre lee `PLANNING.md`** al inicio de una nueva conversación para entender la arquitectura, los objetivos y las restricciones del proyecto.
- **Revisa `TASK.md`** antes de empezar una nueva tarea. Si la tarea no está listada, añádela con una breve descripción.
- **Usa las convenciones de nomenclatura, estructura de archivos y patrones de arquitectura** descritos en `PLANNING.md` y en este documento.

### 🧱 Estructura de Código y Andamiaje (Code Structure & Scaffolding)

- **Nunca crees un archivo con más de 500 líneas de código.** Si un archivo se acerca a este límite, refactorízalo dividiéndolo en componentes, hooks o utilidades más pequeñas.
- **Organiza el código en módulos claramente separados**, agrupados por funcionalidad o responsabilidad.
- **Sigue la estructura de directorios estándar de Next.js 15+ (App Router):**
  - `src/app/`: Contiene las rutas de la aplicación.
    - `(auth)/`: Rutas de autenticación (login, signup).
    - `(main)/dashboard/`: Rutas protegidas del panel de usuario.
    - `(main)/admin/`: Rutas protegidas del panel de administrador.
    - `api/`: Rutas de la API (webhooks, etc.).
  - `src/components/`: Componentes de React reutilizables.
    - `ui/`: Componentes generados por Shadcn/UI (no modificar directamente).
    - `shared/`: Componentes genéricos usados en todo el proyecto (ej. `Header`, `Footer`).
    - `features/`: Componentes complejos específicos de una funcionalidad (ej. `PaymentForm`, `EventCalendar`).
  - `src/lib/`: Funciones de utilidad, helpers y la configuración de clientes.
    - `utils.ts`: Funciones genéricas (como el `cn` de Shadcn).
    - `supabase.ts`: Configuración del cliente de Supabase.
    - `validators.ts`: Esquemas de validación con Zod.
  - `src/hooks/`: Hooks de React personalizados (ej. `useUser`).
- **Usa importaciones claras y consistentes.** Prefiere los alias de ruta (`@/components/...`) para evitar rutas relativas complejas (`../../...`).

### 🧪 Pruebas y Fiabilidad (Testing & Reliability)

- **Siempre crea pruebas unitarias con Vitest** para nuevas funcionalidades críticas (hooks, funciones de `lib`, lógica de API).
- **Después de actualizar cualquier lógica**, comprueba si las pruebas existentes necesitan ser actualizadas. Si es así, hazlo.
- **Las pruebas deben vivir en una carpeta que refleje la estructura de la aplicación.** Por ejemplo, la prueba para `src/lib/utils.ts` estaría en `src/lib/utils.test.ts`.
  - Incluye al menos:
    - 1 prueba para el caso de uso esperado.
    - 1 prueba para un caso límite (edge case).
    - 1 prueba para un caso de fallo o error.

### ✅ Finalización de Tareas (Task Completion)

- **Marca las tareas completadas en `TASK.md`** inmediatamente después de terminarlas.
- **Añade nuevas sub-tareas o TODOs descubiertos durante el desarrollo a `TASK.md`** bajo una sección "Descubierto durante el trabajo" o similar.

### 📎 Estilo y Convenciones (Style & Conventions)

- **Usa TypeScript** como lenguaje principal. Activa el modo estricto (`strict: true`) en `tsconfig.json`.
- **Sigue las reglas definidas en `.eslintrc.json` y formatea el código con Prettier** antes de cada commit.
- **Usa Zod para la validación de datos**, especialmente para formularios del lado del cliente y para los payloads de las rutas de API.
- **Usa el App Router de Next.js** para crear páginas y rutas de API. Para la obtención de datos, utiliza Server Components y Server Actions siempre que sea posible.
- **Interactúa con la base de datos usando el cliente de Supabase (`@supabase/ssr`)**. Centraliza la lógica de acceso a datos en funciones específicas.
- **Siempre Trata de usar MCP servicios si los hay disponibles.
- **Escribe comentarios JSDoc para cada función, hook o componente complejo**, explicando su propósito, parámetros y valor de retorno.

  ```typescript
  /**
   * Envía un recordatorio de evento a los padres de una clase específica.
   * @param eventId - El ID del evento.
   * @param classId - El ID de la clase a notificar.
   * @returns Una promesa que se resuelve si las notificaciones se enviaron con éxito.
   */
  async function sendReminder(eventId: number, classId: number): Promise<void> {
    // ... lógica
  }

📚 Documentación y Explicabilidad (Documentation & Explainability)
Actualiza README.md cuando se añadan nuevas características, cambien las dependencias o se modifiquen los pasos de configuración.
Comenta el código que no sea obvio. El objetivo es que sea comprensible para un desarrollador de nivel medio.
Al escribir lógica compleja, añade un comentario # Razón: o // Razón: explicando el porqué de una decisión de implementación, no solo el qué hace el código.
🧠 Reglas de Comportamiento para la IA (AI Behavior Rules)
Nunca asumas contexto que falta. Haz preguntas si algo no está claro.
Nunca alucines librerías o funciones. Usa únicamente paquetes npm conocidos y verificados o las APIs de Next.js y Supabase.
Siempre confirma que las rutas de archivos y los nombres de módulos existen antes de referenciarlos en código o pruebas.
Nunca elimines o sobrescribas código existente a menos que se te instruya explícitamente o sea parte de una tarea de refactorización definida en TASK.md.

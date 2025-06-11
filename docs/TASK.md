
---

### `TASK.md`

```markdown
# TASK.md - Gestor Asociación de Padres

Este documento rastrea las tareas activas y el backlog del proyecto.

## Milestones del MVP

### Milestone 1: Configuración del Proyecto y Autenticación
*   [ ] Inicializar proyecto Next.js 15+ con TypeScript y Tailwind CSS.
*   [ ] Crear proyecto en Supabase y configurar variables de entorno.
*   [ ] Instalar y configurar Shadcn/ui.
*   [ ] Crear el esquema de la base de datos en Supabase usando el script de `PLANNING.md`.
*   [ ] Implementar flujo de registro (Sign Up) y acceso (Sign In) con Supabase Auth.
*   [ ] Crear la página de perfil donde el padre puede asociar a su hijo con un curso.
*   [ ] Implementar rutas protegidas y middleware para `padres` y `administrador`.

### Milestone 2: Módulo Financiero (Vista Administrador)
*   [ ] Crear un panel de control (`/admin/dashboard`).
*   [ ] UI para que el admin pueda definir/actualizar la cuota anual (`fees`).
*   [ ] UI para que el admin pueda registrar un nuevo gasto (`expenses`).
*   [ ] Tabla que muestre todos los pagos recibidos (`payments`) con su estado.
*   [ ] Widget en el dashboard con el resumen: Total Recaudado vs. Total Gastos.

### Milestone 3: Módulo Financiero (Vista Padre)
*   [ ] Crear un panel de control para padres (`/dashboard`).
*   [ ] Mostrar el estado de la cuota anual (pendiente de pago / pagada).
*   [ ] Integrar el SDK de Stripe/MercadoPago.
*   [ ] Añadir botón "Pagar Cuota" que redirija a la pasarela de pago.
*   [ ] Crear un Webhook (API Route en Next.js) para recibir la confirmación de pago y actualizar la base de datos.

### Milestone 4: Módulo de Comunicación y Eventos
*   [ ] UI en el panel de admin para Crear/Editar/Eliminar eventos (`events`).
*   [ ] En el formulario de creación de evento, añadir un selector para elegir los cursos destinatarios.
*   [ ] Crear una Edge Function en Supabase (`on-new-event`) que se active al crear un evento y envíe emails a los padres correspondientes.
*   [ ] Configurar un Cron Job (`/api/check-reminders`) que se ejecute diariamente para enviar recordatorios de eventos próximos.
*   [ ] UI en el panel del padre para ver la lista de próximos eventos.

### Milestone 5: Despliegue y Pruebas
*   [ ] Configurar proyecto en Vercel y enlazar con el repositorio de GitHub.
*   [ ] Desplegar la aplicación.
*   [ ] Realizar pruebas de extremo a extremo de los flujos principales (pago y notificación).

## Backlog (Futuras Mejoras)
*   - Notificaciones Push en la aplicación.
*   - Exportar reportes financieros a CSV/PDF.
*   - Subir archivos (comprobantes) para los gastos.
*   - Sistema de votaciones simples para las reuniones.
*   - Módulo de noticias o anuncios generales.

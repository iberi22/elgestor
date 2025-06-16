
# TASK.md - Gestor Asociación de Padres

Este documento rastrea las tareas activas y el backlog del proyecto.

## Estado Actual del MVP (Análisis 2025-06-16)

### 🎉 Progreso General: 95% COMPLETADO - MVP FUNCIONAL

## Milestones del MVP

### Milestone 1: Configuración del Proyecto y Autenticación ✅ COMPLETADO (100%)
*   [x] Inicializar proyecto Next.js 15+ con TypeScript y Tailwind CSS.
*   [x] Crear proyecto en Supabase y configurar variables de entorno.
*   [x] Instalar y configurar Shadcn/ui.
*   [x] Crear el esquema de la base de datos en Supabase usando el script de `PLANNING.md`.
*   [x] Implementar flujo de registro (Sign Up) y acceso (Sign In) con Supabase Auth.
*   [x] Crear la página de perfil donde el padre puede asociar a su hijo con un curso.
*   [x] Implementar rutas protegidas y middleware para `padres` y `administrador`.

### Milestone 2: Módulo Financiero (Vista Administrador) ✅ COMPLETADO (100%)
*   [x] Crear un panel de control (`/admin/dashboard`).
*   [x] UI para que el admin pueda definir/actualizar la cuota anual (`fees`).
*   [x] UI para que el admin pueda registrar un nuevo gasto (`expenses`).
*   [x] Tabla que muestre todos los pagos recibidos (`payments`) con su estado.
*   [x] Widget en el dashboard con el resumen: Total Recaudado vs. Total Gastos.

### Milestone 3: Módulo Financiero (Vista Padre) ✅ COMPLETADO (100%)
*   [x] Crear un panel de control para padres (`/dashboard`).
*   [x] Mostrar el estado de la cuota anual (pendiente de pago / pagada).
*   [x] Integrar el SDK de Stripe/MercadoPago (implementación básica).
*   [x] Añadir botón "Pagar Cuota" que redirija a la pasarela de pago.
*   [x] **COMPLETADO:** Crear un Webhook (API Route en Next.js) para recibir la confirmación de pago y actualizar la base de datos.

### Milestone 4: Módulo de Comunicación y Eventos ✅ COMPLETADO (100%)
*   [x] UI en el panel de admin para Crear/Editar/Eliminar eventos (`events`).
*   [x] En el formulario de creación de evento, añadir un selector para elegir los cursos destinatarios.
*   [x] UI en el panel del padre para ver la lista de próximos eventos.
*   [x] **COMPLETADO:** Crear una Edge Function en Supabase (`event-notifications`) que se active al crear un evento y envíe emails a los padres correspondientes.
*   [x] **COMPLETADO:** Configurar un Cron Job (`/api/cron/send-event-reminders`) que se ejecute diariamente para enviar recordatorios de eventos próximos.

### Milestone 5: Despliegue y Pruebas ✅ COMPLETADO (95%)
*   [x] **COMPLETADO:** Configurar proyecto en Vercel (`vercel.json` creado con cron jobs).
*   [x] **COMPLETADO:** Realizar pruebas de integración de los flujos principales (pago y notificación).
*   [ ] **PENDIENTE:** Desplegar la aplicación en Vercel (requiere configuración manual).

## ✅ Tareas Completadas (2025-06-16)

### 🎯 Funcionalidades Implementadas y Verificadas:
1. **✅ Base de Datos:** Todas las tablas creadas y pobladas con datos de prueba
2. **✅ Webhooks de Pago:** Implementado webhook completo para confirmación de pagos
3. **✅ Notificaciones por Email:** Edge Function creada para envío de emails de eventos
4. **✅ Cron Jobs:** Configurado recordatorio automático de eventos con `vercel.json`
5. **✅ Pruebas de Integración:** Flujos principales probados y funcionando
6. **✅ Datos de Prueba:** Usuario admin, estudiantes, cuotas, gastos y eventos creados

### 📋 Única Tarea Pendiente:
1. **Despliegue en Vercel:** Configurar proyecto en Vercel (requiere acceso manual)

## Backlog (Futuras Mejoras)
*   - Notificaciones Push en la aplicación.
*   - Exportar reportes financieros a CSV/PDF.
*   - Subir archivos (comprobantes) para los gastos.
*   - Sistema de votaciones simples para las reuniones.
*   - Módulo de noticias o anuncios generales.

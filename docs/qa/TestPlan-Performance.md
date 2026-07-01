# Performance Test Plan - Play Balance

## 1. Objetivo y Alcance
El propósito de este plan de pruebas es garantizar que la infraestructura de **Play Balance** (frontend en Next.js y APIs internas) pueda soportar el tráfico esperado en momentos pico (ej. registro simultáneo de familias y profesionales), manteniendo tiempos de respuesta aceptables y una baja tasa de errores.

**Alcance Inicial:**
- Rutas públicas: `/` (Landing Page) y `/registro` (Formulario de registro).
- API: Tiempos de resolución de carga estática y Server Side Rendering (SSR) de Next.js.

**Fuera de Alcance Inicial:**
- Consultas masivas de escritura a la base de datos de producción.
- Invocaciones masivas a la API de Google Gemini (para evitar consumo de cuota).

## 2. Herramientas Utilizadas
- **Herramienta de Carga:** Grafana K6 (ejecución mediante scripts en JavaScript/TypeScript).
- **Monitoreo Local:** CLI de K6 y reportes en terminal.

## 3. Entornos de Ejecución
- **Entorno Principal de Prueba:** Localhost (`npm run dev` / `npm run start`) o Staging (`Vercel Preview URL`).
- **ATENCIÓN:** *Bajo ninguna circunstancia se ejecutarán pruebas de estrés mutativas contra el entorno de Producción.*

## 4. Tipos de Pruebas (Escenarios)

### 4.1 Load Testing (Prueba de Carga Estándar)
Simula la cantidad esperada de usuarios concurrentes navegando por el sistema en un día normal.
- **VUs (Virtual Users):** 50
- **Duración Total:** 1 minuto
- **Comportamiento:**
  - 15s de *Ramp-up* (0 a 50 VUs).
  - 30s de *Hold* (manteniendo 50 VUs).
  - 15s de *Ramp-down* (50 a 0 VUs).

### 4.2 Stress Testing (Prueba de Estrés - Backend & Database)
Simula una carga ultra agresiva contra la infraestructura de base de datos para medir el límite del *Connection Pool* de Neon DB y el rendimiento del Backend de Next.js.
- **Ruta objetivo:** `/api/health` (Ejecuta un `SELECT` con Drizzle ORM).
- **VUs:** 100
- **Duración:** 1 minuto y 20 segundos.
- **Comportamiento:**
  - 10s de *Ramp-up* rápido a 50 VUs.
  - 30s de *Hold* en 50 VUs.
  - 10s de *Ramp-up* agresivo (Stress) a 100 VUs.
  - 30s de *Hold* en 100 VUs.
  - 10s de *Ramp-down*.

## 5. Métricas de Éxito (SLAs / Criterios de Aceptación)
Las pruebas se considerarán exitosas si cumplen con las siguientes métricas en el reporte final de K6:
1. **Error Rate (Tasa de fallos):** Menor al **1%** de las peticiones HTTP (`http_req_failed < 0.01`).
2. **Response Time (Tiempo de respuesta):** El 95% de las peticiones (P95) deben resolverse en menos de **500 milisegundos** (`http_req_duration < 500ms`).

## 6. Consideraciones de Seguridad
Para evitar sobrecargas innecesarias y detección de ataques DDoS por parte del proveedor (Vercel/Cloudflare), los scripts tendrán una estructura predefinida de *sleeps* (pausas simulando pensamiento humano) entre cada petición.

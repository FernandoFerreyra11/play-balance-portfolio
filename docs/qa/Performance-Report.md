# Performance Test Report - Play Balance

## 1. Resumen Ejecutivo
Este documento detalla los resultados obtenidos durante la ejecución de las pruebas de rendimiento (Fase 1: Load Testing y Fase 2: Stress Testing) realizadas sobre la infraestructura local de **Play Balance** (Next.js SSR + Neon DB).

**Objetivo principal:** Determinar la capacidad máxima de carga del servidor frontend y los límites del *Connection Pool* de la base de datos antes de experimentar degradación de servicio o errores 500.

---

## 2. Resultados: Fase 1 (Load Testing Frontend)
Prueba diseñada para estresar la generación de páginas de Next.js (SSR y Static) simulando un tráfico elevado sostenido.

- **Escenario:** 50 Usuarios Virtuales (VUs) concurrentes.
- **Rutas atacadas:** `/` (Home) y `/register` (Registro).
- **Duración:** 1 minuto.
- **Total de peticiones procesadas:** ~1,194 peticiones (RPS: 18.6 req/s).

### 2.1 Métricas Obtenidas (K6)
| Métrica (SLA) | Objetivo Esperado | Resultado Real | Estado |
| :--- | :--- | :--- | :---: |
| **Tasa de Errores (http_req_failed)** | < 1.00% | **0.00%** | ✅ PASSED |
| **Tiempo de Respuesta (p95)** | < 500 ms | **34.92 ms** | ✅ PASSED |

**Conclusión Fase 1:** El frontend de Next.js es altamente escalable. Fue capaz de despachar todas las peticiones HTML/SSR en tiempos ultracortos (34 milisegundos en el percentil 95) sin registrar un solo fallo de red ni caída de servidor.

---

## 3. Resultados: Fase 2 (Stress Testing Backend & DB)
Prueba ultra-agresiva diseñada para encontrar el punto de ruptura (*breaking point*) de las conexiones a la base de datos Neon mediante Drizzle ORM.

- **Escenario:** 100 Usuarios Virtuales (VUs) concurrentes (escalado agresivo).
- **Rutas atacadas:** `/api/health` (Ejecuta un `SELECT` a la base de datos).
- **Duración:** 1 minuto y 30 segundos.
- **Total de peticiones procesadas:** ~6,556 peticiones (RPS: 72.4 req/s).

### 3.1 Métricas Obtenidas (K6)
| Métrica (SLA) | Objetivo Esperado | Resultado Real | Estado |
| :--- | :--- | :--- | :---: |
| **Tasa de Errores (http_req_failed)** | < 1.00% | **2.30%** | ❌ BROKEN |
| **Tiempo de Respuesta (p95)** | < 500 ms | **256.52 ms** | ✅ PASSED |

**Conclusión Fase 2:** Se identificó con éxito el límite arquitectónico actual del sistema. Al superar los 100 usuarios concurrentes haciendo consultas directas a la base de datos, el nivel gratuito de Neon DB saturó su *Connection Pool*, provocando un rechazo del 2.30% de las conexiones (151 errores sobre 6,556 peticiones). Sin embargo, el tiempo de respuesta de las peticiones exitosas se mantuvo muy veloz (256ms).

---

## 4. Recomendaciones Arquitectónicas
1. **Frontend:** No se requieren acciones. El SSR de Next.js rinde por encima de las expectativas.
2. **Base de Datos:** Si la aplicación experimenta picos reales de más de 100 usuarios activos por segundo, será mandatorio:
   - Contratar un plan superior en Neon que permita mayor cantidad de conexiones simultáneas.
   - Implementar estrategias de caché profundo (Redis) para evitar que todas las peticiones lleguen directamente a la base de datos.

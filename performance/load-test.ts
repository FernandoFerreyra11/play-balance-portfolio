import http from 'k6/http';
import { check, sleep } from 'k6';

// Tipos definidos globalmente gracias a @types/k6
export const options = {
  // Etapas del Load Test (Prueba de carga)
  stages: [
    { duration: '15s', target: 50 }, // Ramp-up: sube de 0 a 50 usuarios en 15 segundos
    { duration: '30s', target: 50 }, // Hold: se mantiene en 50 usuarios durante 30 segundos
    { duration: '15s', target: 0 },  // Ramp-down: baja a 0 usuarios
  ],
  thresholds: {
    // Definimos nuestros SLAs (Acuerdos de Nivel de Servicio)
    http_req_failed: ['rate<0.01'], // Los errores deben ser menos del 1%
    http_req_duration: ['p(95)<500'], // El 95% de las peticiones deben tardar menos de 500ms
  },
};

// Vemos si le pasamos una URL por entorno, si no, usa localhost
const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';

export default function () {
  // 1. Visitamos la página principal
  const resHome = http.get(`${BASE_URL}/`);
  
  // Validamos que devuelva HTTP 200
  check(resHome, {
    'home status was 200': (r) => r.status === 200,
  });
  
  // Pausa simulando el tiempo que un usuario real tarda en leer la pantalla (1 a 3 segundos)
  sleep(Math.random() * 2 + 1);

  // 2. Visitamos la página de registro
  const resRegistro = http.get(`${BASE_URL}/register`);
  
  check(resRegistro, {
    'registro status was 200': (r) => r.status === 200,
  });

  // Otra pausa antes de que el usuario virtual termine su iteración
  sleep(Math.random() * 2 + 1);
}

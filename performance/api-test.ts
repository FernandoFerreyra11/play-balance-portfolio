import http from 'k6/http';
import { check, sleep } from 'k6';

// Test options: Stress Test para la Base de Datos
export const options = {
  stages: [
    { duration: '10s', target: 50 },  // Ramp-up rápido a 50 VUs
    { duration: '30s', target: 50 },  // Hold por 30s
    { duration: '10s', target: 100 }, // Ramp-up agresivo a 100 VUs (Stress)
    { duration: '30s', target: 100 }, // Hold por 30s
    { duration: '10s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'], 
    http_req_duration: ['p(95)<500'], // Latencia del API + BD debe ser < 500ms
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';

export default function () {
  // Hacemos peticiones al endpoint de Health Check (que hace queries a Neon)
  const res = http.get(`${BASE_URL}/api/health`);
  
  check(res, {
    'status was 200': (r) => r.status === 200,
    // Verificamos que el JSON de respuesta devuelva status: 'ok'
    'db connection ok': (r) => {
      try {
        return r.json('status') === 'ok';
      } catch (e) {
        return false;
      }
    },
  });
  
  // Pausa mínima para no ahogar totalmente la red local, 
  // pero lo suficientemente baja para generar alto RPS
  sleep(Math.random() * 0.5 + 0.1); 
}

import { beforeAll, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import * as schema from '@/db/schema';

// 1. Instanciamos PGlite (PostgreSQL en memoria compilado a WebAssembly)
const client = new PGlite();

// 2. Conectamos Drizzle a esta instancia local usando nuestro esquema
const mockDb = drizzle(client, { schema });

// 3. Hacemos un "mock" global. Cualquier archivo que importe '@/db' 
// va a recibir esta BD en memoria en lugar de la conexión real a Neon.
vi.mock('@/db', () => ({
  db: mockDb
}));

// 4. Antes de que corran los tests, ejecutamos las migraciones
// para que la BD en memoria tenga todas las tablas creadas.
beforeAll(async () => {
  await migrate(mockDb, { migrationsFolder: './drizzle' });
});

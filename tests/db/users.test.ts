import { describe, it, expect } from 'vitest';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

describe('Base de Datos - Tabla Users', () => {
  
  it('Debería insertar un profesional con matrícula correctamente', async () => {
    const newPro = {
      name: 'Dr. Test Vitest',
      email: 'test.vitest@pro.com',
      role: 'professional' as const,
      licenseNumber: 'MN-99999'
    };

    // Insertar en la base de datos PGlite
    await db.insert(users).values(newPro);

    // Buscar el usuario recién insertado
    const [savedUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, 'test.vitest@pro.com'));
    
    expect(savedUser).toBeDefined();
    expect(savedUser.name).toBe('Dr. Test Vitest');
    expect(savedUser.licenseNumber).toBe('MN-99999');
    expect(savedUser.role).toBe('professional');
  });

  it('Debería fallar si intento registrar dos usuarios con el mismo email', async () => {
    const user1 = {
      name: 'Usuario 1',
      email: 'duplicado@test.com',
      role: 'parent' as const,
    };
    
    const user2 = {
      name: 'Usuario 2',
      email: 'duplicado@test.com',
      role: 'parent' as const,
    };

    // Insertamos el primero (debería funcionar)
    await db.insert(users).values(user1);

    // Insertamos el segundo (debería arrojar error por constraint UNIQUE en email)
    await expect(db.insert(users).values(user2)).rejects.toThrow();
  });
});

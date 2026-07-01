import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';

export async function GET() {
  const start = performance.now();
  
  try {
    // Consulta súper ligera para testear el Connection Pool de Neon
    await db.select({ id: users.id }).from(users).limit(1);
    
    const end = performance.now();
    return NextResponse.json({
      status: 'ok',
      dbLatencyMs: Math.round(end - start)
    }, { status: 200 });
  } catch (error) {
    console.error('Health Check Database Error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Database connection failed'
    }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import prisma from '../../lib/prisma';

// API endpoint для проверки работоспособности приложения и БД
export async function GET() {
  try {
    // Проверка соединения с базой данных
    await prisma.$queryRaw`SELECT 1`;

    // Если соединение успешно, возвращаем OK
    return NextResponse.json(
      { status: 'ok', message: 'Service is healthy', database: 'connected' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Health check failed:', error);

    // Если произошла ошибка подключения к БД
    return NextResponse.json(
      {
        status: 'error',
        message: 'Database connection failed',
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

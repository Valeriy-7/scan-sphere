import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../lib/prisma';
import fs from 'fs';
import path from 'path';

// API endpoint для проверки работоспособности приложения и БД
export async function GET(req: NextRequest) {
  let dbStatus = 'error';
  let staticFilesStatus = 'error';
  let cacheStatus = 'error';
  
  try {
    // Проверка подключения к базе данных
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'ok';
  } catch (error) {
    console.error('Ошибка проверки подключения к БД:', error);
    dbStatus = 'error';
  }

  // Проверка доступа к статическим файлам
  try {
    const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.png');
    const noImagePath = path.join(process.cwd(), 'public', 'images', 'no-image.svg');
    
    if (fs.existsSync(logoPath) && fs.existsSync(noImagePath)) {
      staticFilesStatus = 'ok';
    } else {
      staticFilesStatus = 'error';
      console.error('Отсутствуют некоторые статические файлы');
    }
  } catch (error) {
    console.error('Ошибка при проверке статических файлов:', error);
  }

  // Проверка доступа к кэшу изображений
  try {
    const cachePath = path.join(process.cwd(), 'public', 'images', 'cache');
    
    if (fs.existsSync(cachePath) && fs.statSync(cachePath).isDirectory()) {
      // Попытка создать временный файл для проверки прав записи
      const testFile = path.join(cachePath, `test-${Date.now()}.txt`);
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      cacheStatus = 'ok';
    } else {
      cacheStatus = 'error';
      console.error('Отсутствует директория кэша или нет прав на запись');
    }
  } catch (error) {
    console.error('Ошибка при проверке директории кэша:', error);
  }

  return NextResponse.json({
    status: dbStatus === 'ok' && staticFilesStatus === 'ok' ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
    details: {
      database: dbStatus,
      staticFiles: staticFilesStatus,
      cache: cacheStatus
    }
  });
}

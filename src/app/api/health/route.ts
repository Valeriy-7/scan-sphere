import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../lib/prisma';
import fs from 'fs';
import path from 'path';

// API endpoint для проверки работоспособности приложения и БД
export async function GET(req: NextRequest) {
  let dbStatus = 'ok';
  let staticFilesStatus = 'ok';
  let cacheStatus = 'ok';
  const errors = [];
  
  try {
    // Проверка подключения к базе данных
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    console.error('Ошибка проверки подключения к БД:', error);
    dbStatus = 'error';
    errors.push(`Ошибка БД: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Проверка доступа к статическим файлам
  try {
    const logoPngPath = path.join(process.cwd(), 'public', 'images', 'logo.png');
    const logoSvgPath = path.join(process.cwd(), 'public', 'images', 'logo.svg');
    const noImagePath = path.join(process.cwd(), 'public', 'images', 'no-image.svg');
    const faviconPath = path.join(process.cwd(), 'public', 'favicon.ico');
    
    // Проверяем наличие хотя бы одного из вариантов логотипа (PNG или SVG)
    const hasLogo = fs.existsSync(logoPngPath) || fs.existsSync(logoSvgPath);
    
    if (hasLogo && fs.existsSync(noImagePath)) {
      staticFilesStatus = 'ok';
    } else {
      staticFilesStatus = 'warning';
      const missingFiles = [];
      if (!hasLogo) missingFiles.push('logo.png/logo.svg');
      if (!fs.existsSync(noImagePath)) missingFiles.push('no-image.svg');
      if (!fs.existsSync(faviconPath)) missingFiles.push('favicon.ico');
      
      console.warn(`Отсутствуют некоторые статические файлы: ${missingFiles.join(', ')}`);
      errors.push(`Отсутствуют файлы: ${missingFiles.join(', ')}`);
    }
  } catch (error) {
    console.error('Ошибка при проверке статических файлов:', error);
    staticFilesStatus = 'error';
    errors.push(`Ошибка статических файлов: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Проверка доступа к кэшу изображений
  try {
    const cachePath = path.join(process.cwd(), 'public', 'images', 'cache');
    
    if (fs.existsSync(cachePath) && fs.statSync(cachePath).isDirectory()) {
      // Попытка создать временный файл для проверки прав записи
      const testFile = path.join(cachePath, `test-${Date.now()}.txt`);
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
    } else {
      cacheStatus = 'error';
      console.error('Отсутствует директория кэша или нет прав на запись');
      errors.push('Отсутствует директория кэша или нет прав на запись');
      
      // Попытка создать директорию кэша
      try {
        fs.mkdirSync(cachePath, { recursive: true });
        fs.chmodSync(cachePath, 0o777);
        console.log('Создана директория кэша');
        cacheStatus = 'ok';
      } catch (mkdirError) {
        console.error('Не удалось создать директорию кэша:', mkdirError);
        errors.push(`Не удалось создать директорию кэша: ${mkdirError instanceof Error ? mkdirError.message : String(mkdirError)}`);
      }
    }
  } catch (error) {
    console.error('Ошибка при проверке директории кэша:', error);
    cacheStatus = 'error';
    errors.push(`Ошибка кэша: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Определяем общий статус на основе проверок
  const overallStatus = 
    dbStatus === 'error' ? 'error' : 
    staticFilesStatus === 'error' || cacheStatus === 'error' ? 'error' :
    staticFilesStatus === 'warning' || cacheStatus === 'warning' ? 'warning' : 'ok';

  return NextResponse.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    details: {
      database: dbStatus,
      staticFiles: staticFilesStatus,
      cache: cacheStatus,
      errors: errors.length > 0 ? errors : undefined
    }
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { parseWildberries } from '../utils/wbParser';
import { saveSearchHistory } from '../../lib/history';
import prisma from '../../lib/prisma';
import { SearchResponse, Product } from '@/types';

// Увеличиваем таймаут для API роута
export const maxDuration = 300; // 300 секунд = 5 минут
export const dynamic = 'force-dynamic';

// Функция для расчета реальной позиции с учетом страницы
const calculatePosition = (
  position: number | string,
  page: number | string
): number => {
  // Преобразуем позицию в число
  const posNum =
    typeof position === 'number'
      ? position
      : typeof position === 'string'
      ? parseInt(position, 10)
      : 0;

  if (posNum <= 0) return 0;

  // Преобразуем страницу в число
  const pageNum =
    typeof page === 'number'
      ? page
      : typeof page === 'string'
      ? parseInt(page, 10)
      : 1;

  if (isNaN(pageNum)) return posNum;

  // На первой странице позиция как есть, иначе (страница-1)*100 + позиция
  return pageNum === 1 ? posNum : (pageNum - 1) * 100 + posNum;
};

export async function POST(req: NextRequest) {
  try {
    const { query, myArticleId, competitorArticleId } = await req.json();

    // Проверяем наличие обязательных параметров
    if (!query || !myArticleId) {
      return NextResponse.json(
        { error: 'Не указаны все обязательные поля (запрос и артикул)' },
        { status: 400 }
      );
    }

    // Логируем запрос
    console.log(
      `Получен запрос на парсинг: ${query}, артикулы: ${myArticleId}, ${
        competitorArticleId || 'без конкурента'
      }`
    );

    try {
      // Проверяем, есть ли уже результаты за сегодня
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Ищем последний запрос с теми же параметрами за сегодня
      const existingQuery = await prisma.searchQuery.findFirst({
        where: {
          query: query,
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
          products: {
            some: {
              article: myArticleId,
            },
          },
        },
        include: {
          products: true,
          positions: {
            include: {
              product: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Если запрос найден, проверяем совпадение указанного конкурента с запрошенным
      let useExistingQuery = false;

      if (existingQuery) {
        // Проверяем совпадение конкурента или его отсутствие
        const hasCompetitorInExistingQuery = existingQuery.products.some(
          (p) => p.isCompetitor && p.article === competitorArticleId
        );

        const requestHasCompetitor = !!competitorArticleId;
        const storedHasCompetitor = existingQuery.products.some(
          (p) => p.isCompetitor
        );

        // Используем кэш только если запрашиваемый режим совпадает с сохраненным
        // (либо оба с конкурентом и артикулы совпадают, либо оба без конкурента)
        if (
          (requestHasCompetitor &&
            storedHasCompetitor &&
            hasCompetitorInExistingQuery) ||
          (!requestHasCompetitor && !storedHasCompetitor)
        ) {
          useExistingQuery = true;
          console.log(
            `Найден кэшированный запрос от ${existingQuery.createdAt.toLocaleTimeString()}, возвращаем данные из БД`
          );
        } else {
          console.log(
            `Найден кэшированный запрос, но режим (${
              requestHasCompetitor ? 'с' : 'без'
            } конкурента) не совпадает с запрошенным. Выполняем новый запрос.`
          );
        }
      }

      // Если запрос найден и режим совпадает, формируем и возвращаем результаты из базы данных
      if (existingQuery && useExistingQuery) {
        const myProduct = existingQuery.products.find(
          (p) => p.article === myArticleId
        );
        const competitorProduct = competitorArticleId
          ? existingQuery.products.find(
              (p) => p.article === competitorArticleId
            )
          : null;

        // Если мой товар найден
        if (myProduct) {
          // Формируем объект с данными товаров
          const products: {
            my: Product;
            competitor?: Product | null;
          } = {
            my: {
              id: myArticleId,
              articleId: myArticleId,
              name: myProduct.title || 'Неизвестно',
              price: myProduct.price || 0,
              image: myProduct.imageUrl || '/images/no-image.svg',
              brand: 'Из БД',
            },
          };

          // Добавляем данные конкурента, если он указан и найден
          if (competitorArticleId && competitorProduct) {
            products.competitor = {
              id: competitorArticleId,
              articleId: competitorArticleId,
              name: competitorProduct.title || 'Неизвестно',
              price: competitorProduct.price || 0,
              image: competitorProduct.imageUrl || '/images/no-image.svg',
              brand: 'Из БД',
            };
          } else {
            // Пустой объект, если конкурент не указан или не найден
            products.competitor = null;
          }

          // Формируем данные о позициях
          const positions = [];
          const chartData = [];

          // Получаем список уникальных городов
          const cities = [
            ...new Set(existingQuery.positions.map((p) => p.city)),
          ];

          for (const city of cities) {
            const myPositions = existingQuery.positions.filter(
              (p) => p.city === city && p.product.article === myArticleId
            );

            const competitorPositions = existingQuery.positions.filter(
              (p) =>
                p.city === city && p.product.article === competitorArticleId
            );

            const myPosition =
              myPositions.length > 0 ? myPositions[0].position : 0;
            const myPage = myPositions.length > 0 ? myPositions[0].page : 0;

            const competitorPosition =
              competitorPositions.length > 0
                ? competitorPositions[0].position
                : 0;
            const competitorPage =
              competitorPositions.length > 0 ? competitorPositions[0].page : 0;

            positions.push({
              city,
              myPosition: myPosition || 'Не найден',
              myPage: myPage || '-',
              ...(competitorArticleId
                ? {
                    competitorPosition: competitorPosition || 'Не найден',
                    competitorPage: competitorPage || '-',
                  }
                : {}),
            });

            // Рассчитываем позиции для графика с учетом номера страницы
            const calculatedMyPosition = calculatePosition(myPosition, myPage);
            const calculatedCompPosition = competitorArticleId
              ? calculatePosition(competitorPosition, competitorPage)
              : 0;

            chartData.push({
              city,
              myPosition: calculatedMyPosition,
              competitorPosition: calculatedCompPosition,
            });
          }

          // Сохраняем историю запроса в локальное хранилище
          saveSearchHistory(query, myArticleId, competitorArticleId);

          // Формируем ответ API
          const responseData: SearchResponse = {
            query: query,
            products: products,
            positions: positions,
            chartData: chartData,
          };

          // Возвращаем результаты из БД
          return NextResponse.json(responseData);
        }
      }

      // Если в кэше нет данных, делаем новый запрос к Wildberries
      console.log('Кэшированных данных нет, выполняем парсинг Wildberries');
      const result = await parseWildberries(
        query,
        myArticleId,
        competitorArticleId
      );

      // Сохраняем историю запроса в локальное хранилище
      saveSearchHistory(query, myArticleId, competitorArticleId);

      // Сохраняем данные в PostgreSQL
      try {
        // Создаем запись о поисковом запросе
        const searchQuery = await prisma.searchQuery.create({
          data: {
            query: query,
          },
        });

        // Сохраняем данные о товарах с использованием upsert
        if (result.products.my) {
          await prisma.product.upsert({
            where: { article: result.products.my.articleId },
            update: {
              title: result.products.my.name,
              price: result.products.my.price,
              imageUrl: result.products.my.image,
              searchQueryId: searchQuery.id,
            },
            create: {
              article: result.products.my.articleId,
              title: result.products.my.name,
              price: result.products.my.price,
              imageUrl: result.products.my.image,
              isCompetitor: false,
              searchQueryId: searchQuery.id,
            },
          });
        }

        if (result.products.competitor) {
          await prisma.product.upsert({
            where: { article: result.products.competitor.articleId },
            update: {
              title: result.products.competitor.name,
              price: result.products.competitor.price,
              imageUrl: result.products.competitor.image,
              searchQueryId: searchQuery.id,
            },
            create: {
              article: result.products.competitor.articleId,
              title: result.products.competitor.name,
              price: result.products.competitor.price,
              imageUrl: result.products.competitor.image,
              isCompetitor: true,
              searchQueryId: searchQuery.id,
            },
          });
        }

        // Сохраняем данные о позициях
        if (result.positions && result.positions.length > 0) {
          const myProductDB = await prisma.product.findUnique({
            where: { article: myArticleId },
          });

          const competitorProductDB = await prisma.product.findUnique({
            where: { article: competitorArticleId },
          });

          for (const posData of result.positions) {
            // Получаем номер страницы и позицию для моего товара
            const myPageStr = String(posData.myPage || '');
            const myPage = myPageStr ? parseInt(myPageStr, 10) : 0;

            const myPosStr = String(posData.myPosition || '');
            const myPosition = myPosStr ? parseInt(myPosStr, 10) : 0;

            // Если есть данные о позиции моего товара и товар найден в БД
            if (myPosition > 0 && myProductDB) {
              await prisma.position.create({
                data: {
                  city: posData.city,
                  position: myPosition,
                  page: myPage,
                  productId: myProductDB.id,
                  searchQueryId: searchQuery.id,
                },
              });
            }

            // Получаем номер страницы и позицию для товара конкурента
            const compPageStr = String(posData.competitorPage || '');
            const compPage = compPageStr ? parseInt(compPageStr, 10) : 0;

            const compPosStr = String(posData.competitorPosition || '');
            const compPosition = compPosStr ? parseInt(compPosStr, 10) : 0;

            // Если есть данные о позиции товара конкурента и товар найден в БД
            if (compPosition > 0 && competitorProductDB) {
              await prisma.position.create({
                data: {
                  city: posData.city,
                  position: compPosition,
                  page: compPage,
                  productId: competitorProductDB.id,
                  searchQueryId: searchQuery.id,
                },
              });
            }
          }
        }

        console.log(`Данные успешно сохранены в базе данных`);
      } catch (dbError) {
        console.error('Ошибка при сохранении в базу данных:', dbError);
        // Продолжаем выполнение, даже если сохранение в БД не удалось
      }

      // Возвращаем результат
      return NextResponse.json(result);
    } catch (error) {
      console.error('Ошибка при парсинге:', error);
      return NextResponse.json(
        { error: 'Ошибка при парсинге данных' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Ошибка при обработке запроса:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

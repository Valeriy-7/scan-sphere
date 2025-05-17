import { NextRequest, NextResponse } from 'next/server';
import { HistoryRecord } from '@/types';
import prisma from '../../lib/prisma';
import { CITIES } from '@/types';

// Функция для форматирования даты в формат ДД.ММ.ГГГГ
function formatDate(date: Date): string {
  return date.toLocaleDateString('ru-RU');
}

// GET запрос для получения истории поисков
export async function GET(request: NextRequest) {
  try {
    // Получение параметров запроса
    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get('articleId');
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit') as string)
      : 10; // Увеличиваем лимит для лучшего отображения истории
    const query = searchParams.get('query'); // Добавляем параметр фильтрации по поисковому запросу

    try {
      // Получаем данные из БД через Prisma
      const searchQueries = await prisma.searchQuery.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        take: limit * 2, // Получаем больше записей, чтобы после фильтрации осталось достаточно
        include: {
          products: true,
          positions: {
            include: {
              product: true,
            },
          },
        },
      });

      // Фильтруем запросы
      let filteredQueries = searchQueries;

      // Фильтруем по артикулу, если указан
      if (articleId) {
        filteredQueries = filteredQueries.filter((q) =>
          q.products.some((product) => product.article === articleId)
        );
      }

      // Фильтруем по поисковому запросу, если указан
      if (query) {
        filteredQueries = filteredQueries.filter(
          (q) => q.query.toLowerCase() === query.toLowerCase()
        );

        // Если указан и артикул, и запрос - строго фильтруем по обоим параметрам
        if (articleId) {
          // Получаем самый последний запрос с этими параметрами
          filteredQueries = filteredQueries.slice(0, 1);
        }
      }

      // Сортируем по дате создания (сначала новые)
      filteredQueries = filteredQueries.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Ограничиваем количество результатов
      filteredQueries = filteredQueries.slice(0, limit);

      // Преобразуем данные в формат HistoryRecord
      const historyRecords: HistoryRecord[] = filteredQueries.map((query) => {
        // Находим товары
        const myProduct = query.products.find((p) => !p.isCompetitor);
        const competitorProduct = query.products.find((p) => p.isCompetitor);

        // Формируем список позиций
        const positions = CITIES.map((city) => {
          // Находим позиции для текущего города (мои)
          const myPositionData = query.positions.find(
            (p) => p.city === city && p.product.isCompetitor === false
          );

          // Находим позиции конкурента для текущего города
          const competitorPositionData = query.positions.find(
            (p) => p.city === city && p.product.isCompetitor === true
          );

          // Определяем ранг и номер страницы для моих позиций
          const rank = myPositionData?.position || 0;
          const pageRank = myPositionData?.page || 0;

          // Определяем ранг и номер страницы для позиций конкурента
          const competitorRank = competitorPositionData?.position || 0;
          const competitorPageRank = competitorPositionData?.page || 0;

          return {
            city,
            rank,
            pageRank,
            competitorRank: competitorRank > 0 ? competitorRank : undefined,
            competitorPageRank:
              competitorPageRank > 0 ? competitorPageRank : undefined,
          };
        }).filter((pos) => pos.rank > 0); // Оставляем только найденные позиции

        return {
          id: query.id.toString(),
          date: formatDate(query.createdAt),
          query: query.query,
          myArticleId: myProduct?.article || '',
          competitorArticleId: competitorProduct?.article || '',
          positions,
          hasCompetitor: !!competitorProduct?.article, // Добавляем флаг наличия конкурента
        };
      });

      if (historyRecords.length === 0) {
        // Если нет данных, возвращаем пустой массив
        return NextResponse.json([]);
      }

      return NextResponse.json(historyRecords);
    } catch (dbError) {
      console.error('Ошибка при запросе к БД:', dbError);
      // В случае ошибки БД возвращаем пустой массив
      return NextResponse.json(
        { error: 'Ошибка при получении данных из БД' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Ошибка при получении истории:', error);
    return NextResponse.json(
      { error: 'Произошла ошибка при обработке запроса' },
      { status: 500 }
    );
  }
}

// POST запрос для создания новой записи в истории
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Проверка обязательных полей
    if (
      !body.query ||
      !body.myArticleId ||
      !body.competitorArticleId ||
      !body.positions
    ) {
      return NextResponse.json(
        { error: 'Не указаны все обязательные поля' },
        { status: 400 }
      );
    }

    try {
      // Сохранение в базу данных через Prisma
      const newQuery = await prisma.searchQuery.create({
        data: {
          query: body.query,
          products: {
            create: [
              { article: body.myArticleId, isCompetitor: false },
              { article: body.competitorArticleId, isCompetitor: true },
            ],
          },
          positions: {
            createMany: {
              data: body.positions.map(
                (pos: {
                  city: string;
                  rank: number;
                  pageRank: number;
                  isCompetitor?: boolean;
                }) => ({
                  city: pos.city,
                  position: pos.rank,
                  page: pos.pageRank,
                  productId: pos.isCompetitor
                    ? body.competitorArticleId
                    : body.myArticleId,
                })
              ),
            },
          },
        },
        include: {
          products: true,
          positions: true,
        },
      });

      // Формируем ответ
      const response: HistoryRecord = {
        id: newQuery.id.toString(),
        date: formatDate(newQuery.createdAt),
        query: newQuery.query,
        myArticleId: body.myArticleId,
        competitorArticleId: body.competitorArticleId,
        positions: body.positions,
        hasCompetitor: !!body.competitorArticleId, // Добавляем флаг наличия конкурента
      };

      return NextResponse.json(response, { status: 201 });
    } catch (dbError) {
      console.error('Ошибка при сохранении в БД:', dbError);
      return NextResponse.json(
        { error: 'Ошибка при сохранении данных в базу' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Ошибка при создании записи в истории:', error);
    return NextResponse.json(
      { error: 'Произошла ошибка при обработке запроса' },
      { status: 500 }
    );
  }
}

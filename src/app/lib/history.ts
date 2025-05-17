// Тип для элемента истории поиска
interface SearchHistoryItem {
  id: string;
  date: Date;
  query: string;
  myArticleId: string;
  competitorArticleId: string;
}

// Объявляем как внешнюю переменную, чтобы она была доступна из других модулей
declare global {
  // eslint-disable-next-line no-var
  var searchHistory: SearchHistoryItem[];
}

// Инициализируем историю, если она еще не существует
if (!global.searchHistory) {
  global.searchHistory = [];
}

// Функция для сохранения истории поиска
export function saveSearchHistory(
  query: string,
  myArticleId: string,
  competitorArticleId?: string
) {
  // Ограничиваем историю до 10 последних запросов
  if (global.searchHistory.length >= 10) {
    global.searchHistory.shift(); // Удаляем самый старый запрос
  }

  // Добавляем новый запрос
  global.searchHistory.push({
    id: Date.now().toString(),
    date: new Date(),
    query,
    myArticleId,
    competitorArticleId: competitorArticleId || '',
  });

  console.log(
    `Сохранен поисковый запрос: ${query}, товары: ${myArticleId}${
      competitorArticleId ? `, ${competitorArticleId}` : ' (без конкурента)'
    }`
  );
  return true;
}

'use client';

import { FC } from 'react';
import { motion } from 'framer-motion';
import { FiClock, FiSearch } from 'react-icons/fi';

interface DailyPosition {
  city: string;
  rank: number; // Позиция в поиске
  pageRank: number; // Номер страницы
  competitorRank?: number; // Позиция конкурента
  competitorPageRank?: number; // Номер страницы конкурента
}

interface HistoryDay {
  id?: string; // Добавляем id для более точной фильтрации
  date: string;
  query: string; // Поле запроса
  myArticleId: string; // Артикул товара
  competitorArticleId?: string; // Артикул конкурента (опциональный)
  positions: DailyPosition[];
  hasCompetitor?: boolean; // Флаг наличия конкурента
}

interface HistoryDisplayProps {
  history: HistoryDay[];
  isLoading?: boolean;
  searchPerformed?: boolean;
  currentQuery?: string; // Текущий поисковый запрос
}

const HistoryDisplay: FC<HistoryDisplayProps> = ({
  history,
  isLoading = false,
  searchPerformed = false,
  currentQuery = '',
}) => {
  // Убираем дубликаты по дате, ограничиваем 6 записей
  const uniqueHistory: HistoryDay[] = [];
  history.forEach((day) => {
    if (!uniqueHistory.some((d) => d.date === day.date)) {
      uniqueHistory.push(day);
    }
  });

  const limitedHistory = uniqueHistory.slice(0, 6);

  // Рассчитываем позицию с учетом страницы
  const calculateRank = (rank: number, pageRank: number): number => {
    // На первой странице позиция как есть, иначе (страница-1)*100 + позиция
    return pageRank === 1 ? rank : (pageRank - 1) * 100 + rank;
  };

  // Если поиск не был выполнен, показываем подсказку
  if (!searchPerformed) {
    return (
      <div className="bg-white/40 backdrop-blur-md rounded-xl border border-white/30 shadow-lg shadow-purple-900/5 p-4 h-full flex flex-col items-center justify-center">
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            rotate: [0, 1, -1, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="text-purple-600 mb-5"
        >
          <FiSearch size={40} />
        </motion.div>
        <p className="text-gray-600 text-center mb-2">
          Выполните поиск товаров по ключевому запросу
        </p>
        <p className="text-gray-500 text-sm text-center">
          История позиций товара будет отображаться здесь
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/40 backdrop-blur-md rounded-xl border border-white/30 shadow-lg shadow-purple-900/5 p-4 h-full flex flex-col">
      {/* Показываем индикатор загрузки */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex items-center justify-center"
        >
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-white border-t-purple-500 rounded-full animate-spin mb-3"></div>
            <p className="text-gray-700">Загрузка истории...</p>
          </div>
        </motion.div>
      )}

      {/* Показываем сообщение, если история пуста */}
      {!isLoading && limitedHistory.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex items-center justify-center"
        >
          <div className="flex flex-col items-center text-gray-600">
            <FiClock size={36} className="mb-3" />
            <p>Нет истории поиска для данного товара</p>
            <p className="text-sm mt-1">
              Выполните поиск с этим же артикулом повторно в будущем, чтобы
              увидеть динамику изменения позиций
            </p>
          </div>
        </motion.div>
      )}

      {/* Показываем историю в виде таблиц */}
      {!isLoading && limitedHistory.length > 0 && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex items-center mb-3"
          >
            <motion.h3
              initial={{ x: -20 }}
              animate={{ x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="font-medium text-lg text-gray-800 mr-auto overflow-hidden text-ellipsis"
            >
              <span className="flex items-center flex-wrap">
                <span className="mr-1">История</span>
                <span className="font-medium text-purple-700">
                  {limitedHistory[0].myArticleId}
                </span>
                {limitedHistory[0].hasCompetitor &&
                  limitedHistory[0].competitorArticleId && (
                    <span className="text-xs bg-purple-100 text-purple-800 ml-1 px-1 rounded">
                      vs {limitedHistory[0].competitorArticleId}
                    </span>
                  )}
                {currentQuery && (
                  <span className="text-sm font-normal text-gray-500 ml-1 whitespace-nowrap">
                    «{currentQuery}»
                  </span>
                )}
              </span>
            </motion.h3>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 w-full flex-1 overflow-auto">
            {limitedHistory.map((day, dayIndex) => (
              <motion.div
                key={dayIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: dayIndex * 0.1, duration: 0.4 }}
                className="rounded-xl border border-purple-100 flex flex-col h-full min-h-0 overflow-hidden bg-gradient-to-b from-white/60 to-white/40"
              >
                <div className="bg-purple-600 text-white py-2 px-3 text-center font-medium text-sm flex flex-col">
                  <span>{day.date}</span>
                </div>

                <div className="flex-1 min-h-0 overflow-auto p-0">
                  <table className="w-full text-sm">
                    <thead className="bg-purple-50">
                      <tr>
                        <th className="text-left py-1.5 px-2 text-gray-700 font-medium border-b border-purple-100">
                          Город
                        </th>
                        <th className="text-center py-1.5 px-1 text-gray-700 font-medium border-b border-purple-100">
                          Мои
                        </th>
                        {day.hasCompetitor && (
                          <th className="text-center py-1.5 px-1 text-gray-700 font-medium border-b border-purple-100">
                            Конкурент
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {day.positions.map((position, posIndex) => {
                        // Рассчитываем позиции с учетом страницы
                        const myRank = calculateRank(
                          position.rank,
                          position.pageRank
                        );

                        // Рассчитываем позицию конкурента, если она доступна
                        const competitorRank =
                          position.competitorRank && position.competitorPageRank
                            ? calculateRank(
                                position.competitorRank,
                                position.competitorPageRank
                              )
                            : undefined;

                        return (
                          <tr
                            key={posIndex}
                            className="hover:bg-purple-50 transition-colors border-b border-purple-50"
                          >
                            <td className="py-1.5 px-2 text-gray-700 font-medium">
                              {position.city}
                            </td>
                            <td className="py-1.5 px-1 text-center text-purple-700 font-medium">
                              {myRank}
                            </td>
                            {day.hasCompetitor && (
                              <td className="py-1.5 px-1 text-center text-gray-600 font-medium">
                                {competitorRank || '–'}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default HistoryDisplay;

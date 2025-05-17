'use client';

import { FC } from 'react';
import { motion } from 'framer-motion';

interface CityPosition {
  city: string;
  myPage: number | string;
  myPosition: number | string;
  competitorPage?: number | string;
  competitorPosition?: number | string;
}

interface CityPositionsTableProps {
  positions: CityPosition[];
}

const CityPositionsTable: FC<CityPositionsTableProps> = ({ positions }) => {
  return (
    <div
      className="bg-white/40 backdrop-blur-md rounded-xl border border-white/30 shadow-lg shadow-purple-900/5 p-3 h-full flex flex-col"
      style={{ maxHeight: '100%' }}
    >
      {/* Заголовок таблицы */}
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-gray-800 font-medium">Позиции в городах</h3>
      </div>

      {/* Проверяем, есть ли хоть одна позиция конкурента */}
      {(() => {
        // Проверяем, есть ли данные конкурента
        const hasCompetitorData = positions.some(
          (pos) => pos.competitorPosition && pos.competitorPosition !== '-'
        );

        return hasCompetitorData ? (
          // Если есть конкурент, выводим двойную таблицу
          <>
            {/* Заголовки столбцов с данными конкурента */}
            <div className="grid grid-cols-3 mb-2 pb-2 border-b border-white/30 select-none pointer-events-none text-sm">
              <div className="text-gray-800 font-medium text-left">Город</div>
              <div className="text-center">
                <div className="text-gray-800 font-medium">Страница</div>
                <div className="text-xs text-gray-500 flex justify-center mt-1">
                  <span className="text-purple-700 w-10 text-center">Моя</span>
                  <span className="text-gray-600 w-10 text-center">Конк.</span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-800 font-medium">Позиция</div>
                <div className="text-xs text-gray-500 flex justify-center mt-1">
                  <span className="text-purple-700 w-10 text-center">Моя</span>
                  <span className="text-gray-600 w-10 text-center">Конк.</span>
                </div>
              </div>
            </div>

            {/* Контейнер со скроллом и фиксированной высотой */}
            <div
              className="overflow-auto flex-1"
              style={{
                height: 'calc(100% - 100px)',
                minHeight: '120px',
                maxHeight: 'calc(100% - 100px)',
              }}
            >
              {positions.length > 0 ? (
                <div className="h-auto">
                  {positions.map((position, index) => (
                    <motion.div
                      key={`${position.city}-${index}`}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`grid grid-cols-3 py-1.5 text-sm ${
                        index !== positions.length - 1
                          ? 'border-b border-white/20'
                          : ''
                      } hover:bg-white/30 transition-colors duration-200 select-none`}
                    >
                      <div className="text-left font-medium pl-2 truncate">
                        {position.city}
                      </div>
                      <div className="text-center">
                        <div className="flex justify-center">
                          <span className="text-purple-700 font-medium w-10">
                            {position.myPage}
                          </span>
                          <span className="text-gray-600 font-medium w-10">
                            {position.competitorPage}
                          </span>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="flex justify-center">
                          <span className="text-purple-700 font-medium w-10">
                            {position.myPosition}
                          </span>
                          <span className="text-gray-600 font-medium w-10">
                            {position.competitorPosition}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-[120px] flex items-center justify-center text-gray-600 text-sm"
                >
                  Нет данных о позициях
                </motion.div>
              )}
            </div>

            {/* Легенда цветов */}
            <div className="mt-auto pt-2 border-t border-white/30 flex justify-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-purple-700"></div>
                <span className="text-gray-700">Мои</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-gray-600"></div>
                <span className="text-gray-700">Конкурент</span>
              </div>
            </div>
          </>
        ) : (
          // Если нет данных конкурента, показываем упрощенную таблицу
          <>
            {/* Заголовки столбцов без данных конкурента */}
            <div className="grid grid-cols-3 mb-2 pb-2 border-b border-white/30 select-none pointer-events-none text-sm">
              <div className="text-gray-800 font-medium text-left">Город</div>
              <div className="text-center text-gray-800 font-medium">
                Страница
              </div>
              <div className="text-center text-gray-800 font-medium">
                Позиция
              </div>
            </div>

            {/* Контейнер со скроллом и фиксированной высотой */}
            <div
              className="overflow-auto flex-1"
              style={{
                height: 'calc(100% - 100px)',
                minHeight: '120px',
                maxHeight: 'calc(100% - 100px)',
              }}
            >
              {positions.length > 0 ? (
                <div className="h-auto">
                  {positions.map((position, index) => (
                    <motion.div
                      key={`${position.city}-${index}`}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`grid grid-cols-3 py-1.5 text-sm ${
                        index !== positions.length - 1
                          ? 'border-b border-white/20'
                          : ''
                      } hover:bg-white/30 transition-colors duration-200 select-none`}
                    >
                      <div className="text-left font-medium pl-2 truncate">
                        {position.city}
                      </div>
                      <div className="text-center">
                        <span className="text-purple-700 font-medium">
                          {position.myPage}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-purple-700 font-medium">
                          {position.myPosition}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-[120px] flex items-center justify-center text-gray-600 text-sm"
                >
                  Нет данных о позициях
                </motion.div>
              )}
            </div>

            {/* Легенда цветов для одного товара */}
            <div className="mt-auto pt-2 border-t border-white/30 flex justify-center text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-purple-700"></div>
                <span className="text-gray-700">Мои позиции</span>
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
};

export default CityPositionsTable;

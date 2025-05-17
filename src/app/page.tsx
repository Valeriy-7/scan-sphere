'use client';

import {
  ProductDisplay,
  CityPositionsTable,
  PositionChart,
  HistoryDisplay,
} from './components';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import ClientWrapper from './ClientWrapper';
import {
  ChartDataPoint,
  CityPosition,
  HistoryRecord,
  SearchResponse,
} from '@/types';
import { FiBarChart2, FiActivity } from 'react-icons/fi';

export default function Home() {
  // Добавляем состояние для данных
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [cityPositions, setCityPositions] = useState<CityPosition[]>([]);
  const [historyData, setHistoryData] = useState<HistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [currentQuery, setCurrentQuery] = useState(''); // Текущий поисковый запрос
  const [currentArticleId, setCurrentArticleId] = useState(''); // Текущий артикул товара

  // Загрузка начальных данных истории
  useEffect(() => {
    fetchHistory();
  }, []);

  // Получение данных истории
  const fetchHistory = async () => {
    try {
      setIsLoading(true);

      // Параметры запроса для фильтрации истории
      const params = new URLSearchParams();

      // Фильтруем строго по конкретному артикулу и по конкретному запросу
      if (currentArticleId) {
        params.append('articleId', currentArticleId);
      }

      // Обязательно фильтруем по точному запросу (ключевые слова)
      if (currentQuery) {
        params.append('query', currentQuery);
      }

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await fetch(`/api/history${queryString}`);

      if (!response.ok) {
        throw new Error('Ошибка при загрузке истории');
      }
      const data = await response.json();
      setHistoryData(data);

      // Если есть история, берем последнюю запись для отображения
      if (data.length > 0) {
        updateDisplayData(data[0]);
      }
    } catch (error) {
      console.error('Ошибка загрузки истории:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Обновление данных для отображения
  const updateDisplayData = (historyItem: HistoryRecord) => {
    // Обновляем графические данные
    const chartDataFromHistory = historyItem.positions.map((pos) => ({
      city: pos.city,
      myPosition:
        pos.pageRank === 1 ? pos.rank : (pos.pageRank - 1) * 100 + pos.rank,
      // В истории нет данных конкурента, используем заглушку
      competitorPosition:
        pos.competitorRank && pos.competitorPageRank
          ? pos.competitorPageRank === 1
            ? pos.competitorRank
            : (pos.competitorPageRank - 1) * 100 + pos.competitorRank
          : 0,
    }));
    setChartData(chartDataFromHistory);
  };

  // Обработчик завершения поиска
  const handleSearchComplete = (data: SearchResponse) => {
    setCityPositions(data.positions);
    setChartData(data.chartData);
    setSearchPerformed(true);
    setCurrentQuery(data.query || ''); // Сохраняем текущий запрос

    // Сохраняем артикул основного товара для фильтрации истории
    if (data.products?.my?.articleId) {
      // Если сменился артикул, очищаем историю
      if (currentArticleId !== data.products.my.articleId) {
        setHistoryData([]);
      }
      setCurrentArticleId(data.products.my.articleId);
    }

    // Обновляем историю после выполнения поиска, чтобы отобразить новые данные
    // Устанавливаем небольшую задержку, чтобы данные успели сохраниться в БД
    setTimeout(() => {
      fetchHistory();
    }, 300);
  };

  // Анимационные варианты
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 80,
      },
    },
  };

  // Компонент подсказки для отображения вместо таблицы
  const TablePlaceholder = () => (
    <div className="h-full flex flex-col items-center justify-center bg-white/40 backdrop-blur-md rounded-xl border border-white/30 shadow-lg shadow-purple-900/5 p-4">
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
        className="text-purple-600 mb-4"
      >
        <FiBarChart2 size={40} />
      </motion.div>
      <p className="text-gray-600 text-center">
        Введите поисковый запрос и артикулы товаров,
        <br />
        чтобы увидеть их позиции в городах
      </p>
    </div>
  );

  // Компонент подсказки для отображения вместо графика
  const ChartPlaceholder = () => (
    <div className="h-full flex flex-col items-center justify-center bg-white/40 backdrop-blur-md rounded-xl border border-white/30 shadow-lg shadow-purple-900/5 p-4">
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
        className="text-purple-600 mb-4"
      >
        <FiActivity size={40} />
      </motion.div>
      <p className="text-gray-600 text-center">
        Выполните поиск, чтобы увидеть сравнительный анализ
        <br />
        позиций товаров на графике
      </p>
    </div>
  );

  return (
    <ClientWrapper>
      <motion.main
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="h-screen overflow-hidden p-3"
      >
        <div className="h-full max-w-full mx-auto flex flex-col">
          <div
            className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-3"
            style={{ height: '50%' }}
          >
            {/* Товары и поиск - 3/12 */}
            <motion.div
              className="lg:col-span-3 h-full"
              variants={itemVariants}
            >
              <ProductDisplay
                products={[]}
                onSearchComplete={handleSearchComplete}
              />
            </motion.div>

            {/* Таблица - 3/12 */}
            <motion.div
              className="lg:col-span-3 h-full"
              variants={itemVariants}
            >
              {searchPerformed ? (
                <CityPositionsTable positions={cityPositions} />
              ) : (
                <TablePlaceholder />
              )}
            </motion.div>

            {/* График - 6/12 */}
            <motion.div
              className="lg:col-span-6 h-full"
              variants={itemVariants}
            >
              {searchPerformed ? (
                <PositionChart data={chartData} />
              ) : (
                <ChartPlaceholder />
              )}
            </motion.div>
          </div>
          <motion.div variants={itemVariants} style={{ height: '50%' }}>
            <HistoryDisplay
              history={historyData}
              isLoading={isLoading}
              searchPerformed={searchPerformed}
              currentQuery={currentQuery}
            />
          </motion.div>
        </div>
      </motion.main>
    </ClientWrapper>
  );
}

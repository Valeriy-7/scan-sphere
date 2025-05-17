'use client';

import { FC, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  ErrorBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  Line,
  LabelList,
} from 'recharts';

interface ChartDataPoint {
  city: string;
  myPosition: number;
  competitorPosition: number;
}

interface PositionChartProps {
  data: ChartDataPoint[];
}

type ChartDataExtended = {
  city: string;
  myPosition: number;
  competitorPosition: number;
  low: number;
  high: number;
  height: number;
  isWinning: boolean;
  hasCompetitor: boolean;
  errorHighUp: number | null;
  errorLowUp: number | null;
  errorHighDown: number | null;
  errorLowDown: number | null;
  errorLineHigh: number;
  errorLineLow: number;
};

// Тип для кастомных лейблов
interface LabelProps {
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
}

const PositionChart: FC<PositionChartProps> = ({ data }) => {
  const [animKey, setAnimKey] = useState(0);
  const [chartData, setChartData] = useState<ChartDataExtended[]>([]);
  const [chartRange, setChartRange] = useState<[number, number]>([0, 0]);

  // Преобразуем данные под формат свечей
  useEffect(() => {
    setAnimKey((prev) => prev + 1);
    // Проверяем, есть ли данные конкурента, чтобы определить формат отображения
    const hasCompetitorData = data.some((item) => item.competitorPosition > 0);

    // Преобразуем и фильтруем данные
    const newData: ChartDataExtended[] = data
      .map((item) => {
        // Безопасное получение позиций (защита от undefined)
        const myPos = item.myPosition || 0;
        const compPos = item.competitorPosition || 0;
        const compExists = hasCompetitorData && compPos > 0;

        // Рассчитываем параметры для свечного графика
        const low = compExists ? Math.min(myPos, compPos) : myPos;
        const high = compExists ? Math.max(myPos, compPos) : myPos;
        const heightRaw = compExists ? Math.abs(myPos - compPos) : 0;

        // Минимальное значение высоты для отображения на графике
        const height = heightRaw === 0 ? 0.0001 : heightRaw;

        // Определяем, выигрывает ли наш товар (позиция меньше = лучше)
        const isWinning =
          !compExists ||
          (myPos > 0 && compPos === 0) ||
          (myPos > 0 && compPos > 0 && myPos <= compPos);

        // Параметры для отрисовки шестов свечей
        const maxOC = compExists ? Math.max(myPos, compPos) : myPos;
        const minOC = compExists ? Math.min(myPos, compPos) : myPos;
        const errHigh = high - maxOC;
        const errLow = minOC - low;

        return {
          city: item.city,
          myPosition: myPos,
          competitorPosition: compPos,
          low,
          high,
          height,
          isWinning,
          hasCompetitor: compExists,
          // Определяем параметры для шестов свечей в зависимости от положения
          errorHighUp: isWinning && compExists ? errHigh : null,
          errorLowUp: isWinning && compExists ? errLow : null,
          errorHighDown: !isWinning && compExists ? errHigh : null,
          errorLowDown: !isWinning && compExists ? errLow : null,
          errorLineHigh: maxOC + errHigh / 2,
          errorLineLow: minOC - errLow / 2,
        };
      })
      .filter((item) => item.myPosition > 0 || item.competitorPosition > 0);

    setChartData(newData);

    // Определяем диапазон значений для Y-оси
    if (newData.length > 0) {
      const allValues = newData
        .flatMap((item) => [
          item.myPosition,
          item.competitorPosition > 0 ? item.competitorPosition : null,
        ])
        .filter((val) => val !== null) as number[];

      const minVal = Math.min(...allValues);
      const maxVal = Math.max(...allValues);
      setChartRange([minVal, maxVal]);
    }
  }, [data]);

  // Если нет данных совсем, показываем заглушку
  if (data.length === 0) {
    return (
      <div className="bg-white/40 backdrop-blur-md rounded-xl border border-white/30 shadow-lg shadow-purple-900/5 p-3 h-full flex flex-col justify-center items-center">
        <p className="text-gray-600 text-center mb-4">
          Выполните поиск чтобы увидеть позиции товара в городах
        </p>
      </div>
    );
  }

  // Форматтер для отображения значений позиций
  const valueFormatter = (value: number | undefined) => {
    if (value === undefined || value === 0) return '';
    return String(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white/40 backdrop-blur-md rounded-xl border border-white/30 shadow-lg shadow-purple-900/5 p-3 h-full flex flex-col"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex justify-between items-center mb-2"
      >
        <h3 className="font-medium text-gray-800">Сравнение позиций</h3>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-sm bg-green-500 shadow-lg shadow-green-500/30"></div>
            <span className="text-gray-600">Мои товары</span>
          </div>
          {/* Показываем легенду конкурента только если есть хотя бы один элемент с конкурентом */}
          {data.some((item) => item.competitorPosition > 0) && (
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-sm bg-red-500 shadow-lg shadow-red-500/30"></div>
              <span className="text-gray-600">Товары конкурента</span>
            </div>
          )}
        </div>
      </motion.div>

      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={`chart-${animKey}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 40, right: 30, left: 15, bottom: 40 }}
                barSize={40}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="city"
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis
                  type="number"
                  domain={[
                    (dataMin: number) => Math.max(1, dataMin - 2),
                    (dataMax: number) => dataMax + 2,
                  ]}
                  tickCount={5}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  reversed={true}
                />
                <Bar dataKey="low" fillOpacity={0} stackId="stack" />
                <Bar
                  dataKey="height"
                  stackId="stack"
                  barSize={40}
                  isAnimationActive
                  fill="#4ade80"
                >
                  {/* Метки конкурента над барами (красные) */}
                  <LabelList
                    dataKey="competitorPosition"
                    position="top"
                    offset={6}
                    fill="#ff4747"
                    fontSize={12}
                    fontWeight="bold"
                    formatter={valueFormatter}
                  />
                  {/* Метки моей позиции под барами (зеленые) */}
                  <LabelList
                    dataKey="myPosition"
                    position="bottom"
                    offset={6}
                    fill="#4ade80"
                    fontSize={12}
                    fontWeight="bold"
                    formatter={valueFormatter}
                  />
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isWinning ? '#4ade80' : '#f87171'}
                      stroke={entry.isWinning ? '#22c55e' : '#ef4444'}
                      style={{
                        filter: `drop-shadow(0 4px 3px rgb(${
                          entry.isWinning ? '34 197 94' : '239 68 68'
                        } / 0.4))`,
                      }}
                    />
                  ))}
                </Bar>

                <Line
                  dataKey="errorLineLow"
                  stroke="none"
                  isAnimationActive={false}
                  dot={false}
                >
                  <ErrorBar
                    dataKey="errorLowDown"
                    width={3}
                    strokeWidth={2}
                    stroke="#f87171"
                  />
                </Line>
                <Line
                  dataKey="errorLineHigh"
                  stroke="none"
                  isAnimationActive={false}
                  dot={false}
                >
                  <ErrorBar
                    dataKey="errorHighDown"
                    width={3}
                    strokeWidth={2}
                    stroke="#f87171"
                  />
                </Line>
                <Line
                  dataKey="errorLineHigh"
                  stroke="none"
                  isAnimationActive={false}
                  dot={false}
                >
                  <ErrorBar
                    dataKey="errorHighUp"
                    width={3}
                    strokeWidth={2}
                    stroke="#4ade80"
                  />
                </Line>
                <Line
                  dataKey="errorLineLow"
                  stroke="none"
                  isAnimationActive={false}
                  dot={false}
                >
                  <ErrorBar
                    dataKey="errorLowUp"
                    width={3}
                    strokeWidth={2}
                    stroke="#4ade80"
                  />
                </Line>
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-auto pt-2 text-center text-xs text-gray-500">
        <span>Чем ниже значение, тем лучше позиция в поиске</span>
      </div>
    </motion.div>
  );
};

export default PositionChart;

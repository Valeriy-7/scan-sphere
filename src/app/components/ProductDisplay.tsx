'use client';

import Image from 'next/image';
import { FC, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowRight, FiPackage } from 'react-icons/fi';
import { SearchResponse } from '@/types';

interface Product {
  name: string;
  articleId: string;
  price: number;
  image: string;
}

interface ProductDisplayProps {
  products: Product[];
  onSearchComplete?: (data: SearchResponse) => void;
}

const ProductDisplay: FC<ProductDisplayProps> = ({
  products: initialProducts,
  onSearchComplete,
}) => {
  const [query, setQuery] = useState('');
  const [myArticle, setMyArticle] = useState('');
  const [competitorArticle, setCompetitorArticle] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Имитация поиска
  const handleSearch = async () => {
    if (!query || !myArticle) {
      // Показываем тестовые данные, если не заполнены все поля
      setIsSearching(true);
      setProducts([]);

      // Имитируем загрузку данных
      setTimeout(() => {
        setProducts(initialProducts);
        setIsSearching(false);
      }, 800);
      return;
    }

    try {
      setIsSearching(true);
      setProducts([]);

      // Делаем реальный API-запрос
      const response = await fetch('/api/parser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          myArticleId: myArticle,
          competitorArticleId: competitorArticle || '', // Пустая строка, если артикул конкурента не указан
        }),
      });

      if (!response.ok) {
        throw new Error('Ошибка при выполнении запроса');
      }

      const data: SearchResponse = await response.json();

      // Обновляем локальное состояние
      const productsList = [data.products.my];
      // Добавляем товар конкурента только если он есть
      if (competitorArticle && data.products.competitor) {
        productsList.push(data.products.competitor);
      }
      setProducts(productsList);

      // Передаем данные для обновления родительского компонента
      if (onSearchComplete) {
        onSearchComplete(data);
      }
    } catch (error) {
      console.error('Ошибка при поиске:', error);
      alert('Произошла ошибка при поиске. Пожалуйста, попробуйте еще раз.');
    } finally {
      setIsSearching(false);
    }
  };

  // Автоматический поиск при нажатии Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="p-4 rounded-xl h-full flex flex-col relative overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at top right, #f8c4ff, #a468ef, #7e52eb, #667aef)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderRadius: '1rem',
      }}
    >
      {/* Форма поиска */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-col gap-3 mb-4 z-10"
      >
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введите запрос..."
            className="bg-white/90 w-full px-4 py-2.5 rounded-full outline-none text-sm shadow-md"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSearch}
            className="absolute right-1 top-1 bg-pink-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-md"
          >
            <FiArrowRight size={18} />
          </motion.button>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute left-3 top-2.5 text-gray-400">
              <FiPackage size={16} />
            </div>
            <input
              type="text"
              value={myArticle}
              onChange={(e) => setMyArticle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Мой артикул"
              className="bg-white/80 w-full pl-9 pr-3 py-2 rounded-full outline-none text-sm shadow-md"
            />
          </div>
          <div className="relative flex-1">
            <div className="absolute left-3 top-2.5 text-gray-400">
              <FiPackage size={16} />
            </div>
            <input
              type="text"
              value={competitorArticle}
              onChange={(e) => setCompetitorArticle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Артикул конк."
              className="bg-white/80 w-full pl-9 pr-3 py-2 rounded-full outline-none text-sm shadow-md"
            />
          </div>
        </div>
      </motion.div>

      {/* Индикатор загрузки */}
      {isSearching && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex items-center justify-center"
        >
          <div className="flex justify-center">
            <div className="w-10 h-10 border-4 border-transparent border-t-pink-500 rounded-full animate-spin"></div>
          </div>
        </motion.div>
      )}

      {/* Список товаров */}
      {!isSearching && (
        <div className="flex-1 overflow-auto flex flex-col gap-2">
          <AnimatePresence>
            {products && products.length > 0
              ? products.map((product, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.15,
                      type: 'spring',
                      stiffness: 100,
                    }}
                    whileHover={{
                      scale: 1.02,
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    }}
                    className="bg-white rounded-xl p-3 flex items-center"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <motion.div
                        className="relative w-16 h-16 min-w-16 rounded-lg overflow-hidden"
                        whileHover={{ scale: 1.05 }}
                      >
                        <Image
                          src={product.image}
                          alt={product.name}
                          width={64}
                          height={64}
                          className="object-cover"
                          onError={(e) => {
                            // Заменяем битые изображения на заглушку
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = '/images/no-image.svg';
                          }}
                        />
                      </motion.div>
                      <div className="flex-1 mr-2">
                        <h3 className="font-bold text-sm">{product.name}</h3>
                        <p className="text-gray-500 text-xs">
                          {product.articleId}
                        </p>
                      </div>
                      <div className="font-bold text-right whitespace-nowrap bg-gray-100 px-3 py-1 rounded-full">
                        {product.price.toLocaleString()} ₽
                      </div>
                    </div>
                  </motion.div>
                ))
              : null}
          </AnimatePresence>

          {/* Подсказка, что нужно ввести артикулы */}
          {products.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center text-white/80 flex-1 flex flex-col justify-center items-center p-4"
            >
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                  rotate: [0, 2, -2, 0],
                }}
                transition={{
                  repeat: Infinity,
                  repeatType: 'mirror',
                  duration: 2,
                }}
              >
                <FiPackage size={40} className="mb-3" />
              </motion.div>
              <p className="text-sm">
                Введите артикулы и нажмите поиск для сравнения товаров
              </p>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default ProductDisplay;

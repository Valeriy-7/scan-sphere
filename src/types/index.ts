// Типы товаров
export interface Product {
  id: string;
  name: string;
  articleId: string;
  price: number;
  image: string;
  brand?: string;
}

// Типы позиций товаров в городах
export interface CityPosition {
  city: string;
  myPage: number | string;
  myPosition: number | string;
  competitorPage?: number | string;
  competitorPosition?: number | string;
}

// Типы данных для графика
export interface ChartDataPoint {
  city: string;
  myPosition: number;
  competitorPosition: number;
}

// Типы истории поисков
export interface HistoryRecord {
  id: string;
  date: string;
  query: string;
  myArticleId: string;
  competitorArticleId?: string;
  positions: {
    city: string;
    rank: number;
    pageRank: number;
    competitorRank?: number;
    competitorPageRank?: number;
  }[];
  hasCompetitor?: boolean;
}

// Запрос на поиск
export interface SearchRequest {
  query: string;
  myArticleId: string;
  competitorArticleId?: string;
}

// Ответ на поиск
export interface SearchResponse {
  query: string;
  products: {
    my: Product;
    competitor?: Product | null;
  };
  positions: CityPosition[];
  chartData: ChartDataPoint[];
}

// Города для поиска
export const CITIES = [
  'Москва',
  'СПб',
  'Казань',
  'Краснодар',
  'Екатеринбург',
  'Новосибирск',
  'Хабаровск',
  'Владивосток',
];

// Города для поиска с кодами WB
export const CITY_CODES = {
  Москва: 'msk',
  СПб: 'spb',
  Казань: 'kzn',
  Краснодар: 'krd',
  Екатеринбург: 'ekb',
  Новосибирск: 'nsk',
  Хабаровск: 'khb',
  Владивосток: 'vvo',
};

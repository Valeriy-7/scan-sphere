/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.wbbasket.ru',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.wbstatic.net',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/svg+xml'],
    minimumCacheTTL: 60,
  },
  // Увеличиваем таймаут для API запросов
  experimental: {
    serverComponentsExternalPackages: ['puppeteer'],
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Настройки прокси для решения проблемы с CORS
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
      // Прямой доступ к статическим файлам
      {
        source: '/images/:path*',
        destination: '/images/:path*',
      },
    ];
  },
  // Повышаем лимит времени обработки запросов
  serverRuntimeConfig: {
    responseLimit: '5mb',
    bodyParser: {
      sizeLimit: '5mb',
    },
  },
  // Настройки для оптимизации и кэширования
  staticPageGenerationTimeout: 180,
  distDir: '.next',
  // Отключаем строгий режим для изображений
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;

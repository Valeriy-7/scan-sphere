/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
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
};

module.exports = nextConfig;

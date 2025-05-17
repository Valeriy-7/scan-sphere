import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Парсер товаров',
  description: 'Сервис отслеживания позиций товаров',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className="font-sans antialiased"
        style={{
          background: 'linear-gradient(to right, #9DA8F9, #FCE7FF)',
          height: '100vh',
          margin: 0,
          padding: 0,
        }}
      >
        {children}
      </body>
    </html>
  );
}

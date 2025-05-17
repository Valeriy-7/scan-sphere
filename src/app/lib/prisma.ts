import { PrismaClient } from '../../generated/prisma';

// PrismaClient является тяжелым для инстанцирования,
// поэтому мы глобально сохраняем одиночный экземпляр
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;

import "dotenv/config";
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client';

// 全局变量类型定义，用于避免热更新时创建多个 Prisma 实例
const globalForPrisma = global as unknown as { 
  prisma: PrismaClient;
};

// 创建 MariaDB adapter
const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectionLimit: 5
});

// 使用全局变量避免开发环境热更新时创建多个实例
export const prisma =
  globalForPrisma.prisma || new PrismaClient({ adapter });

// 在开发环境中将实例保存到全局变量
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
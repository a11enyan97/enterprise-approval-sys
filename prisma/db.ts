import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`;

const adapter = new PrismaPg({
  connectionString,
  connectionTimeoutMillis: 10_000,
  max: 5,
});

const prisma = new PrismaClient({ adapter });

export { prisma };

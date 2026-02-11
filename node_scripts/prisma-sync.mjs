#!/usr/bin/env node
/**
 * Prisma 数据模型同步脚本
 * 修改 schema 后运行此脚本，将自动：
 * 1. 根据 schema 变更创建迁移（如有）
 * 2. 应用迁移到数据库
 * 3. 重新生成 Prisma Client
 *
 * 用法：
 *   node scripts/prisma-sync.mjs
 *   node scripts/prisma-sync.mjs --name 自定义迁移名
 *   npm run db:sync
 */

import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

const args = process.argv.slice(2);
const nameIndex = args.indexOf("--name");
const migrationName =
  nameIndex >= 0 && args[nameIndex + 1]
    ? args[nameIndex + 1]
    : `sync_${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, "").replace(" ", "_")}`;

function run(cmd, description) {
  console.log(`\n> ${description}`);
  try {
    execSync(cmd, {
      cwd: rootDir,
      stdio: "inherit",
    });
  } catch (e) {
    process.exit(e.status ?? 1);
  }
}

console.log("Prisma 数据模型同步...");

run(
  `npx prisma migrate dev --name "${migrationName}"`,
  "创建并应用迁移 + 重新生成 Client（如有 schema 变更）"
);

console.log("\n同步完成。");

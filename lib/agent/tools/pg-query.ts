// lib/agent/tools/pg-query.ts
// 数据库查询工具：用于查询 PostgreSQL 中的用户会话和记忆数据

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import type { PrismaClient } from "@/generated/prisma/client";

/** SQL 查询入参 schema，Zod 校验 + 安全约束 */
const pgQueryInputSchema = z
  .object({
    query: z.string().min(1, "query 不能为空"),
  })
  .refine((v) => v.query.trim().toUpperCase().startsWith("SELECT"), {
    message: "仅支持 SELECT 查询，禁止 INSERT/UPDATE/DELETE 等写操作",
  });

export type PgQueryInput = z.infer<typeof pgQueryInputSchema>;

export interface CreatePgQueryToolOptions {
  sessionId: string;
  prisma: PrismaClient;
}

/**
 * 创建 PostgreSQL 查询工具
 * 使用 Zod schema 约束入参，降低 LLM 幻觉导致的调用失败
 */
export function createPgQueryTool(
  options: CreatePgQueryToolOptions,
): DynamicStructuredTool<typeof pgQueryInputSchema> {
  const { sessionId, prisma } = options;

  return new DynamicStructuredTool({
    name: "pg_query",
    description:
      "用于查询 PostgreSQL 数据库中的用户会话和记忆数据。传入 query 字段（合法的 SQL SELECT 语句）。例如：SELECT * FROM agent_sessions WHERE user_id = 1",
    schema: pgQueryInputSchema,
    func: async ({ query }) => {
      try {
        // 安全校验：仅允许 SELECT 查询（避免恶意操作）
        const trimmed = query.trim().toUpperCase();
        if (!trimmed.startsWith("SELECT")) {
          throw new Error("仅支持 SELECT 查询");
        }

        // 执行查询, 使用$queryRawUnsafe不安全！！！但是在这个工具中用$queryRaw参数化查询也不行
        //    因为这个工具是一个通用SQL执行工具,LLM生成的不仅仅是参数,而是整条SQL语句
        //    所以需要使用$queryRawUnsafe来执行SQL语句。
        // 解决方案：数据库权限控制 + 代码层正则校验
        const result = await prisma.$queryRawUnsafe(query);

        // 记录工具调用日志
        await prisma.toolCallLog.create({
          data: {
            sessionId,
            toolName: "pg_query",
            input: { query } as object,
            output: result as object,
            status: "success",
          },
        });

        return JSON.stringify(result);
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : "未知错误";

        // 记录失败日志
        await prisma.toolCallLog.create({
          data: {
            sessionId,
            toolName: "pg_query",
            input: { query } as object,
            status: "failed",
            error: errMsg,
          },
        });

        return `查询失败: ${errMsg}`;
      }
    },
  });
}

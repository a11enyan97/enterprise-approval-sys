// lib/agent/tools/index.ts
// Agent 工具统一导出

import type { StructuredToolInterface } from "@langchain/core/tools";
import type { PrismaClient } from "@/generated/prisma/client";
import { createPgQueryTool } from "./pg-query";
import { createHttpRequestTool } from "./http-request";

export { createPgQueryTool } from "./pg-query";
export { createHttpRequestTool } from "./http-request";

export interface GetAgentToolsOptions {
  sessionId: string;
  prisma: PrismaClient;
}

/**
 * 获取 Agent 可用工具列表
 * 工具均使用 Zod schema 约束入参，降低 LLM 幻觉风险
 */
export function getAgentTools(
  options: GetAgentToolsOptions,
): StructuredToolInterface[] {
  const { sessionId, prisma } = options;
  return [
    createPgQueryTool({ sessionId, prisma }),
    createHttpRequestTool({ sessionId, prisma }),
  ];
}

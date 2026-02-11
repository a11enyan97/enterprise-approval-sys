// lib/agent/tools/http-request.ts
// 外部 HTTP 请求工具：用于调用外部 API

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import type { PrismaClient } from "@/generated/prisma/client";

/** HTTP 请求入参 schema，Zod 校验防止 LLM 幻觉 */
const httpRequestInputSchema = z.object({
  url: z.url({ message: "url 必须是合法 URL" }),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  data: z.record(z.string(), z.unknown()).optional(),
});

export type HttpRequestInput = z.infer<typeof httpRequestInputSchema>;

export interface CreateHttpRequestToolOptions {
  sessionId: string;
  prisma: PrismaClient;
}

/**
 * 创建外部 HTTP 请求工具
 * 使用 Zod schema 约束入参，降低 LLM 幻觉导致的调用失败
 */
export function createHttpRequestTool(
  options: CreateHttpRequestToolOptions,
): DynamicStructuredTool<typeof httpRequestInputSchema> {
  const { sessionId, prisma } = options;

  return new DynamicStructuredTool({
    name: "http_request",
    description:
      "用于调用外部 HTTP API。传入 url（必填）、method（GET/POST/PUT/PATCH/DELETE）、data（可选，请求体 JSON）",
    schema: httpRequestInputSchema,
    func: async ({ url, method, data }) => {
      try {
        const response = await fetch(url, {
          method,
          headers:
            method !== "GET" && data
              ? { "Content-Type": "application/json" }
              : undefined,
          body: method !== "GET" && data ? JSON.stringify(data) : undefined,
        });

        const text = await response.text();
        let result: unknown;
        try {
          result = JSON.parse(text);
        } catch {
          result = text;
        }

        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}: ${typeof result === "string" ? result : JSON.stringify(result)}`,
          );
        }

        await prisma.toolCallLog.create({
          data: {
            sessionId,
            toolName: "http_request",
            input: { url, method, data } as object,
            output: (typeof result === "object" ? result : { data: result }) as object,
            status: "success",
          },
        });

        return typeof result === "string" ? result : JSON.stringify(result);
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : "未知错误";

        await prisma.toolCallLog.create({
          data: {
            sessionId,
            toolName: "http_request",
            input: { url, method, data } as object,
            status: "failed",
            error: errMsg,
          },
        });

        return `请求失败: ${errMsg}`;
      }
    },
  });
}

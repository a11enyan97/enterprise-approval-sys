// lib/agent/memory/long-term.ts
// 长期记忆：按用户维度存储，跨会话持久化，用于注入 LLM 上下文（如偏好、历史摘要）

import type { PrismaClient } from "@/generated/prisma/client";

/** 长期记忆的 type 字段值 */
export const MEMORY_TYPE_LONG = "long";

/** 长期记忆 content 的存储格式 */
export interface LongTermMemoryContent {
  content: string; // 记忆文本，如 "用户偏好简洁的回复风格"
  /** 可选分类，如 preference | fact | summary */
  category?: string;
}

export interface GetLongTermMemoryOptions {
  /** 最多获取条数，默认 10，避免 LLM 上下文溢出 */
  limit?: number;
}

/**
 * 获取用户的长期记忆，格式化为可注入 LLM 的字符串
 *
 * @example
 * // 在构建 system prompt 时注入
 * const longTerm = await getLongTermMemory(userId, prisma);
 * const systemPrompt = `你是一个助手。以下是关于该用户的长期记忆：\n${longTerm}`;
 */
export async function getLongTermMemory(
  userId: number,
  prisma: PrismaClient,
  options: GetLongTermMemoryOptions = {},
): Promise<string> {
  const { limit = 10 } = options;

  const memories = await prisma.memory.findMany({
    where: {
      type: MEMORY_TYPE_LONG,
      OR: [{ userId }, { session: { userId } }],
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { content: true, createdAt: true },
  });

  if (memories.length === 0) return "";

  return memories
    .map((m) => {
      const content = m.content as { content?: string };
      const text =
        typeof content?.content === "string"
          ? content.content
          : JSON.stringify(content);
      return `[${m.createdAt.toISOString()}]: ${text}`;
    })
    .join("\n");
}

/**
 * 添加一条长期记忆
 *
 * @param content 记忆内容，可以是字符串或结构体
 *
 * @example
 * // 简单文本
 * await addLongTermMemory(userId, prisma, "用户偏好简洁风格");
 *
 * // 带分类
 * await addLongTermMemory(userId, prisma, {
 *   content: "用户是产品经理，关注数据分析",
 *   category: "fact",
 * });
 */
export async function addLongTermMemory(
  userId: number,
  prisma: PrismaClient,
  content: string | LongTermMemoryContent,
): Promise<void> {
  const payload: LongTermMemoryContent =
    typeof content === "string" ? { content } : content;

  await prisma.memory.create({
    data: {
      userId,
      type: MEMORY_TYPE_LONG,
      content: payload as object,
    },
  });
}

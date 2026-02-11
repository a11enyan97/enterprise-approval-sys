// lib/agent/memory/short-term.ts
// 短期记忆：基于 Prisma 持久化的 LangChain 消息历史，用于会话内对话记录

import { BaseListChatMessageHistory } from "@langchain/core/chat_history";
import {
  type BaseMessage,
  mapChatMessagesToStoredMessages,
  mapStoredMessagesToChatMessages,
  type StoredMessage,
} from "@langchain/core/messages";
import type { PrismaClient } from "@/generated/prisma/client";

/** 短期记忆类型 */
export const MEMORY_TYPE_SHORT = "short";

export interface PrismaChatMessageHistoryConfig {
  sessionId: string;
  prisma: PrismaClient;
}

/**
 * 基于 Prisma 的 Agent 消息历史实现
 *
 * 实现 LangChain BaseListChatMessageHistory，与 Agent 对话链无缝集成
 * 
 * @param config.sessionId 会话 ID
 * @param config.prisma Prisma 客户端
 * @returns 短期记忆实例
 * @example
 * const history = new PrismaChatMessageHistory({
 *   sessionId: "123",
 *   prisma: prisma,
 * });
 * const messages = await history.getMessages();
 * console.log(messages);
 */
export class PrismaChatMessageHistory extends BaseListChatMessageHistory {
  lc_namespace = ["lib", "agent", "memory", "short-term"];

  private sessionId: string;
  private prisma: PrismaClient;

  constructor(config: PrismaChatMessageHistoryConfig) {
    super();
    this.sessionId = config.sessionId;
    this.prisma = config.prisma;
  }

  async getMessages(): Promise<BaseMessage[]> {
    const records = await this.prisma.memory.findMany({
      where: { sessionId: this.sessionId, type: MEMORY_TYPE_SHORT },
      orderBy: { createdAt: "asc" },
      select: { content: true },
    });

    const storedMessages: StoredMessage[] = records.map(
      (r: { content: unknown }) => r.content as unknown as StoredMessage,
    );
    return mapStoredMessagesToChatMessages(storedMessages);
  }

  async addMessage(message: BaseMessage): Promise<void> {
    const stored = mapChatMessagesToStoredMessages([message]);
    await this.prisma.memory.create({
      data: {
        sessionId: this.sessionId,
        type: MEMORY_TYPE_SHORT,
        content: stored[0] as object,
      },
    });
  }

  async addMessages(messages: BaseMessage[]): Promise<void> {
    const stored = mapChatMessagesToStoredMessages(messages);
    await this.prisma.memory.createMany({
      data: stored.map((s) => ({
        sessionId: this.sessionId,
        type: MEMORY_TYPE_SHORT,
        content: s as object,
      })),
    });
  }

  async clear(): Promise<void> {
    await this.prisma.memory.deleteMany({
      where: { sessionId: this.sessionId, type: MEMORY_TYPE_SHORT },
    });
  }
}

/**
 * 获取指定会话的消息历史实例（工厂方法）
 */
export function getSessionHistory(
  sessionId: string,
  prisma: PrismaClient,
): PrismaChatMessageHistory {
  return new PrismaChatMessageHistory({
    sessionId,
    prisma,
  });
}

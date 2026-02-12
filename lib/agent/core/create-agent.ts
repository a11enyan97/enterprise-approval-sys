// lib/agent/core/create-agent.ts
// 核心：创建 Agent 实例

import { createAgent } from "langchain";
import { z } from "zod";
import { getLLM } from "@/lib/agent/LLM";
import { getAgentTools } from "@/lib/agent/tools";
import { AGENT_SYSTEM_PROMPT } from "./prompt";
import type { PrismaClient } from "@/generated/prisma/client";

export interface CreateAgentOptions {
  userId: number;
  sessionId: string;
  prisma: PrismaClient;
  /** 长期记忆内容，需在 invoke 前通过 getLongTermMemory 加载并传入 */
  longTermMemory: string;
}

/**
 * 创建 Agent 实例
 *
 * 使用 LangChain createAgent，集成 LLM、工具、动态提示词
 */
export async function createAgentInstance(options: CreateAgentOptions) {
  const { sessionId, prisma, longTermMemory } = options;

  const llm = getLLM();
  const tools = getAgentTools({ sessionId, prisma });

  const systemPrompt = AGENT_SYSTEM_PROMPT.replace(
    "{long_term_memory}",
    longTermMemory || "（暂无）",
  );

  return createAgent({
    model: llm,
    tools,
    systemPrompt,
    // 开发环境可开启 verbose 便于调试
    // verbose: true,
  });
}

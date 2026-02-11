// lib/LLM.ts

import { ChatDeepSeek } from "@langchain/deepseek";

/**
 * 封装 LLM 实例（统一管理模型配置，便于切换）
 * 使用 DeepSeek 作为大语言模型
 */
export const getLLM = () => {
  return new ChatDeepSeek({
    model: "deepseek-chat", // 生产环境可切换为 deepseek-reasoner（推理型）
    temperature: 0.2, // 低随机性，保证 Agent 决策稳定
    apiKey: process.env.DEEPSEEK_API_KEY,
    maxTokens: 2000,
  });
};

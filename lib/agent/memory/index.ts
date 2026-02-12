// lib/agent/memory/index.ts
// 记忆系统统一导出
// 短期记忆：会话上下文
// 长期记忆：关键信息持久化

export {
  MEMORY_TYPE_SHORT,
  getSessionHistory,
  type PrismaChatMessageHistoryConfig,
} from "./short-term";

export {
  MEMORY_TYPE_LONG,
  getLongTermMemory,
  addLongTermMemory,
  type LongTermMemoryContent,
  type GetLongTermMemoryOptions,
} from "./long-term";

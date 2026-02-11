// lib/agent/memory/index.ts
// Agent 记忆模块统一导出

export {
  MEMORY_TYPE_SHORT,
  PrismaChatMessageHistory,
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

import { z } from 'zod';
import { Prisma } from '@/generated/prisma/client';

// ==========================================
// 1. Agent 任务执行相关 (Execute Task)
// ==========================================

/**
 * 任务执行输入参数 Schema
 */
export const RunAgentTaskSchema = z.object({
  userId: z.number().int().positive("用户ID必须是正整数"),
  input: z.string().min(1, "输入不能为空").max(2000, "输入太长了"),
  // 可选参数，如果不传默认为 "default"
  agentType: z.enum(["default", "analyst", "writer"]).default("default").optional(),
});

/**
 * 任务执行输入参数类型 (TS)
 */
export type RunAgentTaskParams = z.infer<typeof RunAgentTaskSchema>;

/**
 * 任务执行返回结果类型
 */
export type AgentTaskResult = {
  success: boolean;
  sessionId?: string;
  status?: string;
  data?: string; // 最终文本输出
  intermediateSteps?: any[]; // 中间步骤 (可选)
  error?: string;
};


// ==========================================
// 2. 会话状态查询相关 (Get Session Status)
// ==========================================

/**
 * 会话查询输入参数 Schema
 */
export const GetSessionStatusSchema = z.object({
  sessionId: z.uuid("无效的会话ID"),
});

/**
 * 会话查询输入参数类型 (TS)
 */
export type GetSessionStatusParams = z.infer<typeof GetSessionStatusSchema>;

/**
 * 定义关联查询结构 (Validator)
 * 用于精确推导 Prisma 返回类型，包含 memories 和 toolCallLogs
 */
const sessionWithRelations = {
  include: {
    memories: true,
    toolCallLogs: true,
  },
} satisfies Prisma.SessionDefaultArgs;

/**
 * 会话详情类型 (包含关联数据)
 * 自动推导类型 = Session + memories[] + toolCallLogs[]
 */
export type AgentSessionDetail = Prisma.SessionGetPayload<typeof sessionWithRelations>;

/**
 * 会话查询返回结果类型
 */
export type GetSessionStatusResult = {
  success: boolean;
  data?: AgentSessionDetail | null;
  error?: string;
};

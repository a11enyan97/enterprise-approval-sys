// lib/agent/core/run-task.ts
// Agent 任务执行：会话状态、记忆持久化、错误处理

import { HumanMessage } from "@langchain/core/messages";
import { prisma } from "@/prisma/db";
import { getLongTermMemory, addLongTermMemory } from "@/lib/agent/memory";
import { getSessionHistory } from "@/lib/agent/memory";
import { createAgentInstance } from "./create-agent";

export interface RunAgentTaskParams {
  userId: number;
  sessionId: string;
  input: string;
}

/**
 * 执行 Agent 任务
 *
 * 流程：更新会话状态 → 加载记忆 → 创建 Agent → 执行 → 持久化 → 返回结果
 */
export async function runAgentTask(params: RunAgentTaskParams) {
  const { userId, sessionId, input } = params;

  // 1. 更新会话状态为运行中
  await prisma.session.update({
    where: { id: sessionId },
    data: { status: "running" },
  });

  try {
    // 2. 加载短期记忆（会话历史）
    const shortTermHistory = getSessionHistory(sessionId, prisma);
    const chatHistory = await shortTermHistory.getMessages();

    // 3. 加载长期记忆
    const longTermMemory = await getLongTermMemory(userId, prisma);

    // 4. 创建 Agent 并执行
    const agent = await createAgentInstance({
      userId,
      sessionId,
      prisma,
      longTermMemory,
    });

    const messages = [...chatHistory, new HumanMessage(input)];
    const result = await agent.invoke({ messages });

    // 5. 更新会话状态为完成
    await prisma.session.update({
      where: { id: sessionId },
      data: { status: "completed" },
    });

    // 6. 持久化短期记忆（本次对话的新消息：用户输入 + Agent 回复）
    const newMessages = result.messages.slice(chatHistory.length + 1);
    await shortTermHistory.addMessages([
      new HumanMessage(input),
      ...newMessages,
    ]);

    // 7. 保存长期记忆（关键结果）
    const lastMessage = result.messages[result.messages.length - 1];
    const outputText =
      typeof lastMessage?.content === "string"
        ? lastMessage.content
        : Array.isArray(lastMessage?.content)
          ? (lastMessage.content as { text?: string }[])[0]?.text ?? ""
          : "";

    await addLongTermMemory(userId, prisma, {
      content: `用户输入: ${input}\nAgent 输出: ${outputText}`,
      category: "task_result",
    });

    return {
      output: outputText,
      messages: result.messages,
      status: "completed" as const,
      data: outputText
    };
  } catch (error) {
    // 8. 异常处理
    const errMsg =
      error instanceof Error ? error.message : "Agent 执行失败";

    await prisma.session.update({
      where: { id: sessionId },
      data: { status: "failed" },
    });

    throw new Error(errMsg);
  }
}

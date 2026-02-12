"use server";

import { GetSessionStatusSchema, RunAgentTaskSchema, type RunAgentTaskParams } from "@/actions/dto/agent.dto";
import { runAgentTask } from "@/lib/agent/core";
import { prisma } from "@/prisma/db";

/**
 * 执行Agent任务
 * 
 * @param params 执行Agent任务的参数
 * @param params.userId 用户ID
 * @param params.input 用户输入
 * @param params.agentType Agent类型
 * @returns 执行结果
 */
export async function executeAgentTask(params: RunAgentTaskParams) {
    //1. 运行时参数校验
    const validatedParams = RunAgentTaskSchema.safeParse(params);
    if (!validatedParams.success) {
        return {
            success: false,
            error: validatedParams.error.message,
        };
    }

    //2. 生成会话ID
    const { userId, input, agentType = 'default' } = validatedParams.data;
    try {
        const session = await prisma.session.create({
            data: {
                userId,
                agentType,
                status: 'pending',
            },
        });

        const result = await runAgentTask({
            userId,
            sessionId: session.id,
            input
        });

        return {
            success: true,
            sessionId: session.id,
            status: result.status,
            data: result.data
        };
    } catch (error) {
        console.log("Agent任务执行失败", error);

        return {
            success: false,
            error: error instanceof Error ? error.message : "未知错误",
        };
    }
}

/**
 * 查询会话状态
 * 
 * @param sessionId 会话ID
 * @returns 会话状态
 */
export async function getSessionStatus(sessionId: string) { 
    //1. 运行时参数校验
    const validatedParams = GetSessionStatusSchema.safeParse({ sessionId });
    if (!validatedParams.success) {
        return {
            success: false,
            error: validatedParams.error.message,
        };
    }

    // 2. 查询会话状态
    try {
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
            include: {
                memories: {
                    orderBy: {
                        createdAt: 'asc', // 按创建时间升序
                    },
                },
                toolCallLogs: {
                    orderBy: {
                        createdAt: 'desc', // 按创建时间降序
                    },
                },
            },
        });

        if(!session) {
            return{
                success: false,
                error: "会话不存在",
            }
        }

        return{
            success: true,
            data: session,
        }
    } catch (error) {
        console.log("查询会话状态失败", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "未知错误",
        };
    }
};
import {NextResponse} from "next/server";
import { prisma } from "@/prisma/client";

// 创建审批申请
export async function POST(request: Request) {
    try {
        const { 
            projectName, 
            approvalContent, 
            deptFullPath, 
            deptLevel1Id,
            deptLevel2Id,
            deptLevel3Id,
            executeDate,
            applicantId,
            typeId
        } = await request.json();

        // 生成审批单号（示例：使用时间戳）
        const requestNo = `APP${Date.now()}`;

        const approval = await prisma.approvalRequest.create({
            data: {
                requestNo,
                projectName,
                approvalContent,
                deptFullPath,
                deptLevel1Id,
                deptLevel2Id,
                deptLevel3Id,
                executeDate: new Date(executeDate),
                applicantId,
                typeId,
            },
        });

        return NextResponse.json(approval);
    } catch (error) {
        return NextResponse.json(
            { error: '创建审批申请失败', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
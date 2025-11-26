import { NextResponse } from "next/server";
import {
  createApprovalRequest,
  getApprovalRequestList,
} from "./service";
import { handleApiError } from "../_shared/errors";

/**
 * 创建审批申请
 * POST /api/approval
 */
export async function POST(request: Request) {
  try {
    const params = await request.json();
    console.log("接收到的参数:", params);

    const approval = await createApprovalRequest(params);

    return NextResponse.json({
      success: true,
      data: approval,
    });
  } catch (error) {
    return handleApiError(error, "创建审批申请失败");
  }
}

/**
 * 获取审批申请列表
 * GET /api/approval
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const applicantId = searchParams.get("applicantId")
      ? parseInt(searchParams.get("applicantId")!)
      : undefined;
    const status = searchParams.get("status") || undefined;
    const deptLevel1Id = searchParams.get("deptLevel1Id")
      ? parseInt(searchParams.get("deptLevel1Id")!)
      : undefined;
    const deptLevel2Id = searchParams.get("deptLevel2Id")
      ? parseInt(searchParams.get("deptLevel2Id")!)
      : undefined;
    const deptLevel3Id = searchParams.get("deptLevel3Id")
      ? parseInt(searchParams.get("deptLevel3Id")!)
      : undefined;

    const result = await getApprovalRequestList({
      page,
      pageSize,
      applicantId,
      status,
      deptLevel1Id,
      deptLevel2Id,
      deptLevel3Id,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleApiError(error, "获取审批申请列表失败");
  }
}



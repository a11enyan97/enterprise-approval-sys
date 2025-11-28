import { NextResponse } from "next/server";
import {
  getApprovalRequestById,
  submitApprovalRequest,
  approveOrRejectRequest,
  deleteApprovalRequest
} from "@/services/approval.service";
import { handleApiError } from "@/services/_shared/errors";

/**
 * 获取审批申请详情
 * GET /api/approval/[requestId]
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const requestId = BigInt((await params).requestId);
    const approval = await getApprovalRequestById(requestId);

    if (!approval) {
      return NextResponse.json(
        {
          success: false,
          error: "审批申请不存在",
          code: "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: approval,
    });
  } catch (error) {
    const errorResponse = handleApiError(error, "获取审批申请详情失败");
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * 提交审批申请
 * PUT /api/approval/[requestId]
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const requestId = BigInt((await params).requestId);
    const payload = await request.json();
    const approval = await submitApprovalRequest(requestId, payload);

    return NextResponse.json({
      success: true,
      data: approval,
    });
  } catch (error) {
    const errorResponse = handleApiError(error, "提交审批申请失败");
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * 审批申请（同意或拒绝）
 * PATCH /api/approval/[requestId]
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId: requestIdParam } = await params;
    const requestId = BigInt(requestIdParam);
    const body = await request.json();
    const { action, approverId } = body;

    if (!action || (action !== "approve" && action !== "reject")) {
      return NextResponse.json(
        {
          success: false,
          error: "无效的审批操作，action 必须是 'approve' 或 'reject'",
          code: "INVALID_ACTION",
        },
        { status: 400 }
      );
    }

    if (!approverId) {
      return NextResponse.json(
        {
          success: false,
          error: "缺少必要参数 approverId",
          code: "MISSING_PARAMETER",
        },
        { status: 400 }
      );
    }

    const approval = await approveOrRejectRequest(
      requestId,
      action,
      approverId
    );

    return NextResponse.json({
      success: true,
      data: approval,
    });
  } catch (error) {
    const errorResponse = handleApiError(error, "审批操作失败");
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * 删除审批申请
 * DELETE /api/approval/[requestId]
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const requestId = BigInt((await params).requestId);
    const deleted = await deleteApprovalRequest(requestId);
    return NextResponse.json({
      success: true,
      data: deleted,
    });
  } catch (error) {
    const errorResponse = handleApiError(error, "删除审批申请失败");
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { ValidationError } from "./validators";

/**
 * 统一错误响应格式
 */
export interface ApiErrorResponse {
  error: string;
  code?: string;
  field?: string;
  details?: string;
}

/**
 * 处理 API 错误并返回统一格式的响应
 * @param error 错误对象
 * @param defaultMessage 默认错误消息
 * @returns NextResponse 错误响应
 */
export function handleApiError(
  error: unknown,
  defaultMessage: string = "操作失败"
): NextResponse<ApiErrorResponse> {

  // 处理验证错误
  if (error instanceof ValidationError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        field: error.field,
      },
      { status: 400 }
    );
  }

  // 处理 Prisma 错误
  if (error && typeof error === "object" && "code" in error) {
    const prismaError = error as { code: string; meta?: any };
    
    // 外键约束错误
    if (prismaError.code === "P2003") {
      return NextResponse.json(
        {
          error: "关联数据不存在，请检查外键字段",
          code: "FOREIGN_KEY_CONSTRAINT",
          details: prismaError.meta?.field_name || "未知字段",
        },
        { status: 400 }
      );
    }

    // 唯一约束错误
    if (prismaError.code === "P2002") {
      return NextResponse.json(
        {
          error: "数据已存在，违反唯一性约束",
          code: "UNIQUE_CONSTRAINT",
          details: prismaError.meta?.target?.join(", ") || "未知字段",
        },
        { status: 409 }
      );
    }
  }

  // 处理通用错误
  const errorMessage =
    error instanceof Error ? error.message : String(error);

  return NextResponse.json(
    {
      error: defaultMessage,
      details: errorMessage,
    },
    { status: 500 }
  );
}


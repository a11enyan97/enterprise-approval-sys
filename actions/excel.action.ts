"use server";

import { validateExcelFile } from "@/services/excel-validator.service";
import { handleActionError } from "@/services/_shared/errors";

/**
 * Excel 文件校验结果响应
 */
export interface ExcelValidationResponse {
  success: boolean;
  error?: string;
  errors?: Array<{
    row: number;
    field?: string;
    message: string;
  }>;
  data?: any[];
}

/**
 * 校验 Excel 文件
 * @param formData FormData 对象，包含 file 字段
 * @returns 校验结果
 */
export async function validateExcelAction(
  formData: FormData
): Promise<ExcelValidationResponse> {
  try {
    const file = formData.get("file") as File | null;

    if (!file) {
      return {
        success: false,
        error: "未找到上传的文件",
      };
    }

    // 验证文件类型
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
    ];

    if (!validTypes.includes(file.type)) {
      return {
        success: false,
        error: `不支持的文件类型 "${file.type}"，请上传 .xlsx 或 .xls 格式的 Excel 文件`,
      };
    }

    // 验证文件大小（限制为 10MB）
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: `文件大小超过限制（${maxSize / 1024 / 1024}MB），请上传较小的文件`,
      };
    }

    // 将 File 转换为 Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 调用校验服务
    const result = await validateExcelFile(buffer, file.name);

    return result;
  } catch (error) {
    const errorResponse = handleActionError(error, "Excel 文件校验失败");
    return {
      success: false,
      error: errorResponse.error || "Excel 文件校验失败",
    };
  }
}


"use server";

import { generateOSSSignature } from "@/services/oss.service";
import { handleApiError } from "@/services/_shared/errors";
import type { OSSTokenResponse } from "@/types/oss";

/**
 * 获取 OSS 签名
 * @param filename 文件名
 * @param contentType 文件类型（可选）
 */
export async function getOSSTokenAction(
  filename: string,
  contentType?: string
): Promise<OSSTokenResponse> {
  try {
    const result = await generateOSSSignature(filename, contentType);
    return {
      success: true,
      ...result,
    };
  } catch (error) {
    const errorResponse = handleApiError(error, "生成预签名URL失败");
    return {
      success: false,
      ...errorResponse,
    };
  }
}


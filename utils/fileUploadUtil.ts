"use client";

/**
 * 客户端 OSS 直传工具
 */

import { getOSSTokenAction } from "@/actions/oss.action";
import type { OSSTokenResponse, OSSUploadResult } from "@/types/oss";

/**
 * 类型守卫：检查是否为成功响应
 */
function isOSSTokenSuccess(
  response: OSSTokenResponse
): response is Extract<OSSTokenResponse, { success: true }> {
  return response.success === true;
}

/**
 * 上传文件到 OSS（使用预签名URL直传，文件直接从客户端上传到OSS）
 * @param file 要上传的文件
 * @returns OSS 上传结果
 */
export async function uploadToOSS(file: File): Promise<OSSUploadResult> {
  // 1. 从服务端获取预签名URL（服务端处理所有配置和错误）
  const tokenResult = await getOSSTokenAction(file.name, file.type);

  if (!isOSSTokenSuccess(tokenResult)) {
    throw new Error(tokenResult.error || "获取上传地址失败");
  }

  const { uploadUrl, publicUrl, filename } = tokenResult;

  // 2. 使用预签名URL直接上传到OSS（客户端直传，不经过服务器）   
  try {
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type || 'application/octet-stream',
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(`文件上传失败: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }
    return {
      uploadUrl,
      publicUrl,
      filename,
    };
  } catch (fetchError) {
    throw new Error(`文件上传失败: ${fetchError}`);
  }
}


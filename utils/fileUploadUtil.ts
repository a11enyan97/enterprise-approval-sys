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
    // 创建 AbortController 用于超时控制（5分钟超时）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000);
    
    try {
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type || 'application/octet-stream',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!uploadResponse.ok) {
        throw new Error(`文件上传失败: ${uploadResponse.status} ${uploadResponse.statusText}`);
      }

      return {
        uploadUrl,
        publicUrl,
        filename,
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // 处理上传错误
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error(`文件 "${file.name}" 上传超时，请检查网络连接或文件大小后重试`);
      }
      
      if (fetchError instanceof TypeError) {
        if (fetchError.message.includes('Failed to fetch') || fetchError.message.includes('network')) {
          throw new Error(`文件 "${file.name}" 上传失败：网络连接错误，请检查网络连接后重试`);
        }
        if (fetchError.message.includes('aborted')) {
          throw new Error(`文件 "${file.name}" 上传被中断，请重试`);
        }
      }
      
      throw fetchError;
    }
  } catch (error) {
    if (error instanceof Error) {
      // 如果错误信息已经包含文件名和详细说明，直接抛出
      if (error.message.includes(file.name) && (error.message.includes('上传失败') || error.message.includes('上传超时') || error.message.includes('上传被中断'))) {
        throw error;
      }
      throw new Error(`文件 "${file.name}" 上传失败：${error.message}`);
    }
    throw new Error(`文件 "${file.name}" 上传失败：未知错误`);
  }
}


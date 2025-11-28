/**
 * 客户端 OSS 直传工具
 */

import { getOSSTokenAction } from "@/actions/oss.action";

/**
 * OSS 上传结果
 */
export interface OSSUploadResult {
  uploadUrl: string;
  publicUrl: string;
  filename: string;
}

/**
 * 上传文件到 OSS
 * @param file 要上传的文件
 * @returns OSS 上传结果
 */
export async function uploadToOSS(file: File): Promise<OSSUploadResult> {
  // 1. 获取 OSS 签名
  const tokenResult = await getOSSTokenAction(file.name, file.type);

  if (!tokenResult.success) {
    throw new Error(tokenResult.error || "获取 OSS 签名失败");
  }

  const { uploadUrl, publicUrl, filename } = tokenResult;

  // 2. 上传文件到 OSS
  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  });

  if (!uploadResponse.ok) {
    throw new Error(`文件上传失败: ${uploadResponse.statusText}`);
  }

  return {
    uploadUrl,
    publicUrl,
    filename,
  };
}


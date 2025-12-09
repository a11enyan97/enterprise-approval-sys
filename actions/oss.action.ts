"use server";

import { generateOSSSignature } from "@/services/oss.service";
import { handleActionError } from "@/services/_shared/errors";
import type { OSSTokenResponse } from "@/types/oss";
import type { AttachmentInput } from "@/types/approval";
import OSS from 'ali-oss';

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
    const errorResponse = handleActionError(error, "生成预签名URL失败");
    return {
      success: false,
      ...errorResponse,
    };
  }
}

/**
 * OSS文件回滚
 * @param attachments 上传附件结果
 */
export async function deleteOSSFiles(attachments: AttachmentInput[]): Promise<{ success: boolean }> {
  // 1. 验证环境变量
  const requiredEnvVars = {
    OSS_REGION: process.env.OSS_REGION,
    OSS_ACCESS_KEY_ID: process.env.OSS_ACCESS_KEY_ID,
    OSS_ACCESS_KEY_SECRET: process.env.OSS_ACCESS_KEY_SECRET,
    OSS_BUCKET: process.env.OSS_BUCKET,
  };

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(`OSS 配置不完整，缺少环境变量: ${missingVars.join(', ')}`);
  }

  const client = new OSS({
    region: `oss-${requiredEnvVars.OSS_REGION!}`,
    accessKeyId: requiredEnvVars.OSS_ACCESS_KEY_ID!,
    accessKeySecret: requiredEnvVars.OSS_ACCESS_KEY_SECRET!,
    bucket: requiredEnvVars.OSS_BUCKET!,
    secure: true, // 使用 HTTPS
  });

  try {
    // 解析 URL 获取文件名 (Key)
    // 假设 URL 是 https://your-bucket.oss-cn-hz.aliyuncs.com/uploads/xxx.jpg
    const keys = attachments.map(att => {
      const urlObj = new URL(att.filePath);
      return urlObj.pathname.substring(1); // 去掉开头的 /
    });

    // 2. 批量删除
    await client.deleteMulti(keys);
    return { success: true };
  } catch (error) {
    console.error('删除文件失败', error);
    return { success: false };
  }
}

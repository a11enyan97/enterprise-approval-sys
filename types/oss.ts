/**
 * OSS 相关类型定义
 */

/**
 * OSS 签名成功响应
 */
export interface OSSTokenSuccessResponse {
  success: true;
  uploadUrl: string;
  publicUrl: string;
  filename: string;
}

/**
 * OSS 签名失败响应
 */
export interface OSSTokenErrorResponse {
  success: false;
  error: string;
  code?: string;
  field?: string;
  details?: string;
}

/**
 * OSS 签名响应类型（判别联合类型）
 */
export type OSSTokenResponse = OSSTokenSuccessResponse | OSSTokenErrorResponse;

/**
 * OSS 上传结果
 */
export interface OSSUploadResult {
  uploadUrl: string;
  publicUrl: string;
  filename: string;
}


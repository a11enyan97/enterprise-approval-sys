import OSS from 'ali-oss';

/**
 * OSS 签名生成结果
 */
export interface OSSSignatureResult {
  uploadUrl: string;
  publicUrl: string;
  filename: string;
}

/**
 * 生成 OSS 预签名 URL
 * @param filename 文件名
 * @param contentType 文件类型（可选）
 * @returns OSS 签名信息
 */
export async function generateOSSSignature(
  filename: string,
  contentType?: string
): Promise<OSSSignatureResult> {
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

  // 2. 初始化 OSS 客户端
  const client = new OSS({
    region: requiredEnvVars.OSS_REGION!,
    accessKeyId: requiredEnvVars.OSS_ACCESS_KEY_ID!,
    accessKeySecret: requiredEnvVars.OSS_ACCESS_KEY_SECRET!,
    bucket: requiredEnvVars.OSS_BUCKET!,
    secure: true, // 使用 HTTPS
  });

  // 3. 生成唯一文件名 (防止覆盖)
  const date = new Date().toISOString().split('T')[0];
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_'); // 清理文件名
  const uniqueFileName = `byteDance/uploads/${date}/${timestamp}-${sanitizedFilename}`;

  // 4. 生成预签名 URL
  const signatureOptions: any = {
    method: 'PUT',
    expires: 600,
  };

  // MIME类型
  if (contentType) {
    signatureOptions['Content-Type'] = contentType;
  } else {
    signatureOptions['Content-Type'] = 'application/octet-stream';
  }

  const uploadUrl = client.signatureUrl(uniqueFileName, signatureOptions);

  // 5. 生成公共访问 URL（bucket 是公共读，使用标准 URL 格式）
  const publicUrl = `https://${requiredEnvVars.OSS_BUCKET}.oss-${requiredEnvVars.OSS_REGION}.aliyuncs.com/${uniqueFileName}`;

  return {
    uploadUrl,
    publicUrl,
    filename: uniqueFileName,
  };
}


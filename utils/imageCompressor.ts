"use client";

import imageCompression from "browser-image-compression";
import type { Options as ImageCompressionOptions } from "browser-image-compression";

// 默认压缩配置：限制 1MB，最长边 1920px，使用 WebWorker
export const DEFAULT_IMAGE_COMPRESSION_OPTIONS: ImageCompressionOptions = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
};

/**
 * 图片压缩工具
 * - 仅对图片类型执行压缩
 * - 当文件已小于目标体积时直接返回原文件
 */
export async function compressImage(
  file: File,
  options: ImageCompressionOptions = DEFAULT_IMAGE_COMPRESSION_OPTIONS
): Promise<File> {
  if (!file.type?.startsWith("image/")) return file;

  const maxSizeBytes = (options.maxSizeMB || DEFAULT_IMAGE_COMPRESSION_OPTIONS.maxSizeMB || 1) * 1024 * 1024;
  if (file.size <= maxSizeBytes) return file;

  try {
    const compressed = await imageCompression(file, options);
    // 确保返回值为 File 类型，并保持原文件名和类型
    return new File([compressed], file.name, { type: compressed.type || file.type, lastModified: Date.now() });
  } catch (error) {
    // 压缩失败时回退原文件，避免中断主流程
    console.error("[imageCompressor] 压缩失败，使用原文件上传：", error);
    return file;
  }
}


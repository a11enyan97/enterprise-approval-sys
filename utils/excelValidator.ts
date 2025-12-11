"use client";

import { validateExcelAction } from "@/actions/excel.action";

// 统一的 Excel 文件大小校验（默认 10MB）
export const validateExcelFileSize = (file: File, maxSizeBytes = 10 * 1024 * 1024): void => {
  if (file.size > maxSizeBytes) {
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    const maxSizeMB = (maxSizeBytes / 1024 / 1024).toFixed(0);
    throw new Error(`文件大小超过限制：${file.name}（${fileSizeMB}MB），最大支持 ${maxSizeMB}MB`);
  }
};

// 校验 Excel 文件（上传前调用后端校验）
export const validateExcelFile = async (file: File): Promise<void> => {
  const formData = new FormData();
  formData.append("file", file);

  const validationResult = await validateExcelAction(formData);

  if (!validationResult.success) {
    const errorMessage = validationResult.error || "Excel 文件校验失败";
    throw new Error(errorMessage);
  }
};

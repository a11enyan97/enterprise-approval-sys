"use client";

import { validateExcelAction } from "@/actions/excel.action";

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

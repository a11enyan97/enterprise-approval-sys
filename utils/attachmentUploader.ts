"use client";

import { compressImage } from "@/utils/imageCompressor";
import { validateExcelFile } from "@/utils/excelValidator";
import { uploadToOSS } from "@/utils/fileUploadUtil";
import { deleteOSSFiles } from "@/actions/oss.action";
import type { AttachmentInput } from "@/types/approval";

export async function uploadAllAttachments(
  fileList: any[],
  attachmentType: "image" | "table"
): Promise<Array<AttachmentInput>> {
  // 1. 仅处理需要上传的文件（没有 url 且有 originFile）
  const filesToUpload = fileList.filter((file) => !file.url && file.originFile);

  // 2. 表格文件先做校验
  if (attachmentType === "table") {
    await Promise.all(
      filesToUpload.map((file) => validateExcelFile(file.originFile))
    );
  }

  // 3. 并发上传；图片先压缩
  const uploadResults = await Promise.allSettled(
    filesToUpload.map(async (file) => {
      const uploadFile =
        attachmentType === "image"
          ? await compressImage(file.originFile)
          : file.originFile;

      const result = await uploadToOSS(uploadFile);
      return {
        filePath: result.publicUrl,
        fileName: uploadFile.name || file.originFile.name,
        attachmentType,
        fileSize: uploadFile.size || 0,
        mimeType: uploadFile.type || file.originFile.type || null,
      } satisfies AttachmentInput;
    })
  );

  // 4. 汇总结果，失败则回滚成功的上传
  const successfulResults: AttachmentInput[] = [];
  let failedCount = 0;

  uploadResults.forEach((result) => {
    if (result.status === "fulfilled") {
      successfulResults.push(result.value);
    } else {
      failedCount++;
    }
  });

  if (failedCount > 0) {
    if (successfulResults.length > 0) {
      await deleteOSSFiles(successfulResults); // OSS 文件回滚
    }
    throw new Error("部分文件上传失败，已取消所有操作");
  }

  // 5. 全部成功，返回 URL 列表
  return successfulResults;
}


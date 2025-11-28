import { NextResponse } from 'next/server';
import { generateOSSSignature } from '@/services/oss.service';
import { handleApiError } from '@/services/_shared/errors';

export async function POST(request: Request) {
  try {
    // 解析请求数据（支持 JSON 和 FormData）
    let filename: string;
    let fileContentType: string | undefined;
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      filename = body.filename || body.name || 'file';
      fileContentType = body.contentType || body.type; // 支持传递文件类型
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      filename = file?.name || formData.get('filename')?.toString() || 'file';
      fileContentType = file?.type;
    } else {
      return NextResponse.json(
        { error: '文件名不能为空' },
        { status: 400 }
      );
    }

    const result = await generateOSSSignature(filename, fileContentType);

    return NextResponse.json({
      uploadUrl: result.uploadUrl,
      publicUrl: result.publicUrl,
      filename: result.filename
    });
  } catch (error: any) {
    const errorResponse = handleApiError(error, '生成预签名URL失败');
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
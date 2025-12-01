/**
 * 附件类型枚举
 */
export enum AttachmentType {
  /** 图片附件 */
  IMAGE = 'image',
  /** 表格附件 */
  TABLE = 'table',
}

/**
 * 审批附件实体类
 * 对应数据库表：approval_attachments
 */
export class ApprovalAttachment {
  /** 附件ID，主键 */
  id: string; // BigInt 转为 string

  /** 审批申请ID */
  requestId: string; // BigInt 转为 string

  /** 附件类型：image-图片附件，table-表格附件 */
  attachmentType: AttachmentType;

  /** 文件原始名称 */
  fileName: string;

  /** 文件存储路径 */
  filePath: string;

  /** 文件大小（字节） */
  fileSize: string; // BigInt 转为 string

  /** 文件MIME类型 */
  mimeType: string | null;

  /** 上传人ID */
  uploaderId: number;

  /** 创建时间 */
  createdAt: Date;

  /** 更新时间 */
  updatedAt: Date;

  // 关系字段（可选，用于包含关联数据）
  /** 审批申请 */
  request?: any; // ApprovalRequest 类型

  /** 上传人 */
  uploader?: any; // User 类型

  constructor(data: Partial<ApprovalAttachment> = {}) {
    this.id = data.id ?? '0';
    this.requestId = data.requestId ?? '0';
    this.attachmentType = data.attachmentType ?? AttachmentType.IMAGE;
    this.fileName = data.fileName ?? '';
    this.filePath = data.filePath ?? '';
    this.fileSize = data.fileSize ?? '0';
    this.mimeType = data.mimeType ?? null;
    this.uploaderId = data.uploaderId ?? 0;
    this.createdAt = data.createdAt ?? new Date();
    this.updatedAt = data.updatedAt ?? new Date();

    if (data.request !== undefined) this.request = data.request;
    if (data.uploader !== undefined) this.uploader = data.uploader;
  }

  /**
   * 判断是否为图片附件
   */
  isImage(): boolean {
    return this.attachmentType === AttachmentType.IMAGE;
  }

  /**
   * 判断是否为表格附件
   */
  isTable(): boolean {
    return this.attachmentType === AttachmentType.TABLE;
  }

  /**
   * 获取文件大小（格式化显示）
   */
  getFormattedFileSize(): string {
    const size = parseInt(this.fileSize, 10);
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(2)} KB`;
    } else if (size < 1024 * 1024 * 1024) {
      return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    } else {
      return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
  }
}


/**
 * 实体类统一导出
 * 所有数据库实体类的类型定义
 */

export { Department } from './Department.entity';
export { User, UserRole } from './User.entity';
export { UserDepartment } from './UserDepartment.entity';
export { ApprovalRequest, ApprovalStatus } from './ApprovalRequest.entity';
export { ApprovalAttachment, AttachmentType } from './ApprovalAttachment.entity';

// 导出所有枚举类型
export type { UserRole as UserRoleEnum } from './User.entity';
export type { ApprovalStatus as ApprovalStatusEnum } from './ApprovalRequest.entity';
export type { AttachmentType as AttachmentTypeEnum } from './ApprovalAttachment.entity';


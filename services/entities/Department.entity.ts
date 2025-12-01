/**
 * 部门实体类
 * 对应数据库表：departments
 */
export class Department {
  /** 部门ID，主键 */
  id: number;

  /** 部门编码，唯一标识 */
  deptCode: string;

  /** 部门名称 */
  deptName: string;

  /** 父部门ID，用于构建部门树 */
  parentId: number | null;

  /** 部门层级，1为一级部门 */
  level: number;

  /** 部门完整路径，如：A部门/B子部门/C团队 */
  fullPath: string | null;

  /** 排序顺序 */
  sortOrder: number;

  /** 部门负责人ID */
  managerId: number | null;

  /** 部门描述 */
  description: string | null;

  /** 状态：1-启用，0-禁用 */
  status: number;

  /** 创建时间 */
  createdAt: Date;

  /** 更新时间 */
  updatedAt: Date;

  // 关系字段（可选，用于包含关联数据）
  /** 父部门 */
  parent?: Department | null;

  /** 子部门列表 */
  children?: Department[];

  /** 部门负责人 */
  manager?: any; // User 类型，避免循环依赖

  constructor(data: Partial<Department> = {}) {
    this.id = data.id ?? 0;
    this.deptCode = data.deptCode ?? '';
    this.deptName = data.deptName ?? '';
    this.parentId = data.parentId ?? null;
    this.level = data.level ?? 1;
    this.fullPath = data.fullPath ?? null;
    this.sortOrder = data.sortOrder ?? 0;
    this.managerId = data.managerId ?? null;
    this.description = data.description ?? null;
    this.status = data.status ?? 1;
    this.createdAt = data.createdAt ?? new Date();
    this.updatedAt = data.updatedAt ?? new Date();
    
    if (data.parent !== undefined) this.parent = data.parent;
    if (data.children !== undefined) this.children = data.children;
    if (data.manager !== undefined) this.manager = data.manager;
  }

  /**
   * 判断是否为根部门（一级部门）
   */
  isRoot(): boolean {
    return this.parentId === null;
  }

  /**
   * 判断部门是否启用
   */
  isEnabled(): boolean {
    return this.status === 1;
  }
}


/**
 * 部门相关类型定义
 */

/**
 * 树形选择器选项类型
 */
export interface CascaderOption {
  title?: string;
  key?: string;
  children?: CascaderOption[];
}


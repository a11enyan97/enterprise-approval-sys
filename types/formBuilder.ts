export type FormFieldType =
  | "input"
  | "textarea"
  | "date"
  | "treeSelect"
  | "uploadImage"
  | "uploadTable";

 /**
 * 联动显隐条件（用于复杂表单联动）
 * 当依赖字段满足条件时，本字段才显示
 */
export interface VisibleWhenCondition {
  field: string; // 依赖的字段 key
  op: "includes" | "eq" | "notEmpty"; // 判断方式
  value?: string; // includes/eq 时的比较值
}

export interface FormField {
  _id?: string; // 前端拖拽用的唯一标识
  key: string; // 提交给后端的字段名
  type: FormFieldType; // 组件类型
  label: string; // 显示标题
  required: boolean;
  placeholder?: string;
  props?: Record<string, any>; // 组件特有属性
  rules?: any[]; // 校验规则
  /** 联动：满足条件时才显示（用于复杂表单联动） */
  visibleWhen?: VisibleWhenCondition;
}

export interface FormLayoutConfig {
  labelCol?: { span: number };
  wrapperCol?: { span: number };
}

export interface FormSchema {
  key: string;
  title: string;
  description?: string;
  layout?: FormLayoutConfig;
  fields: FormField[];
}


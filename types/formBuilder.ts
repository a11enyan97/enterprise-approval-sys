export type FieldType = "input" | "textarea" | "date" | "treeSelect" | "uploadImage" | "uploadTable";

export interface FormField {
  _id: string; // 前端拖拽用的唯一标识
  key: string; // 提交给后端的字段名
  type: FieldType; // 组件类型
  label: string; // 显示标题
  required: boolean;
  placeholder?: string;
  props?: Record<string, any>; // 组件特有属性
  rules?: any[]; // 校验规则
}

export interface FormSchema {
  title: string;
  description: string;
  fields: FormField[];
}


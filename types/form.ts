export type FormFieldType =
  | "input"
  | "textarea"
  | "date"
  | "treeSelect"
  | "uploadImage"
  | "uploadTable";

export interface FormFieldConfig {
  key: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  placeholder?: string;
  rules?: Array<{ required?: boolean; message?: string; maxLength?: number }>;
  props?: Record<string, any>;
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
  fields: FormFieldConfig[];
}


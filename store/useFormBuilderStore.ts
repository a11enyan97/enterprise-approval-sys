"use client";

import { nanoid } from "nanoid";
import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { FormFieldType, FormField, FormSchema } from "@/types/formBuilder";

const fieldTemplates: Record<FormFieldType, Omit<FormField, "_id" | "key">> = {
  input: {
    type: "input",
    label: "单行输入",
    required: false,
    placeholder: "请输入内容",
    props: { maxLength: 100 },
    rules: [],
  },
  textarea: {
    type: "textarea",
    label: "多行文本",
    required: false,
    placeholder: "请输入描述",
    props: { maxLength: 300, showWordLimit: true, autoSize: { minRows: 3, maxRows: 6 } },
    rules: [],
  },
  date: {
    type: "date",
    label: "日期",
    required: false,
    placeholder: "请选择日期",
    props: { format: "YYYY-MM-DD", style: { width: "100%" } },
    rules: [],
  },
  treeSelect: {
    type: "treeSelect",
    label: "部门选择",
    required: false,
    placeholder: "请选择",
    props: { allowClear: true, style: { width: "100%" } },
    rules: [],
  },
  uploadImage: {
    type: "uploadImage",
    label: "图片上传",
    required: false,
    placeholder: "",
    props: {
      multiple: true,
      imagePreview: true,
      listType: "picture-card",
      limit: 3,
      accept: "image/jpeg,image/jpg,image/png,image/gif,image/webp",
    },
    rules: [],
  },
  uploadTable: {
    type: "uploadTable",
    label: "表格上传",
    required: false,
    placeholder: "",
    props: { accept: ".xlsx,.xls" },
    rules: [],
  },
};

const defaultSchema: FormSchema = {
  key: "default_schema",
  title: "未命名表单",
  description: "拖拽左侧组件到画布，右侧配置字段属性",
  fields: [],
};

function createField(type: FormFieldType): FormField {
  const template = fieldTemplates[type];
  return {
    _id: nanoid(),
    key: `${type}_${nanoid(6)}`,
    ...template,
  };
}

export interface FormBuilderState {
  schema: FormSchema;
  selectedFieldId: string | null;
  addField: (type: FormFieldType, insertBeforeId?: string) => void;
  moveField: (activeId: string, overId: string) => void;
  selectField: (fieldId: string | null) => void;
  updateField: (fieldId: string, payload: Partial<FormField>) => void;
  removeField: (fieldId: string) => void;
  updateMeta: (meta: Partial<Pick<FormSchema, "title" | "description">>) => void;
  reset: () => void;
}

const formBuilderStore = createStore<FormBuilderState>()(
  immer((set, get) => ({
    schema: defaultSchema,
    selectedFieldId: null,

    // 将新增的字段插入到指定位置
    addField: (type, insertBeforeId) =>
      set((state) => {
        const field = createField(type);
        const targetIndex = insertBeforeId
          ? state.schema.fields.findIndex((item) => item._id === insertBeforeId)
          : -1;

        if (targetIndex >= 0) {
          state.schema.fields.splice(targetIndex, 0, field);
        } else {
          state.schema.fields.push(field);
        }
        state.selectedFieldId = field._id as string;
      }),

    // 将指定字段移动到指定位置
    moveField: (activeId, overId) =>
      set((state) => {
        if (activeId === overId) return;
        const fields = state.schema.fields;
        const oldIndex = fields.findIndex((item) => item._id === activeId);
        const newIndex = fields.findIndex((item) => item._id === overId);
        if (oldIndex === -1 || newIndex === -1) return;
        const [moved] = fields.splice(oldIndex, 1);
        fields.splice(newIndex, 0, moved);
      }),

    // 选中指定字段
    selectField: (fieldId) =>
      set((state) => {
        state.selectedFieldId = fieldId;
      }),

    // 更新指定字段的属性
    updateField: (fieldId, payload) =>
      set((state) => {
        const target = state.schema.fields.find((item) => item._id === fieldId);
        if (!target) return;

        if (payload.label !== undefined) {
          target.label = payload.label;
        }
        if (payload.key !== undefined) {
          target.key = payload.key;
        }
        if (payload.placeholder !== undefined) {
          target.placeholder = payload.placeholder;
        }
        if (payload.type !== undefined) {
          target.type = payload.type;
        }
        if (payload.required !== undefined) {
          target.required = payload.required;
          target.rules = payload.required
            ? [{ required: true, message: `${payload.label ?? target.label}为必填项` }]
            : [];
        }
        if (payload.props !== undefined) {
          const nextProps = { ...(target.props || {}), ...payload.props };
          Object.keys(nextProps).forEach((key) => {
            if (nextProps[key] === undefined || nextProps[key] === null) {
              delete nextProps[key];
            }
          });
          target.props = nextProps;
        }
        if (payload.rules !== undefined) {
          target.rules = payload.rules;
        }
      }),

    // 删除指定字段
    removeField: (fieldId) =>
      set((state) => {
        state.schema.fields = state.schema.fields.filter((item) => item._id !== fieldId);
        if (state.selectedFieldId === fieldId) {
          state.selectedFieldId = null;
        }
      }),

    // 更新表单模板的基本信息
    updateMeta: (meta) =>
      set((state) => {
        state.schema = { ...state.schema, ...meta };
      }),

    // 重置表单模板
    reset: () =>
      set(() => ({
        schema: { ...defaultSchema, fields: [] },
        selectedFieldId: null,
      })),
  }))
);

// 对useStore进行封装，方便在组件中使用
export const useFormBuilderStore = <T,>(selector: (state: FormBuilderState) => T) =>
  useStore(formBuilderStore, selector);


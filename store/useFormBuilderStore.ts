"use client";

import { nanoid } from "nanoid";
import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { FormFieldType, FormField, FormSchema } from "@/types/formBuilder";
import { FIELD_TYPE_META } from "@/lib/agent/schemas";

// ================================================================
// 字段模板：每种字段类型的默认配置
// 从 FIELD_TYPE_META 的 defaultProps 自动获取，保持单一数据源
// ================================================================

function buildFieldTemplate(type: FormFieldType): Omit<FormField, "_id" | "key"> {
  const meta = FIELD_TYPE_META[type];
  return {
    type,
    label: meta.label,
    required: false,
    placeholder: ["switch", "rate", "checkbox", "radio"].includes(type) ? undefined : "请输入",
    props: meta.defaultProps ? { ...meta.defaultProps } : undefined,
    rules: [],
    // 带选项的字段类型，提供一组默认选项
    ...(meta.hasOptions
      ? {
          options: [
            { label: "选项一", value: "option1" },
            { label: "选项二", value: "option2" },
            { label: "选项三", value: "option3" },
          ],
        }
      : {}),
  };
}

const defaultSchema: FormSchema = {
  version: "1.0",
  key: "default_schema",
  title: "未命名表单",
  description: "拖拽左侧组件到画布，右侧配置字段属性",
  fields: [],
};

/**
 * 创建字段
 *
 * @param type 字段类型
 * @returns 字段
 */
function createField(type: FormFieldType): FormField {
  const template = buildFieldTemplate(type);
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
  immer((set) => ({
    schema: defaultSchema,
    selectedFieldId: null,

    /**
     * 新增字段到指定位置
     *
     * @param type 新增字段的类型
     * @param insertBeforeId 插入位置的字段ID
     */
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

    /**
     * 对画布中的字段进行排序
     *
     * @param activeId 当前拖拽的字段ID
     * @param overId 目标位置的字段ID
     */
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
        if (payload.description !== undefined) {
          target.description = payload.description;
        }
        if (payload.hidden !== undefined) {
          target.hidden = payload.hidden;
        }
        if (payload.disabled !== undefined) {
          target.disabled = payload.disabled;
        }
        if (payload.defaultValue !== undefined) {
          target.defaultValue = payload.defaultValue;
        }
        if (payload.required !== undefined) {
          target.required = payload.required;
          // 自动维护 required 规则
          target.rules = payload.required
            ? [{ type: "required", message: `${payload.label ?? target.label}为必填项` }]
            : [];
        }
        if (payload.options !== undefined) {
          target.options = payload.options;
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
  })),
);

// 对 useStore 进行封装，方便在组件中使用
export const useFormBuilderStore = <T,>(selector: (state: FormBuilderState) => T) =>
  useStore(formBuilderStore, selector);

/** 在非 React 回调中读取最新 state（如 DnD 回调、保存时取 schema），避免为读一次数据而订阅整棵 schema */
export const getFormBuilderState = () => formBuilderStore.getState();

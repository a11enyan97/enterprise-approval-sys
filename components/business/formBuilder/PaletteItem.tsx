"use client";

/**
 * 左侧 Palette 拖拽组件卡片
 *
 * 数据源统一来自 FIELD_TYPE_META，不再维护独立的 paletteItems 列表
 */

import { Tag } from "@arco-design/web-react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { FormFieldType } from "@/types/formBuilder";

interface PaletteItemProps {
  type: FormFieldType;
  /** 显示标签（来自 FIELD_TYPE_META.label） */
  label: string;
  /** 简短描述（来自 FIELD_TYPE_META.description） */
  description: string;
}

export default function PaletteItem({ type, label, description }: PaletteItemProps) {
  // useDraggable：为基础组件绑定拖拽行为，data 中标记来源与类型
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { source: "palette", fieldType: type },
  });

  const style = isDragging
    ? {
        transform: "none", // 禁止源节点位移动画，避免“弹回”
        transition: "none",
        opacity: 0,
        visibility: "hidden" as const,
        cursor: "grabbing",
      }
    : {
        transform: transform ? CSS.Transform.toString(transform) : undefined,
        transition: "none",
        opacity: 1,
        visibility: "visible" as const,
        cursor: "grab",
      };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:border-blue-500"
    >
      <div className="flex items-center justify-between">
        <span className="font-medium text-gray-800">{label}</span>
        <Tag color="arcoblue" size="small">
          {type}
        </Tag>
      </div>
      <p className="mt-1 text-xs text-gray-500">{description}</p>
    </div>
  );
}


"use client";

import { Tag } from "@arco-design/web-react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { FieldType } from "@/types/formBuilder";

export const paletteItems: Array<{ type: FieldType; title: string; desc: string }> = [
  { type: "input", title: "单行输入", desc: "文本输入框" },
  { type: "textarea", title: "多行文本", desc: "支持自动换行" },
  { type: "date", title: "日期选择", desc: "YYYY-MM-DD" },
  { type: "treeSelect", title: "部门选择", desc: "树形选择" },
  { type: "uploadImage", title: "图片上传", desc: "支持多图预览" },
  { type: "uploadTable", title: "表格上传", desc: "上传 Excel" },
];

interface PaletteItemProps {
  type: FieldType;
  title: string;
  desc: string;
}

export default function PaletteItem({ type, title, desc }: PaletteItemProps) {
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
        <span className="font-medium text-gray-800">{title}</span>
        <Tag color="arcoblue" size="small">
          {type}
        </Tag>
      </div>
      <p className="mt-1 text-xs text-gray-500">{desc}</p>
    </div>
  );
}


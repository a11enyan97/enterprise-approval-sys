"use client";

/** 
 * 可拖拽的字段卡片：显示字段信息，支持拖拽排序与删除
 */

import { memo } from "react";
import { Button, Tag } from "@arco-design/web-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { FormField } from "@/types/formBuilder";
import { type UniqueIdentifier } from "@dnd-kit/core";

interface SortableFieldCardProps {
  field: FormField;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export default memo(function SortableFieldCard({ field, isSelected, onSelect, onDelete }: SortableFieldCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field._id as UniqueIdentifier,
    data: { source: "canvas" },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging
      ? "transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease"
      : transition || "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
    opacity: isDragging ? 0.9 : 1,
    borderColor: isSelected ? "#165dff" : "#e5e7eb",
    boxShadow: isDragging
      ? "0 8px 24px rgba(0,0,0,0.12)"
      : isSelected
      ? "0 0 0 2px rgba(22,93,255,0.15)"
      : "0 1px 6px rgba(0,0,0,0.08)",
    scale: isDragging ? 1.01 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes} 
      {...listeners}
      className="group mb-3 rounded-lg border bg-white p-3 shadow-sm"
      data-dnd-id={field._id}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1" onClick={() => onSelect(field._id as string)}>
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-800">{field.label}</span>
            <Tag size="small" color="arcoblue">
              {field.type}
            </Tag>
          </div>
          <div className="mt-1 text-xs text-gray-500">{field.placeholder || "未设置占位提示"}</div>
          <div className="mt-1 text-xs text-gray-500">字段 key：{field.key}</div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Button size="mini" status="danger" type="text" onClick={() => onDelete(field._id as string)}>
            删除
          </Button>
          <Button size="mini" type="text" className="cursor-grab text-gray-500" >
            拖拽
          </Button>
        </div>
      </div>
    </div>
  );
});


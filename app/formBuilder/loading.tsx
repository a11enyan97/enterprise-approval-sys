"use client";
/**
 * 表单设计器路由级 loading UI
 * 进入 /formBuilder 时先展示骨架，再流式替换为设计器，提升 FCP
 */
import { Spin } from "@arco-design/web-react";

export default function FormBuilderLoading() {
  return (
    <div className="flex min-h-[480px] w-full items-center justify-center rounded-lg border border-gray-200 bg-white p-8">
      <Spin size={32} tip="加载表单设计器..." />
    </div>
  );
}

"use client";
/**
 * 审批列表路由级 loading UI
 * Next.js 在进入 /approval 时会先渲染此组件，再流式替换为页面内容，提升 FCP 与可感知性能
 */
import { Spin } from "@arco-design/web-react";

export default function ApprovalLoading() {
  return (
    <div className="flex min-h-[320px] w-full items-center justify-center rounded-lg border border-gray-200 bg-white p-8">
      <Spin size={32} tip="加载审批列表..." />
    </div>
  );
}

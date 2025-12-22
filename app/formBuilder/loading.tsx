"use client";

import React from "react";
import { Skeleton } from "@arco-design/web-react";

export default function Loading() {
  return (
    <div className="h-screen flex">
      {/* 左侧组件库 */}
      <div className="w-64 border-r p-4">
        <Skeleton text={{ rows: 8, width: "100%" }} animation />
      </div>
      {/* 中间画布 */}
      <div className="flex-1 p-8 bg-gray-50">
        <Skeleton text={{ rows: 10, width: "100%" }} animation />
      </div>
      {/* 右侧属性面板 */}
      <div className="w-80 border-l p-4">
        <Skeleton text={{ rows: 6, width: "100%" }} animation />
      </div>
    </div>
  );
}

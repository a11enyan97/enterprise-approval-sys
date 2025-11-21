"use client";

import { useState } from "react";
import { IconCaretUp } from "@arco-design/web-react/icon";

interface CollapsibleFilterProps {
    children: React.ReactNode;
    title?: string;
}

export default function CollapsibleFilter({ children, title = "" }: CollapsibleFilterProps) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="relative">
            {/* 标题栏（在顶部） */}
            {title && (
                <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-700">{title}</span>
                </div>
            )}
            
            {/* 内容区域（从下向上收缩） */}
            <div
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{
                    maxHeight: collapsed ? "0px" : "2000px",
                    opacity: collapsed ? 0 : 1,
                    marginBottom: collapsed ? "0px" : "16px",
                }}
            >
                <div>{children}</div>
            </div>
            
            {/* 收起按钮（在底部） */}
            <div
                className="flex items-center justify-start cursor-pointer border-b border-gray-200 pb-2"
                onClick={() => setCollapsed(!collapsed)}
            >
                <span 
                    className="text-sm text-gray-500 transition-transform duration-300 inline-block"
                    style={{ transform: collapsed ? "rotate(180deg)" : "rotate(0deg)" }}
                >
                    <IconCaretUp style={{width:"14px" , height: "14px"}}/>
                </span>
                <span className="text-sm text-gray-500 ml-1">收起</span>
            </div>
        </div>
    );
}


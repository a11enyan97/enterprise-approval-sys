"use client";

import { useState } from "react";
import { executeAgentTask } from "@/actions/agent.action";
import type { AgentTaskResult } from "@/actions/dto/agent.dto";

export default function AgentConsolePage() {
  // 表单状态
  const [userId, setUserId] = useState<number>(1);
  const [input, setInput] = useState("");
  const [agentType, setAgentType] = useState<"default" | "analyst" | "writer">("default");

  // 交互状态
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AgentTaskResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 重置状态
    setLoading(true);
    setResult(null);

    try {
      const res = await executeAgentTask({
        userId,
        input,
        agentType,
      });

      setResult(res);
    } catch (err) {
      console.error(err);
      setResult({
        success: false,
        error: "请求发生意外错误",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900">
            🤖 AI Agent 控制台
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            调试与测试 Agent 任务执行能力 (基于 Server Actions)
          </p>
        </div>

        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="p-6 md:p-8 space-y-6">
            
            {/* 输入表单 */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User ID */}
                <div>
                  <label htmlFor="userId" className="block text-sm font-medium text-gray-700">
                    用户 ID (调试用)
                  </label>
                  <input
                    type="number"
                    id="userId"
                    value={userId}
                    onChange={(e) => setUserId(Number(e.target.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                    required
                  />
                </div>

                {/* Agent Type */}
                <div>
                  <label htmlFor="agentType" className="block text-sm font-medium text-gray-700">
                    Agent 类型
                  </label>
                  <select
                    id="agentType"
                    value={agentType}
                    onChange={(e) => setAgentType(e.target.value as any)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                  >
                    <option value="default">默认助手 (Default)</option>
                    <option value="analyst">数据分析师 (Analyst)</option>
                    <option value="writer">文案专家 (Writer)</option>
                  </select>
                </div>
              </div>

              {/* Input Area */}
              <div>
                <label htmlFor="input" className="block text-sm font-medium text-gray-700">
                  任务指令 / 问题
                </label>
                <div className="mt-1">
                  <textarea
                    id="input"
                    rows={4}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="shadow-sm block w-full focus:ring-blue-500 focus:border-blue-500 sm:text-sm border border-gray-300 rounded-md p-3"
                    placeholder="例如：帮我查询一下上个月的销售报表，并分析趋势..."
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                    ${loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"}`}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      执行任务中...
                    </span>
                  ) : (
                    "发送指令"
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* 结果展示区 */}
          {result && (
            <div className={`border-t ${result.success ? "bg-green-50" : "bg-red-50"} p-6`}>
              <h2 className={`text-lg font-medium mb-4 ${result.success ? "text-green-800" : "text-red-800"}`}>
                {result.success ? "✅ 执行成功" : "❌ 执行失败"}
              </h2>

              {result.success ? (
                <div className="space-y-4">
                  {/* 会话 ID */}
                  <div className="text-sm text-gray-500">
                    Session ID: <span className="font-mono">{result.sessionId}</span>
                  </div>

                  {/* 最终结果 */}
                  <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Agent 回复</h3>
                    <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap">
                      {result.data}
                    </div>
                  </div>

                  {/* 中间步骤 (如果有) */}
                  {result.intermediateSteps && result.intermediateSteps.length > 0 && (
                    <div className="mt-4">
                      <details className="group">
                        <summary className="flex justify-between items-center font-medium cursor-pointer list-none text-gray-600 hover:text-gray-900">
                          <span>查看思维链 / 工具调用过程</span>
                          <span className="transition group-open:rotate-180">
                            <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                          </span>
                        </summary>
                        <div className="text-gray-500 mt-3 bg-gray-100 p-3 rounded text-xs font-mono overflow-auto max-h-60">
                           <pre>{JSON.stringify(result.intermediateSteps, null, 2)}</pre>
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              ) : (
                // 错误信息
                <div className="text-red-700 bg-red-100 p-4 rounded-md">
                  {result.error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
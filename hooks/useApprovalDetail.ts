/**
 * 审批详情数据获取 Hook
 */

import { useState, useEffect, useCallback } from "react";
import { getApprovalDetail } from "@/utils/api/approval";
import type { ApprovalRequestItem } from "@/types/approval";

interface UseApprovalDetailReturn {
  data: ApprovalRequestItem | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * 获取审批详情的 Hook
 * @param requestId 审批申请ID（可选，如果为 undefined 或 null 则不获取）
 */
export function useApprovalDetail(
  requestId?: string | number | null
): UseApprovalDetailReturn {
  const [data, setData] = useState<ApprovalRequestItem | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    // 如果没有 requestId，不执行请求
    if (!requestId) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await getApprovalDetail(requestId);
      setData(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("获取审批详情失败");
      setError(error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}


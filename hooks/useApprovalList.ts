/**
 * 审批列表数据获取 Hook
 */

import { useState, useEffect, useCallback } from "react";
import { getApprovalList } from "@/lib/api/approval";
import type {
  ApprovalRequestListResponse,
  GetApprovalListParams,
} from "@/types/approval";

interface UseApprovalListReturn {
  data: ApprovalRequestListResponse | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * 获取审批列表的 Hook
 */
export function useApprovalList(
  params?: GetApprovalListParams
): UseApprovalListReturn {
  const [data, setData] = useState<ApprovalRequestListResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getApprovalList(params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("获取数据失败"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [
    params?.page,
    params?.pageSize,
    params?.applicantId,
    params?.status,
    params?.deptLevel1Id,
    params?.deptLevel2Id,
    params?.deptLevel3Id,
  ]);

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


/**
 * 部门数据获取 Hook
 */

import { useState, useEffect, useCallback } from "react";
import { getDepartmentCascaderOptions } from "@/lib/api/departments";
import type { CascaderOption } from "@/lib/api/departments";

interface UseDepartmentsReturn {
  options: CascaderOption[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * 获取部门级联选项的 Hook（懒加载）
 */
export function useDepartments(): UseDepartmentsReturn {
  const [options, setOptions] = useState<CascaderOption[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [loaded, setLoaded] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    // 如果已经加载过，不再重复加载
    if (loaded) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await getDepartmentCascaderOptions();
      setOptions(result);
      setLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("获取部门列表失败"));
      setOptions([]);
      setLoaded(false); // 加载失败时允许重试
    } finally {
      setLoading(false);
    }
  }, [loaded]);

  return {
    options,
    loading,
    error,
    refetch: fetchData,
  };
}


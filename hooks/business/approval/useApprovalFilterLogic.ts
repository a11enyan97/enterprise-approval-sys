import { useCallback } from "react";
import { Form } from "@arco-design/web-react";
import { useRouter, useSearchParams } from "next/navigation";

export function useApprovalFilterLogic() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form] = Form.useForm();

  // 从 URL 获取筛选参数作为初始值
  const createTimeStart = searchParams.get("createTimeStart");
  const createTimeEnd = searchParams.get("createTimeEnd");
  const approvalTimeStart = searchParams.get("approvalTimeStart");
  const approvalTimeEnd = searchParams.get("approvalTimeEnd");

  const initialValues = {
    approvalStatus: searchParams.get("status") || undefined,
    applicationDepartment: searchParams.get("deptId") || undefined,
    approvalProject: searchParams.get("projectName") || undefined,
    createTimeRange: createTimeStart && createTimeEnd
      ? [new Date(createTimeStart), new Date(createTimeEnd)]
      : undefined,
    approvalTimeRange: approvalTimeStart && approvalTimeEnd
      ? [new Date(approvalTimeStart), new Date(approvalTimeEnd)]
      : undefined,
  };

  // 查询处理
  const handleQuery = useCallback(() => {
    form.validate().then((values) => {
      const params = new URLSearchParams();
      
      // 保留分页参数，默认重置到第一页
      const currentPage = "1";
      const currentPageSize = searchParams.get("pageSize") || "10";
      params.set("page", currentPage);
      params.set("pageSize", currentPageSize);
      
      // 1. 审批状态
      if (values.approvalStatus) {
        params.set("status", values.approvalStatus);
      }
      
      // 2. 部门ID
      if (values.applicationDepartment) {
        const deptId = typeof values.applicationDepartment === 'string' 
          ? parseInt(values.applicationDepartment) 
          : values.applicationDepartment;
        if (!isNaN(deptId)) {
          params.set("deptId", String(deptId));
        }
      }
      
      // 3. 项目名称
      if (values.approvalProject) {
        params.set("projectName", values.approvalProject);
      }
      
      // 4. 创建时间范围
      if (values.createTimeRange && Array.isArray(values.createTimeRange) && values.createTimeRange.length === 2) {
        const [start, end] = values.createTimeRange;
        if (start) {
          const startDate = start instanceof Date ? start : new Date(start);
          params.set("createTimeStart", startDate.toISOString());
        }
        if (end) {
          const endDate = end instanceof Date ? end : new Date(end);
          params.set("createTimeEnd", endDate.toISOString());
        }
      }
      
      // 5. 审批时间范围
      if (values.approvalTimeRange && Array.isArray(values.approvalTimeRange) && values.approvalTimeRange.length === 2) {
        const [start, end] = values.approvalTimeRange;
        if (start) {
          const startDate = start instanceof Date ? start : new Date(start);
          params.set("approvalTimeStart", startDate.toISOString());
        }
        if (end) {
          const endDate = end instanceof Date ? end : new Date(end);
          params.set("approvalTimeEnd", endDate.toISOString());
        }
      }
      
      router.push(`/approval?${params.toString()}`);
    }).catch((error) => {
      console.error("表单验证失败:", error);
    });
  }, [form, router, searchParams]);

  // 清空已选
  const handleClear = useCallback(() => {
    form.resetFields();
    const params = new URLSearchParams();
    const currentPage = searchParams.get("page") || "1";
    const currentPageSize = searchParams.get("pageSize") || "10";
    params.set("page", currentPage);
    params.set("pageSize", currentPageSize);
    router.push(`/approval?${params.toString()}`);
  }, [form, router, searchParams]);

  return {
    state: {
      form,
      initialValues,
    },
    methods: {
      handleQuery,
      handleClear,
    }
  };
}


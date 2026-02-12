import type { FormSchema } from "@/types/formBuilder";

/**
 * 审批单创建表单配置
 *
 * rules 已从 Arco 原始格式迁移为结构化 FieldRule 格式
 * 渲染时通过 toArcoRules() 转换为 Arco Design 识别的格式
 */
export const approvalCreateSchema: FormSchema = {
  version: "1.0",
  key: "approval.create",
  title: "新建审批单",
  description: "依据表单配置动态渲染审批单表单",
  layout: {
    labelCol: { span: 2 },
    wrapperCol: { span: 8 },
  },
  fields: [
    {
      key: "projectName",
      label: "审批项目",
      type: "input",
      required: true,
      placeholder: "请输入审批项目",
      rules: [{ type: "required", message: "请输入审批项目" }],
    },
    {
      key: "applicationDepartment",
      label: "申请部门",
      type: "treeSelect",
      required: true,
      placeholder: "请选择申请部门",
      rules: [{ type: "required", message: "请选择申请部门" }],
    },
    {
      key: "approvalContent",
      label: "审批内容",
      type: "textarea",
      required: true,
      placeholder: "请输入审批内容，限制300字内",
      rules: [
        { type: "required", message: "请输入审批内容" },
        { type: "maxLength", value: 300, message: "审批内容不能超过300字" },
      ],
      props: {
        maxLength: 300,
        showWordLimit: true,
        autoSize: { minRows: 4, maxRows: 8 },
      },
    },
    {
      key: "executionDate",
      label: "执行日期",
      type: "date",
      required: true,
      placeholder: "请选择执行日期",
      rules: [{ type: "required", message: "请选择执行日期" }],
      props: {
        format: "YYYY-MM-DD",
      },
    },
    {
      key: "imageAttachments",
      label: "图片附件",
      type: "uploadImage",
      required: false,
      props: {
        multiple: true,
        imagePreview: true,
        limit: 3,
        listType: "picture-card",
        accept: "image/jpeg,image/jpg,image/png,image/gif,image/webp",
      },
    },
    {
      key: "tableAttachments",
      label: "表格附件",
      type: "uploadTable",
      required: false,
      props: {
        accept: ".xlsx,.xls",
      },
    },
  ],
};

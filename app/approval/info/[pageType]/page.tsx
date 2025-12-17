import { redirect, notFound } from "next/navigation";

interface RedirectPageProps {
  params: Promise<{ pageType: string }>;
  searchParams: Promise<{ id?: string }>;
}

// 当未提供 formKey 时，使用默认 formKey 跳转到带 formKey 的路由
export default async function ApprovalInfoRedirect({ params, searchParams }: RedirectPageProps) {
  const { pageType } = await params;
  const { id } = await searchParams;

  const validPageTypes = ["add", "details", "edit"];
  if (!validPageTypes.includes(pageType)) {
    notFound();
  }

  const defaultFormKey = "form_approval_template";
  const query = id ? `?id=${id}` : "";
  redirect(`/approval/info/${pageType}/${defaultFormKey}${query}`);
}


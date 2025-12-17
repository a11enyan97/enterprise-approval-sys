import { redirect, notFound } from "next/navigation";

interface RedirectPageProps {
  params: Promise<{ pageType: string }>;
  searchParams: Promise<{ submissionId?: string, requestId?: string }>;
}

// 当未提供 formKey 时，使用默认 formKey 跳转到带 formKey 的路由
export default async function ApprovalInfoRedirect({ params, searchParams }: RedirectPageProps) {
  const { pageType } = await params;
  const { submissionId, requestId } = await searchParams;

  const validPageTypes = ["add", "details", "edit"];
  if (!validPageTypes.includes(pageType)) {
    notFound();
  }

  const defaultFormKey = "form_approval_template";
  
  const searchString = new URLSearchParams();
  if (submissionId) searchString.set('submissionId', submissionId as string);
  if (requestId) searchString.set('requestId', requestId as string);
  const query = searchString.toString() ? `?${searchString.toString()}` : "";

  redirect(`/approval/info/${pageType}/${defaultFormKey}${query}`);
}


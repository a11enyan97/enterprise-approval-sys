import { ValidationError } from "./_shared/validators";
import type { FormSchema } from "@/types/formBuilder";
import { approvalCreateSchema } from "@/constants/formSchemaConfig";

const formSchemas: Record<string, FormSchema> = {
  [approvalCreateSchema.key]: approvalCreateSchema,
};

export async function getFormSchema(formKey: string): Promise<FormSchema> {
  const schema = formSchemas[formKey];
  if (!schema) {
    throw new ValidationError(`表单配置 ${formKey} 不存在`, "formKey", "FORM_SCHEMA_NOT_FOUND");
  }
  return schema;
}


import { z } from "zod";

/** Resultado que devuelven las Server Actions de formularios. */
export type FormState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Record<string, string[] | undefined>;
  /** Valores enviados, para no perderlos cuando React reinicia el formulario. */
  fields?: Record<string, string>;
};

export const initialFormState: FormState = { status: "idle" };

export function formDataToObject(formData: FormData) {
  const fields: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !key.startsWith("$ACTION")) {
      fields[key] = value;
    }
  }
  return fields;
}

export function validationError(
  error: z.ZodError,
  fields?: Record<string, string>,
): FormState {
  return {
    status: "error",
    message: "Revisa los campos marcados.",
    errors: z.flattenError(error).fieldErrors as Record<string, string[]>,
    fields,
  };
}

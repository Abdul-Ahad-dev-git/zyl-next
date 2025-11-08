import * as yup from "yup";

// ------------------ Query DTO ------------------
export const __NAME__QuerySchema = yup.object({
  uid: yup.string().min(1).max(15).required(),
});
export type __NAME__QueryType = yup.InferType<typeof __NAME__QuerySchema>;
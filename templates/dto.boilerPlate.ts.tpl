import * as yup from "yup";

// ------------------ Body DTO ------------------
export const __NAME__BodySchema = yup.object({
  uid: yup.string().min(5).max(15).required(),
  price: yup.number().min(0).required(),
  address: yup.string().min(5).required(),
  isDefault: yup.boolean().optional(),
});
export type __NAME__BodyType = yup.InferType<typeof __NAME__BodySchema>;

// ------------------ Params DTO ------------------
export const __NAME__ParamsSchema = yup.object({
  id: yup.string().min(1).max(15).required(),
});
export type __NAME__ParamsType = yup.InferType<typeof __NAME__ParamsSchema>;

// ------------------ Query DTO ------------------
export const __NAME__QuerySchema = yup.object({
  uid: yup.string().min(1).max(15).required(),
});
export type __NAME__QueryType = yup.InferType<typeof __NAME__QuerySchema>;
import * as yup from "yup";

// ------------------ Params DTO ------------------
export const __NAME__ParamsSchema = yup.object({
  id: yup.string().min(1).max(15).required(),
});
export type __NAME__ParamsType = yup.InferType<typeof __NAME__ParamsSchema>;


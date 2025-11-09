import * as yup from "yup";


// ------------------ Params Schema ------------------
export const __NAME__ParamsSchema = yup.object({
     id: yup.string().min(5).max(13).required();
});
export type __NAME__ParamsType = yup.InferType<typeof __NAME__ParamsSchema>;

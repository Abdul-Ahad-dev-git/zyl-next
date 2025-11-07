import { wrapHandler } from "zyl-next/wrapHandler";
import { AuthGuard } from "../../lib/guard";
import { __CNAME__Module } from "./__NAME__.module";
import { __NAME__BodyDTO, __NAME__ParamsDTO, __NAME__QueryDTO } from "./Dto/__NAME__.dto";

const { controller } = new __CNAME__Module();
 // GET /api/__NAME__
export const GET = wrapHandler(controller.getAll.bind(controller), {
  route: "/api/__NAME__",
  method: "GET",
  guard: AuthGuard,
});
  // GET /api/__NAME__/getone
export const GET_ONE = wrapHandler(controller.getOne.bind(controller), {
  route: "/api/__NAME__/getone",
  method: "GET",
  guard: AuthGuard,
  queryDTO:__NAME__QueryDTO,
});
// POST /api/__NAME__
export const POST = wrapHandler(controller.create.bind(controller), {
  route: "/api/__NAME__",
  method: "POST",
  guard: AuthGuard,
  bodyDTO: __NAME__BodyDTO,
});
// PATCH /api/__NAME__/[id]
export const PATCH = wrapHandler(controller.update.bind(controller), {
  route: "/api/__NAME__/[id]",
  method: "PATCH",
  guard: AuthGuard,
  bodyDTO: __NAME__BodyDTO,
  paramsDTO: __NAME__ParamsDTO, 
});
  // DELETE /api/__NAME__/[id]
export const DELETE = wrapHandler(controller.delete.bind(controller), {
  route: "/api/__NAME__/[id]",
  method: "DELETE",
  guard: AuthGuard,
  paramsDTO: __NAME__ParamsDTO, 
});

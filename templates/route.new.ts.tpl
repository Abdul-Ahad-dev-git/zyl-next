import { wrapHandler } from "zyl-next/wrapHandler";
import { AuthGuard } from "../../lib/guard";
import { __CNAME__Module } from "./__NAME__.module";
import { __NAME__BodySchema } from "./Dto/Body/__NAME__.dto";
import { __NAME__ParamsSchema } from "./Dto/Param/__NAME__.dto";
import { __NAME__QuerySchema } from "./Dto/Query/__NAME__.dto";

const { controller } = new __CNAME__Module();

// CREATE
export const create__NAME__ = wrapHandler(
  controller.create__NAME__Controller.bind(controller), {
    route: "/api/__NAME__",
    method: "POST",
    guard: AuthGuard,
    bodySchema: __NAME__BodySchema,
  }
);

// GET BY ID / PARAM
export const get__NAME__ = wrapHandler(
  controller.get__NAME__Controller.bind(controller), {
    route: "/api/__NAME__/[id]",
    method: "GET",
    guard: AuthGuard,
    paramsSchema: __NAME__ParamsSchema,
  }
);

// QUERY LIST
export const query__NAME__s = wrapHandler(
  controller.query__NAME__sController.bind(controller), {
    route: "/api/__NAME__",
    method: "GET",
    guard: AuthGuard,
    querySchema: __NAME__QuerySchema,
  }
);

// DELETE
export const delete__NAME__ = wrapHandler(
  controller.delete__NAME__Controller.bind(controller), {
    route: "/api/__NAME__/[id]",
    method: "DELETE",
    guard: AuthGuard,
    paramsSchema: __NAME__ParamsSchema,
  }
);

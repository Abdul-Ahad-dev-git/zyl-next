import { wrapHandler } from "zyl-next/wrapHandler";
import { AuthGuard } from "../../lib/guard";
import { __CNAME__Module } from "./__NAME__.module";
import { __NAME__BodySchema,  } from "./Dto/Body/__NAME__.dto";
import {  __NAME__ParamsSchema,  } from "./Dto/Param/__NAME__.dto";
import { __NAME__QuerySchema } from "./Dto/Query/__NAME__.dto";

const { controller } = new __CNAME__Module();
import { __NAME__BodyType } from "./Dto/Body/__NAME__.dto";
import { __NAME__ParamsType } from "./Dto/Param/__NAME__.dto";
import { __NAME__QueryType } from "./Dto/Query/__NAME__.dto";

export class __CNAME__Service {

  async create__NAME__Service(body: __NAME__BodyType) {
    console.log("Creating __NAME__:", body);
    return { message: "__NAME__ created", data: body };
  }

  async query__NAME__sService(query: __NAME__QueryType) {
    console.log("Querying __NAME__s with:", query);
    return [];
  }

  async get__NAME__Service(params: __NAME__ParamsType) {
    console.log("Getting __NAME__ with:", params);
    return { id: params.id, name: "__NAME__ Sample" };
  }

  async delete__NAME__Service(params: __NAME__ParamsType) {
    console.log("Deleting __NAME__ with:", params);
    return { message: `__NAME__ ${params.id} deleted` };
  }
}

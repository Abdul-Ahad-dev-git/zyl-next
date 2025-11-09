import { __CNAME__Service } from "./__NAME__.service";
import { WrappedRequest } from "zyl-next/wrapHandler";

export class __CNAME__Controller {
  constructor(private readonly __NAME__Service: __CNAME__Service) {}

  async create__NAME__Controller(req: WrappedRequest) {
    return await this.__NAME__Service.create__NAME__Service(req.body);
  }

  async query__NAME__sController(req: WrappedRequest) {
    return await this.__NAME__Service.query__NAME__sService(req.query);
  }

  async get__NAME__Controller(req: WrappedRequest) {
    return await this.__NAME__Service.get__NAME__Service(req.params);
  }

  async delete__NAME__Controller(req: WrappedRequest) {
    return await this.__NAME__Service.delete__NAME__Service(req.params);
  }
}

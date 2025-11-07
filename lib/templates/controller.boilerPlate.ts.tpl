import { __CNAME__Service } from "./__NAME__.service";
import { WrappedRequest } from "zyl-next/wrapHandler";

export class __CNAME__Controller {
  constructor(private readonly __NAME__Service: __CNAME__Service) {}

  // GET /api/base
  async getAll(req: WrappedRequest) {
    return this.__NAME__Service.findAll();
  }
   // GET /api/base/getone
 async getOne(req:WrappedRequest){
  return this.__NAME__Service.findOne(req.query.uid)
 }
  // POST /api/base
  async create(req: WrappedRequest) {

    return this.__NAME__Service.create(req.body);
  }
  // PATCH /api/base/[id]
  async update(req: WrappedRequest) {

    return this.__NAME__Service.update(req.params.id, req.body);
  }
  // DELETE /api/base/[id]
  async delete(req: WrappedRequest) {
    return this.__NAME__Service.delete(req.params.id);
  }
}

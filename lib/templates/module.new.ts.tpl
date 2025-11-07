import { __CNAME__Service } from "./__NAME__.service";
import { __CNAME__Controller } from "./__NAME__.controller";

export class __CNAME__Module {
  public controller: __CNAME__Controller;

  constructor() {
     const service = new __CNAME__Service();
    this.controller = new __CNAME__Controller(service);
  }
}
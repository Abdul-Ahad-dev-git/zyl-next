import { __CNAME__Core } from "../../core/__NAME__/__NAME__.core";
import { __CNAME__Service } from "./__NAME__.service";
import { __CNAME__Controller } from "./__NAME__.controller";

export class __CNAME__Module {
  public controller: __CNAME__Controller;

  constructor() {
    const core = new __CNAME__Core();
    const service = new __CNAME__Service(core);
    this.controller = new __CNAME__Controller(service);
  }
}
import { __CNAME__Core } from "../../core/__NAME__/__NAME__.core";

export class __CNAME__Service {
  private items: any[] = [];

  constructor(private readonly core: __CNAME__Core) {}
  async init() {
    await this.core.init();
  }
  findAll() {
    return this.items;
  }
    findOne(uid: string) {
   const item = this.items.filter((i) => i.uid === uid);
    if (!item) throw new Error("Item not found");
    
    return item
  }
  create(data: any) {
    const newItem = { id: Date.now().toString(), ...data };
    this.items.push(newItem);
    return newItem;
  }

  update(id: string, data: any) {
    const idx = this.items.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error("Item not found");
    this.items[idx] = { ...this.items[idx], ...data };
    return this.items[idx];
  }

  delete(id: string) {
    const idx = this.items.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error("Item not found");
    const removed = this.items.splice(idx, 1)[0];
    return removed;
  }

  async close() {
    await this.core.close();
  }
}
